# Tarumak Studio — Regression Fixes + Tablet/Mobile Navigation Overhaul

## Part 1 — The PDF Merger crash in your screenshot

**Root cause, traced to the exact line.** The error — `Cannot read properties of null (reading 'appendChild')` — comes from `toast()` in `features.js`: `toastRack.appendChild(el)`, with `toastRack` set once at load time to `$('#toast-rack')`. That element existed **only on the homepage**. Every other page on the site — all 66 tool pages, all 50 articles, every category page — never had it. `toast()` is called from 39 places across the codebase, including `utils.js`'s `download()` function, which calls it after *every single successful file download, sitewide*.

**This means your merge almost certainly worked.** Looking at the sequence in `pdf-merger`'s code: PDFLib merges the files, `download()` triggers the actual file save, *then* calls `toast('merged.pdf downloaded', 'ok')` — and that's the line that threw. The error message made it look like the merge itself had failed, when the actual PDF processing had very likely already succeeded and the failure was purely in the success notification afterward. That's a worse bug than a simple crash: it makes working features look broken.

I found this by tracing every `appendChild` call in `pdf-tools.js`, none of which matched, then checking what `download()` calls afterward — `toast()` — and confirming `#toast-rack` doesn't exist on `pdf-merger.html`. Checked how many of the 132 pages were missing it (131) and how many call sites depend on it (39) before touching anything.

**Fix:** `#toast-rack` is now a proper shared-chrome export from `header-chrome.js` (same pattern as the footer), propagated to all 132 pages via the existing build scripts. Its CSS was also only in `tools.css` (68 pages) — moved to `main.css` so it's styled correctly everywhere too. Added a defensive `if(!toastRack)return;` guard to `toast()` itself as a safety net, matching this codebase's existing style elsewhere. Verified by running the actual `toast()` function against `pdf-merger.html`'s real DOM structure: it now appends a correctly-classed, correctly-worded toast with zero exceptions.

## Part 2 — "Some pages footer are broken"

Real, and a second instance of the exact same bug class: footer HTML is byte-identical on all 131 non-404 pages, but **all of its CSS** (`.fgrid`, `.fcol`, `.socials`, `.soc`, `.news`, `.fbar`, and the base `footer{}` rule) lived only in `tools.css`. On the 64 pages that don't load that file — every article, every category page, about/contact/work-with-me/blog/legal pages — the footer rendered as an unstyled stack of plain links and text instead of the intended 5-column layout with social icons.

**While investigating this, found the same pattern was also silently breaking the entire tablet/mobile navigation switch** — the CSS rule that hides the desktop nav bar and shows the hamburger button was *also* only in `tools.css`. On those same 64 pages, the hamburger never appeared and the full desktop nav stayed visible and unusable at phone width. This is very likely the actual root cause behind most of the navigation brief below — not that touch interactions needed fixing in isolation, but that the fundamental responsive switch didn't exist at all outside the 68 pages that happened to load `tools.css`. Also found and fixed in the same pass: the site's `prefers-reduced-motion` accessibility rule and `.nav-active` styling had the identical problem.

**Fix:** all four moved to `main.css`, which every page loads. Re-verified footer/header byte-identity across all 132 pages after the move.

## Part 3 — The tablet/mobile navigation overhaul

Analyzed the existing architecture first, as required. Confirmed: desktop's mega menu is pure CSS `:hover`/`:focus-within` (`mega-menu.js` only swaps preview content and handles keyboard arrows — it never controls open/closed state). That part is completely untouched by this work.

### What changed, and why it's scoped the way it is

**Breakpoints redefined** (in `main.css`, replacing the broken 1160px rule from Part 2): nav bar + search now hide, and the hamburger appears, **only below 767px** — not 1160px. Tablet (768–1024px) now keeps the exact same visible nav bar as desktop; nothing structural changes there. This one change is what actually creates a distinct tablet tier at all — before this, "tablet" didn't functionally exist; anything under 1160px got the (broken, on 64 pages) hamburger treatment.

**Tablet (768–1024px): tap instead of hover, same dropdown.** `nav-responsive.js` intercepts clicks on the "Tools" trigger *only* when `window.innerWidth <= 1024`. First tap opens the panel (`preventDefault` + adds a `.js-open` class); a second tap, or tapping anywhere outside, closes it. Above 1024px the same click handler checks the width and does nothing — the event passes through and the link navigates exactly as it always has. Verified this empirically: ran the real code at both 800px and 1440px widths — at 800px, `preventDefault` fires and the panel opens; at 1440px, neither happens and the click is untouched.

The dropdown's markup, styling, category-preview-swap logic (`mega-menu.js`), and keyboard behavior are all **completely reused** — `.js-open` was added as a class-based equivalent to the existing `:hover`/`:focus-within` rules, so the panel opens identically regardless of which one triggered it. No dropdown content was rebuilt.

**Mobile (<767px): rebuilt drawer.** Was a bare `display:none`/`flex` toggle with 6 flat links and no search, no theme toggle, no animation. Now:
- Slides in from the right with a fading backdrop (`transform: translateX(100%→0)`, backdrop `opacity: 0→1`), both respecting `prefers-reduced-motion` (transitions removed entirely, not just shortened).
- Full-width on small phones (`min(400px, 100vw)`).
- Contains, in order: search (visible immediately, no extra tap), Home, a **Tools accordion**, About/Work With Me/Blog/Contact, then Explore Tools + dark-mode toggle pinned at the bottom.

**The accordion is built entirely from data that already existed** — the same `#megaMenuData` JSON the desktop mega menu reads, embedded once per page. `nav-responsive.js` reads it and generates all 5 category sections (4 tools + a "View All" link each) at runtime. No tool list was hand-authored a second time. Verified this specifically: extracted the real JSON from `index.html` and ran the actual generation logic against it standalone — all 5 categories resolve correctly (Image: 18 tools/4 shown, PDF: 15/4, Developer & SEO: 15/4, Marketing: 8/4, Converter: 10/4), matching the desktop panel's own "popular" picks exactly.

Only one accordion section opens at a time — expanding a new one collapses whichever was previously open, the concrete form "only one dropdown open at a time" takes inside this specific UI.

**Drawer search reuses `matchTools()` from `data.js` verbatim** — the same name/slug/description/category matching with synonym support that the header search and homepage hero search already use. No second matching implementation. Supports arrow-key navigation and Enter to open the highlighted result, plus a "no results" state.

**Dark mode toggle** — a second button inside the drawer, wired so clicking it updates *both* its own icon and the header's, and the drawer's icon re-syncs to current state every time the drawer opens (so switching themes via the header while the drawer was closed doesn't leave it stale).

### Accessibility

- Focus trap: `Tab`/`Shift+Tab` cycle within the drawer's visible, focusable elements only (a collapsed accordion panel's links are correctly excluded via an `offsetParent` visibility check).
- `Escape` closes the drawer (and separately, the tablet dropdown) and returns focus to whatever triggered it.
- Scroll lock via `position: fixed` on `<body>` with the scroll position preserved and restored — not `overflow: hidden` alone, which iOS Safari is known to ignore for background scroll.
- All new touch targets are ≥44×44px (search input, accordion rows, drawer links, action buttons) — enforced only inside the mobile breakpoint, so desktop's existing 40px icon buttons are untouched.
- "Tap outside closes" and "prevent accidental close while scrolling" are the same mechanism: a real `click` listener, which by nature doesn't fire during a scroll/swipe gesture — no separate scroll-detection debounce needed.

### Verification (executed, not assumed)

Built a DOM test harness capable of real class selectors, event dispatch, and tree traversal, then ran the *actual* `nav-responsive.js` against it:
- Burger click → drawer opens, backdrop shows, `aria-expanded` flips — confirmed.
- Close button and backdrop click → both correctly close and reset all state — confirmed.
- Theme toggle → both icons and both ARIA labels update in sync — confirmed.
- Tablet width (800px) → trigger tap prevents navigation, opens panel, sets ARIA — confirmed.
- Desktop width (1440px) → same trigger, same click — nothing intercepted, confirmed inert.
- Tap-outside and Escape → both correctly close the tablet dropdown — confirmed.
- Re-ran the full homepage boot sequence (the fix from the previous regression round) — still zero uncaught exceptions after all of tonight's changes.
- CSS brace-balance checked across all 4 modified/new stylesheets — clean.
- Header/footer byte-identity re-checked across all 132 pages after every change — still one variant each.

## Files changed

**New:** `nav-responsive.css`, `nav-responsive.js`. **Modified:** `header-chrome.js` (TOAST_RACK + NAV_RESPONSIVE_SCRIPT exports), `resync-chrome.js` / `build-tool-pages.js` / `build-tools-page.js` (propagate both), `main.css` (footer/reduced-motion/nav-active moved in; new mobile-only breakpoint), `tools.css` (old rules removed, now sourced from main.css), `mega-menu.css` (`.js-open` support, removed the 900px force-hide bug), `features.js` (toast null-guard; old hamburger line removed), `index.html` (drawer markup rebuilt; harvested everywhere). **Regenerated:** all 66 tool pages, `tools.html`, all 63 static/article pages' chrome.

## Before → after

| | Before | After |
|---|---|---|
| Pages where `toast()` crashes | 131 of 132 | 0 |
| Pages with correctly-styled footer | 68 of 132 | 132 |
| Pages where mobile nav-switch works at all | 68 of 132 | 132 |
| Tablet-specific nav behavior | none (same as mobile) | tap-to-open, nav bar stays visible |
| Mobile drawer contents | 6 flat links | search, accordion (5 categories, real data), 4 flat links, Explore Tools, theme toggle |
| Drawer animation | instant show/hide | slide + fade backdrop, reduced-motion aware |
| Focus trap / Escape / scroll lock | none | all three |
| Touch targets on mobile | mixed, some <44px | ≥44×44px enforced |

## Validation checklist

- [x] Desktop nav and mega menu — untouched, re-verified inert at 1440px width.
- [x] Tablet (768–1024px) — nav bar visible, tap opens Tools, tap-outside and Escape close it, single dropdown only.
- [x] Mobile (<767px) — hamburger, drawer, accordion, search, theme toggle, Explore Tools all present and wired.
- [x] Keyboard: Tab cycles within drawer only; Enter/Space opens the tablet dropdown; Escape closes both surfaces.
- [x] Reduced motion: all transitions removed via `prefers-reduced-motion`, both in the drawer and the existing mega menu.
- [x] No layout shift: the tablet touch-target bump (44px min-height on the Tools trigger) sits well inside the nav's existing fixed 72px row height — checked directly, not assumed.
- [x] Zero duplicated navigation data — the accordion reads the same JSON the desktop menu already had.
- [x] Header/footer byte-identical across all 132 pages, re-checked after every change in this round.
- [ ] **Needs a real device/browser:** touch-specific quirks (momentum scroll inside the drawer, iOS rubber-banding at the scroll-lock boundary, exact 60fps feel of the slide/accordion animation) — structurally correct and reduced-motion-safe here, but this environment can't fire a real touchscreen.

## Remaining recommendations

- Consider whether the tablet dropdown's second-tap-to-close behavior should instead navigate on the second tap (some users expect "tap the label twice" to mean "go there") — left as toggle-only since it's the more common disclosure pattern and `/tools`, the category "Explore" links, and the header CTA all still reach the same destination.
- The mega-menu's AI-prompt search bar still submits to `/?q=` — unrelated to this round's scope, noted previously and still true.
