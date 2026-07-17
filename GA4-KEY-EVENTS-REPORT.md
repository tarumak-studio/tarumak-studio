# GA4 Key Events Implementation — Report

## Read this first: the one thing I genuinely cannot do

Marking `tool_process_completed`, `tool_download`, and `newsletter_signup`
as **Key Events** is a **GA4 admin console action**, not something any
code can do. There is no `gtag()` parameter or JS flag for "this event is
a conversion" — it's a manual toggle in the GA4 UI. Once this build has
been live for a few hours (GA4 needs to actually see the event fire at
least once before it appears in the events list):

1. GA4 → **Admin** (gear icon, bottom left) → **Events** (under "Data display")
2. Find `tool_process_completed` in the list → toggle **"Mark as key event"** on
3. Repeat for `tool_download` and `newsletter_signup`

That's it, but only a human with access to your GA4 property can do it —
I want to be direct about that rather than let this read as "done."

## The real reason GA4 shows near-zero conversions (found before fixing)

I audited every existing analytics call before writing anything new. The
whole 70-tool site had **14 total event-firing call sites**, with
inconsistent ad-hoc names (`upscale_complete`, `enhancement_started`,
`conversion_started`...) that don't match each other, let alone what you
asked for. Worse: `tool_open` — the single most basic "someone used a
tool" signal — only fired inside `app.js`, which loads **only on the
homepage's in-page SPA flow**. Your actual static tool pages (the ones
Google indexes, the ones your ~4-minute-engagement organic traffic lands
on directly) load a completely separate script, `static-tool-bootstrap.js`,
which never called it. Organic visitors converting on real tools were
very likely never generating a single custom event. That's a plausible,
concrete explanation for what your screenshot showed, independent of Key
Event marking.

## Architecture: one shared module, not 70 copies

I built `analytics.js`, loaded on every page type (homepage, all 70 tool
pages, all 5 category pages, all 50 articles, contact/about/etc). It
exposes `trackEvent(name, params)`, which auto-attaches `tool_name`,
`tool_category`, and `device` from `<body data-tool-slug>` (already
present on every tool page) — call sites only pass what's actually
specific to that event.

**The highest-leverage decision:** most of the requested events hook into
functions this codebase *already shares* across all 70 tools, rather than
touching each tool's file individually:

| Event | Hooked at | Coverage |
|---|---|---|
| `tool_open` | `static-tool-bootstrap.js`, right where each tool successfully mounts | **All 70**, verified |
| `tool_upload` | `dropzone()` in `utils.js` — the one function every file-based tool uses | **All file-based tools**, verified |
| `tool_download` | `download()` in `utils.js` | **All tools using it**, verified |
| `tool_error` | `setStatus(el, msg, err)` when `err` is truthy — used everywhere | **Wide, with one caveat below** |
| `tool_reset` | `TarumakReset()`, the universal reset system | **All tools with reset**, verified |
| `category_filter` | one delegated click listener in `analytics.js` on `.tab[data-cat]` | **All 70 tools + /tools page** |
| `related_tool_click` | delegated listener on the recommendation cards built in the last session | **All 70 tool pages** |
| `blog_to_tool_click` / `tool_to_blog_click` | delegated listeners on `.tool-cta-link` / `.tp-guide` | **Wherever those links exist** |
| `mega_menu_tool_click` | delegated listener on `.mega-tool` / `.mega-tool-hero` | **Site-wide** (mega menu is shared chrome) |
| `site_search` | `features.js` (tools grid) + `app.js` (homepage hero search), debounced 600ms so it fires once per pause, not per keystroke | **Both search inputs** |
| `newsletter_signup` | the footer form's existing success branch | **Homepage** (the only place this form exists) |
| `cta_click` | `.tp-cta-primary` / `.tp-cta-ghost`, the "More Tools / Browse all" band on every tool page | **All 70 tool pages** — see honest gap below |

## Where full per-tool coverage stops, and why I'm not claiming more

`tool_process_started` / `tool_process_completed` can't be hooked at a
shared-function level — "processing" is different code in every tool. I
wired these, with real `processing_time` (measured with
`performance.now()`, not estimated), plus the three requested AI-specific
events, into the **6 tools I could verify precisely** because I built or
substantially rewrote them earlier in this project: AI Object Remover, AI
Photo Enhancer, AI Image Upscaler (their `ai_*_completed` events fire
alongside the generic ones), PDF to Excel, Word to PDF, and HTML to PDF.

**The other ~64 tools do not have `tool_process_started`/`_completed`
wired yet.** They do get `tool_open`, `tool_upload`, `tool_download`,
`tool_error`, and `tool_reset` automatically from the shared-helper hooks
above — real, working coverage — but not the two process events
specifically, since I have not read and verified each of those tools'
own code this session. Saying otherwise would be a guess dressed up as a
fact. Extending this is genuinely tractable — every tool follows the same
`onclick → do the work → show result` shape — but it's 64 individual
files to actually open and verify, not a global find-replace.

## A second real gap I found while fixing this

While cleaning up, I found `tool_error`'s coverage isn't as complete as
"every tool calls `setStatus`" implies: at least one place in AI Object
Remover set `st.textContent` directly on an error path instead of calling
`setStatus(..., 1)`, which means it would have silently bypassed the
`tool_error` hook. Fixed that one specifically; flagging that the same
pattern likely exists elsewhere across the ~64 untouched tools.

## Double-fire bugs caught and fixed before shipping

Several tools I touched (`ai-image-upscaler`, `ai-object-remover`) had a
manual `_ga('file_download', ...)` call sitting **right next to** a
`download()` call — meaning, after instrumenting `download()` itself to
fire `tool_download`, those spots would have fired the download event
twice per download. Found and removed both. Separately, `word-to-pdf` and
`html-to-pdf` use jsPDF's own `doc.save()`, which bypasses `download()`
entirely — the opposite problem, silent under-counting. Added an explicit
`tool_download` fire at both those exact points, with a code comment
explaining why they're the exception to the "it's automatic" rule.

## Verified, not assumed

- Every touched file passes `node --check`.
- Full site load test: all 48 tool INITs still register correctly.
- Grepped every one of 142 HTML files site-wide for "has `features.js`
  but missing `analytics.js`" — found and patched 16 pages the build
  scripts don't regenerate (5 category pages, 50 of 51 articles, plus
  blog/about/contact/404/terms/changelog/etc.), each verified to contain
  the tag exactly once afterward, not duplicated.
- Confirmed `MEGA_MENU_SCRIPT` in `header-chrome.js` is a hardcoded
  string, not scraped from `index.html`, before editing near it — so the
  new script tag couldn't silently break that extraction.

## One page this surfaced that has nothing to do with analytics

`article-social-media-image-sizes.html` has **zero** `<script src="...">`
tags of any kind — no header, no nav, no search, nothing. It predates
whatever established this site's shared-chrome system. I patched every
other page but left this one alone, since fixing it means rebuilding its
entire header/footer, a different task than "wire up analytics." Flagging
it now rather than silently leaving it as a mystery gap.

## What wasn't attempted

- `tool_process_started`/`completed` for the ~64 tools outside the six
  listed above (see above).
- Extending `cta_click` to the homepage's own "Explore Tools" button — it
  currently shares a generic `.btn.btn-primary` class with dozens of
  unrelated buttons (including every tool's own Convert/Run button), so
  delegating on that class would over-fire. Giving it a dedicated class
  is a one-line HTML change if you want it, but I didn't make it
  unilaterally since it touches markup outside this task's stated scope.
