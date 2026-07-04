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
 *                                 about/contact/work-with-me/etc.)
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

  /* Bake the Tools mega-menu dropdown from the same data app.js's
     buildNavToolsDropdown() would render at runtime — identical output,
     no JS execution required, so it works on pages that never load
     app.js at all. */
  const NAV_ORDER = ['image', 'pdf', 'developer', 'marketing', 'converter'];
  const bakedPanel = NAV_ORDER.map(c => {
    const meta = CAT_META && CAT_META[c]; if (!meta) return '';
    const popular = (meta.popular || []).map(sl => {
      const t = TOOLS.find(x => x[0] === sl);
      return t ? '<a href="/' + t[0] + '">' + t[1] + '</a>' : '';
    }).join('');
    return '<div class="ntp-col">'
      + '<a class="ntp-cat" href="/' + c + '-tools"><span class="ntp-cat-ico">' + (ICON && ICON[c] || '') + '</span>' + CAT[c] + '</a>'
      + popular
      + '<a class="ntp-viewall" href="/' + c + '-tools">View all &rarr;</a>'
      + '</div>';
  }).join('');
  CHROME_TOP = CHROME_TOP.replace('<!-- buildNavToolsDropdown() -->', bakedPanel);
  if (CHROME_TOP.includes('buildNavToolsDropdown')) throw new Error('header-chrome: dropdown bake failed to replace placeholder');

  const HEAD_LINKS = [...indexSrc.matchAll(/<link[^>]*(?:preconnect|fonts\.googleapis\.com\/css2|icon)[^>]*>/g)].map(m => m[0]).join('\n  ')
    + '\n  <link rel="stylesheet" href="/main.css">';

  _cache = { CHROME_TOP, FOOTER, HEAD_LINKS, CDN_TAGS, TOOLS, CAT, CAT_META, ICON };
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
 *   ''  Home | 'all'  Tools | 'about' | 'work-with-me' | 'blog' | 'contact'
 */
function withActiveNav(chromeTop, key) {
  const re = new RegExp('<a data-nav="' + key + '"([^>]*)>');
  if (!re.test(chromeTop)) throw new Error('withActiveNav: no nav link matches data-nav="' + key + '"');
  return chromeTop.replace(re, (m, attrs) => '<a data-nav="' + key + '" class="nav-active"' + attrs + '>');
}

module.exports = { getChrome, withActiveNav };
