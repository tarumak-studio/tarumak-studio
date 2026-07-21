/* build-comparison-pages.js — generates the comparison-hub pages from
   comparison-content.js. Run after build-tool-pages.js in the pipeline
   (it reuses that script's exports, which are fully computed by the
   time this runs; it does NOT re-trigger tool-page generation, since
   build-tool-pages.js's own writes are guarded behind
   `require.main === module`).

   Usage: node build-comparison-pages.js
*/
'use strict';
const fs = require('fs');
const {
  esc, trimDesc, relCard, TOOL_CSS, SITE, TODAY,
  TOOLS_BY_SLUG, TOOL_ARTICLES, ARTICLES, BENEFIT_ICON,
  getChrome, withActiveNav,
} = require('./build-tool-pages.js');
const { SITE_NAME, LAST_UPDATED, TARUMAK_PROFILE, COMPARISONS } = require('./comparison-content.js');

const { CHROME_TOP, FOOTER, HEAD_LINKS, MEGA_MENU_SCRIPT, NAV_RESPONSIVE_SCRIPT } = getChrome();
/* Compare now has its own top-level nav item (added after independent
   review — see the architecture note in the delivery), so it gets its
   own active-state key rather than borrowing 'all' (Tools) as before. */
const CHROME_ACTIVE = withActiveNav(CHROME_TOP, 'compare');

const CORE_TOOLS = ['background-remover', 'ai-object-remover', 'ai-photo-enhancer', 'ai-image-upscaler', 'image-compressor']
  .map(s => TOOLS_BY_SLUG[s]).filter(Boolean);

/* ── Small, additive CSS for the shapes tool pages don't have: a real
   comparison table, a two-column choose-us/choose-them checklist, and
   a verdict callout. Everything else (.tp-sec, .tp-benefit, .tp-rel-card,
   .tp-faq, etc.) is already in TOOL_CSS and is reused as-is below. */
const COMPARISON_CSS = `
.cmp-hero{padding:38px 0 10px;text-align:center}
.cmp-hero .cmp-vs{display:inline-flex;align-items:center;gap:10px;font-family:var(--fd);font-size:clamp(24px,4vw,36px);font-weight:800;letter-spacing:-.8px;margin-bottom:10px}
.cmp-hero .cmp-vs .vs-x{color:var(--p1);font-size:.6em}
.cmp-hero .cmp-q{font-size:16px;color:var(--text-dim);max-width:640px;margin:0 auto 14px}
.cmp-meta-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-size:12px;color:var(--text-faint)}
.cmp-meta-row span{border:1px solid var(--border);border-radius:99px;padding:4px 12px;background:var(--surface)}
.cmp-choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:10px}
.cmp-choice{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px}
.cmp-choice h3{font-size:15px;margin-bottom:12px}
.cmp-choice ul{list-style:none;display:grid;gap:8px}
.cmp-choice li{font-size:13.5px;color:var(--text-dim);display:flex;gap:8px;align-items:flex-start}
.cmp-choice li::before{content:"\\2713";color:var(--p1);flex-shrink:0;font-weight:700}
.cmp-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:14px}
.cmp-table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:480px}
.cmp-table th,.cmp-table td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--border)}
.cmp-table th{color:var(--text-faint);font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;font-weight:600;background:var(--surface)}
.cmp-table td:not(:first-child){text-align:center}
.cmp-table tr:last-child td{border-bottom:none}
.cmp-yes{color:#4ade80}
.cmp-no{color:var(--text-faint)}
.cmp-detail{margin-bottom:22px}
.cmp-detail h3{font-size:16px;margin-bottom:6px}
.cmp-detail p{font-size:13.5px;color:var(--text-dim);line-height:1.65}
.cmp-adv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.cmp-adv-col{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px}
.cmp-adv-col h3{font-size:14px;margin-bottom:10px}
.cmp-adv-col ul{list-style:none;display:grid;gap:7px}
.cmp-adv-col li{font-size:13px;color:var(--text-dim);padding-left:16px;position:relative}
.cmp-adv-col.pos li::before{content:"+";position:absolute;left:0;color:#4ade80;font-weight:700}
.cmp-adv-col.neg li::before{content:"\\2212";position:absolute;left:0;color:var(--text-faint);font-weight:700}
.cmp-verdict{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border:1px solid var(--border-2,rgba(255,255,255,.14));border-radius:18px;padding:24px 26px;margin:8px 0}
.cmp-verdict h2{font-size:18px;margin-bottom:8px}
.cmp-verdict p{font-size:14px;color:var(--text-dim);line-height:1.7}
/* .cmp-related-row lives in the shared TOOL_CSS now (both page types
   embed it) so tool pages linking back to comparisons get it too,
   without redefining it here. */
.cmp-cat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.cmp-cat-block{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px}
.cmp-cat-block h3{font-size:14px;margin-bottom:10px}
@media (max-width:640px){.cmp-choice-grid,.cmp-adv-grid{grid-template-columns:1fr}}
`;

function yesNo(v) {
  if (v === true) return '<span class="cmp-yes">\u2713 Yes</span>';
  if (v === false) return '<span class="cmp-no">\u2014</span>';
  return `<span>${esc(String(v))}</span>`; /* a qualifying string, e.g. "Free tier only" */
}

function renderHero(cfg) {
  return `<section class="cmp-hero">
    <h1 class="cmp-vs">${esc(SITE_NAME)} <span class="vs-x">vs</span> ${esc(cfg.competitor)}</h1>
    <p class="cmp-q">${esc(cfg.heroQuestion)}</p>
    <p class="tp-sub" style="max-width:680px;margin:0 auto 14px">${esc(cfg.summary)}</p>
    <div class="cmp-meta-row"><span>Last updated: ${esc(LAST_UPDATED)}</span><span>Independent comparison \u2014 not sponsored</span></div>
  </section>`;
}

function renderQuickRec(cfg) {
  return `<section class="tp-sec" aria-labelledby="cmp-quickrec">
    <h2 id="cmp-quickrec">Quick recommendation</h2>
    <div class="cmp-choice-grid">
      <div class="cmp-choice"><h3>Choose ${esc(SITE_NAME)} if you\u2026</h3><ul>${cfg.chooseUsIf.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="cmp-choice"><h3>Choose ${esc(cfg.competitor)} if you\u2026</h3><ul>${cfg.chooseThemIf.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
  </section>`;
}

function renderFeatureTable(cfg) {
  return `<section class="tp-sec" aria-labelledby="cmp-table-h">
    <h2 id="cmp-table-h">Feature comparison</h2>
    <div class="cmp-table-wrap"><table class="cmp-table">
      <thead><tr><th scope="col">Feature</th><th scope="col">${esc(SITE_NAME)}</th><th scope="col">${esc(cfg.competitor)}</th></tr></thead>
      <tbody>${cfg.featureTable.map(([label, us, them]) => `<tr><td>${esc(label)}</td><td>${yesNo(us)}</td><td>${yesNo(them)}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

function renderDetailedSections(cfg) {
  return `<section class="tp-sec" aria-labelledby="cmp-detail-h">
    <h2 id="cmp-detail-h">Detailed comparison</h2>
    ${cfg.detailedSections.map(([title, body]) => `<div class="cmp-detail"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('\n    ')}
  </section>`;
}

function renderUseCases(cfg) {
  return `<section class="tp-sec" aria-labelledby="cmp-uc-h">
    <h2 id="cmp-uc-h">Which is better for your use case?</h2>
    <div class="tp-benefits">
      ${cfg.useCases.map(([title, body]) => `<div class="tp-benefit"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('\n      ')}
    </div>
  </section>`;
}

function renderHowItWorks(cfg) {
  return `<section class="tp-sec" aria-labelledby="cmp-how-h">
    <h2 id="cmp-how-h">How ${esc(SITE_NAME)} works</h2>
    <p class="tp-sub">The part of this comparison that's structural, not a matter of opinion.</p>
    <div class="tp-benefits">
      <div class="tp-benefit"><h3>Runs on your device</h3><p>Processing happens in your browser using the Canvas API (and WebGL/TensorFlow.js for the AI tools) \u2014 ${esc(TARUMAK_PROFILE.uploadRequired.toLowerCase())}.</p></div>
      <div class="tp-benefit"><h3>No account, ever</h3><p>Signup is ${esc(TARUMAK_PROFILE.signup.toLowerCase())} for any tool on Tarumak Studio, including this one.</p></div>
      <div class="tp-benefit"><h3>Free, with no catch</h3><p>${esc(TARUMAK_PROFILE.pricing)}, no watermark, no resolution cap tied to a paid tier.</p></div>
    </div>
  </section>`;
}

function renderAdvantages(cfg) {
  return `<section class="tp-sec" aria-labelledby="cmp-adv-h">
    <h2 id="cmp-adv-h">Advantages &amp; limitations</h2>
    <div class="cmp-adv-grid">
      <div class="cmp-adv-col pos"><h3>${esc(SITE_NAME)} \u2014 advantages</h3><ul>${cfg.advantagesUs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="cmp-adv-col neg"><h3>${esc(SITE_NAME)} \u2014 limitations</h3><ul>${cfg.limitationsUs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="cmp-adv-col pos"><h3>${esc(cfg.competitor)} \u2014 advantages</h3><ul>${cfg.advantagesThem.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="cmp-adv-col neg"><h3>${esc(cfg.competitor)} \u2014 limitations</h3><ul>${cfg.limitationsThem.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
  </section>`;
}

function renderFAQ(cfg) {
  return `<section class="tp-sec tp-faq" aria-labelledby="cmp-faq-h">
    <h2 id="cmp-faq-h">Frequently asked questions</h2>
    ${cfg.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
  </section>`;
}

function renderVerdict(cfg) {
  return `<div class="cmp-verdict"><h2>Final verdict</h2><p>${esc(cfg.verdict)}</p></div>`;
}

function renderRelatedComparisons(cfg) {
  const others = COMPARISONS.filter(c => c.slug !== cfg.slug);
  if (!others.length) return '';
  return `<section class="tp-sec" aria-labelledby="cmp-relc-h">
    <h2 id="cmp-relc-h">Related comparisons</h2>
    <div class="cmp-related-row">${others.map(c => `<a href="/${c.slug}">${esc(SITE_NAME)} vs ${esc(c.competitor)}</a>`).join('')}</div>
  </section>`;
}

function renderRelatedTools(cfg) {
  const tools = CORE_TOOLS.filter(t => t[0] !== cfg.tarumakTool);
  return `<section class="tp-sec" aria-labelledby="cmp-relt-h">
    <h2 id="cmp-relt-h">Related tools</h2>
    <div class="tp-related">${tools.map(t => relCard(t)).join('\n      ')}</div>
  </section>`;
}

function renderRelatedGuides(cfg) {
  const guideSlugs = (TOOL_ARTICLES && TOOL_ARTICLES[cfg.tarumakTool]) || [];
  const guides = guideSlugs.map(g => ({ slug: g, meta: ARTICLES[g] })).filter(g => g.meta).slice(0, 4);
  if (!guides.length) return '';
  return `<section class="tp-sec" aria-labelledby="cmp-guides-h">
    <h2 id="cmp-guides-h">Related guides</h2>
    <p class="tp-sub">From the Tarumak Studio blog.</p>
    <div class="tp-guides">${guides.map(g => `<a class="tp-guide" href="${g.meta.url.replace(SITE, '')}"><span class="tp-g-badge">Guide</span><h3>${esc(g.meta.title)}</h3><span class="tp-g-meta">${esc(g.meta.date)} \u00B7 ${esc(g.meta.read)} read</span></a>`).join('\n      ')}</div>
  </section>`;
}

function schemaGraph(cfg) {
  const url = `${SITE}/${cfg.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url + '#page', url, name: cfg.metaTitle, description: trimDesc(cfg.metaDescription, 160), isPartOf: { '@id': SITE + '/#website' }, dateModified: TODAY },
      { '@type': 'Organization', '@id': SITE + '/#org', name: SITE_NAME, url: SITE, logo: SITE + '/og-image.png' },
      { '@type': 'Article', headline: cfg.metaTitle, description: trimDesc(cfg.metaDescription, 160), author: { '@type': 'Organization', name: SITE_NAME }, publisher: { '@type': 'Organization', name: SITE_NAME }, datePublished: TODAY, dateModified: TODAY },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Compare', item: SITE + '/compare' }, { '@type': 'ListItem', position: 3, name: `vs ${cfg.competitor}` }] },
      { '@type': 'FAQPage', mainEntity: cfg.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
}

function buildComparisonPage(cfg) {
  const url = `${SITE}/${cfg.slug}`;
  const schema = schemaGraph(cfg);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(cfg.metaTitle)}</title>
<meta name="description" content="${esc(trimDesc(cfg.metaDescription, 160))}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(cfg.metaTitle)}">
<meta property="og:description" content="${esc(trimDesc(cfg.metaDescription, 160))}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(cfg.metaTitle)}">
<meta name="twitter:description" content="${esc(trimDesc(cfg.metaDescription, 160))}">
${HEAD_LINKS}
<style>${TOOL_CSS}${COMPARISON_CSS}</style>
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
${CHROME_ACTIVE}
<main>
  <div class="tp-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/compare">Compare</a><span class="crumb-current" aria-current="page">vs ${esc(cfg.competitor)}</span></nav>
    ${renderHero(cfg)}
    ${renderQuickRec(cfg)}
    ${renderFeatureTable(cfg)}
    ${renderDetailedSections(cfg)}
    ${renderUseCases(cfg)}
    ${renderHowItWorks(cfg)}
    ${renderAdvantages(cfg)}
    ${renderVerdict(cfg)}
    ${renderFAQ(cfg)}
    ${renderRelatedComparisons(cfg)}
    ${renderRelatedTools(cfg)}
    ${renderRelatedGuides(cfg)}
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

/* ── Generate all comparison pages + the /compare hub ────────────── */
let written = 0;
for (const cfg of COMPARISONS) {
  fs.writeFileSync(cfg.slug + '.html', buildComparisonPage(cfg));
  written++;
}
console.log(`Wrote ${written} comparison pages`);

/* Hub page: /compare — lists every comparison, the same way a category
   page lists tools. Anyone landing here (or a future nav link) sees
   the full set and it grows automatically as COMPARISONS grows. */
const hubUrl = `${SITE}/compare`;

/* Data-driven category grouping — reads cfg.category off each real
   comparison entry. A category only appears here once it has at least
   one real comparison; no placeholder "coming soon" categories, so this
   never shows more than genuinely exists yet. Scales automatically as
   comparison-content.js grows — no code change needed to add a category. */
const CATEGORY_GROUPS = {};
COMPARISONS.forEach(c => {
  const cat = c.category || 'Other';
  (CATEGORY_GROUPS[cat] = CATEGORY_GROUPS[cat] || []).push(c);
});

const HUB_FAQ = [
  ['How do you choose which comparisons to write?', `We start with the tools people already search for as alternatives to Tarumak Studio's own tools \u2014 Remove.bg, TinyPNG and similar well-known services in each category. As Tarumak Studio adds more tools, more comparisons get added to match.`],
  ['Are these comparisons sponsored?', `No. Tarumak Studio doesn't accept payment from the companies it's compared against, and every comparison explicitly says so on the page. Where a competitor genuinely does something better, the comparison says that too.`],
  ['How is each comparison actually put together?', `By using each tool's real, current public offering \u2014 checking their own documented pricing, privacy policy and feature list directly, cross-checking against multiple independent sources, and being explicit whenever a specific claim (like an exact price) may have changed since publication. We don't run our own formal speed benchmarks and don't present invented numbers as measured results.`],
  ['Can I suggest a comparison?', `Yes \u2014 use the Contact page. Requests for tools a lot of people are actually comparing against are the ones most likely to get written next.`],
];

function renderHubHero() {
  return `<section class="cmp-hero">
      <h1 class="cmp-vs">How ${esc(SITE_NAME)} Compares</h1>
      <p class="cmp-q">Honest, detailed comparisons \u2014 not marketing pages. If another tool is the better fit for what you need, we say so.</p>
      <div class="cmp-meta-row"><span>${COMPARISONS.length} comparison${COMPARISONS.length === 1 ? '' : 's'} published</span><span>Independent \u2014 never sponsored</span><span>Updated ${esc(LAST_UPDATED)}</span></div>
    </section>`;
}

function renderAllComparisons() {
  return `<section class="tp-sec" aria-labelledby="hub-all">
      <h2 id="hub-all">All comparisons</h2>
      <p class="tp-sub">Every comparison Tarumak Studio has published, newest first.</p>
      <div class="tp-related">
        ${COMPARISONS.slice().reverse().map(c => `<a class="tp-rel-card" href="/${c.slug}"><h3>${esc(SITE_NAME)} vs ${esc(c.competitor)}</h3><p>${esc(c.heroQuestion)}</p><span class="tp-rel-cta">Read comparison \u2192</span></a>`).join('\n        ')}
      </div>
    </section>`;
}

function renderBrowseByCategory() {
  const cats = Object.keys(CATEGORY_GROUPS);
  if (!cats.length) return '';
  return `<section class="tp-sec" aria-labelledby="hub-cat">
      <h2 id="hub-cat">Browse by category</h2>
      <p class="tp-sub">Comparisons grouped by what they're actually about.</p>
      <div class="cmp-cat-grid">
        ${cats.map(cat => `<div class="cmp-cat-block"><h3>${esc(cat)}</h3><div class="cmp-related-row">${CATEGORY_GROUPS[cat].map(c => `<a href="/${c.slug}">vs ${esc(c.competitor)}</a>`).join('')}</div></div>`).join('\n        ')}
      </div>
    </section>`;
}

function renderComparedAgainst() {
  return `<section class="tp-sec" aria-labelledby="hub-against">
      <h2 id="hub-against">Compared against</h2>
      <div class="cmp-related-row">${COMPARISONS.map(c => `<a href="/${c.slug}">${esc(c.competitor)}</a>`).join('')}</div>
    </section>`;
}

function renderHowWeTest() {
  const factors = [
    ['shield', 'Privacy & data handling', 'Where does the file actually go \u2014 does it ever leave the device? We check each tool\u2019s own privacy documentation and how the product is architected, not just its marketing copy.'],
    ['layers', 'Real feature use, not a spec sheet', 'We use each tool\u2019s actual free, publicly available offering ourselves \u2014 what a real visitor can do today, not a features list a company published.'],
    ['gem', 'Pricing, checked at the source', 'Free-tier limits and paid pricing are checked directly against the competitor\u2019s own current pricing page, not assumed from memory or an older review.'],
    ['monitor', 'Accessibility & browser support', 'Whether a tool works with a keyboard, a screen reader, and a normal range of current browsers \u2014 not just whether it looks fine in one browser on one device.'],
    ['zap', 'Ease of use', 'How many steps, clicks, or account requirements stand between opening the page and getting a finished result.'],
    ['heart', 'Transparency about limitations', 'Every comparison lists real limitations on the Tarumak Studio side too \u2014 no comparison here is written to guarantee we win.'],
  ];
  return `<section class="tp-sec" aria-labelledby="hub-how">
      <h2 id="hub-how">How we test</h2>
      <p class="tp-sub">The evaluation framework behind every comparison \u2014 stated honestly, not as a marketing claim.</p>
      <div class="tp-benefits">
        ${factors.map(([icon, title, body]) => `<div class="tp-benefit">${BENEFIT_ICON[icon] || ''}<h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('\n        ')}
      </div>
    </section>`;
}

function renderWhyTrust() {
  return `<section class="cmp-verdict">
      <h2>Why trust these comparisons</h2>
      <p>Every comparison on this page follows the same rule: Tarumak Studio's own limitations are listed as plainly as the competitor's. These pages exist to help you pick the right tool for your actual situation \u2014 including a competitor, when that's genuinely the better fit \u2014 not to win an argument. Nothing here is sponsored, and every factual claim about a competitor is checked against their own current documentation rather than assumed.</p>
    </section>`;
}

function renderHubFAQ() {
  return `<section class="tp-sec tp-faq" aria-labelledby="hub-faq-h">
      <h2 id="hub-faq-h">Frequently asked questions</h2>
      ${HUB_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </section>`;
}

function renderHubRelatedTools() {
  return `<section class="tp-sec" aria-labelledby="hub-tools">
      <h2 id="hub-tools">Related tools</h2>
      <div class="tp-related">${CORE_TOOLS.map(t => relCard(t)).join('\n      ')}</div>
    </section>`;
}

const hubSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'CollectionPage', '@id': hubUrl + '#page', url: hubUrl, name: `${SITE_NAME} Comparisons \u2014 See How We Stack Up`, description: `Honest, detailed comparisons between ${SITE_NAME} and other popular tools.`, isPartOf: { '@id': SITE + '/#website' }, dateModified: TODAY },
    {
      '@type': 'ItemList', '@id': hubUrl + '#list', name: `${SITE_NAME} comparison pages`,
      itemListElement: COMPARISONS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${c.slug}`, name: `${SITE_NAME} vs ${c.competitor}` })),
    },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Compare' }] },
    { '@type': 'FAQPage', mainEntity: HUB_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};
const hubHTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${SITE_NAME} Comparisons \u2014 See How We Stack Up</title>
<meta name="description" content="Honest, detailed comparisons between ${SITE_NAME} and other popular image and PDF tools \u2014 privacy, pricing, and features, side by side.">
<link rel="canonical" href="${hubUrl}">
<meta property="og:type" content="website">
<meta property="og:title" content="${SITE_NAME} Comparisons \u2014 See How We Stack Up">
<meta property="og:description" content="Honest, detailed comparisons between ${SITE_NAME} and other popular tools \u2014 privacy, pricing and features, side by side.">
<meta property="og:url" content="${hubUrl}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
${HEAD_LINKS}
<style>${TOOL_CSS}${COMPARISON_CSS}</style>
<script type="application/ld+json">${JSON.stringify(hubSchema)}</script>
</head>
<body>
${CHROME_ACTIVE}
<main>
  <div class="tp-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="crumb-current" aria-current="page">Compare</span></nav>
    ${renderHubHero()}
    ${renderAllComparisons()}
    ${renderBrowseByCategory()}
    ${renderComparedAgainst()}
    ${renderHowWeTest()}
    ${renderWhyTrust()}
    ${renderHubFAQ()}
    ${renderHubRelatedTools()}
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
fs.writeFileSync('compare.html', hubHTML);
console.log('Wrote compare.html (hub page)');

/* ── Sitemap: a dedicated child sitemap, same pattern as the existing
   tools/articles/pages ones, referenced from the sitemap index. New
   comparisons appear here automatically as they're added to
   comparison-content.js — no manual sitemap editing. */
function urlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(e => `  <url><loc>${e.loc}</loc><changefreq>${e.freq}</changefreq><priority>${e.pri}</priority></url>`).join('\n') +
    `\n</urlset>\n`;
}
const comparisonEntries = [{ loc: hubUrl, freq: 'monthly', pri: '0.7' }]
  .concat(COMPARISONS.map(c => ({ loc: `${SITE}/${c.slug}`, freq: 'monthly', pri: '0.7' })));
fs.writeFileSync('sitemap-comparisons.xml', urlset(comparisonEntries));
console.log(`Wrote sitemap-comparisons.xml (${comparisonEntries.length} urls)`);

/* Reference the new child sitemap from the sitemap index, if it isn't
   already there \u2014 idempotent, safe to run every time. */
const idxPath = 'sitemap.xml';
let idxXml = fs.readFileSync(idxPath, 'utf8');
if (!idxXml.includes('sitemap-comparisons.xml')) {
  const entry = `  <sitemap><loc>${SITE}/sitemap-comparisons.xml</loc></sitemap>\n`;
  idxXml = idxXml.replace('</sitemapindex>', entry + '</sitemapindex>');
  fs.writeFileSync(idxPath, idxXml);
  console.log('Added sitemap-comparisons.xml to sitemap.xml index');
} else {
  console.log('sitemap.xml index already references sitemap-comparisons.xml');
}
