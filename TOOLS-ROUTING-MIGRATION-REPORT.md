# Tarumak Studio — /#tools → /tools Routing Migration
### Analysis of the existing architecture, what was already half-done, and everything needed to finish it correctly

## 0. Architecture analysis (done first, as required)

Before touching anything: this is not a client-rendered SPA in the React/Vue sense. It's a vanilla-JS site where `app.js` runs a **thin legacy hash-redirect layer only** — real navigation is plain HTML links to real static pages (confirmed in an earlier round's `ROUTING-MIGRATION-REPORT.md`: every tool, category, and content page already has its own dedicated URL and file). `/#tools` was the one exception: a URL **fragment**, not a route — fragments are never sent to the server, so Google, sharing, and metadata all only ever saw `/`. Digging into what `#tools` actually pointed at: `route()` in `app.js` calls `document.getElementById('tools').scrollIntoView()` — **but no element with `id="tools"` exists anywhere in the current homepage.** The homepage's tool-browsing UI was already split into two smaller sections (Featured Tools + Browse by Category) at some point, and this scroll target was never updated. So `/#tools` wasn't just bad for SEO — it was already quietly non-functional, degrading to "load the homepage, scroll nowhere."

**A partial fix already existed in this codebase** — `tools.html` and `build-tools-page.js` were already present, and `index.html`'s own header/hero already pointed to `/tools`. That work was verified (not assumed correct) and built on rather than redone: `buildGrid()`/`buildTabs()`/`toggleFav()` in `features.js` were confirmed to exist and do what the generator's comments claimed, and the static grid was confirmed to statically pre-render all 66 tools for crawlers before any JS runs. What was **not** done yet: propagating that fix to the other 131 pages, the legacy hash-redirect logic, `mega-menu.js`, `static-tool-bootstrap.js`, category-page breadcrumbs, and the sitemap. That's the work this round completed.

## 1. Root cause, precisely

`index.html` is the single harvested source every other page's header/footer comes from (`header-chrome.js` + `resync-chrome.js`/`build-tool-pages.js`, established in an earlier round). `index.html` itself was already correct — but **the other 131 pages still had their header baked from *before* that fix**, since propagation never ran. A site-wide scan found **134 remaining `/#tools` references** across articles, tool pages, and three JS files, all traceable to that one missing step.

## 2. What was fixed

**Propagation (the bulk of it):** re-ran `resync-chrome.js` and `build-tool-pages.js` — the same two tools that already exist for exactly this purpose. This alone resolved 130 of the 134 references (every article, every static page, every category page) with no hand-editing.

**The 4 places propagation can't reach, fixed at the source:**
- `build-tool-pages.js`'s own CTA-band template still generated `href="/#tools"` on all 66 tool pages' "Browse all tools" link — fixed, then all 66 pages regenerated.
- `mega-menu.js`'s "✨ AI-Powered" tab used `/#tools` for its "Explore all tools" link (every other category tab already correctly used `/{cat}-tools`) — fixed.
- `static-tool-bootstrap.js`'s tool-mount-failure fallback message linked `/#tools` — fixed.
- `app.js`'s legacy hash-redirect layer: `#/all` was rewriting the URL to `/#tools` and attempting a scroll — into an element that doesn't exist. Changed to a real navigation: `window.location.replace('/tools')`, matching how every other legacy hash in that same layer is already handled. **Also added the literal `#tools` hash** (not just `#/all`) to that layer — `#tools` was the fragment actually used site-wide until this round, so old bookmarks and shared links using it now redirect correctly too, not just the internal `#/all` route name.

**A bug in `resync-chrome.js` itself, found while verifying:** after fixing everything above and rebuilding, `tools.html`'s own "Tools" nav item wasn't showing as active — `resync-chrome.js`'s page→active-nav-key mapping didn't know about `tools.html`, so re-running it (which happens on every future header change) was silently stripping the active state `build-tools-page.js` had correctly set. Fixed by teaching `resync-chrome.js` about the new page — verified by rebuilding twice in sequence and confirming the state survives.

**Category-page breadcrumbs** (5 pages: image/pdf/developer/marketing/converter-tools): added the "Tools" level to both the visible breadcrumb nav and the JSON-LD `BreadcrumbList` (Home → Tools → [Category], exactly as specified). **Tool pages were verified unchanged** — they correctly stay Home → Category → Tool, no extra level, per spec.

**A separate, real bug found while touching that schema, unrelated to routing:** all 5 category pages' JSON-LD `WebPage.url` field still said `.../image-tools.html` etc. — the visible `<link rel="canonical">` tag had already been fixed to the clean URL in an earlier SEO round, but that round's canonical check didn't happen to catch this *nested* schema field. Fixed alongside the breadcrumb update since it was found in the same file while making an unrelated change — same principle as fixing `terms.html`'s stale footer link in an earlier round: fix what you find, note that you found it.

**Sitemap:** `/tools` added to `sitemap-pages.xml` generation in `build-tool-pages.js` (priority 0.9, weekly — same tier as the category pages) so it regenerates automatically on every future build, not as a one-off edit.

**`_redirects`:** added `/tools.html → /tools` (301), matching the exact pattern already established for every other page on the site in the prior SEO round.

## 3. What was deliberately NOT changed

**The homepage's Featured Tools and Browse by Category sections stay exactly as they are.** The brief was explicit that the Explore Tools button and nav should open `/tools` instead of scrolling — it did not ask for the homepage's own content to be removed, and deleting those sections would itself be a visual redesign of the homepage, which the brief separately and explicitly prohibited. The result: the homepage still gives a taste of the toolkit, `/tools` is the real, complete, dedicated directory, and there is exactly one navigable destination for "browse all tools" — not two competing versions of the same page.

**`showHome()` in `app.js` still contains a couple of internal `getElementById('tools')` calls used for its old scroll behavior.** These are guarded (`if(el)...`) and already silently no-op today, exactly as they did before this round — they don't build a URL and aren't part of "every `/#tools` link" in the literal sense the brief addresses. Worth a cleanup pass sometime, but doing it here would be scope creep into unrelated dead-code removal rather than the routing fix that was asked for.

## 4. Validation

- [x] **Homepage loads correctly** — untouched beyond the nav/CTA links already fixed before this round started.
- [x] **`/tools` loads directly** — it's a real static file (`tools.html`), served the same way every category page is; no routing framework involved.
- [x] **Refresh on `/tools` works** — same reason; there's no client-side route to lose on reload.
- [x] **Back/forward work** — real browser history entries for a real page, not a hash-state hack.
- [x] **Search still works** — the homepage's own hero search (`wireHeroSearch()` in `app.js`) was checked and doesn't link anywhere needing a change; it lists matching tools directly, each linking to its own real URL.
- [x] **Categories still work** — breadcrumbs extended, nothing else about them touched.
- [x] **Tool pages still work** — regenerated via the existing, unmodified-in-logic build script; breadcrumb depth confirmed unchanged.
- [x] **Zero internal `.html` links anywhere** (404.html excepted by design, per the earlier SEO round) — re-verified after every change in this round, not just at the end.
- [x] **Zero `/#tools` references left** except one historical, past-tense code comment describing what used to be true.
- [x] **Zero redirect chains** — 138 rules parsed programmatically, zero sources that are also another rule's target.
- [x] **Header byte-identical across all 132 pages; footer byte-identical across all 131 non-404 pages** — re-checked after every rebuild in this round.
- [x] **JSON-LD valid JSON on every page** that has one.
- [x] All 25 JS files pass `node --check`.
- [x] **No duplicate metadata / no second Tools page** — `/tools` is the only page with this content; the homepage's sections are a distinct, shorter preview, not a copy.

**Accessibility and performance, addressed structurally rather than with new code:** because `/tools` is a real page (not a client-rendered route swap), focus management, scroll restoration, and "remount" concerns that a JS router would need to handle by hand are simply native browser behavior here — a real navigation, a real new document, a real focus reset. There's no route to "remount" and no lazy-loaded chunk to preserve, because there was never a JS bundler step to begin with; the page loads the same static-first way every other page on this site does.

## 5. Files changed

**Regenerated (not hand-edited):** `tools.html` (66-tool static grid, refreshed against current `data.js`), all 66 tool pages, all 63 static/article pages' header+footer, `index.html` (sitemap count only). **Modified:** `resync-chrome.js` (added `tools.html` to the active-nav mapping), `build-tool-pages.js` (CTA-band link, sitemap `/tools` entry), `mega-menu.js` (AI-tab explore link), `static-tool-bootstrap.js` (fallback link), `app.js` (legacy redirect logic + comment), `image-tools.html` / `pdf-tools.html` / `developer-tools.html` / `marketing-tools.html` / `converter-tools.html` (breadcrumb HTML + JSON-LD breadcrumb + JSON-LD url fix), `_redirects` (+1 rule). **Unchanged:** `header-chrome.js`, `mega-menu.css`, `tool-content.js`, `tool-variants.css/js`, `features.js`'s `buildGrid`/`buildTabs`/`toggleFav` (reused as-is, already correct).

## 6. Remaining recommendations

- `app.js`'s `showHome()` still has two dead `getElementById('tools')` calls (§3) — harmless today, worth removing in a future cleanup pass rather than leaving indefinitely.
- Once deployed, request re-indexing of `/tools` in Search Console rather than waiting for organic re-crawl, and confirm the old `/#tools` fragment (if it has any external backlinks) actually lands on `/tools` in a real browser — fragment-based redirects are client-side only and this environment can't fire a real navigation to verify it live.
- Consider whether the mega-menu's AI-prompt search bar (still submitting to `/?q=`) should instead submit to `/tools?q=` now that a real searchable directory page exists — left alone this round since it wasn't part of the brief and changing it would affect the homepage's own existing search behavior, which the brief asked not to redesign.
