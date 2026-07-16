# PDF to Excel Converter — Build Report

## The honest technical position (read first)

Your brief asks for quality "comparable to SmallPDF, ILovePDF, Adobe Acrobat,
PDFCandy." I want to be direct about what's actually achievable in a browser,
same as every other AI-adjacent tool in this project: **there is no ML table
detector here.** This uses a real, established technique — the same family
used by open-source tools like pdfplumber and Camelot's "stream" mode: read
each text run's actual (x, y) position from the PDF's own content stream,
cluster runs into rows by shared vertical position and into columns by
shared horizontal start position, then place each run into its cell. It does
**not** detect tables via drawn ruling lines (that needs the PDF's raw vector
operator stream — a materially bigger scope, noted below as a future
improvement, not silently attempted).

**Where this genuinely works well:** clean, evenly-spaced tabular data —
invoices, exports from spreadsheets, bank statements, most real-world
"print to PDF" tables. **Where it's weaker than a server-side ML detector:**
tables with heavy visual styling, inconsistent spacing, or complex nested
headers. The tool's own FAQ says this plainly rather than imply parity it
can't deliver — same pattern as the upscaler, enhancer, and object remover
built earlier in this project.

## A real bug my own test caught before shipping

I designed the core algorithm as pure, testable functions specifically so I
could verify it against synthetic data rather than assume it works. Good
thing — a two-word cell test ("New York" as two separate PDF text runs)
**failed** on the first pass: the column-detection step was treating each
word's raw X position as a column candidate, so "New" and "York" landed in
different columns instead of one cell. Root cause: nothing was distinguishing
"the small gap between two words in one cell" from "the large gap between two
different columns." Fixed by adding a word-run merging pass (`mergeWordRuns`)
before column detection, with a separate, much smaller tolerance than the
column-clustering tolerance. Re-tested — including a new adversarial case
specifically designed to prove the fix isn't *too* aggressive (two genuinely
separate short columns must stay separate) — all pass.

## What was built

- **`pdftoexcel-engine.js`** (new) — the reconstruction engine: row
  clustering, word-run merging, column detection, grid building, cell-type
  classification, merged-row heuristic, plus adapters for both real PDF text
  (`fromPdfTextContent`) and OCR word boxes (`fromOcrWords`) so the identical
  clustering logic serves both text PDFs and scanned ones.
- **`INIT['pdf-to-excel']`** in `pdf-tools.js` — drag & drop, a
  Tight/Balanced/Loose table-detection sensitivity control, real password
  handling (reusing the exact retry pattern already proven in `pdf-unlock`),
  automatic per-page scanned-vs-text detection, OCR fallback via Tesseract.js
  (the same CDN/API already used by the OCR Image to Text tool — not a
  second, divergent integration), real progress percentages, Cancel, and
  XLSX generation via SheetJS (lazy-loaded, new to this codebase).

## Specific decisions worth knowing about

- **Dates are kept as text, not coerced to Excel date values.** "03/04/2026"
  is genuinely ambiguous — DD/MM in most of the world, MM/DD in the US — with
  no reliable way to tell from the text alone. Guessing wrong would silently
  write an incorrect date into someone's spreadsheet, which is a worse
  failure than a correct-but-plain text cell. Currency and plain numbers
  *are* coerced to real numeric cells — "$1,234.56" → 1234.56 is unambiguous.
- **Merged cells are a heuristic, not exact structural data** — a row with
  one populated cell where the page typically has several is treated as a
  spanning header/banner. PDFs don't expose real cell-merge information via
  text position, so this is a considered approximation, documented as such
  in the FAQ rather than asserted as precise.
- **"Office Tools" category** — your brief listed this alongside "PDF
  Tools." This codebase's real, existing categories are Image, PDF,
  Developer & SEO, Marketing Designer, and Converter — there's no "Office
  Tools" category here, and I didn't invent one for a single tool. Filed
  under PDF Tools, the correct existing category.
- **Size/page caps**: 60 MB file size, 60 pages — explicit, friendly limits
  rather than letting the browser silently choke on something bigger, with a
  message pointing to the PDF Splitter as the next step.

## Verified, not assumed

- Full test suite on the reconstruction engine: clean 3×3 table, multi-word
  cells (the bug above), OCR pixel-to-point coordinate conversion, merge-row
  detection, scanned-page detection, and the over-merge guard — all pass.
- All touched/created files (`data.js`, `pdf-tools.js`,
  `pdftoexcel-engine.js`, `hero-map.js`, `tool-content.js`,
  `build-tools-page.js`, `build-tool-pages.js`) pass `node --check`.
- Full rebuild pipeline run in order: 70 tool pages generated (up from 69),
  11 workflow maps validated at build time (throws on any bad slug — didn't),
  sitemap/catalog/homepage `numberOfItems` all independently confirmed at 70.
- Mega-menu PDF Tools count (16, up from 15) confirmed identical across 3
  unrelated sampled pages, proving the resync genuinely propagated site-wide.
- Search tested against the real `matchTools()` function: "pdf to excel",
  "excel", "xlsx", "table" all surface it at or near the top; "spreadsheet"
  initially failed (a real gap — neither the name nor description contains
  that word), fixed with one targeted synonym entry, re-tested and confirmed.
- Found and fixed 4 stale "15 tools" references on the PDF category page
  left over from before this tool existed (meta description, OG, Twitter,
  JSON-LD description, and the page's own "Free tools" stat counter) —
  the same category of bug this project has caught several times before.
- Accessibility gaps I caught in my own first draft and fixed: the password
  input relied only on a placeholder (not reliably announced by screen
  readers) — added an explicit `aria-label`. The sensitivity toggle buttons
  were missing `aria-pressed` state — added and wired into the click handler.
  The progress/status region was missing `role="status" aria-live="polite"`
  — added, matching the exact convention already established by the
  upscaler, enhancer, and object remover tools.

## Numbers

Created: `pdftoexcel-engine.js`, `pdf-to-excel.html` (generated). Modified:
`pdf-tools.js` (+~180 lines), `data.js` (registry entry + synonym),
`hero-map.js`, `tool-content.js`, `pdf-tools.html` (new card + 4 stale-count
fixes), 70 rebuilt tool pages + sitemaps + catalog. New dependencies: SheetJS
(`xlsx@0.18.5`, lazy-loaded via CDN, only on this tool's page) — genuinely
new to this codebase. Tesseract.js is reused from the existing OCR tool's
CDN reference, not a second copy. Bundle impact on every other page: 0 KB.

## Future improvements

Vector-ruling-line detection (reading the PDF's actual drawn table borders
via its raw operator stream) would meaningfully close the gap toward
Acrobat-class extraction on heavily-styled tables — real scope, not
attempted here. A locale setting for date interpretation (so a user could
explicitly say "these dates are DD/MM") would let dates convert to real
Excel date values without guessing. Multi-column-per-page table region
detection (currently one reconstruction pass per full page) for PDFs with
side-by-side tables.
