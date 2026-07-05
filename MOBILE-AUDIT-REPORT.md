# Tarumak Studio — Mobile Navigation, Responsive & Typography Audit

## 1. The hamburger menu bug — root cause found and fixed

**This was real, and it was my own mistake from the previous round.** Traced it to an exact line rather than patching symptoms.

`resync-chrome.js` (the script that stamps shared chrome onto the 65 pages that aren't regenerated from scratch — the homepage, every article, every category page, about/contact/work-with-me/blog, legal pages) decides whether to insert the `<script src="/nav-responsive.js">` tag with this check:

```js
if (!html.includes('nav-responsive.js')) { /* insert the script tag */ }
```

The mobile drawer's own accordion placeholder — which I wrote into every page's shared header markup last round — contains an HTML comment: `<!-- built by nav-responsive.js from #megaMenuData -->`. That comment contains the literal string `nav-responsive.js`. Since the header/mobile-menu markup gets stamped onto the page *before* this check runs, by the time the check executes, the page already contains that substring — from the comment, not a real script tag — so the condition evaluated false and **the actual script was never inserted.** Only the 66 tool pages (built fresh from a template that includes the script unconditionally) ever got it. Every other page — the homepage included — had a hamburger button with no click handler attached at all.

I found this by checking, precisely, how many pages had a *real* `<script src="/nav-responsive.js">` tag versus how many merely contained that string anywhere:

| | Before this fix |
|---|---|
| Pages with a real `<script src="/nav-responsive.js">` tag | 66 (tool pages only) |
| Pages with zero real script tag, hamburger completely inert | 65 |
| `tools.html` specifically | 2 real script tags (a separate copy-paste duplicate from last round — this one made the burger open-then-immediately-close on every tap, since the listener fired twice) |

That distribution — "some pages work, many don't" — matches your report exactly, and explains why it wasn't caught by my own verification last time: I had checked for the bare filename string, which the comment itself satisfies. Lesson applied to the fix itself, not just the symptom.

**Fix:** changed every one of `resync-chrome.js`'s four existence checks (mega-menu.css, nav-responsive.css, mega-menu.js, nav-responsive.js) to match the actual tag pattern (`src="/nav-responsive.js"`) instead of the bare filename, closing off this entire bug class rather than just today's instance of it. Removed the duplicate insertion in `build-tools-page.js`. Rebuilt all 132 pages and verified precisely this time: **every single page now has exactly one real script tag, no more, no less** — checked programmatically, not sampled.

**Overlay, scroll lock, focus trap, and close behavior are unchanged from last round's implementation** (which was verified working) — the code itself was correct throughout; it simply wasn't loading on 65 of 132 pages. Re-ran the same interactive test harness from last round against the current build to confirm nothing regressed: burger open/close, backdrop click, theme sync, tablet tap-mode at 800px vs. 1440px, tap-outside, and Escape all still pass.

## 2. "Explore Tools" hidden on mobile, kept on tablet and desktop

Added `.nav .btn-primary { display: none; }` inside the same `@media (max-width: 767px)` block that already hides `.nav-links`/`.search` and shows the hamburger — so it disappears at exactly the same point the rest of the top nav does, and reappears at the same 768px point tablet's nav bar does. The drawer already has its own "Explore Tools" button (added last round), so nothing is actually lost — it just isn't duplicated next to the burger on a phone-width screen. Desktop and tablet: completely unaffected, verified by checking the rule only exists inside that one breakpoint.

## 3. Responsive consistency

Scanned every stylesheet for fixed pixel `width` values that could force horizontal overflow on a 320px viewport (the narrowest width in your test list). Found exactly one fixed-width-adjacent rule site-wide, and it's `max-width: 1180px` on the page container (`.wrap`) — a ceiling, not a floor, so it can't force overflow on a narrow screen. No other concerning fixed widths found in `main.css`, `tools.css`, `mega-menu.css`, `nav-responsive.css`, or `tool-variants.css`.

The touch-target and spacing work from last round (44×44px minimum on mobile, the tablet 44px min-height on the Tools trigger sitting comfortably inside the nav's fixed 72px row) is unchanged and still verified correct.

**Honest limitation:** a static scan can catch fixed-width overflow risks and confirm breakpoint rules exist and don't conflict, but it cannot replace actually loading the site in a real mobile browser at each of the 9 widths requested. I'd treat this section as "no red flags found in the code," not "visually confirmed at every width."

## 4. Typography — found the exact bug you reported, plus a bigger one

**The literal 16.5px you saw** is `.tp-lead` — the intro paragraph under the H1 on all 66 tool pages. Found it by grepping for the exact value across every stylesheet and the tool-page template. Reduced to 14px.

**While auditing further, found something larger:** there was no global font-size rule for `<p>` tags anywhere on the site. `body` set `line-height: 1.6` (already matching your recommendation) but never a `font-size` — so every plain paragraph, including all 50 articles' actual body prose, fell back to the browser's native default of 16px. Added `p { font-size: 14px; line-height: 1.6 }` as a site-wide baseline, which is now the single rule underneath the majority of paragraph text on the site.

**Then found the rule that actually mattered most:** articles have their own more specific selector, `.article-body p`, which — because a class selector beats a plain element selector — was silently overriding that new baseline at **15.5px**, meaning the new global rule alone would not have fixed the highest-volume reading content on the site (all 50 articles). Also found this exact rule duplicated twice within `blog.css` itself (an old, harmless leftover from an earlier patch that never got cleaned up) — fixed both copies, since CSS cascade means only fixing one would have left the second, later one still winning.

**Full list of what was changed**, organized by the recommended tiers:

| Class | Where | Before | After |
|---|---|---|---|
| `.article-body p` / `li` | All 50 articles (`blog.css`, both duplicate copies) | 15.5px | 14px |
| `.tp-lead` | All 66 tool pages | 16.5px | 14px |
| `.sub` | Homepage section description | 17px | 14px |
| `.section-head p` | Section descriptions | 16px | 14px |
| `.tool-head p` | Tool page header description | 16px | 14px |
| `.category-head p` | Category page description | 15.5px | 14px |
| `.comp-head p` | Comparison section description | 15px | 14px |
| `.featured-head p` | Featured Tools description | 15px | 14px |
| `.q .a` | FAQ answer text (tool pages) | 14.5px | 14px |
| `.art-faq p` | FAQ answer text (articles) | 14.5px | 14px |
| `.mk-sub` | Marketing tool descriptions | 15.5px | 14px |
| `.empty` | Empty-state helper text | 15px | 14px |

**Left unchanged, deliberately:** headings (`h3`/`h4`, per your instruction), buttons (`.btn-lg`, `.comp-cta-btn` — not paragraph text), and every `<input>` field's font-size. That last one is intentional: iOS Safari auto-zooms the page when focusing an input with computed font-size under 16px, so shrinking search-box text below where it already sits would introduce a worse mobile bug than the one being fixed. Line-height across all of the above is 1.6–1.65, matching your target.

## 5. Responsive QA at the requested breakpoints

The 767px (mobile) and 768–1024px (tablet) architecture from last round already covers your full requested width list — 320/360/375/390/412/430 all fall below 767px and get the same drawer/hamburger treatment uniformly (there's no additional breakpoint between them that could cause inconsistency), and 768/820/1024 all fall in the tablet band with the visible-nav-bar-plus-tap-dropdown behavior. Re-verified header/footer byte-identity and the nav-responsive asset propagation across all 132 pages after every change in this round, not just at the end.

## Files changed

**Modified:** `resync-chrome.js` (the actual bug fix — precise tag matching instead of substring matching, for all four asset-existence checks), `build-tools-page.js` (removed the duplicate script line), `main.css` (paragraph baseline; Explore Tools mobile-only hiding; 8 paragraph-class font-size reductions), `tools.css` (`.q .a`, `.mk-sub` reductions), `blog.css` (`.article-body p`/`li`, `.art-faq p`, `.mk-sub` — both duplicate copies), `build-tool-pages.js` (`.tp-lead`). **Regenerated:** all 66 tool pages, `tools.html`, all 63 static/article pages' chrome. **Unchanged:** `nav-responsive.js`, `nav-responsive.css`, `header-chrome.js`, `mega-menu.css/js` — none of today's bugs originated in the interactive logic itself, only in how reliably it got loaded and a handful of font sizes.

## Final regression checklist

- [x] Hamburger menu: verified programmatically that all 132 pages now load exactly one real copy of the script — not sampled, checked every page.
- [x] Overlay, scroll lock, focus trap, Escape, tap-outside: re-ran the interactive test suite from last round against the current build — all pass, unchanged from before (the logic was never broken, only its loading).
- [x] Explore Tools hidden on mobile only — confirmed the rule lives inside the 767px breakpoint exclusively.
- [x] No fixed-width overflow risks found in a full stylesheet scan.
- [x] Typography: exact reported value (16.5px) found and fixed, plus the higher-impact `.article-body p` bug found along the way; 12 selectors total corrected against the recommended tiers.
- [x] Touch targets ≥44×44px on mobile — unchanged from last round, re-verified still scoped correctly.
- [x] Desktop and tablet layouts — untouched; every change in this round lives inside a ≤767px (or exact 768–1024px tablet-specific) media query, or is a class this system never applied to desktop.
- [x] All 26 JS files pass `node --check`; all 6 CSS files brace-balance clean.
- [ ] **Still needs a real device/browser pass:** Android/iPhone-specific touch quirks, and eyeballing the 9 requested pixel widths directly — this environment can verify code correctness and propagation exhaustively, but can't replace an actual phone in your hand.
