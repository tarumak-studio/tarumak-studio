# Tarumak Studio — Tool Page Architecture
### 66 indexable tool pages · Real working tools · One build command

**Status: BUILT AND VERIFIED.** This document describes the architecture as implemented — all 66 pages are generated, validated (zero errors across JSON-LD parsing, canonicals, H1s, mount points), and packaged for upload. It also serves as the maintenance guide.

---

## 1. Page Architecture

Every tool gets a static page at an extensionless root URL — `/background-remover`, served from `background-remover.html` (Cloudflare Pages resolves extensionless automatically). **This URL scheme wasn't invented; it was discovered**: the category pages already linked `/background-remover`-style URLs (currently 404ing). This build makes ~66 existing internal links stop pointing at nothing.

Page anatomy (in order, matching the brief):
1. **Breadcrumb** — Home › Category › Tool (also as `BreadcrumbList` schema)
2. **Hero** — H1, SEO lead paragraph, category badge (links to category page), format chips, **favourite button** (syncs with the SPA via the same `tmk_favs` localStorage key — save on a landing page, it's saved in the app), **share button** (native share sheet → clipboard fallback)
3. **Tool interface — the real tool.** Not a screenshot, not a launch button: the actual `INIT[slug]` function mounts into `#toolPanel`. Feasible because (verified in code) `INIT{}` is declared in `data.js`, not `app.js`, and every INIT across all five category files is self-contained — zero SPA dependencies. A loading skeleton shows during hydration; `<noscript>` and mount-failure paths fall back to an "open in app" link.
4. **Benefits** — privacy / speed / quality / formats
5. **How it works** — 4 steps, direct port of the SPA's `buildHowToGuide()` (same copy, category-adaptive verbs)
6. **Features grid**
7. **FAQ** — 8–12 questions: per-tool specifics from `FAQ{}` (66/66 covered) merged with category-level and universal banks, deduplicated
8. **Related tools** — same-category, real `<a href>` links (4–6)
9. **Related guides** — from `TOOL_ARTICLES` → `ARTICLES` metadata
10. **CTA band** — category page + browse-all
11. **Footer** — harvested verbatim from existing pages

## 2. Component & Template System

There are no runtime components to maintain — the "component library" is the **build script's template functions** plus two real sources of truth:

- **Chrome (header/mob-menu/footer/base styles) is harvested at build time from `image-tools.html`** — the existing static-page template. Change the category-page design, re-run the build, and all 66+ tool pages follow. Zero drift by construction.
- **Panel components come from `tools.css`** — the SPA's own stylesheet, linked in each page's head. The mounted tool is pixel-identical in both contexts because it is literally the same CSS and the same INIT function. Missing design tokens (10 of the 20 `tools.css` consumes weren't in the harvested chrome) are patched into each page's embedded style with values copied exactly from `main.css`.

## 3–5. HTML / CSS / JS Organization

```
{slug}.html            ← generated; static content is complete without JS
  <head>  meta + OG/Twitter + canonical + JSON-LD + harvested links
          <link /tools.css>          (panel components)
          <style> harvested chrome + tp-* additions </style>
  <body data-tool-slug data-tool-name>
          harvested header + mob-menu
          content sections (all static HTML — this is what Google reads)
          harvested footer
          inline fav/share script (generated)
          deferred chain: config → utils → tool-helpers → data →
                          {category}-tools → static-tool-bootstrap
```

JS is **additive hydration**: the page is complete, indexable content before a single script runs; the deferred chain then mounts the interactive tool. LCP is the static hero text — Core Web Vitals are structurally protected. The heavy files (`data.js` 68KB, category file 30–70KB) are shared byte-for-byte with the SPA, so they're **already cached** for anyone who has visited any other page — and vice versa: an organic landing pre-warms the SPA.

## 6. Metadata Strategy

Per page: title ≤62 chars (`{Name} — Free Online, No Upload | Tarumak Studio`, with automatic shorter fallbacks for long names), description ≤155 chars derived from the tool's real description (sentence-boundary trimmed), canonical (extensionless), OG + Twitter cards pointing at `og-image.png` (which exists as of the conversion round).

## 7. Schema Strategy

One `@graph` per page: `WebPage` + `SoftwareApplication` (offers: 0, `isAccessibleForFree`) + `BreadcrumbList` + `FAQPage` (the rendered FAQs, exactly — never schema for content not on the page). Deliberately absent: `HowTo` (Google deprecated its rich results), `aggregateRating` (no real ratings — fabricating them is a penalty risk). **Same-deploy rule honored:** the homepage `ItemList` now points at these real URLs (`numberOfItems` corrected 63→66) in the same build that creates the pages — the schema never asserts a URL that doesn't exist.

## 8. Internal Linking

The mesh each tool page now sits in (≥4 independent inlink sources):
- **Homepage** → featured cards (already anchors), toolkit grid (anchor per tool inside `<h3>`), ItemList schema
- **Category pages** → already linked these URLs; the 404s are now pages
- **SPA related-tools cards** → converted this round from onclick-divs to progressive-enhancement anchors (`href` for crawlers, `onclick` SPA-open for users) — this also made them keyboard-accessible
- **Sibling tool pages** → each page's Related Tools section
- **Articles** → guides link to tools; the reverse mesh (articles → tool pages) is the one remaining wiring task, scriptable from `TOOL_ARTICLES` reversed

## 9. Reusable Template / Scalability

**Adding tool #67:** add its row to `TOOLS` in `data.js` (which you already do), optionally its `FAQ{}` entry, run `node build-tool-pages.js`, upload. The page, its schema, its sitemap entry, and the corrected ItemList count all regenerate. 150 tools = the same one command. There is no template to copy, no HTML to hand-edit, no second source of truth.

## 10–11. Performance Plan

- Static content first; all JS deferred; shared JS cached across the whole property
- Embedded critical CSS per page (harvested chrome ~10KB) + one shared `tools.css` request
- No web fonts beyond the existing Google Fonts links (harvested as-is)
- Loading skeleton respects `prefers-reduced-motion`
- Future (Phase 2 of the strategy doc): per-tool code splitting of category files if analytics shows heavy mobile organic traffic — not needed to ship

## 12. SEO Best Practices Applied

Unique title/desc/H1 per page from real per-tool data · FAQ content on-page matches FAQPage schema exactly · extensionless canonicals matching existing site convention · sitemap split (`sitemap.xml` index → tools 0.9 / articles 0.6 / pages) with the broken orphan article excluded · breadcrumbs in HTML and schema · every image-free page (no LCP image risk) · fav/share/recents make landing pages feel like the product, not a brochure.

## 13. Common Mistakes Avoided (each one was a live possibility here)

- **Shipping schema before pages** — the ItemList fix is inside the same build script run, structurally unable to ship separately
- **Templated thin content** — copy comes from per-tool descriptions, per-tool FAQs, and category-adaptive how-tos; the strategy doc's Phase 2 hand-variation pass deepens the 15 highest-traffic pages further
- **Duplicating the component library** — panel CSS is linked, not copied; chrome is harvested, not forked
- **`/tools/` subdirectory** — would have orphaned the 66 links category pages already emit
- **Breaking the SPA** — nothing in the SPA changed except two card types gaining `href`s; `go()` behavior is untouched

## 14. Implementation Order (for upload)

1. Upload everything in `tool-pages-release.zip` to the repo root (66 pages + `static-tool-bootstrap.js` + 4 sitemap files + patched `index.html` + patched `app.js` + `build-tool-pages.js` for future builds)
2. Purge Cloudflare cache; spot-check `/background-remover` renders and the tool works (the mount path needs one real-browser test — this environment can't execute browser JS)
3. Search Console: resubmit `sitemap.xml` (now an index)
4. Run one page through Google's Rich Results Test (validates SoftwareApplication + FAQ + Breadcrumb)
5. Watch Pages → Indexing weekly; 90-day target from the SEO doc: 55–66 indexed
