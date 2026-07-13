/* nav-responsive.js — Tarumak Studio tablet + mobile navigation
 *
 * Three independent concerns, one file because they share the same
 * header markup and the same megaMenuData source:
 *   1. Mobile drawer (hamburger -> full drawer with backdrop, focus
 *      trap, Escape, scroll lock, Tools accordion, search).
 *   2. Tablet tap-mode for the EXISTING desktop Tools dropdown — the
 *      dropdown itself (markup, CSS, mega-menu.js's preview-swap
 *      logic) is completely reused, unchanged. This only changes
 *      how it opens on a touch-width viewport: a tap toggles a
 *      .js-open class (see main.css/mega-menu.css) instead of
 *      relying on :hover, which touch devices don't reliably fire.
 *   3. Theme-toggle sync between the header's button and the
 *      drawer's own copy of it.
 *
 * If any expected element is missing, each section returns early —
 * this is enhancement layered on markup that already works without
 * it (same contract mega-menu.js documents for itself).
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════════════════════════════════════════════════
     1. MOBILE DRAWER
     ═══════════════════════════════════════════════════════════ */
  (function () {
    var burger = document.getElementById('burger');
    var closeBtn = document.getElementById('closeMenu');
    var drawer = document.getElementById('mobileMenu');
    var backdrop = document.getElementById('mmBackdrop');
    if (!burger || !drawer) return;

    var lastFocused = null;
    var savedScrollY = 0;

    function focusablesIn(container) {
      return Array.prototype.slice.call(
        container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')
      ).filter(function (el) { return el.offsetParent !== null; }); // skip anything hidden (e.g. a collapsed accordion panel)
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      var focusables = focusablesIn(drawer);
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function openDrawer() {
      lastFocused = document.activeElement;
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      /* Scroll lock via position:fixed on body (not overflow:hidden
         alone) — iOS Safari famously ignores overflow:hidden on body
         while still allowing background scroll/rubber-banding. */
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + savedScrollY + 'px';
      document.body.style.width = '100%';
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('show');
      burger.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKeydown);
      var delay = prefersReducedMotion ? 0 : 340;
      setTimeout(function () {
        var f = focusablesIn(drawer)[0];
        if (f) f.focus();
      }, delay);
      /* Sync the drawer's own theme icon in case theme changed via
         the header button since the drawer was last opened. */
      syncMmTheme();
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('show');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollY);
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    burger.addEventListener('click', function () {
      if (drawer.classList.contains('open')) closeDrawer(); else openDrawer();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    /* Tap outside (the backdrop) closes — a real click event, which
       naturally doesn't fire during a scroll/swipe gesture, so this
       can't misfire as an "accidental close while scrolling". */
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    /* ── Theme toggle (drawer's own button, synced with the header's) ── */
    var mmTheme = document.getElementById('mmTheme');
    var mmThemeIcon = document.getElementById('mmThemeIcon');
    var root = document.documentElement;
    function syncMmTheme() {
      if (!mmTheme || !mmThemeIcon || typeof moon === 'undefined' || typeof sun === 'undefined') return;
      var isLight = root.getAttribute('data-theme') === 'light';
      mmThemeIcon.innerHTML = isLight ? sun : moon;
      mmTheme.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      mmTheme.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    }
    if (mmTheme) {
      mmTheme.addEventListener('click', function () {
        var isLight = root.getAttribute('data-theme') === 'light';
        root.setAttribute('data-theme', isLight ? 'dark' : 'light');
        /* Keep the header's own icon (#themeIcon) in sync too. */
        var headerIcon = document.getElementById('themeIcon');
        var headerBtn = document.getElementById('theme');
        if (headerIcon && typeof moon !== 'undefined' && typeof sun !== 'undefined') {
          headerIcon.innerHTML = isLight ? moon : sun;
        }
        if (headerBtn) {
          headerBtn.setAttribute('aria-label', isLight ? 'Switch to light theme' : 'Switch to dark theme');
          headerBtn.setAttribute('aria-pressed', isLight ? 'false' : 'true');
        }
        syncMmTheme();
      });
      syncMmTheme();
    }

    /* ── Tools accordion — built from the same #megaMenuData JSON
       the desktop mega menu already uses, so the tool lists never
       need to be authored twice. Only one category open at a time. ── */
    (function buildAccordion() {
      var container = document.getElementById('mmAccordion');
      var dataEl = document.getElementById('megaMenuData');
      if (!container || !dataEl) return;
      var DATA;
      try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }

      var order = ['image', 'pdf', 'developer', 'marketing', 'converter'];
      var html = order.map(function (key) {
        var m = DATA[key];
        if (!m) return '';
        var toolsHtml = m.tools.map(function (t) {
          return '<a class="mm-acc-tool' + (t.starred ? ' starred' : '') + '" href="/' + t.slug + '">'
            + '<span class="mm-acc-tool-mark">' + (t.starred ? '\u2605' : '\u2713') + '</span>'
            + '<span class="mm-acc-tool-txt"><span class="mm-acc-tool-name">' + t.name + '</span>'
            + (t.blurb ? '<span class="mm-acc-tool-blurb">' + t.blurb + '</span>' : '') + '</span>'
            + '</a>';
        }).join('');
        return '' +
          '<div class="mm-acc-item">' +
            '<button class="mm-acc-trigger" type="button" aria-expanded="false" data-cat="' + key + '">' +
              '<span class="mm-acc-ico" style="--acc-color:' + m.accent + '">' + m.icon + '</span>' +
              '<span class="mm-acc-name">' + m.name + '</span>' +
              '<span class="mm-acc-count">' + m.count + '</span>' +
              '<svg class="mm-acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="mm-acc-panel"><div class="mm-acc-panel-inner">' +
              '<p class="mm-acc-desc">' + m.desc + '</p>' +
              toolsHtml +
              '<a class="mm-acc-viewall" href="/' + key + '-tools">View All ' + m.name + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a>' +
            '</div></div>' +
          '</div>';
      }).join('');
      container.innerHTML = html;

      var triggers = Array.prototype.slice.call(container.querySelectorAll('.mm-acc-trigger'));
      triggers.forEach(function (btn) {
        var panel = btn.nextElementSibling;
        btn.addEventListener('click', function () {
          var isOpen = btn.getAttribute('aria-expanded') === 'true';
          /* Single-open accordion: collapse any other open section
             first (spec: "only one dropdown may be open at a time"
             — applied here to the accordion, the concrete instance
             of that requirement in the drawer's own UI). */
          triggers.forEach(function (other) {
            if (other === btn) return;
            other.setAttribute('aria-expanded', 'false');
            other.nextElementSibling.classList.remove('open');
          });
          btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
          panel.classList.toggle('open', !isOpen);
        });
      });
    })();

    /* ── Drawer search — reuses matchTools() from data.js verbatim,
       the exact same matching (name/slug/description/category +
       synonyms) the header search and homepage hero search already
       use, so results are identical everywhere on the site. ── */
    (function wireDrawerSearch() {
      var input = document.getElementById('mmSearch');
      var results = document.getElementById('mmPop');
      if (!input || !results || typeof matchTools !== 'function') return;

      function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      function highlight(text, term) {
        var i = text.toLowerCase().indexOf(term.toLowerCase());
        if (i === -1) return escapeHtml(text);
        return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + term.length)) + '</mark>' + escapeHtml(text.slice(i + term.length));
      }

      var activeIndex = -1;
      function render(term) {
        if (!term) { results.innerHTML = ''; activeIndex = -1; return; }
        var matches = matchTools(term, 6);
        if (!matches.length) {
          results.innerHTML = '<div class="mm-search-empty">No tools match &ldquo;' + escapeHtml(term) + '&rdquo;.</div>';
          activeIndex = -1;
          return;
        }
        results.innerHTML = matches.map(function (t, i) {
          return '<a href="/' + t[0] + '" data-i="' + i + '">' + highlight(t[1], term) + '<span class="mm-search-chip">' + escapeHtml((t[4] && t[4][0]) || '') + '</span></a>';
        }).join('');
        activeIndex = -1;
      }

      input.addEventListener('input', function () { render(input.value.trim()); });

      input.addEventListener('keydown', function (e) {
        var links = Array.prototype.slice.call(results.querySelectorAll('a'));
        if (!links.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeIndex = Math.min(activeIndex + 1, links.length - 1);
          links.forEach(function (a, i) { a.classList.toggle('active', i === activeIndex); });
          links[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeIndex = Math.max(activeIndex - 1, 0);
          links.forEach(function (a, i) { a.classList.toggle('active', i === activeIndex); });
          links[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && activeIndex > -1) {
          e.preventDefault();
          window.location.href = links[activeIndex].getAttribute('href');
        }
      });
    })();
  })();

  /* ═══════════════════════════════════════════════════════════
     2. TABLET TAP-MODE for the existing desktop Tools dropdown.
     Gated to <=1024px so nothing here ever runs on desktop — above
     that width the dropdown keeps working exactly as it always has
     (pure CSS :hover/:focus-within, zero JS involvement).
     ═══════════════════════════════════════════════════════════ */
  (function () {
    var drop = document.querySelector('.nav-tools-drop');
    if (!drop) return;
    var trigger = drop.querySelector('a[data-nav]');
    if (!trigger) return;

    function isTabletWidth() { return window.innerWidth <= 1024; }

    function closeDropdown() {
      drop.classList.remove('js-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggleDropdown(e) {
      if (!isTabletWidth()) return; /* let the click through — desktop navigates normally */
      e.preventDefault();
      var willOpen = !drop.classList.contains('js-open');
      drop.classList.toggle('js-open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', toggleDropdown);
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') toggleDropdown(e);
    });

    /* Tap outside closes. A plain click listener — doesn't fire
       during a scroll/swipe, so scrolling the page never closes an
       open tablet dropdown by accident. */
    document.addEventListener('click', function (e) {
      if (!drop.classList.contains('js-open')) return;
      if (!drop.contains(e.target)) closeDropdown();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drop.classList.contains('js-open')) {
        closeDropdown();
        trigger.focus();
      }
    });
    /* Resizing across the breakpoint (e.g. tablet rotation) shouldn't
       leave a tap-opened panel stuck open once back in hover territory. */
    window.addEventListener('resize', function () {
      if (!isTabletWidth()) closeDropdown();
    });
  })();
})();
