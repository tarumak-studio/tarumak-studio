/* analytics.js — Tarumak Studio unified GA4 event tracking
 *
 * WHY THIS FILE EXISTS: before this, only 14 _ga() calls existed across
 * the entire 70-tool site, with inconsistent ad-hoc names, and the one
 * that mattered most (tool_open) only fired inside the homepage's SPA
 * context (app.js) — never on the static tool pages that organic search
 * traffic actually lands on. That's a real, concrete reason GA4 could
 * show near-zero meaningful conversions despite real traffic and real
 * engagement.
 *
 * This file is loaded on EVERY page (homepage, all 70 tool pages, every
 * category page, every blog article) so the same event names and
 * parameters fire consistently no matter which template rendered the
 * page — one source of truth instead of per-page reimplementation.
 *
 * trackEvent(name, params) auto-attaches, when available:
 *   tool_name     — from <body data-tool-slug>
 *   tool_category — resolved from TOOLS[] (if loaded on this page)
 *   device        — mobile / tablet / desktop
 * Call sites only need to pass what's genuinely specific to that event
 * (file_type, processing_time, etc.) — never repeat the boilerplate.
 *
 * IMPORTANT — read before assuming this file "sets up conversions":
 * marking an event as a GA4 Key Event (what GA4 calls a conversion) is an
 * ADMIN CONSOLE action, not something any client-side script can do.
 * There is no gtag() call or JS flag for "this event is a conversion" —
 * it's a toggle in GA4 itself (Admin → Events → find the event → toggle
 * "Mark as key event"). This file makes sure the events exist and fire
 * correctly with the right names; someone with access to the GA4
 * property still has to flip that switch for tool_process_completed,
 * tool_download, and newsletter_signup. Exact steps in the delivery
 * notes, not repeated here to avoid this comment going stale.
 */
(function () {
  'use strict';
  if (window.trackEvent) return;

  function detectDevice() {
    var w = window.innerWidth || document.documentElement.clientWidth || 1024;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }
  var DEVICE = detectDevice();

  function currentTool() {
    var body = document.body;
    var slug = body && body.getAttribute('data-tool-slug');
    if (!slug) return null;
    var cat = null;
    try {
      if (typeof TOOLS !== 'undefined') {
        for (var i = 0; i < TOOLS.length; i++) { if (TOOLS[i][0] === slug) { cat = TOOLS[i][2]; break; } }
      }
    } catch (e) {}
    return { slug: slug, cat: cat };
  }

  function trackEvent(name, params) {
    var tool = currentTool();
    var p = {};
    for (var k in (params || {})) if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k];
    if (tool) {
      if (p.tool_name === undefined) p.tool_name = tool.slug;
      if (p.tool_category === undefined && tool.cat) p.tool_category = tool.cat;
    }
    if (p.device === undefined) p.device = DEVICE;
    if (window._ga) window._ga(name, p);
  }
  window.trackEvent = trackEvent;

  /* ── Delegated click tracking ─────────────────────────────────────
     Everything below fires on real, already-crawlable <a href> links —
     analytics is added on top of normal navigation, never a replacement
     for it (clicking still navigates instantly; the event fires via
     the click, not via intercepting/delaying navigation). One listener
     on document.body covers every page, present or future, without
     needing per-section wiring. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var cls = a.className || '';

    /* Related Tools / Suggested Workflow / Popular / People Also Use /
       Recently Added / footer recommendations — all share these classes
       (see build-tool-pages.js's relCard/chain/strip renderers). */
    if (/\btp-rel-card\b/.test(cls) || /\btp-chain-step\b/.test(cls) || /\btp-popular-chip\b/.test(cls)) {
      var name = a.querySelector('h3, span');
      trackEvent('related_tool_click', {
        target_tool: (a.getAttribute('href') || '').replace(/^\//, ''),
        link_text: name ? name.textContent.trim() : ''
      });
      return;
    }
    /* Sidebar mini-links (.tp-side-list a) use the same target concept */
    if (a.closest('.tp-side-list')) {
      trackEvent('related_tool_click', { target_tool: (a.getAttribute('href') || '').replace(/^\//, ''), link_text: a.textContent.trim(), source: 'sidebar' });
      return;
    }

    /* A tool page linking OUT to a blog article */
    if (/\btp-guide\b/.test(cls)) {
      trackEvent('tool_to_blog_click', { article_url: a.getAttribute('href') || '' });
      return;
    }
    /* A blog article linking back to a tool */
    if (/\btool-cta-link\b/.test(cls)) {
      trackEvent('blog_to_tool_click', { target_tool: (a.getAttribute('href') || '').replace(/^\//, '') });
      return;
    }

    /* Mega menu tool links (both the featured hero card and regular rows) */
    if (/\bmega-tool\b/.test(cls) || /\bmega-tool-hero\b/.test(cls) || /\bmega-highlight\b/.test(cls)) {
      trackEvent('mega_menu_tool_click', { target_tool: (a.getAttribute('href') || '').replace(/^\//, '') });
      return;
    }

    /* Primary CTAs — the "More Tools / Browse all tools" band present on
       every one of the 70 tool pages (build-tool-pages.js's .tp-cta-*).
       The homepage's own "Explore Tools" button currently shares a
       generic .btn.btn-primary class with dozens of unrelated buttons
       (including every tool's own Convert/Run button) — deliberately
       NOT included here, since delegating on that class would fire on
       everything, not just CTAs. Flagged as a gap rather than guessed. */
    if (/\btp-cta-primary\b/.test(cls) || /\btp-cta-ghost\b/.test(cls)) {
      trackEvent('cta_click', { link_text: a.textContent.trim(), href: a.getAttribute('href') || '' });
      return;
    }
  }, true);

  /* Category filter clicks — the tab row used on /tools and every
     category page (same .tab / data-cat pattern in features.js). */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.tab[data-cat]');
    if (!b) return;
    trackEvent('category_filter', { category: b.dataset.cat });
  }, true);
})();
