/* build-tool-pages.js — Tarumak Studio static tool-page generator
 *
 * Usage:   node build-tool-pages.js
 * Output:  ./{slug}.html for every tool in data.js (66 today, N tomorrow)
 *          ./sitemap.xml (index) + sitemap-tools.xml + sitemap-articles.xml + sitemap-pages.xml
 *
 * Design contract:
 *  - Zero new content invention: how-to copy is a direct port of app.js
 *    buildHowToGuide(); FAQ/related/guides come from data.js + blog-data.js.
 *  - Zero new design language: header/mob-menu/footer/styles are harvested
 *    from image-tools.html (the existing static-page chrome) at build time,
 *    so a future design change to category pages flows into tool pages on
 *    the next build.
 *  - Adding tool #67 to data.js and re-running this script is the ENTIRE
 *    process for shipping its SEO page.
 *
 * Dependency-free (node stdlib only).
 */
'use strict';
const fs = require('fs');
const vm = require('vm');

const SITE = 'https://tarumakstudio.com';
const TODAY = new Date().toISOString().slice(0, 10);

/* ── 1. Capture data from data.js + blog-data.js (vm absorber) ──── */
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
const D = capture(['data.js', 'blog-data.js'], ['TOOLS', 'CAT', 'FAQ', 'TOOL_ARTICLES', 'ARTICLES', 'FEAT', 'CAT_META', 'ICON']);
if (!D.TOOLS || !D.TOOLS.length) throw new Error('TOOLS capture failed');
const { TOOLS, CAT, FAQ, TOOL_ARTICLES, ARTICLES, CAT_META, ICON } = D;
const FEAT_SET = new Set();
(function collect(v) {
  if (typeof v === 'string') { FEAT_SET.add(v); return; }
  if (Array.isArray(v)) { v.forEach(collect); return; }
  if (v && typeof v === 'object') { if (typeof v.slug === 'string') FEAT_SET.add(v.slug); Object.values(v).forEach(collect); }
})(D.FEAT);
console.log(`Data: ${TOOLS.length} tools, ${Object.keys(FAQ || {}).length} FAQ sets, ${Object.keys(TOOL_ARTICLES || {}).length} article maps, ${Object.keys(ARTICLES || {}).length} articles`);

const CAT_PAGE = { image: '/image-tools', pdf: '/pdf-tools', developer: '/developer-tools', marketing: '/marketing-tools', converter: '/converter-tools' };
const CAT_JS = { image: 'image-tools.js', pdf: 'pdf-tools.js', converter: 'converter-tools.js', marketing: 'marketing-tools.js', developer: 'developer-tools.js' };

/* ── 1b. FILE-vs-TEXT classification, derived from the actual tool code ──
   Not guessed from category or chips (both proved unreliable — e.g. the
   image category includes qr-code-generator, a generator with no upload;
   marketing includes brand-color-extract, which DOES take a file). Instead
   this inspects each INIT[slug] registration's real body — resolving
   factory calls like imgConv()/dz() to the factory's own source — for a
   genuine file-input signal. Verified against all 66 tools by hand before
   trusting this in copy generation. Drives privacy-copy and FAQ wording so
   a text tool is never told "your files are never uploaded" (it has none)
   and a file tool always gets the concrete privacy promise. */
const FILE_MARKER = /type=.file.|dropzone\(|\bdz\(|accept\s*[:=]/;
const CAT_SRC = {};
for (const cat of Object.keys(CAT_JS)) CAT_SRC[cat] = fs.readFileSync(CAT_JS[cat], 'utf8');
const ALL_CAT_SRC = Object.values(CAT_SRC).join('\n');
function factoryBody(fname) {
  const m = ALL_CAT_SRC.match(new RegExp('function\\s+' + fname + '\\s*\\('));
  if (!m) return null;
  const i = ALL_CAT_SRC.indexOf('{', m.index);
  let depth = 0;
  for (let j = i; j < ALL_CAT_SRC.length; j++) {
    if (ALL_CAT_SRC[j] === '{') depth++;
    else if (ALL_CAT_SRC[j] === '}') { depth--; if (depth === 0) return ALL_CAT_SRC.slice(i, j + 1); }
  }
  return null;
}
const IS_FILE_TOOL = {};
for (const cat of Object.keys(CAT_JS)) {
  const src = CAT_SRC[cat];
  const re = /INIT\[['"]([\w-]+)['"]\]\s*=\s*(function\s*\(|[\w$]+\()/g;
  let m;
  while ((m = re.exec(src))) {
    const slug = m[1];
    const isFactory = !m[2].startsWith('function');
    if (isFactory) {
      const fname = m[2].match(/([\w$]+)\(/)[1];
      const body = factoryBody(fname);
      IS_FILE_TOOL[slug] = body ? FILE_MARKER.test(body) : false;
    } else {
      const rest = src.slice(m.index);
      const next = rest.slice(10).search(/\nINIT\[/);
      const body = next === -1 ? rest : rest.slice(0, next + 10);
      IS_FILE_TOOL[slug] = FILE_MARKER.test(body);
    }
  }
}


/* ── 2. Chrome: from the shared header-chrome module ──────────────
   Was inline here originally; now a single shared module so a second
   build script (build-static-pages.js) can use the exact same header,
   dropdown-bake, and footer without a second implementation. See
   header-chrome.js for the full rationale. */
const { getChrome, withActiveNav } = require('./header-chrome.js');
const { CHROME_TOP: CHROME_TOP_BASE, FOOTER, HEAD_LINKS, CDN_TAGS } = getChrome();
/* Every tool/category page is "under Tools" \u2014 mark that nav item
   active. Real bug found while unifying the header: main.css already
   styles .nav-active, but nothing was ever setting it on tool pages
   (or category pages) \u2014 the nav gave no current-page indication
   at all. Fixed once here, not per-page. */
const CHROME_TOP = withActiveNav(CHROME_TOP_BASE, 'all');
console.log(`Chrome: header+menu ${CHROME_TOP.length}c, footer ${FOOTER.length}c, links ${HEAD_LINKS ? 'ok' : 'MISSING'}`);

/* ── 3. Page-specific CSS (tokens only from :root — no new palette) ─ */
const TOOL_CSS = `
.tp-wrap{max-width:1240px;margin:0 auto;padding:0 24px}
#cookie-bar{position:fixed;bottom:0;left:0;right:0;z-index:8500;background:color-mix(in srgb,var(--bg-2) 94%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--border);padding:14px 28px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;transform:translateY(100%);transition:transform .4s var(--ease)}
#cookie-bar.show{transform:none}
#cookie-bar p{flex:1;font-size:13.5px;color:var(--text-dim);margin:0;min-width:200px}
#cookie-bar p a{color:var(--p1);text-decoration:underline}
.cb-btns{display:flex;gap:10px;align-items:center;flex-shrink:0}
#cb-accept{height:36px;padding:0 20px;border-radius:10px;background:var(--grad);color:#06121a;font-family:var(--fb);font-weight:600;font-size:13px;border:none;cursor:pointer}
#cb-accept:hover{opacity:.88}
.cb-decline{background:transparent;color:var(--text-dim);border:1px solid var(--border);border-radius:9px;padding:8px 14px;font-size:13px;font-family:var(--fb);font-weight:500;cursor:pointer;transition:.2s}
.cb-decline:hover{border-color:var(--border-2);color:var(--text)}
@media (max-width: 600px) {
  #cookie-bar { padding: 12px 16px; gap: 10px; flex-direction: column; align-items: stretch; }
  #cookie-bar p { font-size: 12.5px; min-width: 0; }
  .cb-btns { width: 100%; }
  .cb-btns button { flex: 1; }
  #cb-accept { height: 34px; padding: 0 14px; font-size: 12.5px; } .cb-decline { padding: 7px 12px; font-size: 12.5px; }
}

.breadcrumb{display:flex;align-items:center;flex-wrap:wrap;font-size:13px;padding-top:22px}
.breadcrumb a{color:var(--text-dim);text-decoration:none;transition:color .2s}
.breadcrumb a:hover{color:var(--p1)}
.breadcrumb a:focus-visible{outline:2px solid var(--p1);outline-offset:3px;border-radius:4px}
.breadcrumb a+a::before,.breadcrumb a+.crumb-current::before{content:'\u203A';display:inline-block;margin:0 9px;color:var(--text-faint)}
.crumb-current{color:var(--text);font-weight:600}

.tp-hero{padding:40px 0 8px}
.tp-hero h1{font-family:var(--fd);font-size:clamp(30px,5vw,44px);font-weight:700;letter-spacing:-1.2px;margin:14px 0 10px}
.tp-lead{font-size:16.5px;color:var(--text-dim);max-width:720px;line-height:1.65}
.tp-badges{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px}
.tp-cat-badge{font-size:12px;font-weight:700;color:var(--p1);background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.25);padding:5px 12px;border-radius:100px;text-decoration:none}
.tp-chip{font-size:11.5px;font-weight:600;color:var(--text-dim);background:var(--surface);border:1px solid var(--border);padding:4px 10px;border-radius:100px}
.tp-actions{display:flex;gap:8px;margin-left:auto}
.tp-act{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--text-dim);background:var(--surface);border:1px solid var(--border);padding:7px 14px;border-radius:100px;cursor:pointer;transition:all .2s}
.tp-act:hover{color:var(--p1);border-color:rgba(34,211,238,.3)}
.tp-act.active{color:#f472b6;border-color:rgba(244,114,182,.35);background:rgba(244,114,182,.08)}
.tp-act svg{width:14px;height:14px}
.tp-panel-frame{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border:1px solid var(--border-2,rgba(255,255,255,.14));border-radius:20px;padding:26px;margin:26px 0 8px;box-shadow:0 24px 60px -30px rgba(0,0,0,.55)}
.tp-panel-loading{display:flex;align-items:center;justify-content:center;gap:10px;min-height:170px;color:var(--text-faint);font-size:14px}
.tp-panel-loading .dot{width:9px;height:9px;border-radius:50%;background:var(--p1);animation:tpPulse 1s ease-in-out infinite}
@keyframes tpPulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
@media (prefers-reduced-motion: reduce){.tp-panel-loading .dot{animation:none}}
@media (max-width:720px){.tp-panel-frame{padding:14px;border-radius:16px}}

.tp-sec{padding:34px 0 6px}
.tp-sec h2{font-family:var(--fd);font-size:24px;font-weight:700;letter-spacing:-.6px;margin-bottom:6px}
.tp-sec .tp-sub{font-size:14px;color:var(--text-dim);margin-bottom:22px}
.tp-benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px}
.tp-benefit{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px}
.tp-benefit svg{width:20px;height:20px;color:var(--p1);margin-bottom:10px}
.tp-benefit h3{font-size:14.5px;font-weight:700;margin-bottom:6px}
.tp-benefit p{font-size:13px;color:var(--text-dim);line-height:1.55}
.tp-steps{list-style:none;display:grid;gap:10px;counter-reset:step}
.tp-step{display:flex;gap:14px;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px}
.tp-step-n{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:rgba(34,211,238,.13);color:var(--p1);font-family:var(--fd);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
.tp-step h3{font-size:14.5px;font-weight:700;margin-bottom:3px}
.tp-step p{font-size:13px;color:var(--text-dim);line-height:1.55}
.tp-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.tp-feature{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:13px 15px;font-size:13px;font-weight:600}
.tp-feature svg{width:15px;height:15px;color:var(--p1);flex-shrink:0}
.tp-faq details{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0;margin-bottom:8px;overflow:hidden}
.tp-faq summary{cursor:pointer;padding:15px 18px;font-size:14px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px}
.tp-faq summary::-webkit-details-marker{display:none}
.tp-faq summary::after{content:'+';color:var(--p1);font-size:18px;font-weight:400;flex-shrink:0}
.tp-faq details[open] summary::after{content:'\\2212'}
.tp-faq details p{padding:0 18px 15px;font-size:13.5px;color:var(--text-dim);line-height:1.65}
.tp-related{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.tp-rel-card{display:block;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;text-decoration:none;transition:border-color .2s,transform .2s}
.tp-rel-card:hover{border-color:rgba(34,211,238,.35);transform:translateY(-2px)}
.tp-rel-card h3{font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:5px}
.tp-rel-card p{font-size:12.5px;color:var(--text-dim);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tp-rel-card .tp-rel-cta{display:inline-block;margin-top:10px;font-size:12px;font-weight:700;color:var(--p1)}
.tp-guides{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.tp-guide{display:block;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;text-decoration:none;transition:border-color .2s}
.tp-guide:hover{border-color:rgba(34,211,238,.35)}
.tp-guide .tp-g-badge{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--p1);margin-bottom:7px;display:block}
.tp-guide h3{font-size:14px;font-weight:700;color:var(--text);line-height:1.45;margin-bottom:7px}
.tp-guide .tp-g-meta{font-size:11.5px;color:var(--text-faint)}
.tp-cta-band{margin:40px 0 50px;padding:30px;border-radius:18px;background:linear-gradient(120deg,rgba(34,211,238,.08),rgba(99,102,241,.08));border:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
.tp-cta-band h2{font-family:var(--fd);font-size:19px;font-weight:700;letter-spacing:-.4px}
.tp-cta-band p{font-size:13px;color:var(--text-dim);margin-top:4px}
.tp-cta-links{display:flex;gap:10px;flex-wrap:wrap}
.tp-cta-links a{font-size:13.5px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:11px}
.tp-cta-primary{color:#0b0f16;background:var(--grad)}
.tp-cta-ghost{color:var(--text);background:var(--surface);border:1px solid var(--border2)}
@media(max-width:640px){.tp-hero{padding-top:26px}.tp-cta-band{flex-direction:column;align-items:flex-start}}
@media (max-width: 640px) {
  .tp-hero { padding: 26px 0 4px; }
  .tp-hero h1 { margin: 12px 0 8px; }
  .tp-badges { gap: 6px; margin-top: 12px; }
  .tp-chip { font-size: 11px; padding: 3px 9px; }
  .tp-actions { margin-left: 0; width: 100%; margin-top: 6px; }
  .tp-panel-frame { margin: 20px 0 6px; }
  .tp-sec { padding: 26px 0 4px; }
  .tp-sec .tp-sub { margin-bottom: 16px; }
  .breadcrumb { font-size: 12px; padding-top: 16px; }
  .breadcrumb a+a::before, .breadcrumb a+.crumb-current::before { margin: 0 6px; }
}
`;

/* ── 4. Copy logic ported verbatim from app.js buildHowToGuide ──── */
function howtoSteps(t, cat) {
  const inputNoun = { image: 'your image (JPG, PNG, WebP, or similar)', pdf: 'your PDF file', developer: 'your text, code or data', marketing: 'your details', converter: 'your file' }[cat] || 'your file';
  const actionVerb = { image: 'Drop', pdf: 'Drop', converter: 'Drop', developer: 'Paste or type', marketing: 'Enter' }[cat] || 'Drop';
  return [
    ['Open ' + t[1], 'No sign-up or install needed — the tool is ready as soon as the page loads.'],
    [actionVerb + ' ' + inputNoun, actionVerb === 'Drop' ? 'Drag it into the drop zone, or click to browse your files. Nothing is uploaded to a server.' : 'Type or paste directly into the input field.'],
    ['Adjust the settings if needed', 'Most options have a sensible default already selected — change them only if you need something specific.'],
    ['Download your result', 'Your output is ready instantly. Click download to save it — the file never left your device during processing.']
  ];
}

/* General FAQ — personalized per tool, every claim true site-wide */
/* Normalize a question to a comparable key: lowercase, strip punctuation,
   collapse whitespace. Used to dedupe near-identical phrasings, not just
   byte-identical ones (e.g. "Are my files uploaded to a server?" vs
   "Do you upload my files?" both key to the same underlying topic below). */
function faqKey(q) { return q.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); }
const TOPIC_PATTERNS = {
  privacy: /upload|server|leave your device|sent (anywhere|to)/,
  account: /account|sign.?up|log.?in|email required/,
  formats: /format|support(s|ed)?\b.*(file|type)|file type/
};
function topicsIn(q) {
  const k = faqKey(q);
  return Object.keys(TOPIC_PATTERNS).filter(t => TOPIC_PATTERNS[t].test(k));
}

/* General FAQ — personalized per tool, and now CONTEXT-AWARE:
   isFileTool comes from IS_FILE_TOOL, resolved from each tool's actual
   code (not guessed from category/chips — see the classifier above).
   File tools get the concrete "processed locally, never uploaded"
   promise; text/URL/generator tools get input-appropriate wording
   instead of a nonsensical claim about files they don't have. */
/* Real file-format tokens only \u2014 an explicit whitelist, not a shape
   heuristic. A shape check like "short + uppercase" was tried first and
   wrongly passed non-format chips that happen to look format-shaped: HEX,
   CSS, RESIZE, SOCIAL, CANVAS, BRAND are all short/uppercase but describe
   a capability, not a file type, and would still have read as nonsense
   ("works with HEX, CSS"). The actual vocabulary of real formats used
   across every tool's chips is small and enumerable, so a whitelist is
   both more accurate and easier to audit than any pattern. */
const REAL_FORMATS = new Set(['JPG','PNG','WEBP','SVG','PDF','TXT','GIF','ICO','DOCX']);
function isFormatChip(c) {
  if (REAL_FORMATS.has(c)) return true;
  const parts = c.split('\u2192');
  return parts.length === 2 && REAL_FORMATS.has(parts[0]) && REAL_FORMATS.has(parts[1]);
}
function generalFaq(t, cat, isFileTool) {
  const realChips = (t[4] || []).filter(c => isFormatChip(c));
  const chips = realChips.join(', ');
  const out = [
    ['Is ' + t[1] + ' really free?', 'Yes — completely free, with no usage limits, no watermarks and no premium wall. Every tool on Tarumak Studio is free to use.'],
    ['Do I need to create an account?', 'No. There is no sign-up, no login and no email required. Open the tool and use it immediately.']
  ];
  if (isFileTool) {
    out.push(['Are my files uploaded to a server?', 'No. ' + t[1] + ' runs entirely in your browser — your files are processed locally and never uploaded, which also makes it faster than server-based alternatives.']);
    if (chips) out.push(['What formats does it support?', t[1] + ' works with ' + chips + '.']);
  } else {
    out.push(['Is my input sent to a server?', 'No. ' + t[1] + ' processes everything you type or paste locally in your browser — nothing is ever sent to a server.']);
  }
  out.push(['Does it work on mobile?', 'Yes. The tool runs in any modern browser on desktop, tablet or phone — no app install needed.']);
  return out;
}

/* Merge per-tool FAQ with the general bank, deduping by TOPIC (not just
   exact text) so a per-tool question about uploads/accounts/formats
   suppresses the generic version of the same question rather than
   duplicating it. This is the fix for the exact-duplicate bug (identical
   question appearing twice) and the near-duplicate bug (differently
   worded but same-topic questions both appearing). */
function mergeFaq(specificFaq, general) {
  const seenKeys = new Set();
  const seenTopics = new Set();
  const out = [];
  for (const [q, a] of specificFaq) {
    const k = faqKey(q);
    if (seenKeys.has(k)) continue;
    seenKeys.add(k);
    topicsIn(q).forEach(t => seenTopics.add(t));
    out.push([q, a]);
  }
  for (const [q, a] of general) {
    const k = faqKey(q);
    if (seenKeys.has(k)) continue;
    const topics = topicsIn(q);
    if (topics.some(t => seenTopics.has(t))) continue;
    seenKeys.add(k);
    topics.forEach(t => seenTopics.add(t));
    out.push([q, a]);
  }
  return out;
}

const svg = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 3l-4 6 4 12 4-12-4-6"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>'
};

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function trimDesc(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')) + '\u2026';
}
function pageTitle(name) {
  let t = name + ' \u2014 Free Online, No Upload | Tarumak Studio';
  if (t.length > 60) t = name + ' \u2014 Free Online Tool | Tarumak Studio';
  if (t.length > 60) t = name + ' | Tarumak Studio';
  return t;
}

/* ── 5. Per-page schema graph (built as objects → guaranteed valid JSON) ─ */
function schemaGraph(t, faqPairs) {
  const [slug, name, cat, desc] = t;
  const url = `${SITE}/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': url + '#page', url, name: pageTitle(name),
        description: trimDesc(desc, 155), isPartOf: { '@id': SITE + '/#website' },
        dateModified: TODAY
      },
      {
        '@type': 'Organization', '@id': SITE + '/#org', name: 'Tarumak Studio',
        url: SITE, logo: SITE + '/og-image.png'
      },
      {
        '@type': 'SoftwareApplication', '@id': url + '#app', name, url,
        description: desc, applicationCategory: 'WebApplication',
        applicationSubCategory: CAT[cat], operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript', isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: CAT[cat], item: SITE + CAT_PAGE[cat] },
          { '@type': 'ListItem', position: 3, name }
        ]
      },
      {
        '@type': 'FAQPage', mainEntity: faqPairs.map(([q, a]) => ({
          '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a }
        }))
      }
    ]
  };
}

/* ── 6. Page assembly ──────────────────────────────────────────── */
function buildPage(t) {
  const [slug, name, cat, desc, chips] = t;
  const url = `${SITE}/${slug}`;
  const title = pageTitle(name);
  const metaDesc = trimDesc(desc, 155);

  const specificFaq = (FAQ && FAQ[slug]) ? FAQ[slug] : [];
  const isFileTool = !!IS_FILE_TOOL[slug];
  const faqPairs = mergeFaq(specificFaq, generalFaq(t, cat, isFileTool)).slice(0, 12);

  const related = TOOLS.filter(x => x[2] === cat && x[0] !== slug)
    .sort((a, b) => (FEAT_SET.has(b[0]) ? 1 : 0) - (FEAT_SET.has(a[0]) ? 1 : 0))
    .slice(0, 6);

  const guideSlugs = (TOOL_ARTICLES && TOOL_ARTICLES[slug]) || [];
  const guides = guideSlugs.map(g => ({ slug: g, meta: ARTICLES[g] })).filter(g => g.meta);

  const steps = howtoSteps(t, cat);
  /* Privacy + formats copy branches on IS_FILE_TOOL (code-derived, not
     guessed) so a text tool like UTM Builder or JSON Formatter is never
     told "your files never upload" \u2014 it has no files, only typed
     or pasted input. */
  const inputWord = isFileTool ? 'files' : 'input';
  const benefits = [
    [svg.monitor, '100% in your browser', name + ' runs locally on your device \u2014 there is no server doing the work, so there is nothing to queue for and nothing to trust with your ' + inputWord + '.'],
    [svg.shield, 'Private by architecture', isFileTool
      ? 'Your files are processed locally in your browser and never uploaded. That is not a policy promise \u2014 it is how the tool is built.'
      : 'Your input is processed locally in your browser and never sent anywhere. That is not a policy promise \u2014 it is how the tool is built.'],
    [svg.zap, 'Instant results', isFileTool
      ? 'No upload wait, no processing queue, no download-from-server step. The only speed limit is your own device.'
      : 'No round-trip to a server for every keystroke or click. The only speed limit is your own device.'],
    [svg.gem, 'Full quality output', 'You get exactly what the tool produces \u2014 no watermarks, no resolution caps, no premium-only quality tiers.'],
    [svg.layers, isFileTool ? 'Formats covered' : 'Built for', (() => {
      if (isFileTool) {
        const realChips = (chips || []).filter(c => isFormatChip(c));
        return realChips.length ? ('Works with ' + realChips.join(', ') + '.') : 'Common formats supported out of the box.';
      }
      return (chips && chips.length) ? (name + ' covers ' + chips.join(', ').toLowerCase() + '.') : 'Built for real-world marketing and content workflows.';
    })()]
  ];
  const features = ['100% browser-based', 'Free forever', 'No sign-up', 'Privacy safe', 'Instant processing', 'Works on mobile'];

  const schema = schemaGraph(t, faqPairs);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(metaDesc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Tarumak Studio">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(metaDesc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Tarumak Studio \u2014 66+ free browser tools. Nothing uploaded.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(metaDesc)}">
  <meta name="twitter:image" content="${SITE}/og-image.png">
  ${HEAD_LINKS}
  <link rel="stylesheet" href="/tools.css">
  <style>${TOOL_CSS}</style>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body data-tool-slug="${slug}" data-tool-name="${esc(name)}">
${CHROME_TOP}
<main>
  <div class="tp-wrap">

    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <a href="${CAT_PAGE[cat]}">${esc(CAT[cat])}</a>
      <span class="crumb-current" aria-current="page">${esc(name)}</span>
    </nav>

    <section class="tp-hero">
      <h1>${esc(name)}</h1>
      <p class="tp-lead">${esc(desc)}</p>
      <div class="tp-badges">
        <a class="tp-cat-badge" href="${CAT_PAGE[cat]}">${esc(CAT[cat])}</a>
        ${(chips || []).map(c => `<span class="tp-chip">${esc(c)}</span>`).join('')}
        <div class="tp-actions">
          <button class="tp-act" id="tpFav" data-slug="${slug}" aria-label="Save ${esc(name)} to favourites" aria-pressed="false">${svg.heart}<span id="tpFavLabel">Save</span></button>
          <button class="tp-act" id="tpShare" aria-label="Share ${esc(name)}">${svg.share}<span id="tpShareLabel">Share</span></button>
        </div>
      </div>
    </section>

    <section class="tp-mount" aria-label="${esc(name)} tool">
      <div id="toolPanel" class="tp-panel-frame">
        <div class="tp-panel-loading"><span class="dot"></span><span class="dot" style="animation-delay:.18s"></span><span class="dot" style="animation-delay:.36s"></span>Loading ${esc(name)}\u2026</div>
        <noscript><p style="text-align:center;color:var(--text-dim);padding:20px">This tool runs entirely in your browser and needs JavaScript enabled.</p></noscript>
      </div>
    </section>

    <section class="tp-sec" aria-labelledby="tp-why">
      <h2 id="tp-why">Why use ${esc(name)}?</h2>
      <p class="tp-sub">Built browser-first \u2014 which changes what you can expect from a free tool.</p>
      <div class="tp-benefits">
        ${benefits.map(b => `<div class="tp-benefit">${b[0]}<h3>${esc(b[1])}</h3><p>${esc(b[2])}</p></div>`).join('\n        ')}
      </div>
    </section>

    <section class="tp-sec" aria-labelledby="tp-how">
      <h2 id="tp-how">How to use ${esc(name)}</h2>
      <p class="tp-sub">Four steps, no learning curve.</p>
      <ol class="tp-steps">
        ${steps.map((s, i) => `<li class="tp-step"><span class="tp-step-n" aria-hidden="true">${i + 1}</span><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div></li>`).join('\n        ')}
      </ol>
    </section>

    <section class="tp-sec" aria-labelledby="tp-feat">
      <h2 id="tp-feat">Features</h2>
      <p class="tp-sub">Everything included, nothing gated.</p>
      <div class="tp-features">
        ${features.map(f => `<div class="tp-feature">${svg.check}${esc(f)}</div>`).join('\n        ')}
      </div>
    </section>

    <section class="tp-sec tp-faq" aria-labelledby="tp-faq-h">
      <h2 id="tp-faq-h">Frequently asked questions</h2>
      <p class="tp-sub">About ${esc(name)} and how Tarumak Studio works.</p>
      ${faqPairs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </section>

    ${related.length ? `<section class="tp-sec" aria-labelledby="tp-rel">
      <h2 id="tp-rel">Related tools</h2>
      <p class="tp-sub">More free ${esc(CAT[cat]).toLowerCase()} \u2014 same privacy, same price.</p>
      <div class="tp-related">
        ${related.map(r => `<a class="tp-rel-card" href="/${r[0]}"><h3>${esc(r[1])}</h3><p>${esc(r[3])}</p><span class="tp-rel-cta">Try Tool \u2192</span></a>`).join('\n        ')}
      </div>
    </section>` : ''}

    ${guides.length ? `<section class="tp-sec" aria-labelledby="tp-guides">
      <h2 id="tp-guides">Related guides</h2>
      <p class="tp-sub">From the Tarumak Studio blog.</p>
      <div class="tp-guides">
        ${guides.map(g => `<a class="tp-guide" href="${g.meta.url.replace(SITE, '')}"><span class="tp-g-badge">Guide</span><h3>${esc(g.meta.title)}</h3><span class="tp-g-meta">${esc(g.meta.date)} \u00B7 ${esc(g.meta.read)} read</span></a>`).join('\n        ')}
      </div>
    </section>` : ''}

    <section class="tp-cta-band" aria-label="Explore more tools">
      <div>
        <h2>Keep going \u2014 there are ${TOOLS.length} tools here</h2>
        <p>All free, all browser-based, none of them ever see your files.</p>
      </div>
      <div class="tp-cta-links">
        <a class="tp-cta-primary" href="${CAT_PAGE[cat]}">More ${esc(CAT[cat])}</a>
        <a class="tp-cta-ghost" href="/#tools">Browse all tools</a>
      </div>
    </section>

  </div>
</main>
${FOOTER}

<div id="cookie-bar" role="region" aria-label="Cookie consent">
  <p>We use localStorage to remember your theme preference and recently-used tools. No cookies are set. No personal data is collected. <a href="/cookie-policy">Cookie Policy</a> \u00b7 <a href="/privacy-policy">Privacy Policy</a></p>
  <div class="cb-btns">
    <button class="cb-decline" id="cb-decline">Decline</button>
    <button class="cb-accept" id="cb-accept">Accept</button>
  </div>
</div>
<script>
(function(){
  /* Favourite — shares the SPA's exact localStorage contract (tmk_favs) */
  var FK='tmk_favs', btn=document.getElementById('tpFav'), lbl=document.getElementById('tpFavLabel');
  function favs(){try{return JSON.parse(localStorage.getItem(FK)||'[]');}catch(e){return [];}}
  function paint(){var on=favs().indexOf(btn.getAttribute('data-slug'))>-1;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on?'true':'false');lbl.textContent=on?'Saved':'Save';}
  btn.addEventListener('click',function(){
    var slug=btn.getAttribute('data-slug'),f=favs(),i=f.indexOf(slug);
    if(i>-1)f.splice(i,1);else f.push(slug);
    try{localStorage.setItem(FK,JSON.stringify(f));}catch(e){}
    paint();
  });
  paint();
  /* Share — native sheet where available, clipboard fallback */
  var sh=document.getElementById('tpShare'), shl=document.getElementById('tpShareLabel');
  sh.addEventListener('click',function(){
    var data={title:document.title,url:location.href};
    if(navigator.share){navigator.share(data).catch(function(){});}
    else if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(function(){shl.textContent='Copied!';setTimeout(function(){shl.textContent='Share';},1600);});}
  });
})();
</script>
${CDN_TAGS}
<script src="/config.js" defer></script>
<script src="/utils.js" defer></script>
<script src="/tool-helpers.js" defer></script>
<script src="/data.js" defer></script>
<script src="/pdf-tools.js" defer></script>
<script src="/image-tools.js" defer></script>
<script src="/converter-tools.js" defer></script>
<script src="/marketing-tools.js" defer></script>
<script src="/developer-tools.js" defer></script>
<script src="/features.js" defer></script>
<script src="/static-tool-bootstrap.js" defer></script>
</body>
</html>`;
}

/* ── 7. Generate all pages ─────────────────────────────────────── */
let written = 0;
for (const t of TOOLS) {
  fs.writeFileSync(t[0] + '.html', buildPage(t));
  written++;
}
console.log(`Wrote ${written} tool pages`);

/* ── 8. Sitemaps (index + three children) ──────────────────────── */
function urlset(urls) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod || TODAY}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n') +
    '\n</urlset>\n';
}
fs.writeFileSync('sitemap-tools.xml', urlset(TOOLS.map(t => ({ loc: `${SITE}/${t[0]}`, freq: 'monthly', pri: '0.9' }))));

const articleFiles = fs.readdirSync('.').filter(f => /^article-.*\.html$/.test(f) && f !== 'article-social-media-image-sizes.html');
fs.writeFileSync('sitemap-articles.xml', urlset(articleFiles.map(f => ({ loc: `${SITE}/${f.replace(/\.html$/, '')}`, freq: 'yearly', pri: '0.6' }))));

const pages = [
  { loc: SITE + '/', freq: 'weekly', pri: '1.0' },
  ...Object.values(CAT_PAGE).map(p => ({ loc: SITE + p, freq: 'monthly', pri: '0.8' })),
  ...['/blog', '/about', '/contact', '/work-with-me', '/changelog'].map(p => ({ loc: SITE + p, freq: 'monthly', pri: '0.5' })),
  ...['/privacy-policy', '/terms', '/cookie-policy'].map(p => ({ loc: SITE + p, freq: 'yearly', pri: '0.3' }))
];
fs.writeFileSync('sitemap-pages.xml', urlset(pages));

fs.writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  ['tools', 'articles', 'pages'].map(n => `  <sitemap><loc>${SITE}/sitemap-${n}.xml</loc><lastmod>${TODAY}</lastmod></sitemap>`).join('\n') +
  '\n</sitemapindex>\n');
console.log(`Sitemaps: index + tools(${TOOLS.length}) + articles(${articleFiles.length}) + pages(${pages.length})`);


/* ── 9. Same-deploy schema fix: homepage ItemList must point at the REAL
   tool URLs the moment they exist (never before, never after) ─────── */
let idx = fs.readFileSync('index.html', 'utf8');
const beforeCount = (idx.match(/#\/t\//g) || []).length;
idx = idx.replace(/https:\/\/tarumakstudio\.com\/#\/t\//g, 'https://tarumakstudio.com/');
idx = idx.replace('"numberOfItems": 63', '"numberOfItems": ' + TOOLS.length);
fs.writeFileSync('index.html', idx);
console.log(`index.html: ${beforeCount} hash tool URLs -> real URLs; numberOfItems -> ${TOOLS.length}`);
