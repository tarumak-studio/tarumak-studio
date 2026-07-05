# Tarumak Studio — Mega Menu Hover-Gap Fix

## The bug, precisely

The panel opens via `top: calc(100% + 14px)` — a 14px visual gap below the "Tools" trigger. `.nav-tools-drop` (the hover-triggering container) doesn't gain height from that gap, because the panel is `position: absolute` and doesn't contribute to its parent's normal-flow box. So the 14px gap is real, empty screen space that belongs to neither the trigger nor the panel. Moving the cursor diagonally from one to the other crosses genuinely outside both elements' hoverable area for a moment — plain CSS `:hover` has no memory of "I was just here a moment ago," so it closes the instant the cursor leaves the trigger, before it can physically reach the panel below. This is exactly what you described, and it's a well-known limitation of pure-CSS dropdown menus, not something specific to this codebase's markup.

## The fix

`mega-menu.js` now manages open/close itself on desktop, with the trigger and the panel treated as one combined region, bridged by a delay:

- Entering *either* the trigger or the panel opens the menu and cancels any pending close.
- Leaving *either* one starts a 200ms close timer (within your requested 150–250ms window).
- If the cursor re-enters before that timer fires — which a normal diagonal move across a 14px gap always does — the timer is cancelled and the menu stays open. If it doesn't, the menu closes.
- Gated to `window.innerWidth > 1024` end to end, checked inside every handler (not just once at setup), so this is completely inert at tablet and mobile widths — that's still tablet's tap-to-open (from the mobile nav work) and the hamburger drawer, both untouched.

`:hover` and `:focus-within` are left exactly as they were in `main.css` — deliberately not removed. Two reasons: keyboard users never had the gap bug in the first place (focus doesn't travel through physical space), so `:focus-within` continues to open/close the menu the same instant it always did, with no delay layered on top. And if this script ever fails to load, the menu still opens via plain `:hover` with a complete, fully-linked default preview already baked into the page — this change adds behavior, it never removes the fallback.

**Verified empirically, not just by reading the code** — ran the actual updated file in a test harness and reproduced your exact scenario: hover the trigger (opens), leave the trigger heading toward the panel (stays open through the grace period), reach the panel before the delay expires (stays open, timer cancelled), let the now-cancelled timer fire (confirmed it's a no-op — the menu does *not* close). Then confirmed the reverse: leaving the panel for good and letting the delay elapse closes it correctly. Also confirmed the same code does nothing at all at tablet width, and that `aria-expanded` tracks true/false correctly through both open and close.

**One bug found and fixed while building this:** the first version used `if (closeTimer)` to check for a pending timer, which treats a timer ID of `0` as "no timer" (falsy) — harmless in real browsers, which don't hand out `0` as an ID, but still a real latent bug caught by the test harness (whose mock IDs do start at 0). Changed to explicit `!== null` checks throughout.

## Two more bugs found while investigating this, and fixed

While reading the exact CSS this fix needed to touch, found:

**A second copy of the entire "NAV TOOLS DROPDOWN" CSS section duplicated in `main.css`** — a leftover from an earlier round's patch that was never cleaned up (same pattern as a duplicate found in `blog.css` last round). Checked it wasn't hiding a real divergence first: every selector in the second copy already existed in the first, so it was pure dead weight. Removed it.

**A residual bug in the surviving copy:** `@media (max-width: 900px) { .nav-tools-panel { display: none !important; } }` was still present — this is the *non*-`.mega` version of a bug already fixed two rounds ago (that fix only removed the `.mega`-specific selector from `mega-menu.css`). Since the real panel element carries both classes (`class="nav-tools-panel mega"`), this plain selector still matched it and was still force-hiding the menu for the entire 768–900px tablet sub-range — silently undoing part of the tablet tap-mode work from two rounds ago. Removed it; the panel's visibility below 767px is already correctly handled by its hidden parent (`.nav-links`), so no replacement rule was needed.

## Verification

- Ran the exact gap-crossing scenario against the real, current code — passes.
- Confirmed desktop-only gating holds at both 1440px and 800px.
- Confirmed `aria-expanded` state tracking.
- Re-ran the full combined-script boot sequence (every page script loaded together, including this change) — zero uncaught exceptions, homepage sections still render correctly (unrelated to this fix, but re-checked since `main.css` and `mega-menu.js` were both touched).
- Header and footer re-verified byte-identical across all 132 pages; `nav-responsive.js` and `mega-menu.js` re-verified present exactly once per page.
- All 26 JS files pass `node --check`; all 6 CSS files brace-balance clean.

## What wasn't touched

Tablet's tap-to-open behavior, the mobile hamburger drawer, and the accordion — all untouched, still governed entirely by `nav-responsive.js`, which this round didn't modify at all. Keyboard Tab/Shift+Tab order is native browser behavior and was never affected by the bug or this fix. The visual 14px gap itself is unchanged — the fix bridges it in time (the delay), not by shrinking or removing it, matching how Vercel/Stripe-style menus actually solve this (they keep visual breathing room between trigger and panel; the delay is what makes it forgiving).

## Files changed

**Modified:** `mega-menu.js` (the actual fix — hover-intent with delay, moved `trigger`/`triggerLink` computation earlier for reuse, updated the file's own architecture comment to describe the new behavior honestly), `main.css` (removed the dead duplicate CSS block and the residual tablet force-hide bug found inside it). **Unchanged:** `nav-responsive.js`, `nav-responsive.css`, `header-chrome.js`, and every build script — this was a two-file, surgical fix.

## Honest limitation

This environment can run the actual event-handling code and verify its logic against real inputs, which is what the tests above did — but it cannot render a real cursor moving across real pixels in a real browser. The timing (200ms), the gap-crossing math, and the state transitions are all verified against the genuine code; the *feel* of it — whether 200ms reads as instant or as a beat too slow on an actual trackpad — is worth a two-minute check once this is live.
