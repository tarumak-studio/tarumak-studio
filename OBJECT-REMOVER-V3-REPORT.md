# AI Object Remover v3.0 — Upgrade Report

## The honest scoping first

Your brief names Cleanup.pictures, Clipdrop and Firefly Generative Fill as the
bar. Those run large neural inpainting models on server GPUs. This tool's
on-device engine is real algorithmic reconstruction (the PatchMatch/
content-aware-fill family) — that positioning hasn't changed, and the FAQ
still says so plainly. What this upgrade does is close the biggest *actual*
quality gaps that family has, rather than pretend to be a diffusion model.

**Built and verified (engine v3.0):**

1. **Edge-aware structure propagation — the genuinely missing capability.**
   The old pipeline was diffusion (smooth base) + texture patches; nothing
   ever CONTINUED an interrupted line. A fence rail, horizon, railing or
   building edge crossing the removal area simply dissolved into blur. Now:
   Sobel edge detection finds strong edges terminating at the mask boundary,
   a matcher pairs up entries that are collinear + colour-matched (the two
   ends of the same real-world line, with a ~28° angle gate and a colour
   gate), and the line's own cross-profile is stamped through the fill —
   before texture synthesis, so texture builds around restored structure.
   This is the brief's #1 and #3, and it's the classic structure-propagation
   idea from the inpainting literature, sized for browsers.

2. **Automatic multi-pass refinement (#10).** After the fill, the engine
   measures local detail (variance) inside the filled region against its
   surroundings. Too smooth relative to a textured neighbourhood — the
   classic "smudge" — triggers one automatic finer-grained texture pass and
   re-blend. No second click. Correctly does NOT fire on smooth surroundings
   (sky/gradients), where a smooth fill is the right answer.

3. **Two-scale synthesis in Best mode (#5).** Best now lays down coarse
   texture blocks first (large pattern), then finer blocks over them
   (detail) — a real, visible quality step over Balanced rather than just
   bigger numbers.

**Verified how:** the same discipline as the rest of this project — every new
engine function is pure typed-array code, tested against synthetic images in
Node. The test that mattered most: a dark line interrupted by a masked hole.
First implementation FAILED it — the line arrived washed out (140 vs its
true value 40) because Sobel detects the light↔dark *transition*, not the
line's body, so the propagation strip was mis-centred and over-feathered. I
diagnosed the exact matched coordinates, widened the strip and flattened the
feather curve, and re-ran: the line now continues at exactly its true value
(40), with off-line background untouched (200). Also verified: an
adversarial scene with two perpendicular, colour-mismatched edges genuinely
touching the mask boundary produces ZERO phantom pairings — the gates hold.
Artifact detection tested both directions: flags a flat fill in textured
surroundings (score 1.0), stays silent for smooth fill in sky (score 0.0).

**UI (the parts that were actually missing):**
- Result metadata line: processing time, resolution, quality mode, and
  "Processed entirely in your browser" (#14).
- **Hold to compare** — a third view mode alongside Split and Side-by-side:
  press-and-hold (mouse, touch, or keyboard — Space/Enter) shows the
  original, release shows the result. The fastest way to spot artifacts (#9).
- **✨ Continue editing** suggestions after removal: Photo Enhancer,
  Upscaler, Background Remover, Compressor (#15). One honest caveat: these
  are plain links — automatic image hand-off between tools doesn't exist in
  this codebase and would be its own project (browser storage limits make it
  non-trivial for large images). Download → re-upload is still the flow.

**Already existed (your brief assumed otherwise):** brush size AND softness
sliders, `[`/`]` size shortcuts, Ctrl+Z/Y undo/redo, E for eraser, zoom with
Ctrl+wheel, fullscreen, rectangle selection, automatic adaptive mask
dilation + guard ring (#2 — the engine has done this since v2), Split and
Side-by-side comparisons. Left alone.

**Skipped, with reasons:**
- **Click-to-select objects (#6):** needs a real segmentation model
  (SAM-class) running in-browser — a major dependency and download, its own
  project. Wiring a half-working colour-flood "smart select" would be worse
  than the brush. Honest future improvement, not faked.
- **Semantic scene classification (#12):** without a classifier model,
  "detect sky/water/grass" would be guesswork. The variance gate already
  adapts smooth-vs-textured behaviour, which is the mechanically useful
  half of that request.
- **8000×8000 support (#13):** the existing 16MP cap stays. 64MP of RGBA
  float working buffers is where browser tabs die; raising the cap without
  a tiling architecture would trade "works reliably" for a checkbox.
- **Web Workers/OffscreenCanvas (#13):** the pipeline is already chunked
  and cancellable (setTimeout yields between stages), which is what keeps
  the UI responsive. A worker port is a clean future refactor, not a quick
  add.
- **Swipe/fade comparison variants (#9):** Split (drag slider) already IS
  the swipe interaction; Hold-to-compare covers the toggle. A separate fade
  mode adds a button without adding information.

## A serious self-inflicted bug, caught and fixed before shipping

While moving misplaced FAQ blocks to `data.js` (the build script only reads
FAQs from there — the same systemic issue found in the word-to-pdf session,
now audited across ALL tool files: eight FAQs had never reached their live
pages, two of them defined twice in different files), my extraction regex
used the wrong terminator pattern (`]];`) for one multi-line FAQ that
actually ends `\n];`. The non-greedy match ran on and silently swallowed the
ENTIRE AI Photo Enhancer section — its INIT function included — into
`data.js`. Everything still passed syntax checks because the moved code is
valid JavaScript anywhere. What caught it: the full-site load test's INIT
count dropped 48 → 47. I traced the missing slug, confirmed the 20,574-char
blob in `data.js`, split it surgically (two FAQ blocks stay in `data.js`;
the 18KB enhancer section returned to its correct position in
`image-tools.js`, restoring natural file order: upscaler → enhancer →
object-remover), and re-verified: 48 INITs, all three AI tools' FAQs baked
into their static pages (visible + JSON-LD), 70 FAQ sets building. The
count-based load test existing is the only reason this didn't ship broken —
which is the argument for keeping it.

## Files

- `objectremover-engine.js` — v3.0: +structure propagation (detect/match/
  propagate), +assessFillQuality, two-scale Best, refinement pass, `_test`
  API for the unit suite.
- `image-tools.js` — result metadata, hold-to-compare, continue-editing
  links, timing capture; enhancer section restored post-incident.
- `data.js` — all tool FAQs consolidated here (eight moved, one stale
  duplicate removed, object-remover copy updated for v3.0).
- `converter-tools.js` — FAQ blocks moved out.
- 70 tool pages rebuilt; all count surfaces verified at 70.

## What I could not verify

Real-photo fill quality. The synthetic tests prove the algorithms do what
they claim (lines reconnect, smudges trigger refinement, no phantom
structures) — they cannot prove results *look* natural on real photographs.
That judgment needs your eyes on real removals: try a power line against
sky, an object crossing a fence or railing, and something on grass or
brick, on Balanced and Best. The railing/fence case is where v3.0 should be
most visibly better than v2.2.
