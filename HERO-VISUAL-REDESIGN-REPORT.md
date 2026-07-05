# Tarumak Studio — Hero Visual Redesign
### Smaller footprint everywhere, one real animation gap closed, upload area untouched

## 0. Measuring the actual problem before touching anything

Calculated the real vertical stack a mobile visitor faced before reaching the upload tool, using the actual CSS values that existed:

| Element | Height |
|---|---|
| Header | 64px |
| Breadcrumb | ~34px |
| Hero text (H1 + lead + badges) | ~139px |
| **Hero Visual** (shell padding 28px + tallest hero, the 220px-tall compare type) | **~250–276px** |
| Panel margin | ~20px |
| **Total before the upload tool's top edge** | **~515–553px** |

On a common small-phone usable viewport (roughly 580–620px after browser chrome), that left only 30–90px for the actual dropzone to peek into view — nowhere near enough to read as "the upload area is here." The Hero Visual alone was over half the problem.

## 1. What changed

**The shared shell** (`.tp-hero-visual`, wraps all 6 hero types): padding 28px → 16px (10px on mobile), `min-height` 180px → 100px (64px on mobile), margin-top 22px → 14px (10px on mobile).

**Every one of the 6 hero types individually**, not just the shell around them — each type's own internal dimensions were cut to roughly 55–65% of their original size, with an additional mobile-specific reduction on top:

| Hero type | Before (main element) | After (desktop) | After (mobile) |
|---|---|---|---|
| Compare (before/after) | 220px tall | 100px | 64px |
| Scan (OCR document) | 96×124px | 62×80px | 52×68px |
| Workflow (stacked docs) | 150px tall, cards 78×100px | 84px, cards 54×68px | 60px, cards 40×50px |
| Code (console mock) | ~194px (5 lines, 1.7 line-height) | ~150px (1.5 line-height, tighter padding) | same (already compact) |
| Live (preview card) | 168×106px | 120×76px | 96×62px |
| Convert (format badges) | ~66px | ~44px | same |

**New estimated mobile total: ~340px** before the upload tool's top edge (down from ~515–553px) — leaving roughly 240–280px of a typical small-phone viewport for the dropzone itself, comfortably enough for its icon, "Drop files here" text, and format chip to be genuinely visible without scrolling.

Every reduction is a size change only — no hero type's *content* (icons, labels, structure, category accent colors) was removed, per "keep it attractive, just smaller."

## 2. Animation consistency — found the actual gap, not a guess

Checked every one of the 6 hero types individually for real `animation:` declarations rather than assuming. Result: **5 of 6 already had motion — only "compare" (used for the Image Tools category default, plus Background Remover and Image Compressor specifically) had none at all.** Given Image Tools is the largest category, this was likely the single most-seen static illustration on the site.

**Fixed with a self-animating sweep**, not a generic pulse — thematically fitting for a before/after tool: the split line, its glowing divider, and the handle icon now drift slowly back and forth (30%↔70% over 6 seconds) on their own, demonstrating the before/after concept without requiring a visitor to touch anything. The moment someone actually drags the real slider, a small script (`tool-hero.js`) adds one class that freezes the auto-sweep and hands permanent control to their input for the rest of the page view — verified this handoff directly: before interaction, no freeze class present; the instant the (real, unchanged) range input fires its `input` event, the class appears and the manually-set position is applied correctly.

Every animation on the page — the 5 that already existed and this new one — has a `prefers-reduced-motion` fallback; the new sweep was built to the same standard as the rest.

## 3. Consistent spacing across categories

All 5 tool categories (Image, PDF, Developer, Marketing, Converter) share the exact same shell (`.tp-hero-visual`) and now the exact same reduction applied to it — there's no per-category shell override to drift out of sync. The 6 hero *types* differ from each other by content (a document mock necessarily looks different from a code console), but their footprints are now much closer to each other than before: previously ranging ~236–276px, now ranging roughly 74–94px on mobile — a genuinely tighter, more consistent band.

## 4. What was not touched

The upload area, drop zone, and every other part of the actual tool interface — confirmed untouched by checking the tool-mount markup and its CSS (`.tp-panel-frame` and everything inside it) directly; nothing in this round's diff touches those selectors. Only `tool-variants.css` (hero-specific styles) and `tool-hero.js` (the compare slider's own script) were changed.

## 5. Verification

- Recalculated the full vertical stack using the actual new CSS values (not a rough guess) — see the table above.
- Confirmed via direct inspection that only the compare hero lacked animation before this round, and confirmed all 6 have it now.
- Ran the actual `tool-hero.js` code in a test harness: confirmed the auto-sweep is unfrozen by default, and freezes correctly (with the right `--tp-split` value and handle position) the moment a drag is simulated.
- Re-verified header/footer byte-identity across all 132 pages, and CSS brace-balance / JS syntax across the whole project — this was a two-file change (`tool-variants.css`, `tool-hero.js`) and neither regressed anything else.
- Spot-checked real generated tool pages to confirm the HTML markup's class names match the new CSS exactly (no stale class references).

## Files changed

**Modified:** `tool-variants.css` (all 6 hero types resized, new compare-hero sweep animation added), `tool-hero.js` (freeze-on-interaction logic). **Regenerated:** all 66 tool pages (content unchanged, just picking up the external CSS/JS changes on rebuild). **Unchanged:** the tool panel/upload area and its CSS, `build-tool-pages.js`'s hero-markup-generating functions (only the CSS consuming that markup changed, not the markup itself), every other page type.

## Honest limitation

This environment can measure and verify CSS values, run the actual interaction logic, and calculate the resulting layout math precisely — which is what the table in §1 and the freeze-on-interaction test represent. It cannot render a real phone screen and confirm the upload area is visually, pixel-for-pixel in the first viewport on every device in your audience. The math points clearly in the right direction (a ~35% cut in the total pre-tool stack, concentrated almost entirely in the Hero Visual itself); a two-minute check on an actual phone is worth doing once this is live.
