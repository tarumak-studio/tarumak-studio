# AI Image Upscaler v4.0 — Upgrade Report

## The root cause, found before writing any UI code

Your screenshot's own label — "Engine: High-quality resampling · v3.0" —
is the bug made visible. The engine already had a real neural path
(ESRGAN via TensorFlow.js), but it silently rejected any input over 4
megapixels and fell through to plain resize+sharpen. Your test image was
2880×3840 = **11.1MP** — nearly 3× over that cap. For any modern phone
photo (most are 8–12MP+), the neural path could never run at all. That's
why it "feels like interpolation instead of AI": for the majority of real
uploads, it genuinely was.

## The fix has two independent parts, because I can verify one and not the other

**Part 1 — the classical fallback, fully rewritten and tested.** This is
what runs whenever the neural path is unavailable (older devices, no
WebGL, or — before this fix — any large photo). It was architecturally
thin: resize, then sharpen, nothing else. I added two real passes, ported
from the proven, already-tested techniques in `enhancer-engine.js` rather
than inventing new ones:

- **Denoise runs first, on the original resolution, before any resize** —
  cleaning JPEG artifacts and sensor noise here means the resize steps
  enlarge clean detail instead of amplifying noise. Gated by a
  same-neighborhood-median check so real edges are never touched.
- **A local-contrast ("clarity") pass after resizing** — the same
  downscale/upscale-back technique already proven in the enhancer,
  giving a sense of recovered depth that plain edge-sharpening alone
  doesn't provide.

Verified two ways: a variance test proving realistic noise amplitude
drops meaningfully (68→23) while a genuine hard edge stays completely
untouched (10 vs 250, unchanged), and a direct test of the clarity math
proving it produces exactly zero change on a flat region (won't invent
fake detail) and a moderate, bounded boost where real local contrast
exists. Also renamed the label from "High-quality resampling" to "Detail
Reconstruction Engine" — accurate to what it now actually does, and
deliberately *not* using "AI" or "Neural" anywhere in that label, since
this specific path isn't.

**Part 2 — large images now get real AI, not a silent skip.** Instead of
rejecting anything over the 4MP cap, the engine now downscales to fit the
inference budget, runs genuine neural detail recovery on that proxy, then
does one final resize to match your exact requested output dimensions.
For your screenshot's photo specifically: it would now downscale to a
1732×2309 proxy (verified at exactly 4.00MP, aspect ratio preserved),
get real ESRGAN detail recovery on nearly 3× more image data than before,
then resize to the true 5760×7680 target.

**I have to be direct about the limits of what I verified here.** This
container has no browser, no WebGL, no way to execute the actual
TensorFlow.js/ESRGAN inference. I traced the control flow and the math
carefully and I'm confident it's *logically* correct — but I cannot claim
to have run it end-to-end the way I could test the classical pipeline
numerically. Please treat this specific code path as needing a real
device test before you fully trust it.

## UI, built on patterns already proven twice this project

Rather than design a fourth version of "comparison modes" or "progress
bar," this reuses the exact components already verified working for the
Object Remover and AI Photo Enhancer:

- **Comparison modes** — Split and Side-by-side (the two your brief
  asked for, not the enhancer's four), remembered for the session.
- **Zoom** — Fit/100%/200%/400% + Reset, wheel-zoom preserved. Both
  images zoom together by construction, not by two transforms kept in
  sync by hand: split mode scales one shared DOM subtree, side-by-side
  scales two flex siblings inside the same scaled row — there's
  structurally nothing that *could* desync them.
- **Upload progress** — real, not simulated theater: the percentage
  reflects actual decode/canvas-draw work, which genuinely takes visible
  time on large images.
- **Processing steps** — a checklist mapped to the engine's *real*
  progress ranges (denoise 2–20%, resize 20–55%, clarity 55–75%, sharpen
  75–98%, or the neural equivalents) — it lights up because real work
  crossed that threshold, not on a fixed timer.
- **Enhancement summary card** — Original/Enhanced resolution, real
  badges (different sets for neural vs. classical, since they earn
  different claims), processing time, engine, version.
- **Download button** — "Download 5760×7680 PNG (~12.4 MB)" instead of
  "Download", with a real byte-per-pixel size estimate for the selected
  format.
- **Live difference highlight** — a subtle glow on the divider line while
  actively dragging the split slider. Deliberately not a fake pixel-diff
  overlay, which would risk exaggerating a synthetic "look how different
  these are" effect the brief explicitly said not to do.
- **Continue Editing** — reused directly, now tracked via the same
  delegated `continue_editing_click` listener built in the enhancer
  session (works automatically here too, no new code needed).

## A double-count I caught before shipping

`dropzone()` already fires `tool_upload` automatically for every
file-based tool (wired in the GA4 analytics session). I initially added
a second, manual `tool_upload` call in this tool's own upload handler —
caught it before finishing and removed it, rather than ship an event
that fires twice per upload.

## Verified, not assumed

- Downscale math tested against your exact screenshot dimensions
  (2880×3840, 2×): proxy correctly lands at 4.00MP, aspect ratio held,
  final match step correctly triggers.
- Denoise and clarity passes tested in their new location (not just
  assumed correct from being "the same as the enhancer") — one test
  initially failed due to an unrealistic synthetic noise pattern I'd
  written; diagnosed as a test-design flaw, not an algorithm bug, and
  re-verified with realistic noise amplitude.
- `node --check` clean on every touched JS file; full site load test
  still shows 48 tools registered; `tools.css` brace balance confirmed.
- FAQ updated to describe the real cascade behavior for large images and
  confirmed present on the rebuilt static page.

## Files changed

`upscaler-engine.js` (v3.0→v4.0: denoise/clarity passes, honest classical
label, neural cascade for large images), `image-tools.js` (upload
progress, real step checklist, comparison modes, zoom stops, summary
card, badges, download copy, continue editing), `analytics.js` (no
changes needed — existing listeners already cover this tool),
`tools.css` (badge fade-in animation), `data.js` (FAQ). 70 tool pages
rebuilt.
