# Tarumak Studio — Tool Page Variant System
### From one template rendered 66 times to a data-driven system with real per-tool and per-category variety

## 0. What the brief asked for, and what was actually true in the code

The brief's diagnosis was checked against `build-tool-pages.js` directly, not assumed. It was accurate, and worse in one respect than described: every tool page rendered the **exact same 5 benefit cards**, the **exact same 6 feature tags** (`'100% browser-based', 'Free forever', 'No sign-up', 'Privacy safe', 'Instant processing', 'Works on mobile'` — a literal fixed array, not a pool), and the **exact same 4 how-to steps** (only the input noun/verb changed per category), in the same order, on all 66 pages. There were no use cases, no tips, no comparisons, no workflow content, and no hero beyond a heading and some chips. Related tools never crossed category lines, and the CTA band said the identical "Keep going — there are 66 tools here" on every single page.

## 1. The two-tier system this round built

**Tier 1 — `TOOL_META` (tool-content.js): 7 hand-verified flagship tools.** Every claim in these entries was checked against the tool's real `INIT[]` implementation before being written — not invented, not guessed from the category. Concretely:
- **Background Remover** — confirmed it runs a real segmentation model (`@imgly/background-removal`, ONNX/WASM), not a color-key trick.
- **Image Compressor** — confirmed the real 10–100% quality slider and JPG/WebP output choice.
- **OCR (Image to Text)** — confirmed the real 8 supported languages and that it's Tesseract.js-powered with live progress.
- **PDF Merger** — confirmed it reorders via up/down buttons, not drag-and-drop (the *old* data.js description said "drag to reorder," which the tool doesn't actually do — the new copy says "one-click reorder" instead).
- **JSON Formatter** — confirmed the real format/minify/validate buttons.
- **OG Image Generator** — confirmed the real live 1200×630 canvas preview with custom colors and logo text.
- **Word to PDF** — confirmed it's built on mammoth.js and which formatting actually survives.

These 7 get fully bespoke hero art, benefits, use cases, and tips/mistakes (or comparison copy). They were chosen to match the brief's own named examples (Background Remover, Image Compressor, OCR, PDF Merger, JSON Formatter, QR/social-image generator) — one per category, with Image getting three since the brief named three different Image tools explicitly.

**Tier 2 — `CAT_DEFAULTS` (tool-content.js): the other 59 tools.** Each category has a *pool* of 6–8 real, category-true benefit/feature/use-case options (never a specific mechanic that isn't verified for every tool in that category — no fabricated "batch processing" or "no size limit" claims here). `build-tool-pages.js` picks a **deterministic, slug-seeded** subset and order per tool — same tool always renders the same content on every rebuild (important for a static site with no server: a "random" pick would mean a different git diff on every deploy for no reason), but two different tools in the same category no longer show the identical set in the identical order. Verified directly: `image-resizer`, `jpg-to-png`, `exif-remover`, `image-cropper` and `watermark-image` — all Image category, all Variant A — each render a different 3-of-6 benefit subset in a different order.

## 2. Hero types (6) and section-composition variants (4)

**Hero types**, one per tool, decorative only (the real, functional tool is still the actual mounted tool panel right below — nothing in a hero has to work, only illustrate):
- **compare** — before/after slider (real `<input type="range">`, keyboard-accessible), with `checkerboard` (transparency) and `meter` (file-size readout) sub-styles for Background Remover and Image Compressor specifically.
- **scan** — document illustration + scanning-line sweep + live language badges (OCR).
- **workflow** — stacked/fanning documents, with a `stack` merge-animation sub-style for PDF Merger.
- **code** — console/editor mock with syntax-colored, staggered-reveal lines (JSON Formatter, Developer default).
- **live** — animated preview card, with a `social-card` sub-style for OG Image Generator; a QR-style pixel grid otherwise (Marketing default).
- **convert** — format-A → arrow → format-B badges (Converter default, Word to PDF). This one needed a real fix mid-build: some tools encode their conversion as one chip (`"PNG→JPG"`), others as separate tags (`["DOCX","PDF","CONVERT"]`) — the first version of this code only handled the first pattern and silently rendered "DOCX → FILE" for Word to PDF. Caught by checking the actual rendered output against all 10 converter-category tools' real chip data, not just the flagship, and fixed to handle both patterns.

**Section-composition variants** (the brief's A/B/C/D), implemented as **one data-driven dispatcher**, not four copy-pasted template functions — adding a variant E later is a data change (one new array + one new category mapping), not a fifth function to keep in sync with the other four:
- **A** (Image default): Hero → Tool → Benefits → How To → Use Cases → FAQ → Related → Guides
- **B** (Marketing & Converter default): Hero → Comparison → Tool → Benefits (trimmed to 3) → FAQ → Guides → Related
- **C** (Developer default): Hero → Tool → Tips & Common Mistakes → FAQ → Related
- **D** (PDF default): Hero → Tool → Use Cases → Workflow Timeline → Guides → Related

Flagship tools can and do deviate from their category's default variant where it genuinely fits better — Background Remover and OCR use Variant C (tips/mistakes) rather than Image's default Variant A, because "common mistakes when removing a background" is real, useful content and a 5th generic benefit card would not have been.

Actual distribution across all 66 pages after build: **A: 16 · B: 18 · C: 17 · D: 15** — a genuinely mixed site, not one shape with a different tool name.

## 3. Cross-category related tools

`WORKFLOW_NEXT` overrides the old same-category-only related-tools logic for the 7 flagships with what someone would realistically reach for next — OCR now recommends PDF-to-Text and Text Diff (not just other Image tools), PDF Merger recommends PDF Compressor and Splitter, JSON Formatter recommends Base64 and Regex Tester. Every slug in this map is validated at build time the same way `header-chrome.js` validates `CAT_META.popular` — it throws on a stale slug rather than silently rendering (or dropping) a dead link, which is exactly the bug class that shipped unnoticed in an earlier mega-menu round. The other 59 tools keep the same-category fallback, which is still a reasonable default.

## 4. What was deliberately NOT done this round, told plainly

**No Tailwind.** The brief listed it as a deliverable. This site has zero build pipeline (no Node bundler, no npm install step for the live site — `header-chrome.js`'s own comment confirms "no React/Vite"). Adding Tailwind here means either a CDN runtime with no purge step (worse Lighthouse score, directly opposed to the performance section of the same brief) or bolting a second styling system onto a site that already has a complete, working design-token system. `tool-variants.css` extends that existing system (every value is an existing `:root` token or a category accent already used in the mega menu) rather than sitting beside it as a second language. If real Tailwind is still wanted, that's a larger, separate infrastructure decision worth its own conversation — happy to scope it if so.

**Category pages, blog connections, and competitor-comparison content** (a large separate section of the brief) were not touched this round. The brief's own core complaint — "almost every tool page follows the exact same layout" — is specifically about the 66 *tool* pages, which is what this round fixed end to end. Category pages are a different, real project (hero illustration, featured workflows, recently-updated, beginner guides, competitor comparisons) and deserve their own pass rather than a shallow bolt-on here that would leave both halves half-finished.

**Not all 66 tools have hand-verified TOOL_META entries.** 7 do. The other 59 get real structural variety (different hero, different section composition, different deterministic content selection by category) but their specific benefit/feature copy is the category-pool tier, not individually fact-checked against each tool's code. Extending `TOOL_META` for more tools over time — following the exact pattern of the 7 already written in `tool-content.js` — is how the ceiling extends; it's a content-authoring task now, not an engineering one.

## 5. Files touched

**New:** `tool-content.js` (TOOL_META, CAT_DEFAULTS, WORKFLOW_NEXT), `tool-variants.css` (6 hero types + use-cases/tips/comparison/workflow blocks), `tool-hero.js` (the one hero type needing any JS — the compare slider; the other 5 are pure CSS). **Rewritten:** `build-tool-pages.js` — chrome-loading, the FAQ topic-dedup logic, the IS_FILE_TOOL classifier, the schema graph, and sitemap generation are all unchanged verbatim from the original; benefits/features/how-to/CTA/related-tools generation and page assembly are new. **Untouched:** `header-chrome.js`, `mega-menu.css`, `mega-menu.js`, `build-static-pages.js`, category pages, and everything from the previous navigation-audit round — re-verified after this round that all 131 pages still share one byte-identical header.

## 6. Verification performed

- Header/mega-menu byte-identity re-checked after this round: still 131/131 pages, one variant — this work did not regress the previous round's fix.
- All 66 tool pages re-generated; `node --check` clean on all 24 JS files in the project.
- JSON-LD schema validated (parsed as real JSON, not just presence-checked) across all 131 HTML files — only `404.html` correctly has none.
- Every one of the 66 pages confirmed to load `tool-variants.css` and `tool-hero.js`.
- Spot-checked all 7 flagship heroes render their intended type with correct real data (OCR's exact 8 languages, PDF Merger's real reorder copy, etc.).
- Spot-checked benefit variety across 5 same-category, same-variant tools — confirmed genuinely different subsets/orders, not coincidentally identical.
- Found and fixed two real bugs during this verification, not before it: the convert-hero's format-badge detection (described in §2), and a set of double-escaped `\\u2014` sequences in `tool-content.js` that were rendering as literal backslash-u-2014 text instead of an em dash — caught by grepping the actual generated HTML output, not by re-reading the source.

## 7. Honest limitations

Same as every prior report in this repo: no real browser here. The hero animations (scan-line sweep, stack-merge fan, code-line reveal, live-card pulse) are structurally correct CSS with `prefers-reduced-motion` fallbacks, but "correct on paper" isn't "seen rendered." The compare-hero's range-slider interaction is a real, native, keyboard-accessible input — genuinely functional — but hasn't been dragged by an actual mouse in an actual browser. Worth five minutes after deploy.
