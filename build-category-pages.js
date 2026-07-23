/* build-category-pages.js — generates the 5 category landing pages from
   category-content.js. Run after build-tool-pages.js (reuses its
   exports; does not retrigger tool-page generation, same
   require.main-guarded pattern as build-comparison-pages.js).

   Usage: node build-category-pages.js
*/
'use strict';
const fs = require('fs');
const {
  esc, trimDesc, relCard, TOOL_CSS, SITE, TODAY,
  TOOLS, TOOLS_BY_SLUG, ARTICLES, ICON,
  getChrome, withActiveNav,
} = require('./build-tool-pages.js');
const { CATEGORIES } = require('./category-content.js');
const { COMPARISONS } = require('./comparison-content.js');

const { CHROME_TOP, FOOTER, HEAD_LINKS, MEGA_MENU_SCRIPT, NAV_RESPONSIVE_SCRIPT } = getChrome();

/* ── Validation: every real tool in a category must appear in exactly
   one group. This runs on every build, not just once by hand — if a
   tool is renamed, added, or removed in data.js and category-content.js
   isn't updated to match, the build fails loudly here instead of
   silently dropping (or duplicating) a tool on the live page. */
function validateCategory(catKey, cat) {
  const realSlugs = new Set(TOOLS.filter(t => t[2] === cat.dataCat).map(t => t[0]));
  const grouped = [];
  cat.groups.forEach(([, slugs]) => slugs.forEach(s => grouped.push(s)));
  const invalid = grouped.filter(s => !realSlugs.has(s));
  if (invalid.length) throw new Error(`category-content.js [${catKey}]: groups reference non-existent tools: ${invalid.join(', ')}`);
  const counts = {};
  grouped.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const missing = [...realSlugs].filter(s => !counts[s]);
  const dup = Object.keys(counts).filter(s => counts[s] > 1);
  if (missing.length) throw new Error(`category-content.js [${catKey}]: real tools missing from any group: ${missing.join(', ')}`);
  if (dup.length) throw new Error(`category-content.js [${catKey}]: tools appear in more than one group: ${dup.join(', ')}`);
  const featInvalid = cat.featured.map(f => f[0]).filter(s => !realSlugs.has(s));
  if (featInvalid.length) throw new Error(`category-content.js [${catKey}]: invalid featured slugs: ${featInvalid.join(', ')}`);
  const wfInvalid = cat.workflow.steps.map(s => s[0]).filter(s => !realSlugs.has(s));
  if (wfInvalid.length) throw new Error(`category-content.js [${catKey}]: invalid workflow slugs: ${wfInvalid.join(', ')}`);
}

function renderHero(cat) {
  const style = `--cat-accent:${cat.accent};--cat-accent-bg:color-mix(in srgb, ${cat.accent} 12%, transparent);--cat-accent-border:color-mix(in srgb, ${cat.accent} 30%, var(--border))`;
  return `<div class="cat-hero-row" style="${style}">
    <div class="cat-hero-copy">
      <div class="cat-eyebrow" style="color:${cat.accent}">${esc(cat.eyebrow)}</div>
      <h1 class="cat-h1">${esc(cat.heroTitle)}</h1>
      <p class="cat-hero-sub">${esc(cat.heroSubtitle)}</p>
      <div class="cat-stat-cards">
        ${cat.stats.map(([n, l]) => `<div class="cat-stat-card"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join('\n        ')}
      </div>
    </div>
    <div class="cat-hero-illust" aria-hidden="true">${ICON[cat.dataCat] || ''}</div>
  </div>`;
}

function renderFeatured(cat) {
  const items = cat.featured.map(([slug, badge]) => TOOLS_BY_SLUG[slug] ? [TOOLS_BY_SLUG[slug], badge] : null).filter(Boolean);
  if (!items.length) return '';
  return `<section aria-labelledby="cat-featured-h" style="margin-top:32px">
    <div class="cat-group-head"><h2 id="cat-featured-h">Featured ${esc(cat.name)}</h2></div>
    <div class="cat-featured-grid">
      ${items.map(([t, badge]) => `<a class="cat-featured-tool" href="/${t[0]}"><span class="badge">${esc(badge)}</span><h3>${esc(t[1])}</h3><p>${esc(trimDesc(t[3], 110))}</p><span class="cta">Open tool <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>`).join('\n      ')}
    </div>
  </section>`;
}

function renderFilterBar(cat) {
  return `<div class="cat-filter-bar" role="search">
    <input type="search" id="catFilterInput" placeholder="Filter ${esc(cat.name.toLowerCase())}\u2026" aria-label="Filter tools on this page" autocomplete="off">
    <button class="cat-filter-chip active" data-catgroup="all" aria-pressed="true">All</button>
    ${cat.groups.map(([title]) => `<button class="cat-filter-chip" data-catgroup="${esc(title)}" aria-pressed="false">${esc(title)}</button>`).join('')}
  </div>`;
}

function renderGroups(cat) {
  return cat.groups.map(([title, slugs]) => {
    const tools = slugs.map(s => TOOLS_BY_SLUG[s]).filter(Boolean);
    return `<div class="cat-group" data-group="${esc(title)}">
      <div class="cat-group-head"><h2>${esc(title)}</h2><span class="count">${tools.length} tool${tools.length === 1 ? '' : 's'}</span></div>
      <div class="cat-group-grid">
        ${tools.map(t => `<a href="/${t[0]}" class="cat-tool-card" data-tool-name="${esc(t[1].toLowerCase())}"><span class="cat-arrow arr">\u2192</span><h3>${esc(t[1])}</h3><p>${esc(trimDesc(t[3], 100))}</p></a>`).join('\n        ')}
      </div>
    </div>`;
  }).join('\n    ');
}

function renderWorkflow(cat) {
  const steps = cat.workflow.steps.map(([slug, label]) => TOOLS_BY_SLUG[slug] ? [TOOLS_BY_SLUG[slug], label] : null).filter(Boolean);
  if (!steps.length) return '';
  const arrow = '<svg class="cat-workflow-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  return `<section aria-labelledby="cat-wf-h" style="margin-top:34px">
    <div class="cat-group-head"><h2 id="cat-wf-h">${esc(cat.workflow.title)}</h2></div>
    <div class="cat-workflow">
      ${steps.map(([t, label], i) => `<a href="/${t[0]}" class="cat-workflow-step"><span class="wf-n">${i + 1}</span><span>${esc(label)}</span></a>${i < steps.length - 1 ? arrow : ''}`).join('\n      ')}
    </div>
  </section>`;
}

function renderInsights(cat) {
  return `<section aria-labelledby="cat-insight-h" style="margin-top:34px">
    <div class="cat-group-head"><h2 id="cat-insight-h">Why This Matters</h2></div>
    <div class="tp-benefits">
      ${cat.insights.map(([title, body]) => `<div class="cat-insight"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('\n      ')}
    </div>
  </section>`;
}

function renderLead(cat) {
  if (!cat.leadParagraph) return '';
  return `<p class="cat-lead">${esc(cat.leadParagraph)}</p>`;
}

function renderTrust(cat) {
  return `<div class="cat-trust-row" style="margin-top:8px">${cat.trust.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
}

function renderCompare(cat) {
  if (!cat.compareLinks.length) return '';
  const byslug = {}; COMPARISONS.forEach(c => { byslug[c.slug] = c; });
  const items = cat.compareLinks.map(s => byslug[s]).filter(Boolean);
  if (!items.length) return '';
  return `<section aria-labelledby="cat-cmp-h" style="margin-top:34px">
    <div class="cat-group-head"><h2 id="cat-cmp-h">See How We Compare</h2></div>
    <div class="cmp-related-row">${items.map(c => `<a href="/${c.slug}">Tarumak Studio vs ${esc(c.competitor)}</a>`).join('')}</div>
  </section>`;
}

function renderGuides(cat) {
  const guides = Object.keys(ARTICLES).filter(k => ARTICLES[k].cat === cat.name).map(k => ARTICLES[k]).slice(0, 9);
  if (!guides.length) return '';
  return `<section aria-labelledby="cat-guides-h" style="margin-top:34px">
    <div class="cat-group-head"><h2 id="cat-guides-h">Guides and Articles</h2></div>
    <div class="tp-guides">
      ${guides.map(g => `<a class="tp-guide cat-article-card" href="${g.url.replace(SITE, '')}"><span class="tp-g-badge">Guide</span><h3>${esc(g.title)}</h3><span class="tp-g-meta">${esc(g.date)} \u00b7 ${esc(g.read)} read</span></a>`).join('\n      ')}
    </div>
  </section>`;
}

function renderFAQ(cat) {
  return `<section class="tp-faq" aria-labelledby="cat-faq-h" style="margin-top:34px">
    <div class="cat-group-head"><h2 id="cat-faq-h">Frequently Asked Questions</h2></div>
    ${cat.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n    ')}
  </section>`;
}

function schemaGraph(cat) {
  const url = `${SITE}/${cat.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': url + '#page', url, name: cat.heroTitle, description: trimDesc(cat.heroSubtitle, 160), isPartOf: { '@id': SITE + '/#website' }, dateModified: TODAY },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Tools', item: SITE + '/tools' }, { '@type': 'ListItem', position: 3, name: cat.name }] },
      { '@type': 'FAQPage', mainEntity: cat.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
}

function buildCategoryPage(catKey, cat) {
  validateCategory(catKey, cat);
  const url = `${SITE}/${cat.slug}`;
  const schema = schemaGraph(cat);
  const active = withActiveNav(CHROME_TOP, 'all');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(cat.heroTitle)} | Tarumak Studio</title>
<meta name="description" content="${esc(trimDesc(cat.heroSubtitle, 160))}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(cat.heroTitle)}">
<meta property="og:description" content="${esc(trimDesc(cat.heroSubtitle, 160))}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
${HEAD_LINKS}
<style>${TOOL_CSS}</style>
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
${active}
<main>
  <div class="cat-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/tools">Tools</a><span class="crumb-current" aria-current="page">${esc(cat.name)}</span></nav>
    ${renderHero(cat)}
    ${renderLead(cat)}
    ${renderTrust(cat)}
    ${renderFeatured(cat)}
    ${renderFilterBar(cat)}
    ${renderGroups(cat)}
    ${renderWorkflow(cat)}
    ${renderInsights(cat)}
    ${renderCompare(cat)}
    ${renderGuides(cat)}
    ${renderFAQ(cat)}
  </div>
</main>
${FOOTER}
<script src="/utils.js" defer></script>
<script src="/data.js" defer></script>
<script src="/features.js" defer></script>
${MEGA_MENU_SCRIPT}
${NAV_RESPONSIVE_SCRIPT}
<script src="/analytics.js" defer></script>
</body>
</html>`;
}

if (require.main === module) {
  let written = 0;
  Object.keys(CATEGORIES).forEach(catKey => {
    const cat = CATEGORIES[catKey];
    fs.writeFileSync(cat.slug + '.html', buildCategoryPage(catKey, cat));
    written++;
  });
  console.log(`Wrote ${written} category pages (validated: every real tool present exactly once per category)`);
}

module.exports = { buildCategoryPage, validateCategory };
