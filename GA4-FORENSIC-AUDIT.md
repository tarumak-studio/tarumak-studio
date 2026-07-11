# GA4 Forensic Audit — tarumakstudio.com / G-ER0G4HSYQV

**Method note (honesty first):** I audited the complete source zip
(137 HTML pages, all JS, all build scripts). I could **not** fetch the deployed
site's files from this environment, so every "deployed" claim below is either
(a) inferred from source + GA4 protocol behaviour, or (b) given to you as a
10-second check you run yourself. Nothing below is guessed beyond that line.

---

## 1. Analytics Initialization Flow (as found)

Complete occurrence list — this is *every* analytics-related line in the project:

| Pattern | File : Line | What it is |
|---|---|---|
| `window.dataLayer =` | `config.js:7` | dataLayer creation (only one) |
| `function gtag()` | `config.js:8` | gtag declaration (only one) |
| `gtag('js', new Date())` | `config.js:9` | init call |
| `gtag('config', 'G-XXXXXXXXXX')` | `config.js:10` | **config call — PLACEHOLDER ID** |
| `window._ga = function…` | `config.js:11` | site event wrapper (only definition) |
| gtag.js loader `?id=G-XXXXXXXXXX` | `index.html:24` | **loader — PLACEHOLDER ID** |
| gtag.js loader `?id=G-XXXXXXXXXX` | `article-social-media-image-sizes.html:72` | orphaned page, placeholder |
| inline `gtag('config','G-XXXXXXXXXX')` | `article-social-media-image-sizes.html:73` | second init on orphaned page, placeholder |
| `window._ga('page_view',…)` | `app.js:64` | manual page_view on blog hash routes |
| `window._ga('tool_open',…)` | `app.js:983` | tool-open event |
| `window._ga('file_download',…)` | `app.js:985` | download event |
| `<script src="/config.js">` injected | `build-tool-pages.js:679` | build template (loader NOT included) |
| placeholder acknowledged | `header-chrome.js:111` | comment: *"the site's analytics tag is still a placeholder"* |

Checked and **cleared** (no findings): no CSP anywhere; no consent-mode
(`gtag('consent'…)`) anywhere; no service worker (`worker.js` is a Cloudflare
Worker for AI search, unrelated to caching); nothing overwrites `window.gtag`
or replaces `dataLayer`; no duplicate dataLayer creation; script order is
correct everywhere (`config.js` loads before `app.js` on every page that has
both, both `defer` → order guaranteed); `_ga` is guarded (`if(window.gtag)`)
so no race can throw.

**Load order on a tool page (all `defer`, executes in document order):**
CDN libraries → `config.js` → `utils.js` → `tool-helpers.js` → `data.js` →
category tool files → `app.js`. On `index.html`: loader at line 24 (`async`),
`config.js` at 541, `app.js` at 552.

## 2. Event Flow (as found — and where it dies)

```
Page loads → config.js runs → dataLayer created → gtag('config','G-XXXXXXXXXX') queued
   │
   ├─ On 134 of 137 pages: gtag.js library is NEVER loaded.
   │    dataLayer is an inert array. Events queue forever. ZERO network requests.
   │    (Only index.html + the orphaned article load the library at all.)
   │
   └─ On index.html: gtag.js?id=G-XXXXXXXXXX loads (Google serves the library
        even for unknown IDs), reads the queue, and transmits every event to
        /g/collect with  tid=G-XXXXXXXXXX.
        → /g/collect ALWAYS returns HTTP 204 — it is a fire-and-forget
          endpoint that does NOT validate the measurement ID synchronously.
        → Server-side, hits with an ID that no property owns are discarded.
```

**This resolves the apparent contradiction in your symptoms.** Everything you
observed is consistent with a placeholder ID:

- *"Tag Assistant detects the GA4 tag"* — it detects that *a* gtag installation
  exists; it does not attest that hits reach *your* property.
- *"page_view / user_engagement fire"* — they fire client-side, carrying the wrong `tid`.
- *"collect?v=2 returns 204"* — 204 is unconditional. **204 ≠ accepted.**
- *"Realtime 0, DebugView empty"* — correct behaviour: not one hit has ever
  carried `tid=G-ER0G4HSYQV` from this codebase.
- *"Data collection active in past 48 hours"* — the one symptom this source
  cannot produce. Most likely explanations: a test hit (GA4's own "Test
  installation" button, or Tag Assistant's connected debug session), or your
  deployed `config.js` briefly differed from this zip (your deployments are
  manual and partial — the zip may not match the server byte-for-byte). The
  decisive check is in the validation section; it takes 10 seconds.

## 3. Problems Found

| # | Severity | Problem | Evidence |
|---|---|---|---|
| 1 | **Critical** | Measurement ID is the placeholder `G-XXXXXXXXXX` in the only `gtag('config')` call | `config.js:10` |
| 2 | **Critical** | gtag.js library loaded on only **2 of 137 pages** — 134 pages push events into a dataLayer nothing transmits | loader present only in `index.html:24` + orphaned article |
| 3 | **Critical** | Build template injects `config.js` but not the loader → every rebuild regenerates the no-transmission state on all tool pages | `build-tool-pages.js:679` |
| 4 | Major | Orphaned page has a **second, duplicate initialization** (own loader + inline config), also placeholder | `article-social…html:72-73`; prior audits say this page should be deleted |
| 5 | Major | **Privacy/Cookie policy states "We do not use Google Analytics"** — the moment collection goes live, that statement is false. Legal/trust issue, and directly contrary to your trust-framework doctrine | `app.js:942`, `app.js:945`, `privacy.html` |
| 6 | Minor | 3 pages load no `config.js` at all (`privacy.html`, `hero-showcase.html`, orphaned article) — they'll rely on the loader tag only or collect nothing | file scan |
| 7 | Minor | Manual `page_view` event for blog hash routes sends no `page_location`/`page_title` override — hash changes aren't distinct pages to GA4; low-impact since blog is hash-routed | `app.js:64` |

Not found (explicitly cleared): duplicate dataLayer, gtag overwrites, CSP
blocks, consent-mode gating, config-before-analytics race, SPA routing
breakage, enhanced-measurement conflict, multiple config.js files.

## 4. Root Cause

**No hit from this codebase has ever carried `tid=G-ER0G4HSYQV`.** Hits either
(a) never leave the page at all — 134 of 137 pages have no gtag.js library —
or (b) leave `index.html` tagged `G-XXXXXXXXXX`, which Google's collect
endpoint accepts with a 204 and then discards because no property owns that ID.
Realtime and DebugView for property G-ER0G4HSYQV are therefore *correctly*
reporting zero.

Supporting evidence: `config.js:10` (placeholder in the sole config call),
`index.html:24` (placeholder in the sole active loader), the 2/137 loader
coverage count, `build-tool-pages.js:679` (template perpetuates it), and the
project's own comment at `header-chrome.js:111` acknowledging the tag was
never set. Your observed symptoms are all protocol-consistent with this — the
key misconception to discard is *"204 = data accepted."*

## 5. Exact Fixes (applied in the delivered files)

**Fix 1 — `config.js` lines 7–11 → rewritten (the keystone).**
Real ID, plus config.js now **injects the gtag.js loader itself** when the page
doesn't already have one:
```js
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
(function(){
  var GA_ID = 'G-ER0G4HSYQV';
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  gtag('js', new Date());
  gtag('config', GA_ID);
})();
window._ga = function(e,p){ if(window.gtag) gtag('event',e,p||{}); };
```
Why this shape: 134/137 pages already load `config.js`, so one deployed file
gives the entire site real collection — no editing of 137 HTML files, and it's
immune to your manual-partial-deployment pattern. The existence check matches
the actual `script[src]` attribute (per this repo's own hard-learned rule about
substring false-positives), and it makes the loader **idempotent**: pages that
carry a hardcoded loader don't double-load.

**Fix 2 — `index.html:24`** — hardcoded loader ID corrected to `G-ER0G4HSYQV`
(kept for earliest possible load on the homepage; Fix 1's guard prevents a
duplicate).

**Fix 3 — `build-tool-pages.js` (template, formerly line 679 region)** — the
loader tag is now emitted right before `config.js` in the head template, so
future rebuilds produce correct pages natively rather than depending on
runtime injection.

**Fix 4 — `article-social-media-image-sizes.html:72–73`** — both placeholder
IDs corrected. Note: two earlier audit reports in your repo say this page was
already deleted; it keeps reappearing in your zips. Recommend deleting it —
its duplicate inline init is now harmless but redundant.

**Fix 5 — NOT applied, requires your decision (Major #5):** update the Privacy
Policy and Cookie Policy (both `privacy.html` if kept, and `PAGES['privacy']` /
`PAGES['cookie']` in `app.js:942/945`) to disclose Google Analytics use before
or at the same moment collection goes live. I didn't rewrite legal copy
unilaterally — tell me the disclosure stance you want (e.g., "anonymous usage
analytics via GA4, no files, IP anonymized") and I'll draft it.

All fixes verified in this environment: `node --check` passes on every edited
file; a browser-faithful VM simulation of `config.js` confirms the loader is
injected with the real ID, `config` is queued for `G-ER0G4HSYQV`, `_ga` events
queue correctly, and the double-inject guard injects **zero** extra scripts
when a loader tag already exists (all PASS).

## 6. Validation Checklist (run after deploying `config.js` + `index.html`)

**Step 0 — the decisive 10-second check (also settles the "active in 48h" mystery):**
Open any page → DevTools → Network → filter `collect` → click a request →
look at the **`tid=` query parameter**. Before the fix it reads `G-XXXXXXXXXX`
(or there's no request at all on tool pages). After the fix it must read
`tid=G-ER0G4HSYQV`. That parameter is the ground truth; nothing else is.

1. **Deployment freshness:** open `https://tarumakstudio.com/config.js` directly
   in the browser — confirm you see `G-ER0G4HSYQV` in the served file. If not:
   purge Cloudflare cache for `/config.js` (or Cache Rules → bypass on `*.js`
   during testing) and hard-reload (Ctrl+Shift+R). There is no service worker
   in this project, so no SW cache to clear.
2. **Coverage:** repeat Step 0 on a **tool page** (e.g. `/background-remover`) —
   before the fix those pages sent nothing; now they must show `collect?v=2`
   requests with the right `tid`.
3. **Tag Assistant:** connect to the site — it should now show the G-ER0G4HSYQV
   tag specifically (not just "a" Google tag), with `page_view` on load.
4. **DebugView:** append `?debug_mode=1` to any page URL (or keep Tag Assistant
   connected), open GA4 → Admin → DebugView — your device should appear within
   seconds with `page_view`, then `user_engagement` after ~10s on page.
5. **Realtime:** open the site on your phone (mobile data, not Wi-Fi, to rule
   out any IP filter) — Realtime should show 1 user within ~30 seconds.
6. **Site events:** open a tool and download a result — `tool_open` and
   `file_download` should appear in DebugView, confirming the `_ga` wrapper path.
7. **48-hour banner sanity:** after a day of the fix live, GA4 home should show
   non-zero users; if the property was previously receiving *some* mystery
   hits, Admin → Data streams → your stream → check the stream's Measurement ID
   matches `G-ER0G4HSYQV` exactly (rules out watching the wrong stream/property).

**Files delivered:** `ga-fix/config.js`, `ga-fix/index.html`,
`ga-fix/build-tool-pages.js`, `ga-fix/article-social-media-image-sizes.html`.
Deploy at minimum `config.js` (site-wide fix) and `index.html` (homepage
loader ID), then purge Cloudflare cache for both.
