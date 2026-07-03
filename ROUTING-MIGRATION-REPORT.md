# Tarumak Studio — Routing Migration Report
### Hash-SPA navigation → canonical clean URLs · Completed & validated

## Phase 1 — Codebase Analysis (findings)

**Premise correction (important):** the brief described a React + Vite + React Router application. Verified reality: **no package.json, no Vite config, no src/, no React** — Tarumak Studio is a vanilla JS SPA (hash router in `app.js`) plus 130 static HTML pages. This made the migration *simpler* (no router library, no build pipeline to reconfigure) and everything below is grounded in the real architecture.

**Second correction:** the 66 SEO landing pages with the real tool embedded already existed (built in the immediately preceding round) — hero → working tool → benefits → how-it-works → FAQ → related, exactly the composition the brief specifies, with no "Open Tool" button. What genuinely remained was this brief's core demand: **internal navigation still used hash routes in 600+ places.**

**Inventory (all verified by census, not sampled):**
- `index.html`: 20 `onclick="go(...)"` navigation elements (brand ×3, nav, CTAs ×3, hero pills ×5, footer ×7, mob-menu ×2) + JSON-LD `SearchAction` targeting `#/all?q=` + 5 category schema URLs on `#/{cat}`
- `app.js`: 11 inline link-builder sites + 2 delegated handlers + SPA blog/page views with `#/` crumbs
- `features.js`: 5 sites (toolkit grid card + inner anchor, 2 search-result renderers, recent pills)
- `ai-search.js`: 3 handlers
- Static pages: **569 hash refs across 130 files** — 454× `/#/all` in harvested headers, ~100 article→tool links in two forms (`/#/t/x` and `#/t/x`), plus stragglers in the orphaned broken article
- `static-tool-bootstrap.js` fallback and the build template's noscript/CTA

## Phase 2 — Migration Plan (as executed)

URL mapping: `#/t/{slug}` → `/{slug}` · `#/{cat}` → `/{cat}-tools` · `#/all` → `/#tools` (homepage toolkit anchor) · `#/blog` → `/blog` · `#/p/{page}` → `/{page}` · SearchAction → `/?q={term}` (with a new prefill handler). Conversion styles: elements with existing `href` drop their `onclick`; onclick-only elements become real anchors; card containers navigate via `location.href` (avoiding invalid nested anchors around the fav button). Backward compatibility: a **legacy redirect layer** at the top of `route()` forwards every old external hash link to its canonical page; `go()` becomes a documented one-line shim feeding that layer. Orphaned duplicates deleted with 301s via Cloudflare `_redirects`.

## Phase 3 — Changes Made

| File(s) | Change |
|---|---|
| `index.html` | All 20 elements → real links; SearchAction + category schema URLs cleaned; zero `#/` remaining |
| `app.js` | Legacy redirect layer; 13 builder/handler sites converted; SPA blog prev/next + crumbs → real URLs; `?q=` SearchAction handler added; `go()` → legacy shim |
| `features.js` | Grid cards, search results ×2, recent pills → real navigation |
| `ai-search.js` | Result rows + category fallback → real URLs |
| `static-tool-bootstrap.js` | Mount-failure fallback no longer points into the SPA (which would redirect-loop) |
| `build-tool-pages.js` | noscript de-hashed; CTA → `/#tools`; dead `tp-open` CSS purged; regenerated all 66 pages |
| 130 static pages | Bulk sweep, both link forms; article→tool mesh now real URLs (~100 links — the internal-linking layer the SEO architecture doc called for, completed as a side effect) |
| Deleted | `article-social-media-image-sizes.html` (broken, unstyled duplicate), `privacy.html` (orphan) — with 301s in new `_redirects` |

## Phase 4 — Validation Results (final pass, all automated)

✅ Hash refs across all 131 HTML files: **zero** · ✅ `#/` in JS outside the redirect layer + documented shim: **zero** · ✅ 66/66 tool routes exist, tool embedded, no Open-Tool button · ✅ All 8 JS files pass syntax · ✅ 66-page schema/canonical errors: **zero** · ✅ Sitemap index valid · ✅ index.html JSON-LD parses · ✅ Old `#/t/`, `#/{cat}`, `#/all`, `#/blog`, `#/p/` links all redirect to canonical URLs · ✅ No duplicate routes (orphans removed with 301s)

**Honest transparency notes:** (1) One intermediate edit briefly broke `app.js` (a nested brace in `go()` my slice missed) — caught by the syntax gate and repaired in the same session; final state verified clean. (2) Tool mounting and redirects are code-verified but need one real-browser smoke test after deploy, since this environment can't execute browser JS. (3) The trade-off accepted by design: tool-card clicks are now full page navigations rather than instant SPA swaps — the pages are light and the JS is shared/cached, but it is a perceptible change from the old in-app feel, in exchange for one canonical URL per tool, consistent analytics, and the SEO architecture both strategy docs called for.
