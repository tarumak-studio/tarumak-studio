# Global Header Unification — Report
### One shared header component, everywhere. Zero navigation code duplication.

## Architecture note (read this first)

Tarumak Studio is vanilla JS + static HTML on Cloudflare Pages — there's no React/Vite, so "one shared Header component" doesn't mean a runtime component. The correct static-site equivalent, and what's implemented here: **one file is the single source of truth for the header markup (`index.html`'s own `<header>`), and every page that needs it gets it from one shared module at build time — never by hand-editing a second copy.** That module is `header-chrome.js`. This is the same pattern already proven out for the 66 tool pages; this round extracts it properly and extends it to everywhere else.

## Root cause

63 pages — every category page, the blog index, all 50 blog articles, About, Contact, Work With Me, the changelog, and the legal pages — were still built from an older, simpler header template: flat text links, a plain hamburger button, **no search box, no theme toggle, no Tools dropdown at all.** Not a styling gap — a structurally different, less-capable header that had never been migrated when the richer header was built for the homepage and tool pages.

## What was built

**`header-chrome.js`** — the single shared module. Harvests the header + mobile menu verbatim from `index.html`, bakes the Tools mega-menu from the same data `app.js`'s dynamic version would use (so the dropdown needs zero JavaScript to render — pure CSS `:hover`/`:focus-within`, confirmed by inspecting `main.css` directly), and now also exposes `withActiveNav()` for the current-page highlight. `build-tool-pages.js` was refactored to call this module instead of doing the harvest inline — verified as a byte-for-byte no-op on all 66 existing tool pages before building anything new on top of it, specifically so this round wouldn't introduce the exact duplication it's meant to eliminate.

**`build-static-pages.js`** — the new migration script, for the 63 pages the tool-page work never reached. Per file: swaps the old header+mobile-menu for the shared chrome, ensures `main.css` is linked, removes the old per-page `:root` color tokens (superseded by `main.css`'s), strips the now-dead inline burger-toggle script (two formatting variants existed across templates; matched by content, not exact whitespace, so both were caught), and adds the minimal script chain the header needs — `config.js`, `utils.js`, `data.js`, `features.js`. Deliberately **not** `app.js` or the five category tool files: nothing on these pages mounts a tool, and the dropdown needs no JS at all, so loading either would be dead weight. Existing page-specific behavior — `blog.html`'s article-grid builder, `contact.html`'s form handler, every page's own JSON-LD — is untouched.

## A bug this surfaced, not introduced

Building the minimal script chain for these pages required tracing exactly what the header's search box depends on — which is how I found that **`matchTools()`, the function the search box calls on every keystroke, lives in `app.js`, which the 66 "already unified" tool pages never load.** Confirmed by actually firing a synthetic `input` event in a Node sandbox (my normal mount-simulation testing never caught this, because it only loads scripts and calls `INIT()` — it never dispatches DOM events): the search box has been throwing `ReferenceError: matchTools is not defined` on every tool page, on every keystroke, since those pages first shipped. Fixed by moving the whole search-matching unit (`matchTools`, `normalizeSearchTerm`, `EXT_SYNONYMS`, `highlightMatch`, `escapeHtml`) into `data.js` — the one file that's loaded absolutely everywhere search appears. Re-verified with the same synthetic-event technique on both the homepage and a tool page after the move: clean on both.

**A second, related gap, also site-wide:** `main.css` already has full styling for `.nav-active` (the current-page nav highlight) — nothing was ever setting the class. Not on tool pages, not on category pages, not anywhere. Added `withActiveNav()` to the shared module and wired it into both build scripts, mapped per page type (tool/category pages → Tools, blog + articles → Blog, and so on; pages with no honest match — changelog, legal pages — are correctly left unmarked rather than forcing a wrong tab active).

## Verification

- **Byte-identity, not "looks the same":** the header block on all 66 tool pages, all 5 category pages, and all 51 blog pages (index + 50 articles) is byte-for-byte identical to every other page in its group. About/Contact/Work&nbsp;With&nbsp;Me differ from each other by *exactly* the position of the `nav-active` class — confirmed by stripping that one marker and diffing what's left, which comes back identical.
- **Dropdown arrow + mega menu:** present and complete (5 populated columns) on every one of the 63 migrated pages plus all 66 tool pages — checked programmatically, not sampled.
- **Zero JavaScript errors:** every migrated page's script chain loads clean in a Node sandbox, *and* a synthetic keystroke into the search box and a synthetic click on the theme toggle both execute without throwing — checked on all 63 pages individually, not a handful. Tool-page mount simulation (all 66, all 9 shared JS files) and the full homepage stack (`app.js` + `features.js` together) both stayed clean throughout.
- **Zero new 404s:** re-crawled every internal `href` across all 194 HTML files after the migration.
- **Legacy markers gone:** zero remaining `.site-header` instances, zero remaining references to the old `#burgerBtn`/`#mobMenu` IDs, anywhere.

## Files touched

`header-chrome.js` (new — the shared module) · `build-static-pages.js` (new — the migration script) · `build-tool-pages.js` (refactored to consume the shared module; verified as a no-op before extending) · `data.js` (gained the search-matching functions) · `app.js` (lost them — no duplication) · 63 pages migrated: `about.html`, `blog.html`, `contact.html`, `work-with-me.html`, `changelog.html`, `privacy-policy.html`, `terms.html`, `cookie-policy.html`, `image-tools.html`, `pdf-tools.html`, `developer-tools.html`, `marketing-tools.html`, `converter-tools.html`, and 50 `article-*.html` pages.

## Scope decisions (told plainly, not left implicit)

**The footer was not touched.** These 63 pages currently use a much simpler footer than the homepage's five-column one — a real inconsistency, but a different, larger visual change than "fix the header," and wasn't asked for this round. Flagging it here rather than silently expanding scope or silently leaving it out.

**Per-page color tokens were removed, not reconciled.** 56 of the 63 pages had their own embedded `:root` block with values a few percent off from `main.css`'s (e.g. `#0c111a` vs `#0a0d18` for the background) — close enough that no one would spot it side by side, but not byte-identical. Since `main.css` is linked now regardless, keeping the redundant local copy served no purpose, so it's gone; every color on these pages now resolves against the exact same tokens as the rest of the site.

## Honest limitations

Structural and functional correctness is verified thoroughly — byte-identity, JS execution, synthetic interaction events, link integrity. What still wants a real browser: confirming the mega-menu's hover/focus visual transition looks right on an actual category or article page (the CSS is identical to the tool pages it already works on, but "identical CSS" isn't the same as "seen it render"), and a keyboard-only tab-through on one of the newly migrated pages to feel the focus order end to end.
