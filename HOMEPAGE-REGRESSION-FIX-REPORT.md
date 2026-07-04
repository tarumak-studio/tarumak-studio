# Tarumak Studio — Homepage Regression: Root Cause & Fix
### One uncaught exception explained every symptom in this report — verified by actually running the boot sequence, not just reading it

## 0. Method

Every homepage function this bug report mentions was real and present in the code — nothing had been deleted. That ruled out "missing import" or "deleted component" as the cause and pointed at **execution stopping partway through**. Rather than guess which line, I built a minimal DOM stub and actually ran the real `data.js → features.js → app.js` boot sequence in Node against the *actual current* homepage HTML structure (same element IDs, including the ones that are *absent*), then again against `/tools`' structure. This turns "I believe this is the cause" into "I ran it and watched it happen."

## 1. Root cause

An earlier round moved `buildTabs()` and `buildGrid()` out of `app.js` and into `features.js`, specifically so the new `/tools` directory page could reuse them (documented in `features.js`'s own comment: *"moved here... so the /tools directory page... has everything it needs"*). That move needed one thing it didn't get: **both functions unconditionally write to `tabsEl`/`gridEl`** (`tabsEl.innerHTML = ...`, `gridEl.innerHTML = ...`) with no null check. Those two variables are set once, at module scope, in `data.js`:

```js
const tabsEl=$('#tabs'), gridEl=$('#grid');
```

`#tabs` and `#grid` only exist on `/tools` — never on the homepage (confirmed directly against `index.html`'s real ID list). So on the homepage, both variables are `null`, and `buildTabs()` throws `TypeError: Cannot set properties of null (setting 'innerHTML')` the instant it's called.

**Why that one throw explains the entire bug list, not just one section:** `showHome()` calls these in sequence — `buildTabs();buildGrid();buildCategoryCards();buildFeaturedTools();buildLatestArticles();wireFilterPills();` — and JavaScript does not continue past an uncaught throw to the next statement in that chain. Every function listed *after* `buildTabs()` in that same line silently never ran. Worse, `showHome()` is invoked by the app's boot-time `route()` call, and that call itself is followed, later in the same script, by `wireHeroSearch()` and a second explicit boot-time render pass. An uncaught exception partway through a script halts everything remaining in *that script* — so all of the following, not just the three sections named in the report, were dead on every homepage load:

| Silently broken | Because it comes after `route()` in `app.js` |
|---|---|
| Featured Tools cards | ✓ (matches report) |
| Category cards | ✓ (matches report) |
| Latest Guides cards | ✓ (matches report) |
| Homepage hero search wiring | ✓ (matches report §8 — "Homepage search... critical regression") |
| Hero tool-count auto-update | not reported, but confirmed dead too |
| Filter-pill wiring | not reported, but confirmed dead too |

One bug, one fix, every symptom.

## 2. Why the other search surfaces were unaffected

The report asked to audit header search, `/tools` search, and category-page search too. Checked each:

- **Header/mega-menu search** lives entirely in `mega-menu.js`, a separate script tag loaded independently of `app.js`. A throw inside `app.js` cannot stop a different `<script>` from running — confirmed this was never actually broken.
- **`/tools` page search** calls `buildTabs()`/`buildGrid()` directly (not through `showHome()`), and on that page `tabsEl`/`gridEl` are real elements — never null, never affected by this bug in the first place. Re-verified with the same boot-sequence test against `/tools`' actual DOM structure: tabs and the full 66-tool grid both render correctly.
- **Category pages** have no search box at all (confirmed: zero occurrences of `#gridSearch`/`#heroSearch` in `image-tools.html`) — nothing to regress there.

## 3. The fix

Two one-line guards, matching the defensive style already used elsewhere in the same file (`if(tabsEl)tabsEl.addEventListener(...)` a few lines below already does exactly this — the function *bodies* were just missed):

```js
function buildTabs(){
  if(!tabsEl)return;
  ...
}
function buildGrid(){
  if(!gridEl)return;
  ...
}
```

No HTML changed. No CSS changed. No visual element touched. `features.js` is loaded via `<script src="/features.js">` on every page from one file — this fix takes effect everywhere the moment the file is saved, no per-page regeneration needed.

## 4. Verification (executed, not assumed)

Built a Node-based DOM stub reproducing the real homepage's actual element IDs (including the real *absence* of `#tabs`/`#grid`) and ran the genuine `data.js` → category JS → `blog-data.js` → `features.js` → `app.js` boot sequence against it:

- **Before the fix:** confirmed the exact throw (`Cannot set properties of null`) at the exact line, and confirmed the three containers stayed empty.
- **After the fix:** boot completes with **zero uncaught exceptions**. `feat-grid` renders 9,167 characters of real card markup, `cat-grid` renders 3,628 characters (all 5 categories), `blog-strip-grid` renders 3,479 characters.
- **Search, functionally, not just "doesn't throw":** simulated typing "merge" into the real hero search input — it returns a real, correctly-linked, correctly-highlighted result (`PDF <mark>Merge</mark>r` → `/pdf-merger`), confirming partial-match and highlight behavior both work.
- **`/tools` page re-verified unaffected:** same test against its real DOM (where `#tabs`/`#grid` legitimately exist) — tabs render, and the full grid renders all 66 tools, unchanged from before this fix.
- **Image comparisons / converter directions** (asked about explicitly): spot-checked `background-remover.html`'s compare-slider and `word-to-pdf.html`'s convert badges (DOCX → PDF) — both intact, unrelated to this bug and untouched by this fix.
- **Header/footer integrity:** re-checked after this fix — still one byte-identical header across all 132 pages, one byte-identical footer across all 131 non-404 pages. This was a pure logic fix; nothing structural moved.
- All 25 JS files re-pass `node --check`.

## 5. What this was not

Not a redesign, not a rewrite, not a rebuild of any section. One file changed (`features.js`), two lines added. Every other file in the project — including every homepage section's actual markup, styling, and animation — was already correct; the content was always there, it just never got the chance to render.

## 6. Files changed

**Modified:** `features.js` (2 lines — the guards above). **Everything else: unchanged.**
