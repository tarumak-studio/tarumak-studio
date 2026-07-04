# Tarumak Studio — SEO, Trust & Accessibility Polish Audit
### Findings verified against the real codebase, fixes tested, nothing assumed

Every issue below was confirmed in the actual files before fixing (not assumed from your examples), and several turned out to be **systemic** — affecting many more tools than the specific examples you flagged. Where I found something that looked wrong but wasn't (or was correct history, not a bug), I've said so.

---

## 1. Tool-count consistency

**Real per-category counts** (verified by parsing `data.js`, not guessed): Image 18, PDF 15, Converter 10, Marketing 8, Developer 15 → **66 total**. The homepage already said 66 consistently — no fix needed there.

**Fixed:**
- `image-tools.html` — meta description, OG tags, and JSON-LD all said "15 free image tools" while the on-page heading correctly said 18. The **18 was right**; 5 occurrences of the wrong "15" corrected.
- `pdf-tools.html`, `developer-tools.html`, `marketing-tools.html`, `converter-tools.html` — each had "**Free Free**" duplicated in the section heading (a template bug, not a count error — their counts were already correct).
- `llms.txt` — badly stale: said "56 tools" total, wrong per-category breakdown, "30 articles" (real: 50), and every URL still used the pre-migration hash format (`#/t/...`, `#/image`). Fully corrected.
- **`app.js` — a live bug, not a static one.** Three lines dynamically overwrite the meta description / OG description / Twitter description with a hardcoded "56 free browser-based tools" string on every SPA navigation. This meant even after fixing the static HTML, the *rendered* tags could still show 56 depending on when you inspected them. Fixed to 66.
- `article-tarumak-studio-vs-smallpdf.html` — an FAQ answer claimed "All 56 tools" as a current, evergreen fact. Fixed to 66.
- **Deliberately left unchanged:** `changelog.html` mentions "56 tools" twice, but both are **dated historical entries** (2026-05, 2026-06) describing what was true *at that time*, before more tools were added. Changing them to 66 would misrepresent your own history — I left them as accurate historical record.

## 2. Duplicate FAQ questions — the root cause, not just the two examples

You flagged two tools; the actual bug affected **19 of 66 tools**. The page generator merged each tool's specific FAQ with a generic 5-question bank **with no deduplication at all** — so any tool whose own FAQ already covered uploads, accounts, or formats got that question a second time from the generic bank. Fixed by adding real topic-aware deduplication (not just exact-text matching, so re-worded near-duplicates are caught too). Verified: **zero duplicate questions across all 66 pages** after the fix, confirmed by re-scanning every generated page's FAQ block.

## 3. Context-aware privacy copy — also systemic

The deeper issue behind "don't say files never upload on UTM Builder or JSON Formatter": the generator had **no concept of file vs. text tools** at all — it always used file-upload language. I built a classifier that inspects each tool's *actual code* (not category, not guessed) to determine whether it takes a file upload — resolving even shared factory functions like `imgConv()` and `dz()` to their real implementation. Verified against all 66 tools by hand before trusting it in copy generation (43 file tools, 23 text/generator tools).

This now drives three things everywhere: the FAQ privacy question, the benefits-section "Private by architecture" claim, and the "Formats covered" vs "Built for" framing. Re-scanned all 66 pages after the fix: **zero context mismatches** — no text tool claims "files never upload," no file tool is missing the concrete promise.

## 4. Accessibility

- **Dropzone keyboard access (real bug, affects all 43 file tools):** the upload zone only listened for mouse clicks — no `tabindex`, no keyboard handler, and the actual `<input type="file">` was `hidden` (removed from the tab order entirely). A keyboard-only user could not open the file picker on any file-based tool, site-wide or on any tool page. Fixed: the drop zone is now `tabindex="0" role="button"` with a real `aria-label`, and Enter/Space opens the file picker. Added a visible focus ring matching the site's existing `:focus-visible` pattern (used elsewhere on category cards) — nothing invented, just extended.
- **92 slider/select controls with a `<label>` that wasn't actually connected to its control** (visible text, but no `for`/`id` association) — across image, PDF, and converter tools. Fixed all 92 with a verified regex pass (spot-checked output, then re-ran the full 66-tool mount simulation to confirm zero regressions).
- **Reorder/remove buttons** (↑ ↓ × on multi-file tools like PDF Organizer, Images-to-PDF, GIF Maker) had no accessible name at all — just Unicode glyphs. Added contextual labels ("Move [item] up", "Remove [item]").
- **PDF reader rotate/delete/zoom buttons** — same issue, fixed with proper `aria-label`s (the existing `title` attributes weren't a substitute; screen-reader support for `title` is unreliable).
- **Mobile menu close button** — had zero accessible name on the homepage and on 55 static pages that share the same header pattern (articles, tool pages, category pages). Fixed everywhere; verified zero remaining instances.
- **Theme toggle** — upgraded from a generic "Theme" label to a dynamic one ("Switch to light/dark theme") that updates on each toggle, plus `aria-pressed` state.
- Fav/share buttons, header search input, and burger menu were **already correctly labeled** — I checked rather than assumed, and left them as-is.

## 5. Mobile UX

- **Hero graphic pushing the CTA down — confirmed and fixed.** There was no mobile breakpoint at all for the hero's 2-column grid — it stayed side-by-side at every width, and the decorative 3D card graphic sat *between* the headline and the search box in the DOM. Fixed: below 720px the grid stacks to one column and **reorders** so headline → search CTA appears before the (now smaller) decorative graphic — the promise and the primary action are visible first, without deleting or redesigning the graphic itself.
- **Cookie banner** — had no mobile sizing at all (same padding/font-size as desktop). Added a compact mobile layout: smaller padding and text, buttons stacked full-width instead of a wide row. Visual style (color, blur, animation) untouched.
- First-viewport messaging (what the site does / privacy promise / CTA) was already present in the existing eyebrow and sub-copy — the fix above ensures it's not pushed down further, without rewriting the copy itself.

## 6. Trust section — added, using existing design language

There was **no privacy-explanation section on the homepage at all** — I found a `.trust` CSS class already defined in `main.css` with zero matching HTML anywhere (dead, unused styling). Added a real "How privacy works" section using that existing card pattern: runs on your device, nothing is uploaded (file-tool and text-tool cases both covered honestly), built on named open libraries, no account/no file tracking. The library names are accurate — I checked the actual CDN loads and lazy-loaded scripts before naming them (pdf-lib, PDF.js, Tesseract.js, mammoth.js). Added the missing mobile breakpoint for this grid too (collapses 4→2→1 columns).

Also added short trust copy directly on every upload zone ("Runs locally in your browser. Nothing uploads.") via the single shared drop-zone component — one change, applies to all 43 file tools.

**Scope decision:** I did not add equivalent per-input trust copy inside each of the 23 text-tool panels individually, since (unlike the file dropzone) there's no shared factory for text inputs — each tool builds its own panel markup, so this would mean touching 23 separate tool implementations rather than one shared component. The FAQ and benefits-section fixes already give every text tool accurate, tool-specific privacy copy; I judged that a safer, lower-risk way to cover the same ground than editing each tool's markup by hand.

## 7. Content quality

Beyond the FAQ dedup (which was the main thin-content issue), I did not do a full copy rewrite across all 66 pages — that's a much larger project than a polish pass, and risked exactly the kind of unnecessary change you asked me to avoid. What's fixed is real and systemic (counts, duplicates, context-correctness); what's left is closer to "could be even more specific per tool" than "actively wrong."

## 8. Validation performed

- **Internal link crawl:** 5,167 internal `href`s checked across all 131 HTML files. Found and fixed one real dead link (`/privacy.html`, referenced from 2 pages — the file was removed in an earlier routing migration in favor of `/privacy-policy`, but two links weren't updated at the time).
- **Duplicate titles:** zero duplicate `<title>` values across all 131 pages.
- **H1 count:** every page has exactly one `<h1>` — zero pages with 0 or 2+.
- **Meta descriptions:** present and non-empty on 130/131 pages; the one gap was `404.html`, which also had no `noindex` — added both (a real, if minor, SEO gap on an error page).
- **Console errors:** simulated the full script-load chain (all 9 shared JS files) and mounted all 66 tools in a Node sandbox with browser APIs stubbed — **zero load failures, 66/66 mounts**, both in the tool-page context and the full homepage context (including `app.js`/`features.js`), confirming the accessibility and content fixes introduced no regressions.
- **Named page spot-checks** (structure-level, since this environment has no real browser): homepage (H1 count, trust section present, hero-copy class present for the mobile fix), image-compressor (6 FAQs, zero dupes, file-tool copy correct), json-formatter and utm-builder (text-tool copy correct, zero dupes), pdf-merger (uses the reorder-button component, now labeled), image-tools.html (18 consistently, zero "Free Free"), blog.html (labeled close button, single H1, meta present).

## 9. Honest limitations

Everything above is verified at the **code and structure level** — file existence, JSON-LD validity, script execution without throwing, string-level correctness. What I cannot verify from here, and what genuinely needs a real browser pass before you call this done:
- Visual confirmation that the mobile hero reorder/shrink actually *looks* right on a real phone viewport (the CSS is correct and tested for balance, but I can't screenshot it)
- That the now-keyboard-focusable dropzone doesn't visually clash with anything on a specific tool's layout
- Actual upload → process → download click-throughs (structural mount is proven; the interactive result on real files is not)
- Screen-reader spot-check with an actual AT (VoiceOver/NVDA) rather than markup inspection

A 10-minute pass covering those four would close the loop.
