/* ai-search.js — Tarumak Studio AI search layer (client)
 *
 * Load AFTER app.js and features.js:
 *   <script src="/ai-search.js" defer></script>
 *
 * SAFE-BY-DEFAULT: with AI_ENDPOINT empty, this file is completely inert —
 * zero listeners, zero DOM changes, zero network calls. The site behaves
 * exactly as it does today. Set AI_ENDPOINT to the deployed Worker URL to
 * switch the feature on. This means the file can ship to production BEFORE
 * the Worker exists, de-risking the rollout.
 *
 * DESIGN CONTRACT (mirrors the Worker):
 *   AI never fires per-keystroke. It offers itself only when
 *   (a) the query looks like intent, not a lookup, AND
 *   (b) the user explicitly presses Enter or clicks the AI row.
 *   Cost scales with confusion, not traffic. Local search stays the
 *   instant, free, offline default for every keystroke.
 */
(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────────── */
  var AI_ENDPOINT = '';   // e.g. 'https://tarumak-ai-search.<acct>.workers.dev'
  var MIN_WORDS_FOR_AI = 3;      // "compress pdf" → local handles it; 3+ words → intent
  var REQUEST_TIMEOUT_MS = 12000;

  if (!AI_ENDPOINT) return;                       // feature off — file is inert
  if (typeof matchTools !== 'function' || typeof bySlug !== 'function') return;

  /* Session-scoped state */
  var quotaExhausted = false;
  var inFlight = null;

  /* ── Intent heuristic ────────────────────────────────────────────
     Decides when the AI row is OFFERED (not fired). Two signals:
     1. Local search found nothing — the exact moment AI adds value.
     2. The query reads like a task description: 3+ words, or contains
        a connective that implies multiple steps or a goal. */
  var CONNECTIVES = /\b(and|then|also|after|into|to a|make it|without)\b/i;
  function looksLikeIntent(term, localResults) {
    if (!term || term.length < 8) return false;
    if (localResults.length === 0) return true;
    var words = term.trim().split(/\s+/).length;
    return words >= MIN_WORDS_FOR_AI || CONNECTIVES.test(term);
  }

  /* ── AI call ─────────────────────────────────────────────────── */
  function askAI(term) {
    if (inFlight && inFlight.abort) inFlight.abort();
    var controller = new AbortController();
    inFlight = controller;
    var timer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);

    return fetch(AI_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: term })
    }).then(function (r) {
      clearTimeout(timer);
      if (r.status === 429) { quotaExhausted = true; throw new Error('quota'); }
      if (!r.ok) throw new Error('upstream');
      return r.json();
    }).then(function (data) {
      /* Client-side validation — never trust even our own Worker blindly.
         bySlug throws on unknown slugs, which is exactly the guarantee
         we want: hallucinated tools are structurally unrenderable. */
      var tools = [];
      (data.tools || []).forEach(function (t) {
        try { bySlug(t.slug); tools.push(t); } catch (e) { /* drop invalid */ }
      });
      return { tools: tools, sequence: !!data.sequence, fallback: data.fallback || null };
    });
  }

  /* ── Rendering ───────────────────────────────────────────────── */
  var ICONS = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  function aiOfferRowHTML(term) {
    return '<div class="ai-offer" data-ai-offer="1" role="option" tabindex="0" style="display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;border-top:1px solid var(--border);color:var(--p1);font-size:13px;font-weight:600">' +
      ICONS.spark +
      '<span>Ask AI: &ldquo;' + escapeHtml(term) + '&rdquo;</span>' +
      '<span style="margin-left:auto;font-size:11px;color:var(--text-faint);font-weight:500">Enter &crarr;</span>' +
    '</div>';
  }

  function aiLoadingHTML() {
    return '<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid var(--border);color:var(--text-dim);font-size:13px">' +
      '<span class="ai-pulse" style="width:8px;height:8px;border-radius:50%;background:var(--p1);animation:aiPulse 1s ease-in-out infinite"></span>' +
      'Understanding your request&hellip;' +
    '</div>';
  }

  function aiResultsHTML(result) {
    var head = '<div style="padding:9px 14px 4px;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-faint);border-top:1px solid var(--border)">' +
      (result.sequence ? 'AI suggested workflow' : 'AI suggestion') + '</div>';

    var rows = result.tools.map(function (t, i) {
      var tool = bySlug(t.slug);
      var step = result.sequence
        ? '<span style="width:18px;height:18px;border-radius:50%;background:rgba(34,211,238,.15);color:var(--p1);font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' + (i + 1) + '</span>'
        : '';
      return '<div class="ai-tool-row" data-ai-slug="' + t.slug + '" role="option" tabindex="0" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer">' +
        step +
        '<span style="font-size:13.5px;font-weight:600;color:var(--text)">' + escapeHtml(tool[1]) + '</span>' +
        '<span style="font-size:12px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(t.reason || '') + '</span>' +
      '</div>';
    }).join(result.sequence
      ? '<div style="padding:0 14px 0 21px;color:var(--text-faint);line-height:0">' + ICONS.arrow + '</div>'
      : '');

    var foot = '';
    if (!result.tools.length) {
      var catNames = { image: 'Image Tools', pdf: 'PDF Tools', converter: 'Converter Tools', marketing: 'Marketing Tools', developer: 'Developer Tools' };
      foot = result.fallback
        ? '<div class="ai-tool-row" data-ai-cat="' + result.fallback + '" role="option" tabindex="0" style="padding:10px 14px;cursor:pointer;font-size:13px;color:var(--text-dim)">No exact tool &mdash; browse closest category: <strong style="color:var(--p1)">' + (catNames[result.fallback] || result.fallback) + '</strong></div>'
        : '<div style="padding:10px 14px;font-size:13px;color:var(--text-dim)">No matching tool for that yet.</div>';
    }

    var privacy = '<div style="padding:6px 14px 9px;font-size:10.5px;color:var(--text-faint)">Query text only &mdash; your files are never involved.</div>';
    return head + rows + foot + privacy;
  }

  function quotaRowHTML() {
    return '<div style="padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--text-faint)">Daily AI searches used up &mdash; regular search still works, and everything resets tomorrow.</div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* One-time keyframes for the pulse dot */
  var style = document.createElement('style');
  style.textContent = '@keyframes aiPulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}' +
    '.ai-tool-row:hover,.ai-offer:hover,.ai-tool-row:focus-visible,.ai-offer:focus-visible{background:rgba(34,211,238,.08);outline:none}' +
    '@media (prefers-reduced-motion: reduce){.ai-pulse{animation:none !important}}';
  document.head.appendChild(style);

  /* ── Attachment: one function, both search surfaces ──────────── */
  function attach(inputSel, resultsSel) {
    var input = document.querySelector(inputSel);
    var results = document.querySelector(resultsSel);
    if (!input || !results) return;

    var aiZone = document.createElement('div');
    aiZone.setAttribute('data-ai-zone', '1');
    var lastOfferedTerm = '';

    /* Observe the existing dropdown so the AI zone rides along with the
       results the site already renders — the site's own render code is
       never modified, we only append after it. */
    var mo = new MutationObserver(function () {
      if (aiZone.parentNode !== results && results.style.display !== 'none') {
        results.appendChild(aiZone);
      }
      maybeOffer();
    });
    mo.observe(results, { childList: true, subtree: false });

    function maybeOffer() {
      if (quotaExhausted) { aiZone.innerHTML = ''; return; }
      var term = input.value.trim();
      if (!term) { aiZone.innerHTML = ''; return; }
      var local = matchTools(term, 8);
      if (looksLikeIntent(term, local)) {
        if (term !== lastOfferedTerm) {
          aiZone.innerHTML = aiOfferRowHTML(term);
          lastOfferedTerm = term;
        }
      } else {
        aiZone.innerHTML = ''; lastOfferedTerm = '';
      }
    }

    function fire(term) {
      aiZone.innerHTML = aiLoadingHTML();
      askAI(term).then(function (result) {
        aiZone.innerHTML = aiResultsHTML(result);
        wireResultClicks();
      }).catch(function (e) {
        aiZone.innerHTML = (e && e.message === 'quota')
          ? quotaRowHTML()
          : '';   /* silent on failure — local results remain, AI never blocks */
      });
    }

    function wireResultClicks() {
      aiZone.querySelectorAll('[data-ai-slug]').forEach(function (row) {
        row.addEventListener('click', function () { go('t/' + row.getAttribute('data-ai-slug')); });
        row.addEventListener('keydown', function (e) { if (e.key === 'Enter') go('t/' + row.getAttribute('data-ai-slug')); });
      });
      aiZone.querySelectorAll('[data-ai-cat]').forEach(function (row) {
        row.addEventListener('click', function () { go(row.getAttribute('data-ai-cat')); });
      });
    }

    /* Offer row click / Enter-to-fire */
    aiZone.addEventListener('click', function (e) {
      var offer = e.target.closest && e.target.closest('[data-ai-offer]');
      if (offer) fire(input.value.trim());
    });
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      /* Only intercept Enter when the AI offer is showing AND the user
         hasn't arrow-keyed onto one of the site's own result rows —
         the site's existing keyboard nav keeps priority. */
      var offerShowing = aiZone.querySelector('[data-ai-offer]');
      var siteHasActive = results.querySelector('.active, [aria-selected="true"]');
      if (offerShowing && !siteHasActive) {
        e.preventDefault();
        fire(input.value.trim());
      }
    });
  }

  function init() {
    attach('#heroSearch', '#heroSearchResults');
    attach('#navSearch', '#navPop');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
