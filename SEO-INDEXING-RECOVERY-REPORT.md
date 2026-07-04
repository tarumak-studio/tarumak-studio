# Tarumak Studio — Technical SEO & Google Indexing Recovery
### Every GSC-flagged issue, root-caused against the real code and fixed — not guessed at

## 0. The numbers, before anything else

Your Search Console export showed **79 of ~130 known URLs** with an indexing problem, and only a handful properly indexed:

| Issue | Count |
|---|---|
| Discovered — currently not indexed | 48 |
| Crawled — currently not indexed | 24 |
| Redirect error | 3 |
| Server error (5xx) | 2 |
| Page with redirect | 2 |

That's not 79 separate bugs. It's almost entirely **one root cause wearing five different masks**: the site was serving every page at two live URLs (`/about` and `/about.html`) with contradictory canonical signals between them, on top of a `www` subdomain that isn't properly connected and returns server errors instead of redirecting. Everything below traces each GSC category back to the actual lines of code causing it.

## 1. Root cause — duplicate URL formats (GSC categories: Discovered, Crawled, Redirect error)

Three different inconsistent patterns were found, verified directly in the files rather than assumed:

**Pattern A — backwards canonical (about, contact, work-with-me, changelog, privacy-policy, terms, cookie-policy).** These 7 pages' own `<link rel="canonical">`, `og:url`, and JSON-LD `url` fields all pointed at the `.html` version, while the sitemap listed the clean version, and the global nav/footer (present on every page site-wide) linked to the `.html` version too. Three different signals, three different answers about which URL is real — this is close to a worst-case setup for Google.

**Pattern B — correct canonical, no redirect (all 50 articles + blog.html + 5 category pages).** These already had the clean URL correctly set as canonical. But no redirect existed from the `.html` file to it, so Cloudflare was serving identical content at both URLs with a 200 status — Google's crawler found both, which is exactly why your export shows pairs like `article-css-gradient-guide` and `article-css-gradient-guide.html` as two separate crawled entries.

**Pattern C — the actual source of most of the volume.** `blog-data.js`'s `ARTICLES` metadata object stored every article's URL with the `.html` suffix. Every tool page's "Related guides" section, and blog.html's own static article grid, render directly from that data — so one file was quietly reintroducing `.html` links across dozens of pages no matter how many individual pages got fixed by hand. Found by counting: a site-wide link scan started at **1,721** internal `.html` hrefs, and even after fixing the header/footer at the source, **356 remained**, all traceable to this one data file plus direct article-to-article cross-links using the same pattern.

**Fix:**
- Canonical/OG/JSON-LD self-references corrected on all 7 Pattern-A pages.
- `index.html`'s header and footer (the single harvested source every page's chrome comes from) corrected, then propagated site-wide by re-running the existing `resync-chrome.js` and `build-tool-pages.js` build tools — not hand-edited per page.
- `blog-data.js`'s 47 article URLs corrected at the source, plus a site-wide sweep fixing the remaining direct article-to-article links.
- **137 explicit, single-hop 301 redirects** added to `_redirects` — one per page with a physical `.html` file, `.html → clean`, so any already-indexed `.html` URL, old bookmark, or external backlink lands on the canonical page in one hop.

**Verified after the fix:** zero internal `.html` hrefs remain anywhere on the site (excluding `404.html`, which is intentionally outside this system — see §6). All 131 pages share one byte-identical header and one byte-identical footer (previously 8 different hand-copied footer variants existed — a known, explicitly-deferred gap from an earlier round that turned out to be directly causing part of today's problem).

## 2. Redirect chains and redirect errors (GSC: Redirect error, Page with redirect)

The 3 URLs GSC flagged as **Redirect error** (`blog.html`, `article-create-qr-code-business.html`, `article-compress-images-without-losing-quality.html`) had **no redirect rule at all** before this round — meaning whatever redirect attempt Google's crawler hit previously either came from a transient platform-level condition or a since-changed configuration this repo has no record of. Each now has one explicit rule.

Every rule in the new `_redirects` was checked programmatically for chains — parsed every source→target pair and confirmed **zero targets are themselves the source of another rule**. Every URL on the site now resolves in exactly one hop.

`article-text-case-formats-guide.html` (GSC: **Page with redirect**) already had a working redirect — that's the *correct*, intended end-state for every `.html` URL, not a bug. It's now consistent with the other 136.

## 3. Canonical domain (GSC: Server error 5xx on `http://www` and `https://www`)

This is the one item that is **not fully fixable from the repository**. `_redirects` now includes:
```
https://www.tarumakstudio.com/*  https://tarumakstudio.com/:splat  301
http://www.tarumakstudio.com/*   https://tarumakstudio.com/:splat  301
http://tarumakstudio.com/*       https://tarumakstudio.com/:splat  301
```
But a `_redirects` file only governs traffic that reaches this Cloudflare Pages project in the first place. A 5xx on `www` (not a 404, not a redirect — a *server error*) means `www.tarumakstudio.com` isn't correctly connected to this Pages project at the DNS/custom-domain level yet. **Action needed on your end:** in the Cloudflare Pages dashboard, add `www.tarumakstudio.com` as a custom domain on this project (Pages → your project → Custom domains → Set up a custom domain), and confirm the DNS record for `www` is a CNAME pointing at your `*.pages.dev` subdomain. The moment that connection exists, the redirect rules above take over immediately — no further code change needed.

## 4. "Crawled — currently not indexed" — content audit (24 URLs)

Before writing a word of new copy, I checked whether these pages actually had a content problem. Word counts, FAQ presence, title/description length (measured on the *rendered* text, decoding HTML entities — a raw-byte count of `&mdash;` inflates length by 6 characters versus what actually displays), and internal link counts, across the 8 URLs that were flagged independently of their `.html` duplicate:

| Page | Words | FAQs | Internal links | Title (rendered) |
|---|---|---|---|---|
| article-how-to-create-seo-friendly-url-slugs | ~2,200 | 3 | 48 | 53 chars |
| article-create-qr-code-business | ~2,150 | 2 | 46 | 50 chars |
| article-meta-tags-seo-guide | ~2,150 | 2 | 46 | 57 chars |
| article-reduce-pdf-file-size | ~2,100 | 2 | 49 | fine |
| article-social-media-image-sizes-2026 | ~2,100 | 2 | 51 | 49 chars |
| article-how-to-convert-word-to-pdf | ~2,050 | 3 | 49 | fine |
| contact | — | 0 | 34 | fine |
| privacy-policy | — | 0 | 33 | fine |

**Honest finding:** these are not thin pages. 2,000+ words, unique H1s, 2–3 FAQs each, 46–51 internal links. The one real defect found was a meta description running 168 characters (over the ~155–160 soft limit) on the URL-slugs article — trimmed, and matched consistently across its `og:description`, `twitter:description`, and JSON-LD (all four previously carried the same too-long string). Everything else checked out. `contact` and `privacy-policy` are inherently low-uniqueness page *types* that Google very commonly declines to index even when well-built — that's expected, not a bug to engineer around with padding.

**What I'm not going to claim:** that rewriting already-substantial 2,000-word articles would fix this. The far more likely explanation, given the technical findings in §1, is that crawl budget and ranking signals were being split across two competing URLs for every single page — diluting exactly the kind of authority signal that decides "crawled" vs. "indexed" on a newer site. That's fixed now; the rest is genuinely a matter of resubmission and time (see §7).

## 5. "Discovered — currently not indexed" — crawlability audit (48 URLs)

Checked what actually links to each of these 48 URLs, rather than assuming they need more internal links added. Result: **the vast majority were already linked from the global nav, footer, or mega-menu on all 131 pages** — the problem wasn't a missing link, it was that the link and the page's own canonical tag disagreed with each other (Pattern A in §1), which is a strong signal to Google that the URL isn't worth prioritizing. Category pages (`image-tools`, `pdf-tools`, etc.) were already fully consistent before this round and needed no linking fix at all.

`llms.txt` and `llms-full.txt` are plain-text files for LLM/AI-assistant discovery, not HTML pages — Google crawling and then not "indexing" a `.txt` file as a search result is expected, correct behavior, not a defect.

## 6. `404.html` — a deliberate, documented exception

`404.html` doesn't participate in the `.html → clean` redirect (there's nothing to redirect *to* — it's the error page itself) and wasn't included in the footer/header unification sweep in the same way. This was a deliberate design decision from an earlier round, re-confirmed here as still correct: it already carries `noindex,follow` and a real meta description, so it isn't part of today's indexing problem.

## 7. Sitemap and robots.txt

Sitemap regeneration is already automatic (`build-tool-pages.js` rebuilds all 4 sitemap files on every run) and was re-verified after every fix in this round: **130 URLs across `sitemap-tools.xml` (66), `sitemap-articles.xml` (50), and `sitemap-pages.xml` (14) — zero `.html` entries anywhere.** `robots.txt` was already correct (`Allow: /`, correct `Sitemap:` line) and needed no changes.

**Recommended next step once deployed:** resubmit `sitemap.xml` in Search Console and use the URL Inspection tool's "Request Indexing" on a handful of the previously-duplicated pages to accelerate re-crawl, rather than waiting for Google's own schedule.

## 8. Files changed

**Rewritten:** `_redirects` (domain canonicalization + 2 legacy-orphan rules + 137 `.html→clean` rules, zero chains). **Modified:** `index.html` (header/footer link fixes — the harvest source for every other page), `blog-data.js` (47 article URLs), `resync-chrome.js` (extended to also re-stamp the footer, not just the header — closing the gap the header-unification round explicitly deferred), `about.html` / `contact.html` / `work-with-me.html` / `changelog.html` / `privacy-policy.html` / `terms.html` / `cookie-policy.html` (canonical/OG/JSON-LD self-references + body cross-links), `article-how-to-create-seo-friendly-url-slugs.html` (description length). **Regenerated:** all 66 tool pages (`build-tool-pages.js`) and all 63 static/article pages' header+footer (`resync-chrome.js`) — not hand-edited individually. **Unchanged:** `robots.txt`, `header-chrome.js`, `mega-menu.css/js`, `tool-content.js`, `tool-variants.css/js` — none of today's issues originated there.

## 9. Before → after

| | Before | After |
|---|---|---|
| Internal `.html` links site-wide | 1,721 | 0 |
| Footer variants across the site | 8 | 1 |
| Header variants across the site | 1 (already fixed in an earlier round) | 1 |
| Pages with backwards canonical (.html asserted as real) | 7 | 0 |
| `.html → clean` redirects | 0 general rules (2 legacy-specific only) | 137, zero chains |
| Domain canonicalization rules | none | www/http → apex (pending your DNS action, §3) |
| Sitemap entries with `.html` | — | 0 (130 clean URLs) |

## 10. Validation checklist

- [x] Every page's canonical tag matches its actual clean URL — checked programmatically across all 131 pages, zero mismatches.
- [x] Zero internal links to any `.html` URL anywhere on the site (404.html excepted by design).
- [x] All 131 pages share one byte-identical header; all 130 non-404 pages share one byte-identical footer.
- [x] `_redirects` parsed programmatically — zero rules where a target is also another rule's source (no chains).
- [x] The exact 3 GSC "Redirect error" URLs and the 1 "Page with redirect" URL each resolve via exactly one explicit rule.
- [x] JSON-LD schema parses as valid JSON on all 131 pages.
- [x] Sitemap (130 URLs across 3 child files) contains zero `.html` entries; `robots.txt` unchanged and correct.
- [x] All 24 JS files pass `node --check`.
- [ ] **Needs your action:** attach `www.tarumakstudio.com` as a custom domain on the Cloudflare Pages project (§3) — the one item genuinely outside the repo's control.
- [ ] **Needs your action, post-deploy:** resubmit `sitemap.xml` in Search Console and request re-indexing on a sample of previously-duplicated URLs.
- [ ] **Needs a real browser, post-deploy:** spot-check that a `.html` URL redirects visibly (not just per the rule file) once live on Cloudflare Pages — redirect-rule *syntax* was verified here, but this environment can't fire an actual HTTP request against the live edge network.
