# Hero Visual System — Production Integration Report

## What changed, and why

**Root cause (confirmed against your real files):** `resolveMeta()` in
`build-tool-pages.js` picked a hero type with:
```js
const hero = (flagship && flagship.hero) || catDef.hero || 'compare';
```
`catDef` is `CAT_DEFAULTS[cat]` from `tool-content.js`, and every category's
default was a single hardcoded value — `image: 'compare'`, `pdf: 'workflow'`,
`developer: 'code'`, `marketing: 'live'`, `converter: 'convert'`. Any tool
without a bespoke `TOOL_META` override (all but 7 of your 66 tools) fell
straight through to that one value. That's the whole bug — not just image
tools, the same pattern silently affected developer/marketing/PDF tools too.

**The fix:** hero selection is now driven entirely by `hero-map.js` — one
real slug in, one hero type out, no category fallback, no per-page
hardcoding. `resolveMeta()` no longer computes or returns `hero`/
`heroVariant` at all.

## Files

| File | Status | What |
|---|---|---|
| `hero-map.js` | **replaces** the version from last round | All 66 real tools (pulled programmatically from your `data.js`, not transcribed), correct slugs, correct conversion directions |
| `hero-render.js` | **new** | Server-side renderer — 38 hero types, all built at Node build-time like your existing header-chrome/mega-menu bake, zero client JS |
| `tool-variants.css` | **hero section replaced**, everything else (use-cases/tips/comparison/workflow-timeline/section-reveal, lines 209+ in the old file) **untouched** | New CSS for all 38 types |
| `build-tool-pages.js` | **3 surgical edits** (see diff) | require hero-render, delete the two hero-resolution lines, delete the old 6-renderer block, update the one call site |

`tool-hero.js` and `tool-content.js` are **not modified**. `tool-hero.js`'s
`.tp-compare-range` selector now matches zero elements — its own
`if (!ranges.length) return;` guard makes that a clean no-op, verified with
zero console errors across every page. `tool-content.js`'s `hero`/
`heroVariant` fields on `TOOL_META`/`CAT_DEFAULTS` are now unread dead data
(checked: nothing else in the repo references them) — harmless to leave,
safe to delete later if you want to tidy up.

Diffs for both edited files are attached for your own review before you
apply anything.

## Validation (against your actual repo, not a mock)

- Ran your real `node build-tool-pages.js` — **0 errors**, wrote all 66 pages, sitemaps and `index.html`'s `numberOfItems` updated same as before.
- Loaded all 66 generated pages in headless Chromium: **0 real console/JS errors** (the only console lines were CDN-fetch 403s, caused by this sandbox's network restrictions blocking cdnjs — not present on your live site).
- Confirmed **every one of the 66 pages' `data-hero-type` matches `hero-map.js` exactly** — no mismatches.
- Confirmed **zero old hero classes** (`tp-compare`, `tp-scan`, `tp-stack`, `tp-code`, `tp-live`, `tp-convert`) remain anywhere in the 66 generated pages.
- Spot-checked direction-sensitive tools by hand: `heic-to-jpg` → HEIC→JPG (was showing generic Before/After), `png-to-jpg` → PNG→JPG "smaller", all 16 converters confirmed correct.
- GPU-safety audit of all 39 `@keyframes` blocks: caught one real violation (a divider animating `left`, inherited from the pattern the old CSS already used elsewhere) and fixed it to a static position + opacity pulse. Everything else was already transform/opacity/filter-only.
- Mobile fold check (390×844) across 6 hero types spanning the tallest (background-remover: 98px) to shortest: `#toolPanel` top ranged 447–541px — comfortably inside the first viewport every time.
- `prefers-reduced-motion: reduce` checked on 4 pages: hero stays visible, resolves to a static meaningful frame, zero errors.

## Applying this

Replace `hero-map.js`, `tool-variants.css`, `build-tool-pages.js` in your
repo root with the versions attached here, add the new `hero-render.js`
alongside them, then run your normal `build-tool-pages.js` →
`resync-chrome.js` → `build-tool-pages.js` pipeline as usual.
