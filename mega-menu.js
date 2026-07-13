/* mega-menu.js — interaction layer for the Tools mega menu.
 *
 * OPEN/CLOSE is now JS-managed on desktop (a .js-open class, added to
 * .nav-tools-drop), not pure CSS :hover — a real hover gap between the
 * "Tools" trigger and the panel (position:absolute; top: calc(100% +
 * 14px)) meant the cursor spent a moment outside BOTH the trigger's and
 * the panel's rendered box while crossing that gap, and plain :hover
 * has no memory: the instant the cursor left the trigger, the panel
 * started closing before the cursor could reach it. Below, entering
 * either the trigger OR the panel opens immediately and cancels any
 * pending close; leaving either starts a ~200ms close timer, so a
 * normal diagonal mouse movement across the gap always lands inside
 * the panel well before that timer fires.
 *
 * :hover and :focus-within remain in main.css as-is, for two reasons:
 * keyboard users get instant, gap-free open/close via :focus-within
 * (focus doesn't travel through physical space, so it never had this
 * bug), and if this script fails to load for any reason, the menu
 * still opens via plain :hover and still shows a complete, fully-
 * linked default preview (Image Tools) baked into the page at build
 * time by header-chrome.js. This file's new behavior only adds time,
 * it never removes it — .js-open being absent never closes a panel
 * that :hover or :focus-within is independently keeping open.
 *
 * Also still handles what CSS can't regardless of open/close:
 * swapping the right-hand preview panel's content when a different
 * category (or the AI-Powered tab) is hovered or focused, and a few
 * keyboard conveniences.
 *
 * Gated to desktop width (>1024px) throughout — tablet's tap-to-open
 * (nav-responsive.js, <=1024px) owns this exact same .js-open class
 * below that width; the two never run at the same time because each
 * checks the current width before doing anything, not just at setup.
 */
(function () {
  'use strict';

  var panel = document.getElementById('navToolsPanel');
  var preview = document.getElementById('megaPreview');
  var dataEl = document.getElementById('megaMenuData');
  if (!panel || !preview || !dataEl) return; // not a mega-menu page (shouldn't happen, but never throw on the header)

  var DATA;
  try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var trigger = panel.closest('.nav-tools-drop');
  var triggerLink = trigger ? trigger.querySelector('a[data-nav]') : null;

  var cats = Array.prototype.slice.call(panel.querySelectorAll('.mega-cat'));
  var tabs = Array.prototype.slice.call(panel.querySelectorAll('.mega-tab'));
  var lastCatKey = 'image';
  var activeKey = 'image';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Desktop hover-intent: single combined region (trigger + panel),
     JS-managed, with a close delay that bridges the gap. ── */
  (function hoverIntent() {
    if (!trigger) return;
    function isDesktopWidth() { return window.innerWidth > 1024; }

    var closeTimer = null;
    var CLOSE_DELAY = 200; // ms — within the requested 150-250ms range

    function open() {
      if (!isDesktopWidth()) return;
      if (closeTimer !== null) { clearTimeout(closeTimer); closeTimer = null; }
      trigger.classList.add('js-open');
      if (triggerLink) triggerLink.setAttribute('aria-expanded', 'true');
    }
    function scheduleClose() {
      if (!isDesktopWidth()) return;
      if (closeTimer !== null) clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        trigger.classList.remove('js-open');
        if (triggerLink) triggerLink.setAttribute('aria-expanded', 'false');
        closeTimer = null;
      }, CLOSE_DELAY);
    }
    function closeNow() {
      if (closeTimer !== null) { clearTimeout(closeTimer); closeTimer = null; }
      trigger.classList.remove('js-open');
      if (triggerLink) triggerLink.setAttribute('aria-expanded', 'false');
    }

    /* Trigger and panel are treated as one region: entering either
       cancels any pending close, leaving either schedules one. A
       normal diagonal move from the trigger into the panel enters the
       panel well inside the 200ms window, canceling the close that
       leaving the trigger just scheduled — the panel never flickers
       shut in between. */
    trigger.addEventListener('mouseenter', open);
    trigger.addEventListener('mouseleave', scheduleClose);
    panel.addEventListener('mouseenter', open);
    panel.addEventListener('mouseleave', scheduleClose);

    /* Resizing across the breakpoint (e.g. a laptop window narrowed
       into tablet range) shouldn't leave a hover-opened panel stuck
       open once tablet's own tap-mode takes over. */
    window.addEventListener('resize', function () {
      if (!isDesktopWidth()) closeNow();
    });

    /* Escape closes however it was opened — .js-open (mouse) or
       :focus-within (keyboard) — and returns focus to the trigger. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!trigger.classList.contains('js-open') && document.activeElement && !trigger.contains(document.activeElement)) return;
      closeNow();
      if (triggerLink) triggerLink.focus();
    });
  })();

  function iconSvg(key) { return DATA[key] ? DATA[key].icon : ''; }

  function render(key) {
    if (key === activeKey) return; // nothing to do — avoid needless reflow/flash
    var m = DATA[key];
    if (!m) return;
    activeKey = key;

    var toolsHtml = m.tools.map(function (t) {
      return '<a class="mega-tool' + (t.starred ? ' starred' : '') + '" href="/' + t.slug + '">'
        + '<span class="mega-tool-mark">' + (t.starred ? '\u2605' : '\u2713') + '</span>'
        + '<span class="mega-tool-txt"><span class="mega-tool-name">' + t.name + '</span>'
        + (t.blurb ? '<span class="mega-tool-blurb">' + t.blurb + '</span>' : '') + '</span>'
        + '</a>';
    }).join('');
    var exploreHref = key === '__ai__' ? '/tools' : '/' + key + '-tools';
    var exploreLabel = key === '__ai__' ? 'Explore all tools' : 'Explore ' + m.name;
    var highlightHtml = m.highlight
      ? '<a class="mega-highlight" href="/' + m.highlight.slug + '">'
        + '<span class="mega-hl-badge">' + (m.highlight.type === 'new' ? '\u2728' : '\u2b50') + ' ' + m.highlight.label + '</span>'
        + '<span class="mega-hl-name">' + m.highlight.name + '</span>'
      + '</a>'
      : '';

    preview.innerHTML =
      '<div class="mega-preview-head" style="--accent:' + m.accent + '"><span class="mega-preview-ico">' + m.icon + '</span>'
      + '<div><h3>' + m.name + '</h3><p>' + m.count + ' free browser-based tools. ' + m.desc + '</p></div>'
      + (m.illustration ? '<div class="mega-illo-wrap" style="color:' + m.accent + '">' + m.illustration + '</div>' : '')
      + '</div>'
      + '<div class="mega-preview-list">' + toolsHtml + '</div>'
      + highlightHtml
      + '<a class="mega-explore" href="' + exploreHref + '">' + exploreLabel
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a>';

    if (!prefersReducedMotion) {
      preview.classList.remove('swapping');
      void preview.offsetWidth; /* restart the animation on repeat triggers */
      preview.classList.add('swapping');
    }

    cats.forEach(function (a) { a.classList.toggle('active', a.dataset.cat === key); });
    tabs.forEach(function (b) {
      var on = (b.dataset.tab === 'popular' && key !== '__ai__') || (b.dataset.tab === '__ai__' && key === '__ai__');
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  cats.forEach(function (a) {
    var key = a.dataset.cat;
    a.addEventListener('mouseenter', function () { lastCatKey = key; render(key); });
    a.addEventListener('focus', function () { lastCatKey = key; render(key); });
  });

  tabs.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      render(b.dataset.tab === '__ai__' ? '__ai__' : lastCatKey);
    });
  });

  /* ── Keyboard: Up/Down moves through the category rail; Escape closes
     the menu and returns focus to the "Tools" trigger, since native
     :focus-within can open the panel but has no notion of dismissing it
     on its own. ── */
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (triggerLink) triggerLink.blur();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var focusables = cats;
    var i = focusables.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    var next = e.key === 'ArrowDown' ? Math.min(i + 1, focusables.length - 1) : Math.max(i - 1, 0);
    focusables[next].focus();
  });

  /* ── AI prompt bar: submits to the site's real search (the existing
     /?q= handler on the homepage) — a natural-language-friendly entry
     point into genuine search results, not a simulated chat response. ── */
  var form = panel.querySelector('.mega-ai-prompt');
  if (form) {
    form.addEventListener('submit', function (e) {
      var input = form.querySelector('.mega-ai-input');
      if (!input || !input.value.trim()) { e.preventDefault(); }
      /* else: let the native GET submit proceed to /?q=... */
    });
  }
})();
