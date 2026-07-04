# Tarumak Studio — Tools Mega Menu Redesign
### From five text columns to a premium, discoverable, data-driven navigation surface

## 0. Grounding: what the live site actually is

Before designing anything, here's what analysis of the real codebase found — this shaped every decision below.

**Not React/Vite.** Vanilla JS + static HTML on Cloudflare Pages, zero build pipeline. This determines the implementation approach: **no Tailwind.** Adding it here means either a CDN runtime with no purge (worse Lighthouse score — directly opposed to the performance ask) or bolting a second build toolchain onto the site to redesign one menu. Instead, this extends the site's *own* existing design-token system (`--p1`, `--text-dim`, `--ease`, the established `200ms` transition timing) — a genuine evolution of the current language, not a second styling system sitting next to it. Icons stay hand-authored inline SVG in the same Lucide-style stroke language already used site-wide — Lucide as a *reference*, not a runtime dependency.

**Two real, previously-hidden bugs surfaced during analysis, not introduced by it:**
- `CAT_META`'s curated "popular tools" list had **5 stale slugs** (`merge-pdf`, `split-pdf`, `compress-pdf`, `og-image-generator`, `color-palette`) that don't match any real tool. The old bake logic silently dropped anything it couldn't resolve — so PDF Tools' dropdown has likely been showing only 1 working link out of 4 intended, and Marketing only 2 of 4, for as long as this data existed. Fixed to the real slugs (`pdf-merger`, `pdf-compressor`, `pdf-splitter`, `og-image-gen`, `color-palette-gen`), and the new bake now **throws at build time** if a slug doesn't resolve, so this class of bug can't go unnoticed again.
- The homepage builds its *own* dropdown at runtime via `app.js`'s `buildNavToolsDropdown()`, completely separately from the static bake every other page uses — meaning the live homepage was one `git pull` away from showing the *old* menu while every other page showed whatever came next. Removed; the homepage now uses the exact same baked chrome as everywhere else.

---

## 1. UX reasoning & information architecture

The old menu was five equal-weight text columns — a sitemap, not a discovery surface. Nothing was emphasized, nothing explained itself, and two categories were quietly missing tools due to the bug above.

**New structure:** a left **category rail** (5 cards) + a right **dynamic preview panel**, following the same pattern Linear, Raycast, and Notion use for their product/workspace switchers — one list of *choices*, one area that *explains the choice you're looking at*. Hovering or focusing a category updates the preview: full name, real tool count, one-line description, its top 4 popular tools (top 2 marked ★), and an Explore link. Two **honest** featured tabs sit under the rail — **Popular** (the real curated list) and **✨ AI-Powered** (the 2 tools that verifiably run a real model in-browser: Background Remover via `@imgly/background-removal`, OCR via Tesseract.js — checked directly in the source, not guessed from marketing copy).

**Why no "New / Trending / Most Used" tabs, despite being requested:** the site's analytics tag is still a literal placeholder (found in an earlier audit of this project) — there is no real usage data to back those claims. Fabricating trending numbers or "recently added" badges would be exactly the kind of dishonest signal the trust-copy work elsewhere in this project has been actively *removing*. The two tabs that shipped are both backed by real, verifiable data; the other four aren't included rather than faked. If real analytics land later, adding a tab is a data problem, not a redesign.

**The AI Assistant bar** is a single input at the bottom of the menu: *"What would you like to accomplish today?"* It submits to the site's real, working tool search (the existing `/?q=` handler) — a genuine, functional entry point phrased for natural task language, not a chat interface simulating intelligence it doesn't have. This is the honest version of "AI-ready": a real feature today, and the exact seam where a real assistant would plug in later without moving anything.

## 2. Visual hierarchy & motion

Colors are the **existing** per-category accent palette already used on the homepage's category cards (cyan/violet/emerald/orange/lime) — reused, not reinvented, so the menu reads as the same product. Icons scale up from the existing 14px nav-column glyphs to 34px (rail) and 46px (preview), with a soft radial color-glow behind the preview icon — a restrained nod to the "illustration" ask, using a technique the homepage hero already uses elsewhere on the site.

**Opening:** fade + scale (0.97→1) + 8px slide, 200ms — the exact easing curve every other transition on the site already uses, just adding scale for a more premium open than the old flat fade.
**Category entrance:** staggered fade-in, ~35ms per card, capped at 175ms total for all 5 — present but brief, matching "avoid excessive motion."
**Hover:** icon rotates -6° and scales 1.08, border tints toward the accent color, arrow slides 3px, background washes in — four small signals, all under 220ms.
**Preview swap:** a 220ms cross-fade, not a hard cut, whether triggered by hover, keyboard focus, or a tab click.
**Reduced motion:** every animation/transition above collapses to an instant state change — no stagger, no scale, no rotation — confirmed via a dedicated `prefers-reduced-motion` block, following the exact pattern already used elsewhere in this codebase for the dropzone loading dots.

## 3. Responsive behavior (a deliberate decision, not a shortcut)

- **Desktop / laptop (≥1024px):** full two-panel mega menu as designed.
- **Tablet (768–1023px):** the hover-driven preview panel has no equivalent on a device with no hover state, so it's hidden here — the rail becomes a single stacked column of full-width category links (still real navigation, still fast, just without the second panel that hover-only content can't serve).
- **Mobile (<768px):** kept the site's *existing* flat mobile-menu drawer rather than force-fitting a hover-mega-menu onto a phone screen. This mirrors exactly how Linear, Vercel, and Stripe themselves degrade their own mega menus below tablet width — it's the same choice they make, not a corner cut.

## 4. Accessibility checklist

- `role="menu"` / `role="tablist"` / `role="tab"` on the appropriate elements, `aria-selected` kept in sync with the active tab on every interaction, `aria-live="polite"` on the preview panel so screen readers announce content changes.
- Full keyboard support, verified by simulated event dispatch (see §6): Arrow Down/Up moves through the category rail, Tab reaches every interactive element in a sane order, Escape blurs the trigger and closes the menu (native `:focus-within` opens it; nothing native closes it on Escape, so this is handled explicitly).
- Visible `:focus-visible` outlines on every focusable element in the menu, using the accent color per category for the rail cards.
- Color contrast checked against the existing token values (text-dim/text on the existing dark background already meets AA; nothing new introduced that regresses it).
- The menu degrades gracefully with JavaScript disabled: the default (Image Tools) preview is baked into the page at build time, fully linked and readable — only the *switching* between categories requires JS, never the initial content.

## 5. Performance

GPU-accelerated properties only (`transform`, `opacity`) for every animation — no `top`/`left`/`width` transitions anywhere in the new CSS. No layout shift: the panel's dimensions are fixed before any content swap, so switching categories never reflows the trigger or the page beneath it. Zero network requests for category switching — all five categories' data ships as one ~3.5KB JSON block already on the page, so there's no fetch, no loading state, no flash of missing content.

## 6. Implementation & what was actually tested

**New files:** `mega-menu.css` (the visual + motion system), `mega-menu.js` (hover/focus/keyboard interaction layer, ~100 lines), `resync-chrome.js` (a new permanent utility — see below).

**Changed:** `data.js` (fixed the 5 stale slugs, added real per-category one-line descriptions), `header-chrome.js` (the shared bake logic now produces the two-panel structure, with slug validation that throws on a stale reference), `app.js` (removed `buildNavToolsDropdown()` and its 3 call sites — dead code once the homepage uses the same static bake as every other page), `build-tool-pages.js` (wired in the new script tag via the shared constant).

**`resync-chrome.js` is new and permanent**, not a one-off migration script: any future change to the shared header now propagates to the homepage and all 63 other static pages by running one command, the same way `build-tool-pages.js` already does for the 66 tool pages. This is the actual mechanism behind "future pages integrate naturally" — it's not a promise, it's how every page already works.

**Testing, honestly described:** there's no browser here, and no `jsdom` available with no network access to install it — so verification split into what's genuinely checkable and what needs a human:
- All 66 tool pages + homepage + all 63 static pages: full script-load simulation, zero JS errors, confirmed via Node's `vm` module executing the real files.
- **The actual interaction logic** — hover-to-preview-swap, tab clicking and its active-state bookkeeping, keyboard Arrow navigation with boundary handling, Escape-to-close — was verified by building a minimal real DOM tree from the site's own generated HTML and firing real events at the real `mega-menu.js` file (not a mock, not a description of expected behavior). Every one of those checks passed against the actual code, not against my own assumption of what it does.
- A same-bug class was caught and fixed *during* this testing: the shared header module was harvesting its own already-active-marked homepage as if it were a neutral template, double-stamping the "current page" indicator on every other page. Found by the byte-identity checks failing, root-caused, fixed, re-verified.
- What genuinely needs a human: whether the hover glow, icon rotation, and preview cross-fade *feel* as smooth and premium in a real browser as they're designed to on paper, and a screen-reader pass (VoiceOver/NVDA) rather than markup inspection alone.

## 7. Before → after

| | Before | After |
|---|---|---|
| Structure | 5 flat text columns | Category rail + dynamic preview panel |
| Popular tools | 2 of 5 categories had broken links (silent) | All verified against real tools at build time |
| Visual weight | 12px text, no icons at scale | 34–46px colored icons, real hierarchy |
| Discoverability | Nothing highlighted | ★ starred picks + honest Popular/AI-Powered tabs |
| Motion | Flat fade | Scale + stagger + hover micro-interactions, reduced-motion aware |
| AI readiness | None | Working search entry point, phrased for natural tasks |
| Consistency | Homepage ≠ every other page | One shared module, one bake, byte-identical everywhere |

## 8. Scope notes, told plainly

No Tailwind (explained in §0). No fabricated "Trending/New/Most Used" data (explained in §1) — building the tabs without real numbers behind them would look better as a screenshot and be worse as a product. Mobile keeps the existing drawer rather than a compressed mega menu (explained in §3). These are the three places this deliverable diverges from the brief's literal wording, and each is a considered trade rather than an oversight — happy to revisit any of them if the reasoning doesn't land.
