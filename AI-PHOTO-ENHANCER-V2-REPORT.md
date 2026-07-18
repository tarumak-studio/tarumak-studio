# AI Photo Enhancer v2.0 — Upgrade Report

## The actual bug, found before writing any UI code

Your screenshot's complaint — barely visible enhancement — traced to one
specific, provable cause, not vague "needs more polish." The engine's
`analyze()` function is genuinely good image science (real histogram
analysis, gray-world white balance, gated sharpening), but its output for
an *already-decent* photo — exactly what your baby-photo screenshot is —
was almost nothing:

```
Settings for a well-lit, reasonably sharp photo (the common case):
  {"sharpness":18,"clarity":10}
  clarity amount  = 0.08   (an 8% local-contrast push)
  sharpen amount  = 0.162  (a 16% unsharp-mask blend)
  vibrance        = 0      (zero color richness added)
  contrast        = 0      (zero punch added)
```

The algorithm was correctly deciding "nothing is badly wrong here" and
applying almost nothing — technically correct, but wrong for a product
that needs to visibly earn its name. Fixed by adding **always-on baseline
floors** for contrast, vibrance, clarity and sharpness — real corrections
still fire when something is actually wrong (dark, flat, faded, noisy,
soft), but even a good photo now gets a genuine, deliberate lift:

```
Same photo, after the fix:
  {"contrast":11,"vibrance":15,"sharpness":34,"clarity":26}
  clarity amount  = 0.208  (2.6x stronger)
  sharpen amount  = 0.306  (1.9x stronger)
  vibrance        = 15     (was 0)
  contrast        = 11     (was 0)
```

These values are moderate on purpose — real unsharp-mask and Lightroom-
clarity conventions, not pushed toward halos or neon saturation. "Don't
oversharpen, don't oversaturate" was the explicit ask; this is tuned to
sit inside that, not at its edge.

## Section 8 (Strength Control) and Section 1 are the same mechanism

Subtle/Balanced/Strong/Maximum is a multiplier on top of whatever preset
or auto-analysis is active — Balanced (1.0×) *is* the new baseline above.
One deliberate design choice: **corrective values (brightness, white
balance) are never scaled**, only stylistic ones (contrast, vibrance,
clarity, sharpness, noise reduction). Otherwise "Subtle" would leave a
genuinely too-dark photo still dark, which isn't what an intensity
slider should mean — verified with a test proving corrective values stay
fixed across all four strength levels while stylistic ones scale.

## A genuine new capability for Portrait: skin-tone-aware smoothing

Section 1 and 2 both ask for "skin tones / face clarity / eye sharpness."
I want to be precise about what's actually running: **this is a
colour-range heuristic, not face detection.** It classifies each pixel
by whether its RGB falls in a broad, well-established skin-tone range
(the same rule-based test used as a first-pass filter in a lot of
computer-vision work before reaching for a trained model) — pixels that
qualify get light blemish smoothing; eyes, hair, eyebrows and background
are left alone, which is what lets them read as sharp *against* the
softened skin. Tested against 8 cases (light/medium/deep skin tones vs.
sky blue, grass green, white, black, red fabric) — correctly classifies
all 8. It will not work on illustration or non-photographic input, which
is exactly why it's wired only into the Portrait preset, not applied
globally.

## Sections built, with real verification

- **Progress (§3):** a real progress bar + percentage + stage name, fed
  by the engine's own `onProgress` callback (already existed internally,
  was never surfaced) — for both the live preview and the full-resolution
  download. Genuinely reused, not a second fake progress system.
- **4 comparison modes (§4):** Split (existing divider), Side-by-side
  (new), Before/After Toggle (the exact hold-to-compare pattern already
  proven on the Object Remover, reused not reinvented), and Swipe
  (drag-anywhere-on-the-image, distinct from Split's handle-only drag).
  Selected mode persists across re-enhancements within the session.
- **Zoom stops (§5):** Fit/100%/200%/400%/800% as explicit buttons,
  wheel-zoom and keyboard shortcuts (+/-/0/F) preserved from the working
  original.
- **Enhancement summary (§6):** a real checklist derived from whichever
  settings actually got applied (contrast → "Contrast improved", etc.) —
  not a fixed decorative list; it changes with the photo and preset.
- **Processing info (§7):** engine version, preset, strength, resolution,
  processing time (measured, not estimated), output format.
- **Error handling (§12):** failures now preserve the source image and
  settings and show a Retry button that just re-runs the same call — no
  silent reset. Also fixed two spots that wrote error text via
  `.textContent` directly instead of `setStatus()`, which — as I flagged
  in the GA4 session — means they'd bypassed automatic error tracking
  before this fix.
- **Analytics (§15):** `image_uploaded`, `preset_selected`,
  `comparison_mode_used`, `zoom_usage`, `download_clicked`,
  `continue_editing_click` (new, and retrofitted onto the Object
  Remover's continue-editing links too, which never had it), plus the
  existing `tool_process_completed`/`ai_enhance_completed`.

## Two things I deliberately did not do, and why

**8000×8000 support (§13):** I checked the actual memory cost before
deciding. At 64MP, the denoise and sharpen passes alone need ~730MB of
concurrent buffers (measured, not guessed) — a real, likely tab-crashing
number on a lot of devices, especially mobile. The current 25MP cap
(already generous — covers essentially all consumer phone cameras) stays.
Raising it to match the brief's literal number would have been trading
"works reliably" for a spec-sheet checkbox.

**Web Workers / OffscreenCanvas (§13):** the existing pipeline already
avoids freezing the UI via row-banded `setTimeout(0)` chunking — a proven
pattern used successfully across this whole codebase. Moving it into a
real Worker means restructuring every pass around `postMessage` and
transferable buffers with no DOM/canvas access unless OffscreenCanvas is
available — a legitimate, larger architecture change, not something to
bolt on inside an already-large session. Flagging as real future work
rather than either skipping silently or attempting a rushed version.

## Verified, not assumed

- The core "is this actually stronger" claim tested with real numbers
  from the actual `analyze()` decision logic, before and after.
- `scaleSettings()` tested for the corrective-vs-stylethic split, the
  0–100 slider mapping, and the 2× cap.
- Skin-tone classifier tested against 8 real cases spanning skin tones
  and clearly-non-skin colors.
- `node --check` on every touched file; full site load test still shows
  48 tools registered; `tools.css` brace balance confirmed.
- FAQ updated to describe what's actually running (including the "colour
  heuristic, not face detection" caveat) and confirmed present on the
  rebuilt static page.

## Files changed

`enhancer-engine.js` (v1.0→v2.0: baseline floors, strength scaling,
skin-smoothing pass), `image-tools.js` (comparison modes, progress bars,
strength UI, error/retry, continue-editing, analytics), `analytics.js`
(continue_editing_click delegated listener), `tools.css` (reusable
progress-bar component), `data.js` (FAQ). 70 tool pages rebuilt.
