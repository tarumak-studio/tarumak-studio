/* mega-menu.js — interaction layer for the Tools mega menu.
 *
 * The OPEN/CLOSE of the menu itself is pure CSS (:hover / :focus-within
 * on .nav-tools-drop, already in main.css) — this file only handles
 * what CSS can't: swapping the right-hand preview panel's content when
 * a different category (or the AI-Powered tab) is hovered or focused,
 * and a few keyboard conveniences. If this file fails to load for any
 * reason, the menu still opens and still shows a complete, fully-linked
 * default preview (Image Tools) — baked into the page at build time by
 * header-chrome.js. This is enhancement, never a hard dependency.
 */
(function () {
  'use strict';

  var panel = document.getElementById('navToolsPanel');
  var preview = document.getElementById('megaPreview');
  var dataEl = document.getElementById('megaMenuData');
  if (!panel || !preview || !dataEl) return; // not a mega-menu page (shouldn't happen, but never throw on the header)

  var DATA;
  try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var cats = Array.prototype.slice.call(panel.querySelectorAll('.mega-cat'));
  var tabs = Array.prototype.slice.call(panel.querySelectorAll('.mega-tab'));
  var lastCatKey = 'image';
  var activeKey = 'image';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function iconSvg(key) { return DATA[key] ? DATA[key].icon : ''; }

  function render(key) {
    if (key === activeKey) return; // nothing to do — avoid needless reflow/flash
    var m = DATA[key];
    if (!m) return;
    activeKey = key;

    var toolsHtml = m.tools.map(function (t) {
      return '<a class="mega-tool' + (t.starred ? ' starred' : '') + '" href="/' + t.slug + '">'
        + (t.starred ? '<span class="mega-star" aria-hidden="true">\u2605</span>' : '')
        + t.name + '</a>';
    }).join('');
    var exploreHref = key === '__ai__' ? '/tools' : '/' + key + '-tools';
    var exploreLabel = key === '__ai__' ? 'Explore all tools' : 'Explore ' + m.name;

    preview.innerHTML =
      '<div class="mega-preview-head" style="--accent:' + m.accent + '"><span class="mega-preview-ico">' + m.icon + '</span>'
      + '<div><h3>' + m.name + '</h3><p>' + m.desc + '</p></div></div>'
      + '<div class="mega-preview-list">' + toolsHtml + '</div>'
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
  var trigger = panel.closest('.nav-tools-drop');
  var triggerLink = trigger ? trigger.querySelector('a[data-nav]') : null;

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
