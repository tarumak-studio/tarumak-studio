/* header-chrome.js — THE single shared source for Tarumak Studio's global
 * header, mobile menu, footer, and required <head> links.
 *
 * This is the "shared Header component" for a static-HTML site with no
 * live templating engine: instead of a runtime component, there is
 * exactly one place this markup is authored (index.html's own header),
 * and every build script that stamps pages gets it from HERE — never by
 * re-reading index.html itself or re-implementing the dropdown bake.
 *
 * Used by:
 *   - build-tool-pages.js       (66 tool pages)
 *   - build-static-pages.js     (63 other pages: category, blog, articles,
 *                                 about/contact/french-academy/etc.)
 *
 * To change the header for the ENTIRE site: edit index.html's header once,
 * re-run whichever build script(s) touch pages that need it. Nothing else
 * to update — this module always re-derives from index.html at build time,
 * it holds no copy of its own.
 *
 * Usage:
 *   const { getChrome } = require('./header-chrome.js');
 *   const { CHROME_TOP, FOOTER, HEAD_LINKS, CDN_TAGS, TOOLS, CAT, CAT_META, ICON } = getChrome();
 */
'use strict';
const fs = require('fs');
const vm = require('vm');

let _cache = null;

function getChrome() {
  if (_cache) return _cache; // one harvest per build run, not per page

  const indexSrc = fs.readFileSync('index.html', 'utf8');

  /* ── Data needed to bake the Tools dropdown (mirrors app.js's
     buildNavToolsDropdown, statically, so no app.js is required on
     pages that use this chrome) — extracted via the same vm-absorber
     technique build-tool-pages.js already used, so this module has no
     second implementation of "how do we read data.js". */
  function makeAbsorber() {
    const fn = function () { return absorber; };
    const absorber = new Proxy(fn, {
      get: (t, p) => (p === Symbol.toPrimitive ? () => '' : absorber),
      set: () => true,
      apply: () => absorber
    });
    return absorber;
  }
  const stub = makeAbsorber();
  const sandbox = { window: stub, document: stub, localStorage: stub, navigator: stub, matchMedia: stub, $: stub, console };
  sandbox.globalThis = sandbox;
  let captured = null;
  sandbox.__CAP__ = x => { captured = x; };
  vm.createContext(sandbox);
  const src = fs.readFileSync('data.js', 'utf8');
  const names = ['TOOLS', 'CAT', 'CAT_META', 'ICON'];
  const cap = `\n;__CAP__({${names.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : null`).join(',')}});`;
  vm.runInContext(src + cap, sandbox);
  if (!captured || !captured.TOOLS) throw new Error('header-chrome: TOOLS capture from data.js failed');
  const { TOOLS, CAT, CAT_META, ICON } = captured;

  /* ── CDN libraries, in the SPA's exact order — every page that mounts
     a real tool (currently just tool pages) needs these; pages that
     only need the header/search/theme do not load them at all, that
     decision is the CALLER's, this module just makes them available. */
  const CDN_TAGS = [...indexSrc.matchAll(/<script src="https:\/\/cdnjs\.cloudflare\.com[^>]*><\/script>/g)]
    .map(m => m[0].includes(' defer') ? m[0] : m[0].replace('></script>', ' defer></script>'))
    .join('\n');
  if (!CDN_TAGS) throw new Error('header-chrome: CDN tags not found in index.html');

  /* ── Header + mobile menu, harvested verbatim ── */
  function mustIdx(re, label) {
    const m = indexSrc.match(re);
    if (!m) throw new Error('header-chrome: harvest failed: ' + label);
    return m[0];
  }
  let CHROME_TOP = indexSrc.slice(indexSrc.indexOf('<header id="header">'), indexSrc.indexOf('<main'));
  if (!CHROME_TOP.includes('mobileMenu') || !CHROME_TOP.includes('navToolsPanel')) {
    throw new Error('header-chrome: index header harvest incomplete');
  }
  const FOOTER = mustIdx(/<footer[\s\S]*?<\/footer>/, 'footer');

  /* ── Mega menu: category rail (left) + dynamic preview (right) ──
     Replaces the old 5-plain-text-column dropdown. Everything is baked
     at build time — no client fetch, no flash of empty content — and
     ALL FIVE categories' preview data ships as one small embedded JSON
     block that mega-menu.js reads to swap the right panel on hover/
     focus/click. Without JS, the page still shows a complete, correct,
     fully-linked default preview (Image Tools) — this is enhancement,
     not a hard dependency.
     Every popular[] slug is verified against the real TOOLS array here
     — throws loudly on a stale slug instead of silently dropping it
     (exactly how 5 stale slugs went unnoticed in the old bake: it just
     skipped anything TOOLS.find() couldn't resolve). */
  const NAV_ORDER = ['image', 'pdf', 'developer', 'marketing', 'converter'];
  const ACCENT = { image: '#22d3ee', pdf: '#a78bfa', developer: '#34d399', marketing: '#fb923c', converter: '#a3e635' };
  const COUNT = {};
  NAV_ORDER.forEach(c => { COUNT[c] = TOOLS.filter(t => t[2] === c).length; });

  function resolveTool(slug, cat) {
    const t = TOOLS.find(x => x[0] === slug);
    if (!t) throw new Error('header-chrome: CAT_META.' + cat + '.popular references unknown slug "' + slug + '"');
    return t;
  }

  /* AI-Powered tab: an honest, small, code-verified list — not a
     marketing-invented one. Only tools that actually call a real
     model at runtime (checked directly in image-tools.js: @imgly/
     background-removal for background-remover, Tesseract.js for OCR)
     qualify. "New" / "Trending" / "Most Used" tabs are deliberately
     NOT implemented: the site's analytics tag is still a placeholder
     (see the SEO audit), so there is no real data to back those claims
     yet, and fabricating activity numbers would be exactly the kind of
     thing the trust-copy work elsewhere in this project has been
     fixing, not adding. */
  const AI_POWERED = ['background-remover', 'ai-image-upscaler', 'ocr-image-to-text'].map(sl => TOOLS.find(t => t[0] === sl)).filter(Boolean);

  const previewData = {};
  NAV_ORDER.forEach(c => {
    const meta = CAT_META[c];
    const popular = meta.popular.map(sl => resolveTool(sl, c));
    const hl = meta.highlight;
    const hlTool = hl ? resolveTool(hl.slug, c) : null;
    previewData[c] = {
      name: CAT[c], desc: meta.desc || meta.tagline, accent: ACCENT[c], icon: ICON[c],
      count: COUNT[c], illustration: meta.illustration || '',
      tools: popular.map((t, i) => ({ slug: t[0], name: t[1], starred: i < 2, blurb: (meta.blurbs && meta.blurbs[t[0]]) || '' })),
      highlight: hlTool ? { type: hl.type, label: hl.label, slug: hlTool[0], name: hlTool[1] } : null
    };
  });
  previewData.__ai__ = {
    name: 'AI-Powered Tools', desc: 'Tools that run a real model in your browser \u2014 not just an algorithm.', accent: '#f472b6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    count: AI_POWERED.length,
    illustration: '<svg class="mega-illo" viewBox="0 0 160 100" fill="none" aria-hidden="true">'
      + '<circle class="illo-float illo-d1" cx="56" cy="50" r="26" stroke="currentColor" stroke-width="2" opacity=".4"/>'
      + '<circle class="illo-float illo-d2" cx="100" cy="50" r="18" stroke="currentColor" stroke-width="2" opacity=".55"/>'
      + '<path class="illo-sparkle" d="M120 24l3.2 8.8L132 36l-8.8 3.2L120 48l-3.2-8.8L108 36l8.8-3.2z" fill="currentColor"/>'
      + '<path class="illo-sparkle illo-sp2" d="M40 68l2.2 6L48 76l-5.8 2-2.2 6-2.2-6L32 76l5.8-2z" fill="currentColor"/>'
      + '</svg>',
    tools: AI_POWERED.map((t, i) => ({ slug: t[0], name: t[1], starred: true, blurb: '' })),
    highlight: null
  };

  const rail = NAV_ORDER.map((c, i) => {
    const m = previewData[c];
    return '<a class="mega-cat" href="/' + c + '-tools" data-cat="' + c + '" style="--accent:' + m.accent + '"' + (i === 0 ? ' data-default="1"' : '') + '>'
      + '<span class="mega-cat-ico">' + m.icon + '</span>'
      + '<span class="mega-cat-body"><span class="mega-cat-top">' + m.name + '<span class="mega-cat-count">' + m.count + '</span></span>'
      + '<span class="mega-cat-desc">' + m.desc + '</span></span>'
      + '<svg class="mega-cat-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
      + '</a>';
  }).join('');

  function renderPreview(m, catKey) {
    const tools = m.tools.map(t =>
      '<a class="mega-tool' + (t.starred ? ' starred' : '') + '" href="/' + t.slug + '">'
      + '<span class="mega-tool-mark">' + (t.starred ? '\u2605' : '\u2713') + '</span>'
      + '<span class="mega-tool-txt"><span class="mega-tool-name">' + t.name + '</span>'
      + (t.blurb ? '<span class="mega-tool-blurb">' + t.blurb + '</span>' : '') + '</span>'
      + '</a>'
    ).join('');
    const exploreHref = catKey === '__ai__' ? '/tools' : '/' + catKey + '-tools';
    const exploreLabel = catKey === '__ai__' ? 'Explore all tools' : 'Explore ' + m.name;
    const highlightHtml = m.highlight
      ? '<a class="mega-highlight" href="/' + m.highlight.slug + '">'
        + '<span class="mega-hl-badge">' + (m.highlight.type === 'new' ? '\u2728' : '\u2b50') + ' ' + m.highlight.label + '</span>'
        + '<span class="mega-hl-name">' + m.highlight.name + '</span>'
      + '</a>'
      : '';
    return '<div class="mega-preview-head" style="--accent:' + m.accent + '"><span class="mega-preview-ico">' + m.icon + '</span>'
      + '<div><h3>' + m.name + '</h3><p>' + m.count + ' free browser-based tools. ' + m.desc + '</p></div>'
      + (m.illustration ? '<div class="mega-illo-wrap" style="color:' + m.accent + '">' + m.illustration + '</div>' : '')
      + '</div>'
      + '<div class="mega-preview-list">' + tools + '</div>'
      + highlightHtml
      + '<a class="mega-explore" href="' + exploreHref + '">' + exploreLabel + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a>';
  }

  const defaultPreview = renderPreview(previewData.image, 'image');
  const dataScript = '<script type="application/json" id="megaMenuData">' + JSON.stringify(previewData).replace(/</g, '\\u003c') + '</script>';

  const bakedPanel = '<div class="mega-rail" role="none">' + rail
    + '<div class="mega-tabs" role="tablist" aria-label="Highlight">'
    + '<button type="button" class="mega-tab active" data-tab="popular" role="tab" aria-selected="true">Popular</button>'
    + '<button type="button" class="mega-tab" data-tab="__ai__" role="tab" aria-selected="false">\u2728 AI-Powered</button>'
    + '</div></div>'
    + '<div class="mega-preview" id="megaPreview" aria-live="polite">' + defaultPreview + '</div>'
    + '<div class="mega-footer"><form class="mega-ai-prompt" action="/" method="get" role="search">'
    + '<svg class="mega-ai-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>'
    + '<input type="text" name="q" class="mega-ai-input" placeholder="What would you like to accomplish today?" aria-label="Describe what you want to do \u2014 runs the real tool search" autocomplete="off">'
    + '<button type="submit" class="mega-ai-go" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>'
    + '</form></div>' + dataScript;

  /* Splice the freshly-generated panel into the harvested header.
     Two possible states of index.html:
       (a) it still carries the original placeholder comment
           (bakedPanel is the wrapper's INNER html, so the comment sits
           inside the <div id="navToolsPanel"> wrapper), or
       (b) a previous round baked a rendered panel into it — in which
           case the old .replace() was a SILENT NO-OP and every page
           kept shipping the stale panel (frozen tool counts, missing
           new tools). Same bug class as the script-src existence
           checks: a replacement must match what's actually in the
           file. Handle both — preserving the wrapper div, swapping
           only its interior — and throw loudly if neither matches. */
  const BAKED_PANEL_RE = /(<div class="nav-tools-panel[^"]*" id="navToolsPanel"[^>]*>)[\s\S]*?id="megaMenuData">[\s\S]*?<\/script>(<\/div>)/;
  if (CHROME_TOP.includes('<!-- buildNavToolsDropdown() -->')) {
    CHROME_TOP = CHROME_TOP.replace('<!-- buildNavToolsDropdown() -->', bakedPanel);
  } else if (BAKED_PANEL_RE.test(CHROME_TOP)) {
    CHROME_TOP = CHROME_TOP.replace(BAKED_PANEL_RE, '$1' + bakedPanel.replace(/\$/g, '$$$$') + '$2');
  } else {
    throw new Error('header-chrome: nav panel splice point not found — neither placeholder comment nor baked panel matched');
  }
  if (CHROME_TOP.includes('buildNavToolsDropdown')) throw new Error('header-chrome: dropdown bake failed to replace placeholder');
  CHROME_TOP = CHROME_TOP.replace('class="nav-tools-panel"', 'class="nav-tools-panel mega"');

  /* index.html is both the live homepage AND the harvest source for every
     other page's chrome \u2014 but resync-chrome.js correctly bakes
     data-nav="" class="nav-active" onto ITS OWN Home link (it IS the
     homepage). Harvesting that as if it were a neutral template would
     stamp "Home" active onto every other page too, on top of whatever
     withActiveNav() adds for that page. Strip any pre-existing marker
     from the harvested base so it's always truly neutral, regardless of
     index.html's own current on-disk state. */
  CHROME_TOP = CHROME_TOP.replace(/(<a data-nav="[a-z-]*")\s+class="nav-active"/, '$1');

  const HEAD_LINKS = [...indexSrc.matchAll(/<link[^>]*(?:preconnect|fonts\.googleapis\.com\/css2|icon)[^>]*>/g)].map(m => m[0]).join('\n  ')
    + '\n  <link rel="stylesheet" href="/main.css">'
    + '\n  <link rel="stylesheet" href="/mega-menu.css">'
    + '\n  <link rel="stylesheet" href="/nav-responsive.css">';

  /* Single definition of the script tag every page with this header
     needs for the mega menu's interactivity — so no build script (or
     future one) hand-types this tag independently. */
  const MEGA_MENU_SCRIPT = '<script src="/mega-menu.js" defer></script>';
  const NAV_RESPONSIVE_SCRIPT = '<script src="/nav-responsive.js" defer></script>';

  /* toast-rack: the container every toast(...) call across the entire
     codebase (39 call sites in app.js/features.js/utils.js/every
     category tool file) writes into via toastRack.appendChild(el) —
     with NO null guard at any call site, because until this fix the
     container was assumed to always exist. It sits BEFORE <header> in
     index.html, so it was never inside the CHROME_TOP harvest
     boundary (which starts AT <header id="header">) and so was never
     part of what any build script propagated — index.html was the
     only page that ever had it. Every other page's toast() call,
     including the plain success toast after every single file
     download, has been throwing since the day this site first grew
     pages beyond the homepage. Exported here as its own constant
     (not folded into CHROME_TOP) because it sits outside that
     boundary on purpose — same reasoning as FOOTER being separate. */
  const TOAST_RACK = '<div id="toast-rack" aria-live="polite" aria-atomic="false"></div>';

  _cache = { CHROME_TOP, FOOTER, HEAD_LINKS, CDN_TAGS, TOOLS, CAT, CAT_META, ICON, MEGA_MENU_SCRIPT, TOAST_RACK, NAV_RESPONSIVE_SCRIPT };
  return _cache;
}

/* Bakes the current-page highlight (.nav-active — already styled in
 * main.css, just never set anywhere: neither the 66 tool pages nor the
 * homepage's own dynamic setActiveNav() cover tool/category/article
 * pages) into a COPY of CHROME_TOP for one specific page. Kept separate
 * from getChrome() because the harvest+bake is expensive and identical
 * for every page, while the active key differs per page — cache once,
 * stamp cheaply per call.
 *
 * key must match one of the real data-nav values in the header:
 *   ''  Home | 'all'  Tools | 'about' | 'french-academy' | 'blog' | 'contact'
 */
function withActiveNav(chromeTop, key) {
  const re = new RegExp('<a data-nav="' + key + '"([^>]*)>');
  if (!re.test(chromeTop)) throw new Error('withActiveNav: no nav link matches data-nav="' + key + '"');
  return chromeTop.replace(re, (m, attrs) => '<a data-nav="' + key + '" class="nav-active"' + attrs + '>');
}

module.exports = { getChrome, withActiveNav };
