# Hero Visual System — Redesign Report

**Scope:** Hero Visual section only (between the `<h1>`/pill block and the tool mount).
**Untouched:** upload component, tool functionality, and the functional Before/After
comparison that lives *lower* on the Background Remover page.

---

## 1. Root-cause diagnosis

The symptom — every image tool showing the same Before/After checker-reveal — is what
you get when the hero is a **single hardcoded block** rendered by the shared tool-page
template rather than a **tool-aware** component. The template has one hero; the slug
does not select a variant, so all 18 image tools inherit the one visual that was authored
for Background Remover.

*Verified:* the live tool pages render the tool body via JS (`Loading … tool` appears in
static HTML), and the hero markup is not per-slug in the fetched pages.
*To confirm on your side:* whether the hero currently lives in `build-tool-pages.js` as a
literal block or in a partial. Either way, the fix below replaces it with a slug-driven mount.

---

## 2. The system — six template families

One engine (`hero-visuals.js`), one stylesheet (`hero-visuals.css`), driven by a single
`HERO_MAP` (slug → config). Add a tool = add one line to the map.

| Family | Job | Renderers | Motion |
|---|---|---|---|
| **Comparison** | show a state change on one image | `comparison` | edge sweep reveals result |
| **Transformation** | A → B (format / size / dimension / notation) | `formatConvert`, `sizeReduction`, `dimension`, `colorChain` | flowing connector + pop-in |
| **Workflow** | many↔one, frames→output | `mergeDocs`, `splitDocs`, `assemble` (grid/gif) | converge / fan-out / assemble |
| **Visualization** | an effect or process applied | `blur`, `watermark`, `palette`, `eyedropper`, `crop`, `codeFormat`, `encode`, `hash`, `regex`, `ocr` | effect ramps in on loop |
| **Preview** | pages / rotation / security state | `rotate`, `pagePreview`, `lock` | flip / rotate / shackle open-close |
| **Generation** | build an artifact up | `qr`, `utm`, `previewCard`, `favicon` | modules / params / card assemble |

**Signature:** motion *is* meaning. Every animation demonstrates the tool's real job — no
floating shapes, no decorative loops. The shared "flow connector" (a dashed line feeding an
arrowhead) ties all transformation heroes together for consistency.

---

## 3. Hero type assigned to every tool

`verified` = slug confirmed on the live site. `inferred` = tool exists, slug is my best
guess — **confirm the key against `data.js` and change only the key** if it differs.

### Image
| Tool | Slug | Hero | Slug status |
|---|---|---|---|
| Background Remover | `background-remover` | Comparison | verified |
| Image Compressor | `image-compressor` | Transformation · size (12.4 MB → 2.8 MB) | verified |
| Image Resizer | `image-resizer` | Transformation · dimension (4000×3000 → 1200×900) | verified |
| Crop Image | `image-cropper` | Visualization · crop | verified |
| Blur Image | `blur-image` | Visualization · blur | inferred |
| Watermark | `watermark-image` | Visualization · watermark | inferred |
| Palette Generator | `palette-generator` | Visualization · palette | inferred |
| OCR | `image-to-text` | Visualization · ocr | inferred |

### Converters (direction verified via slug)
| Tool | Slug | Renders |
|---|---|---|
| JPG → PNG | `jpg-to-png` | JPG → PNG |
| PNG → JPG | `png-to-jpg` | PNG → JPG (smaller) |
| JPG → WebP | `jpg-to-webp` | JPG → WebP (−30%) |
| WebP → JPG | `webp-to-jpg` | WebP → JPG |
| HEIC → JPG | `heic-to-jpg` | HEIC → JPG |
| SVG → PNG | `svg-to-png` | SVG → PNG |
| PDF → JPG | `pdf-to-jpg` | PDF → JPG |
| Word → PDF | `word-to-pdf` | DOCX → PDF |
| TXT → PDF | `txt-to-pdf` | TXT → PDF |
| HTML → PDF | `html-to-pdf` | HTML → PDF |
| Markdown → HTML | `markdown-to-html` | MD → HTML |
| GIF → WebP | `gif-to-webp` | GIF → WebP (−60%) |
| WebP → GIF | `webp-to-gif` | WebP → GIF |
| PNG → ICO | `png-to-ico` | PNG → ICO *(inferred slug)* |
| CSV → JSON | `csv-to-json` | CSV → JSON *(inferred slug)* |
| JSON → CSV | `json-to-csv` | JSON → CSV *(inferred slug)* |

### PDF
| Tool | Slug | Hero | Slug status |
|---|---|---|---|
| Merge PDF | `merge-pdf` | Workflow · merge | inferred |
| Split PDF | `split-pdf` | Workflow · split | inferred |
| Compress PDF | `compress-pdf` | Transformation · size (8.6 MB → 2.1 MB) | inferred |
| Rotate PDF | `rotate-pdf` | Preview · rotate | inferred |
| PDF Reader | `pdf-reader` | Preview · pages | inferred |
| Unlock PDF | `unlock-pdf` | Preview · lock (opening) | inferred |
| Password Protect | `protect-pdf` | Preview · lock (closing) | inferred |

### Developer & Data
| Tool | Slug | Hero | Slug status |
|---|---|---|---|
| JSON Formatter | `json-formatter` | Visualization · codeFormat (messy → formatted) | verified |
| Base64 Encoder | `base64-encoder` | Visualization · encode (text → Base64) | verified |
| Hash Generator | `hash-generator` | Visualization · hash (progressive) | inferred |
| Regex Tester | `regex-tester` | Visualization · regex (match highlight) | verified |
| Color Converter | `color-converter` | Transformation · chain (HEX → RGB → HSL) | verified |
| Color Picker | `color-picker` | Visualization · eyedropper | verified |

### Marketing & Generation
| Tool | Slug | Hero | Slug status |
|---|---|---|---|
| QR Generator | `qr-code-generator` | Generation · qr | verified |
| UTM Builder | `utm-builder` | Generation · utm (params append) | verified |
| Meta Generator | `meta-tag-generator` | Generation · preview card | inferred |
| Open Graph Generator | `og-image-generator` | Generation · preview card | inferred |
| Favicon Generator | `favicon-generator` | Generation · favicon (PNG → sizes) | verified |
| GIF Maker | `gif-maker` | Workflow · assemble (filmstrip → play) | verified |
| Image Collage | `image-collage` | Workflow · assemble (grid) | verified |

> Meta Generator and Open Graph Generator intentionally share the **preview-card** visual —
> both build a social preview. If you want them distinct, tint the card image via a
> `kind`-specific class (the config already carries `kind: "meta" | "og"`).

---

## 4. Direction fixes

All 16 directional converters were checked programmatically: for every `X-to-Y` slug the
hero renders `X → Y`. **No reversed directions remain.** The check is reproducible — it
reads `HERO_MAP` and asserts `from`/`to` against the slug halves.

---

## 5. Slugs to confirm (the only edit you may need)

These 17 keys are inferred. Open `hero-visuals.js`, find each key in `HERO_MAP`, and if your
real slug differs, rename **the key only** (the config stays the same):

```
blur-image · watermark-image · palette-generator · image-to-text ·
png-to-ico · csv-to-json · json-to-csv · merge-pdf · split-pdf ·
compress-pdf · rotate-pdf · pdf-reader · unlock-pdf · protect-pdf ·
hash-generator · meta-tag-generator · og-image-generator
```

The showcase badges each of these in amber so you can spot them at a glance.

---

## 6. Integration into your build pipeline

**Recommended — carry the slug in `data.js` (your single source of truth):**

1. Ship `hero-visuals.css` and `hero-visuals.js` to the site root (or your assets path).
2. In `build-tool-pages.js`, where each tool page is assembled, inject one line between the
   `<h1>` pill block and the tool mount:
   ```html
   <div class="hv" data-hero-slug="{{tool.slug}}"></div>
   ```
3. Load the two files (defer is fine):
   ```html
   <link rel="stylesheet" href="/hero-visuals.css">
   <script src="/hero-visuals.js" defer></script>
   ```
4. Run `resync-chrome.js` to propagate. The engine self-initialises on `DOMContentLoaded`;
   nothing else to wire.

`HERO_MAP` can also live *inside* `data.js` if you prefer one source — expose it and pass it
to `window.TarumakHero` before init. Either way, adding a tool is one map line.

**Background Remover note:** the hero is now a compact teaser (edge-sweep reveal), **not** the
full slider. Keep your existing functional Before/After comparison exactly where it is, lower
on the page — the two no longer duplicate.

---

## 7. Performance & accessibility (built in)

- Animates **only** `transform`, `opacity`, `filter`. No `width/height/top/left/margin`.
- `contain: layout paint` + `will-change` on moving atoms → stays on the compositor, ~60fps.
- **Pauses when off-screen** via `IntersectionObserver` (`animation-play-state: paused`).
- **`prefers-reduced-motion`**: animations disabled *and* each hero resolves to its
  meaningful end-state (not a blank/hidden frame). Verified per hero.
- `role="img"` + `aria-label` on every hero; override with `data-hero-label` if you want
  tool-specific alt text.
- Heights: **176px desktop → 138px mobile → 124px ≤380px.** Measured: on a 390×844 viewport
  the upload area's bottom lands at 476px — comfortably above the fold.

---

## 8. Files

| File | Purpose |
|---|---|
| `hero-visuals.css` | All templates, tokens, animations, reduced-motion, pause |
| `hero-visuals.js` | `HERO_MAP` + renderers + runtime (zero dependencies) |
| `hero-showcase.html` | Standalone demo — every hero, auto-built from the map |

Tokens inherit from your site via `var(--accent, …)`, `var(--surface, …)`, etc. If those
variables exist, the heroes adopt your real palette automatically; if not, the dark-navy
fallbacks match `#0c111a`.
