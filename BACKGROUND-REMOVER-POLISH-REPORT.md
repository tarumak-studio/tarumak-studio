# Background Remover — Polish & Consistency Pass
### Breadcrumb, trust copy, accessibility, mobile, typography, cross-page consistency

## The headline finding

**The breadcrumb had zero CSS anywhere the page loads.** Not "unfinished" — genuinely unstyled, rendering as raw browser-default markup (default blue underlined links, no layout, no spacing). Tracing it back: when tool pages were unified onto the homepage's header/footer in an earlier round, the old donor-page styles were dropped and the breadcrumb rule never got carried into the new embedded stylesheet. That's the root cause behind "looks unfinished" — it wasn't a styling choice that needed refining, it was a missing rule.

## What changed

**Breadcrumb** — added the missing CSS from scratch, and rebuilt the separator technique while I was in there. The old markup used sibling `<span>›</span>` elements between links, which on mobile wrap can leave a `›` stranded alone at the start of a line. Separators are now CSS-generated (`::before` bound to the *following* item), so a separator always wraps together with the crumb it introduces — never orphaned. Result:
- Separators get real spacing (`margin: 0 9px`, tightened to `6px` on mobile) instead of a bare 6px flex-gap
- Previous links: `var(--text-dim)` — the site's actual secondary text token, confirmed against the design system's own naming (`--text` → `--text-dim` → `--text-faint`)
- Current page: `font-weight:600` + `var(--text)` (the brightest of the three tokens) + `aria-current="page"`, and it's a `<span>`, never a link
- Added `:focus-visible` styling matching the pattern already used on category cards elsewhere on the site

**Upload trust copy** — rewritten from "Neural segmentation running entirely on your device..." to: *"Runs entirely in your browser — nothing is uploaded. The AI model downloads once and is cached locally; your photos never leave your device."* Covers all four points you outlined, still two sentences. Also fixed the visual weight issue: it was set to `--text-faint`, literally the dimmest text color on the page for a trust claim — moved to `--text-dim` with a small status-dot marker, matching the same trust-microcopy pattern already used on every other tool's upload zone.

**A bug the trust-copy review surfaced:** Background Remover's FAQ claimed it "works with AI-Powered, Transparent PNG, Privacy Safe" as if those were file formats — because the generator was joining marketing tags into a formats sentence without checking whether they actually looked like formats. Traced this further: **7 of 66 tools** had the same bug (Social Image Resizer, Color Palette Generator, Brand Color Extractor, Word to PDF, OCR, HEIC to JPG). Fixed with an explicit whitelist of real format tokens (JPG, PNG, WEBP, SVG, PDF, TXT, GIF, ICO, DOCX) rather than a shape-based guess — a first attempt using "short + uppercase" as a heuristic wrongly passed through HEX, CSS, SOCIAL, and CANVAS, so I replaced it with an exact list instead of trying to be clever about it.

**Accessibility** — Breadcrumb (above), Mode selector (added `role="group"`, `aria-label`, and `aria-pressed` kept in sync on every click — previously the AI/Solid toggle had no toggle-state semantics at all for a screen reader), Upload zone (Background Remover has its own custom dropzone markup that calls the shared keyboard-enabled `dropzone()` utility — the utility already supported Enter/Space from earlier work, but *this specific tool's* markup was missing the `tabindex`/`role`/`aria-label` needed to actually reach it by keyboard; fixed). Favourite button, Share button, Theme switch, and Search were already correctly labeled from earlier work — checked, not touched. Landmark structure: found the main site nav had no `aria-label` to distinguish it from the breadcrumb nav (both are `<nav>` landmarks — screen reader users navigating by landmark had no way to tell them apart), and the header search wrapper had no `role="search"`. Both fixed, both propagate everywhere since they live in the shared header.

**Mobile polish** — added a dedicated mobile breakpoint that previously only existed for hero top-padding and CTA-band stacking. Now also covers: badge/chip sizing, the favourite/share button row (drops to its own full-width line instead of squeezing against badges), upload-panel margins, section padding, and breadcrumb sizing. Desktop values are untouched — every new rule is inside `@media (max-width: 640px)`.

**Typography** — the section-level rhythm (34px top-padding, 6px→22px heading-to-content stagger) was already consistent by construction, since every major section shares one `.tp-sec` class. Found one real stray value: `.tp-features` used a 10px grid gap while `.tp-benefits`, `.tp-related`, and `.tp-guides` all use 12px — normalized to 12px.

**Component consistency across pages** — compared Homepage, Background Remover, Image Compressor, JSON Formatter, UTM Builder, and PDF Merger. Header, footer, and (after the fix below) the cookie banner are now byte-identical across all six. The one intentional difference: the nav dropdown panel is a JS-built placeholder on the homepage vs. pre-rendered HTML on tool pages — same visual result, different because tool pages don't load the SPA's `app.js`. Everything else matched already, since all tool pages share one generator.

**The cookie banner was missing entirely from all 66 tool pages** — this was the real find under "Component Consistency." `blog.css` (where its styles live) wasn't even linked on tool pages, so landing directly on any tool from Google meant never seeing the consent banner at all. While rebuilding it, found a second bug on the *homepage itself*: the live CSS rule referenced an animation (`tIn`) that doesn't exist anywhere in the stylesheet, and had no hidden-until-shown state — meaning the "wait 1.2s, then slide up" behavior the JS was written for hasn't actually been working; the bar just appears immediately. Fixed both: tool pages now get the same banner, and the underlying technique (transform + `.show` class, matching a pattern already used elsewhere on the site) actually implements the delayed appearance both were supposed to have.

**The two smaller notes** — added a tooltip (`title` + hover) to the ⌘K badge explaining what it does, for anyone who doesn't recognize the shortcut; the search field itself already has a full accessible label independent of this. On real imagery: I didn't attempt this — sourcing or faking before/after screenshots is a content/asset task, not a code fix, and generating placeholder "results" would risk implying processed output that never happened. Worth doing, but as a separate content project.

## Validation

Every change was verified by regenerating all 66 tool pages and running a full mount simulation (all 9 shared JS files loaded, all 66 `INIT` functions executed) plus the complete homepage stack including `app.js`/`features.js` — **zero load failures, 66/66 mounts**, at every step along the way, not just at the end. CSS brace-balance checked after every edit to `main.css`, `blog.css`, and `tools.css`.

## Honest limitations

Everything above is verified at the code/structure level. What still needs a real browser: whether the breadcrumb's spacing and weight actually *read* as intended visually, whether the mobile reorder of the favourite/share row looks right at real viewport widths, and a screen-reader pass (VoiceOver/NVDA) on the mode selector and breadcrumb rather than markup inspection alone.
