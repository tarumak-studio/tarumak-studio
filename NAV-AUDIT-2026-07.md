# Tarumak Studio — Navigation Single-Source-of-Truth Audit
### Every header/nav/mega-menu implementation found, verified against the real files, and reconciled to exactly one source

## 0. What this round actually was

The brief asked for a Tools mega-menu redesign plus a full audit for duplicate/legacy header implementations. On inspecting the uploaded codebase directly (byte-level diffs, not a read of the existing reports), the **premium mega menu itself already exists** — category rail, dynamic preview panel, Popular/AI-Powered tabs, full keyboard + ARIA support, reduced-motion handling — built in an earlier round and documented in `MEGA-MENU-REDESIGN.md`. That work was verified here independently (see §1) rather than taken on faith, because a separate discrepancy (§2) showed that a prior report's claims and the actual delivered files didn't fully match.

So this round's real work was the audit itself: finding where the "one shared component" promise had gaps, and closing them.

## 1. Verification method (not sampled)

Every one of the 133 uploaded HTML files was parsed and its `<header>…</header>` block hashed. Before fixes: **130 pages byte-identical** (differing only in which nav item carries `nav-active`), **3 outliers**. CSS/JS `<link>`/`<script>` tags were inventoried the same way across all pages — 8 distinct combinations before fixes, all explainable except the same 3 outlier pages. `header-chrome.js` was read in full to confirm the "single source of truth" claim is real: it re-derives the header from `index.html` at build time on every run rather than storing its own copy, and `resync-chrome.js` re-stamps that output onto every page carrying `<header id="header">`. This is genuine, working infrastructure.

## 2. A discrepancy worth knowing about

Two existing reports in this repo — `ROUTING-MIGRATION-REPORT.md` and `POLISH-AUDIT-REPORT.md` — both state that `privacy.html` and `article-social-media-image-sizes.html` were **already deleted** in an earlier round (both cite a 131-page total, both describe `/privacy.html` as already gone). Both files were nonetheless present, unmodified, in the zip uploaded for this round. I can't tell you *why* from here — whether that deletion never actually got committed, or the zip came from an older snapshot — only that the two don't match, and it's worth double-checking that whatever you push to GitHub next is this round's output, not a copy from before those files were removed a second time.

## 3. The 3 outlier pages, found and fixed

**`404.html`** — a completely separate, hand-coded header: no Tools nav, no mega menu, no search, no theme toggle, zero shared JS. Neither `build-static-pages.js` (looks for the old `class="site-header"` marker) nor `resync-chrome.js` (looks for `<header id="header">`) could ever find it, so it was invisible to both existing migration tools. **Fixed:** migrated onto the exact same shared chrome via a new small script, `build-404.js` (same pattern as the site's other `build-*.js` files). It now carries `<header id="header">`, so `resync-chrome.js` will maintain it automatically from now on — no separate script needs to run again.

**`privacy.html`** — an orphaned duplicate of `privacy-policy.html`: old header, own hardcoded `:root` tokens, self-referencing canonical, not in any sitemap, linked from nowhere except its own footer and one stale link in `terms.html`. **Fixed:** deleted (already excluded from the site's own build tooling; already partially redirected — see below).

**`article-social-media-image-sizes.html`** (no `-2026` suffix) — a stale duplicate of `article-social-media-image-sizes-2026.html`, same H1, old header, not in the sitemap, explicitly excluded by name in `build-tool-pages.js`'s own article-discovery filter. **Fixed:** deleted.

**`_redirects` gap:** the existing redirect rules only covered the extensionless clean-URL form of the two deleted pages (`/privacy`, `/article-social-media-image-sizes`) — not the `.html`-suffixed direct path, which is what actually got requested since the physical files still existed. **Fixed:** added explicit `.html` redirect entries for both, so old bookmarks/backlinks 301 correctly now that the files are gone.

## 4. One more bug, found while checking the outliers

**`terms.html`** carried a leftover duplicate stylesheet include — `<link rel="stylesheet" href="main.css">` from the old template, sitting alongside the correct `/main.css` the shared chrome also adds. Same file, loaded twice. Its footer also linked "Privacy" to the orphaned `privacy.html` instead of `/privacy-policy.html`, the one stale reference `POLISH-AUDIT-REPORT.md`'s own link crawl had flagged but not actually fixed. **Fixed:** duplicate include removed, footer link corrected to match every sibling legal page.

## 5. Verification after fixes

- **Header byte-identity:** all 131 remaining pages (133 − 2 deleted) now share one identical header block, hash-verified — not "131 minus known exceptions," all 131.
- **CSS/JS chain:** every page loads `mega-menu.css` and `mega-menu.js`; zero pages missing either; zero pages double-loading `main.css`.
- **Dangling references:** zero remaining links anywhere in the live site to either deleted file (only historical `.md` reports still mention them, left as-is — they're dated records, not live content, same principle `POLISH-AUDIT-REPORT.md` itself applied to `changelog.html`'s old tool-count mentions).
- **Tooling now covers 100% of pages:** `resync-chrome.js`'s own target discovery reports 131/131 pages found, 0 errors — `404.html` included for the first time.
- All build scripts re-checked with `node --check`: clean.

## 6. What genuinely still needs a human

Same honest limitation every prior report in this repo has flagged: no real browser here. The mega menu's hover/focus motion, the 404 page's new header rendering correctly at the top of a real error page, and a keyboard-only tab-through are all structurally verified but not eyeballed. Worth a two-minute look after deploy.

## 7. Files touched this round

New: `build-404.js`. Modified: `404.html`, `terms.html`, `_redirects`. Deleted: `privacy.html`, `article-social-media-image-sizes.html`. Nothing else in the 131 already-correct pages, `header-chrome.js`, `mega-menu.css`, or `mega-menu.js` needed any change — that infrastructure was already right.
