/* build-tools-page.js — generates tools.html, the dedicated Tools
 * Directory page at /tools.
 *
 * Why this exists: the site used to treat "all tools, searchable and
 * filterable" as a same-page anchor on the homepage (/#tools) — a
 * <section id="tools"> rendered entirely by client-side JS, with no
 * static content, no dedicated metadata, and no real URL. Every
 * category page (image-tools.html etc.) already proved the better
 * pattern for this site: real static content first, JS enhancement
 * second. This script applies that same pattern to the tools
 * directory and gives it a real page.
 *
 * Static-first, matching ARCHITECTURE-TOOL-PAGES.md's own contract:
 * the grid below is pre-rendered with every one of TOOLS' real
 * entries (not a placeholder), using the EXACT markup buildGrid() in
 * features.js produces for the default (all, unfiltered) state — so
 * a crawler or no-JS visitor sees the real, complete tool list
 * immediately, and buildTabs()/buildGrid() then take over for
 * interactive filtering once JS runs, re-rendering the same content.
 *
 * Usage: node build-tools-page.js
 */
'use strict';
const fs = require('fs');
const vm = require('vm');

const SITE = 'https://tarumakstudio.com';
const TODAY = new Date().toISOString().slice(0, 10);

function makeAbsorber() {
  const fn = function () { return absorber; };
  const absorber = new Proxy(fn, {
    get: (t, p) => (p === Symbol.toPrimitive ? () => '' : absorber),
    set: () => true,
    apply: () => absorber
  });
  return absorber;
}
function capture(files, names) {
  const stub = makeAbsorber();
  const sandbox = { window: stub, document: stub, localStorage: stub, navigator: stub, matchMedia: stub, $: stub, console };
  sandbox.globalThis = sandbox;
  let captured = null;
  sandbox.__CAP__ = x => { captured = x; };
  vm.createContext(sandbox);
  const src = files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
  const cap = `\n;__CAP__({${names.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : null`).join(',')}});`;
  vm.runInContext(src + cap, sandbox);
  return captured;
}
const D = capture(['data.js'], ['TOOLS', 'CAT', 'ICON']);
if (!D.TOOLS || !D.TOOLS.length) throw new Error('build-tools-page: TOOLS capture failed');
const { TOOLS, CAT, ICON } = D;

const { getChrome, withActiveNav } = require('./header-chrome.js');
const { CHROME_TOP: CHROME_TOP_BASE, FOOTER, HEAD_LINKS, MEGA_MENU_SCRIPT, TOAST_RACK, NAV_RESPONSIVE_SCRIPT } = getChrome();
const CHROME_TOP = withActiveNav(CHROME_TOP_BASE, 'all');

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* Static grid — byte-for-byte the same markup buildGrid() in
   features.js produces for activeCat='all', term='' (favourites
   excepted, since that's per-visitor localStorage state unknowable
   at build time — JS corrects the heart-icon state immediately on
   load, same as any other per-user UI state on this site). */
const arrowSvg = '<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const heartSvg = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
function toolCard(x) {
  return '<div class="tool cat-' + x[2] + '" onclick="location.href=\'/' + x[0] + '\'">' + arrowSvg
    + '<button class="fav-btn" data-slug="' + x[0] + '" onclick="toggleFav(\'' + x[0] + '\',event)" aria-label="Save ' + esc(x[1]) + '">' + heartSvg + '</button>'
    + '<div class="ico">' + ICON[x[2]] + '</div>'
    + '<h3><a href="/' + x[0] + '" style="color:inherit;text-decoration:none">' + esc(x[1]) + '</a></h3>'
    + '<p>' + esc(x[3]) + '</p>'
    + '<div class="chips">' + x[4].map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>'
    + '</div>';
}
const staticGrid = TOOLS.map(toolCard).join('');

/* Static tabs — matches buildTabs()'s default-state output (All +
   Saved, 0 saved at build time — corrected immediately by JS from
   the visitor's own localStorage). */
const catCounts = {}; TOOLS.forEach(t => { catCounts[t[2]] = (catCounts[t[2]] || 0) + 1; });
const staticTabs = '<button class="tab active" data-cat="all">All <span class="ct">' + TOOLS.length + '</span></button>'
  + '<button class="tab t-saved" data-cat="favs">&#9829; Saved <span class="ct">0</span></button>';

const title = 'All ' + TOOLS.length + ' Free Browser Tools | Tarumak Studio';
const desc = 'Every free Tarumak Studio tool in one place — ' + TOOLS.length + ' browser-based tools for images, PDFs, developers and marketers. Search or filter by category. Nothing uploaded.';
const url = SITE + '/tools';

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, isPartOf: { '@id': SITE + '/#website' }, dateModified: TODAY },
    {
      '@type': 'CollectionPage', '@id': url + '#collection', url, name: 'All Tools',
      hasPart: TOOLS.map(t => ({ '@type': 'SoftwareApplication', name: t[1], url: SITE + '/' + t[0], applicationCategory: 'WebApplication' }))
    },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Tools' }
    ] }
  ]
};

const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Tarumak Studio">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}/og-image.png">
  ${HEAD_LINKS}
  <link rel="stylesheet" href="/tools.css">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body data-page="tools">
${TOAST_RACK}
${CHROME_TOP}
<main>
  <div class="wrap" style="max-width:1240px;margin:0 auto;padding:0 24px">

    <nav class="breadcrumb" aria-label="Breadcrumb" style="display:flex;align-items:center;flex-wrap:wrap;font-size:13px;padding-top:22px">
      <a href="/" style="color:var(--text-dim);text-decoration:none">Home</a>
      <span aria-hidden="true" style="margin:0 9px;color:var(--text-faint)">&rsaquo;</span>
      <span style="color:var(--text);font-weight:600" aria-current="page">Tools</span>
    </nav>

    <section class="section" style="padding-top:16px">
      <div class="section-head"><span class="eyebrow"><span class="dot"></span>THE TOOLKIT</span><h1 style="font-family:var(--fd);font-size:clamp(30px,5vw,44px);font-weight:700;letter-spacing:-1.2px;margin:14px 0 10px">All ${TOOLS.length} tools, one place</h1><p>Search by name or filter to your saved favourites. Every tool opens with drag-and-drop, instant processing and a one-click download.</p></div>
      <div class="toolbar">
        <div class="tabs" id="tabs">${staticTabs}</div>
        <div class="filter-search"><div class="fi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input id="gridSearch" aria-label="Filter tools" type="text" placeholder="Filter tools by name…" autocomplete="off" /></div></div>
      </div>
      <div class="grid" id="grid">${staticGrid}</div>
    </section>

  </div>
</main>
${FOOTER}
<script src="/config.js" defer></script>
<script src="/utils.js" defer></script>
<script src="/data.js" defer></script>
<script src="/features.js" defer></script>
${MEGA_MENU_SCRIPT}
${NAV_RESPONSIVE_SCRIPT}
<script>
/* Re-render on load using the visitor's real saved-tools state —
   the static grid/tabs above are the real, complete, unfiltered
   list already (for crawlers and instant paint); this just wires up
   interactivity and corrects the Saved count from localStorage. */
document.addEventListener('DOMContentLoaded', function(){ buildTabs(); buildGrid(); });
</script>
</body>
</html>`;

fs.writeFileSync('tools.html', html);
console.log(`tools.html written: ${TOOLS.length} tools in static grid, ${html.length} bytes`);
