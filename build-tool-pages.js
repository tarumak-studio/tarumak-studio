/* build-tool-pages.js — Tarumak Studio static tool-page generator
 *
 * Usage:   node build-tool-pages.js
 * Output:  ./{slug}.html for every tool in data.js (66 today, N tomorrow)
 *          ./sitemap.xml (index) + sitemap-tools.xml + sitemap-articles.xml + sitemap-pages.xml
 *
 * Design contract:
 *  - Zero new content invention for facts: every claim in TOOL_META
 *    (tool-content.js) was checked against that tool's real INIT[]
 *    code before being written. Category-level fallback content
 *    (CAT_DEFAULTS) is generic-but-true, never a specific mechanic
 *    that isn't verified for every tool in the category.
 *  - Zero new design language: header/mob-menu/footer/styles are
 *    harvested from index.html via header-chrome.js at build time.
 *  - VARIANT SYSTEM (see tool-content.js + TOOL-VARIANT-SYSTEM.md):
 *    each tool renders one of 6 hero types and one of 4 section-
 *    composition variants (A/B/C/D), driven by data, not by four
 *    copy-pasted template functions. TOOL_META overrides the 7
 *    hand-verified flagship tools; every other tool falls back to
 *    its category's CAT_DEFAULTS with a deterministic (slug-seeded,
 *    not random) pick from that category's content pools — so no
 *    two tools in the same category render the identical benefit
 *    set in the identical order, without fabricating per-tool specifics
 *    that haven't been individually verified.
 *  - Adding tool #67 to data.js and re-running this script is still
 *    the entire process for shipping its SEO page; optionally adding
 *    a TOOL_META entry is how it gets the full-fidelity treatment.
 *
 * Dependency-free (node stdlib only).
 */
'use strict';
const fs = require('fs');
const vm = require('vm');

const SITE = 'https://tarumakstudio.com';
const TODAY = new Date().toISOString().slice(0, 10);

/* ── 1. Capture data from data.js + blog-data.js + tool-content.js ── */
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

/* Variant-system data — see tool-content.js for the full rationale. */
const V = capture(['tool-content.js'], ['CAT_DEFAULTS', 'WORKFLOW_NEXT', 'TOOL_META']);
if (!V.CAT_DEFAULTS || !V.TOOL_META) throw new Error('tool-content.js capture failed');
const { CAT_DEFAULTS, WORKFLOW_NEXT, TOOL_META } = V;
console.log(`Variant data: ${Object.keys(TOOL_META).length} flagship tools, ${Object.keys(CAT_DEFAULTS).length} category defaults, ${Object.keys(WORKFLOW_NEXT).length} workflow maps`);

/* Validate WORKFLOW_NEXT the same way header-chrome.js validates
   CAT_META.popular — throw at build time on a stale slug rather than
   silently rendering a dead link (the exact bug class that shipped
   undetected in the old mega-menu bake). */
const TOOLS_BY_SLUG = {};
TOOLS.forEach(t => { TOOLS_BY_SLUG[t[0]] = t; });
Object.entries(WORKFLOW_NEXT).forEach(([slug, list]) => {
  if (!TOOLS_BY_SLUG[slug]) throw new Error(`WORKFLOW_NEXT: unknown source slug "${slug}"`);
  list.forEach(s => { if (!TOOLS_BY_SLUG[s]) throw new Error(`WORKFLOW_NEXT["${slug}"]: unknown target slug "${s}"`); });
});
Object.entries(TOOL_META).forEach(([slug]) => { if (!TOOLS_BY_SLUG[slug]) throw new Error(`TOOL_META: unknown slug "${slug}"`); });

/* Deterministic (slug-seeded, not random) pool picker — see
   tool-content.js for why: reproducible builds, real per-tool variety. */
function slugHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function seededPick(pool, n, seed) {
  const arr = pool.slice();
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) & 0x7fffffff; const j = s % (i + 1); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr.slice(0, Math.min(n, arr.length));
}

const CAT_PAGE = { image: '/image-tools', pdf: '/pdf-tools', developer: '/developer-tools', marketing: '/marketing-tools', converter: '/converter-tools' };
const CAT_JS = { image: 'image-tools.js', pdf: 'pdf-tools.js', converter: 'converter-tools.js', marketing: 'marketing-tools.js', developer: 'developer-tools.js' };

/* ── 1b. FILE-vs-TEXT classification, derived from the actual tool code ──
   Unchanged from the original build script — see the inline comments
   below for why this is derived from real code, not guessed. */
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

/* ── 2. Chrome: from the shared header-chrome module ──────────────── */
const { getChrome, withActiveNav } = require('./header-chrome.js');
const { CHROME_TOP: CHROME_TOP_BASE, FOOTER, HEAD_LINKS, CDN_TAGS, MEGA_MENU_SCRIPT } = getChrome();
const CHROME_TOP = withActiveNav(CHROME_TOP_BASE, 'all');
console.log(`Chrome: header+menu ${CHROME_TOP.length}c, footer ${FOOTER.length}c, links ${HEAD_LINKS ? 'ok' : 'MISSING'}`);

/* ── 3. Page-specific CSS (tokens only from :root — no new palette) ─
   Unchanged from the original except for the new .tp-var-* selectors,
   which live in tool-variants.css (loaded via HEAD_LINKS_TOOL below)
   rather than duplicated inline on every page. */
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

/* ── 4. Copy logic ported verbatim from app.js buildHowToGuide (kept
   as the fallback for any tool with no TOOL_META.howTo) ──────────── */
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

/* General FAQ — personalized per tool, every claim true site-wide.
   Unchanged from the original. */
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
const REAL_FORMATS = new Set(['JPG', 'PNG', 'WEBP', 'SVG', 'PDF', 'TXT', 'GIF', 'ICO', 'DOCX']);
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

/* ── Icon set — extended from the original with a few new glyphs the
   variant system needs (arrowRight for the convert hero, bulb/alert
   for tips vs. common mistakes). Same hand-authored inline-SVG,
   Lucide-style stroke language as everywhere else on the site. ── */
const svg = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 3l-4 6 4 12 4-12-4-6"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.55 1 1.32 1 2.5h6c0-1.18.4-1.95 1-2.5A6 6 0 0 0 12 2z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  compareIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3m0-8V5a2 2 0 0 0-2-2h-3"/></svg>'
};
const BENEFIT_ICON = { zap: svg.zap, monitor: svg.monitor, gem: svg.gem, layers: svg.layers, shield: svg.shield, heart: svg.heart };

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
function fillTemplate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
}

/* ── 4b. Meta resolution — TOOL_META override, else CAT_DEFAULTS
   fallback with a deterministic per-tool pick from the category pool. */
function resolveMeta(t) {
  const [slug, name, cat, desc, chips] = t;
  const isFileTool = !!IS_FILE_TOOL[slug];
  const flagship = TOOL_META[slug];
  const catDef = CAT_DEFAULTS[cat] || CAT_DEFAULTS.image;
  const seed = slugHash(slug);
  const realChips = (chips || []).filter(c => isFormatChip(c));
  const vars = { name, formats: realChips.length ? realChips.join(', ') : (isFileTool ? 'common formats' : 'real-world input') };

  const benefits = flagship && flagship.benefits
    ? flagship.benefits.map(([ic, ti, de]) => [BENEFIT_ICON[ic] || svg.zap, ti, de])
    : seededPick(catDef.benefitPool, 4, seed).map(([ic, ti, de]) => [BENEFIT_ICON[ic] || svg.zap, fillTemplate(ti, vars), fillTemplate(de, vars)]);

  const features = flagship && flagship.features ? flagship.features : seededPick(catDef.featurePool, 6, seed + 7);
  const useCases = flagship && flagship.useCases ? flagship.useCases : seededPick(catDef.useCasePool, 4, seed + 13);
  const howTo = flagship && flagship.howTo ? flagship.howTo : howtoSteps(t, cat);
  const tips = (flagship && flagship.tips) || catDef.tipsPool || [];
  const mistakes = (flagship && flagship.mistakes) || catDef.mistakePool || [];
  const comparisonIntro = (flagship && flagship.comparisonIntro) || (catDef.comparisonIntro ? fillTemplate(catDef.comparisonIntro, vars) : null);
  const ctaVerb = (flagship && flagship.ctaVerb) || catDef.ctaVerb || 'Try another tool';
  const hero = (flagship && flagship.hero) || catDef.hero || 'compare';
  const heroVariant = (flagship && flagship.heroVariant) || null;
  const variant = (flagship && flagship.variant) || catDef.variant || 'A';
  const accent = (flagship && flagship.accent) || catDef.accent || '#22d3ee';
  const workflowSteps = flagship && flagship.howTo ? flagship.howTo : (catDef.workflowSteps || []).map(s => [s, '']);

  return { slug, name, cat, desc, chips, isFileTool, benefits, features, useCases, howTo, tips, mistakes, comparisonIntro, ctaVerb, hero, heroVariant, variant, accent, workflowSteps };
}

/* ── 5. Hero renderers — one per hero type. All decorative: the real,
   functional tool lives in #toolPanel right below; these illustrate
   what the tool does, they don't have to BE the tool. ── */
function heroCompare(meta) {
  const cbClass = meta.heroVariant === 'checkerboard' ? ' tp-compare--checkerboard' : meta.heroVariant === 'meter' ? ' tp-compare--meter' : '';
  const meterAttrs = meta.heroVariant === 'meter' ? ' data-meter-before="2.4 MB" data-meter="640 KB"' : '';
  return `<div class="tp-compare${cbClass}"${meterAttrs}>
    <div class="tp-compare-before"><span class="tp-compare-icon">${svg.compareIcon}</span></div>
    <div class="tp-compare-after"><span class="tp-compare-icon">${svg.compareIcon}</span></div>
    <div class="tp-compare-divider"></div>
    <div class="tp-compare-handle">${svg.arrowRight}</div>
    <span class="tp-compare-label is-before">Before</span>
    <span class="tp-compare-label is-after">After</span>
    <input type="range" class="tp-compare-range" min="0" max="100" value="50" aria-label="Drag to compare before and after">
  </div>`;
}
function heroScan(meta, langs) {
  const badges = (langs || ['English', 'Hindi', 'French', 'Spanish']).map((l, i) => `<span class="tp-scan-lang${i < 2 ? ' is-live' : ''}">${esc(l)}</span>`).join('');
  return `<div class="tp-scan">
    <div class="tp-scan-doc" aria-hidden="true">
      <div class="tp-scan-beam"></div>
      <div class="tp-scan-line"></div><div class="tp-scan-line"></div><div class="tp-scan-line"></div><div class="tp-scan-line"></div><div class="tp-scan-line"></div>
    </div>
    <div class="tp-scan-langs">${badges}</div>
  </div>`;
}
function heroWorkflow(meta) {
  const mergeClass = meta.heroVariant === 'stack' ? ' tp-stack--merge' : '';
  return `<div class="tp-stack${mergeClass}" aria-hidden="true">
    <div class="tp-stack-page"></div><div class="tp-stack-page"></div><div class="tp-stack-page"></div>
  </div>`;
}
function heroCode(meta) {
  const lines = [
    ['<span class="tp-tok-punc">{</span>', ''],
    [`  <span class="tp-tok-key">"tool"</span><span class="tp-tok-punc">:</span> <span class="tp-tok-str">"${esc(meta.name)}"</span><span class="tp-tok-punc">,</span>`, ''],
    ['  <span class="tp-tok-key">"processed"</span><span class="tp-tok-punc">:</span> <span class="tp-tok-key">"locally"</span><span class="tp-tok-punc">,</span>', ''],
    ['  <span class="tp-tok-key">"valid"</span><span class="tp-tok-punc">:</span> <span class="tp-tok-ok">true</span>', ''],
    ['<span class="tp-tok-punc">}</span>', '']
  ];
  return `<div class="tp-code">
    <div class="tp-code-bar"><span class="tp-code-dot"></span><span class="tp-code-dot"></span><span class="tp-code-dot"></span></div>
    <div class="tp-code-body">${lines.map(l => `<div class="tp-code-line">${l[0]}</div>`).join('')}</div>
  </div>`;
}
function heroLive(meta) {
  if (meta.heroVariant === 'social-card') {
    return `<div class="tp-live" aria-hidden="true">
      <div class="tp-live-card"><div class="tp-live-title"></div><div class="tp-live-sub"></div><div class="tp-live-badge"></div></div>
    </div>`;
  }
  const cells = Array.from({ length: 25 }, (_, i) => `<span class="${[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].indexOf(i) > -1 ? 'on' : ''}"></span>`).join('');
  return `<div class="tp-live" aria-hidden="true">
    <div class="tp-live-qr">${cells}</div>
    <div class="tp-live-card"><div class="tp-live-title"></div><div class="tp-live-sub"></div></div>
  </div>`;
}
/* Hero badges are decorative, not a factual claim requiring the FAQ's
   strict REAL_FORMATS bar — so this is deliberately a superset (adds
   HTML/IMG/HEX/RGB/MARKDOWN), checked against every converter-category
   tool's actual chips rather than guessed. */
const HERO_FORMATS = new Set([...REAL_FORMATS, 'HTML', 'IMG', 'HEX', 'RGB', 'MARKDOWN']);
function convertFromTo(chips) {
  for (const c of (chips || [])) {
    const parts = c.split(/[\u2192\u21d2]/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 2 && HERO_FORMATS.has(parts[0]) && HERO_FORMATS.has(parts[1])) return parts;
  }
  const realOnly = (chips || []).filter(c => HERO_FORMATS.has(c));
  if (realOnly.length >= 2) return [realOnly[0], realOnly[1]];
  return ['INPUT', 'OUTPUT'];
}
function heroConvert(meta) {
  const [from, to] = convertFromTo(meta.chips);
  return `<div class="tp-convert" aria-hidden="true">
    <div class="tp-convert-badge">${esc(from)}</div>
    <svg class="tp-convert-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
    <div class="tp-convert-badge is-target">${esc(to)}</div>
  </div>`;
}
const HERO_RENDERERS = { compare: heroCompare, scan: heroScan, workflow: heroWorkflow, code: heroCode, live: heroLive, convert: heroConvert };
function renderHero(meta) {
  const fn = HERO_RENDERERS[meta.hero] || heroCompare;
  const langs = meta.slug === 'ocr-image-to-text' ? ['English', 'Hindi', 'French', 'German', 'Spanish', 'Japanese', 'Chinese (Simplified)', 'Arabic'] : null;
  const inner = meta.hero === 'scan' ? heroScan(meta, langs) : fn(meta);
  return `<div class="tp-hero-visual" style="--tp-accent:${meta.accent}">${inner}</div>`;
}

/* ── 6. New content-block renderers ── */
function renderUseCases(meta) {
  return `<section class="tp-sec" aria-labelledby="tp-uc">
      <h2 id="tp-uc">Where ${esc(meta.name)} actually gets used</h2>
      <p class="tp-sub">Real situations this tool is built for.</p>
      <div class="tp-usecases">
        ${meta.useCases.map(([t, d]) => `<div class="tp-usecase"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n        ')}
      </div>
    </section>`;
}
function renderTips(meta) {
  if (!meta.tips.length && !meta.mistakes.length) return '';
  const col = (title, icon, items, cls) => !items.length ? '' : `<div class="tp-tips-col">
        <h3>${icon}${esc(title)}</h3>
        <ul class="tp-tip-list">
          ${items.map(i => `<li class="tp-tip-item ${cls}">${cls === 'is-tip' ? svg.bulb : svg.alert}<span>${esc(i)}</span></li>`).join('\n          ')}
        </ul>
      </div>`;
  return `<section class="tp-sec" aria-labelledby="tp-tips">
      <h2 id="tp-tips">Get better results</h2>
      <p class="tp-sub">Tips from how ${esc(meta.name)} actually works, and mistakes worth avoiding.</p>
      <div class="tp-tips-grid">
        ${col('Pro tips', svg.bulb, meta.tips, 'is-tip')}
        ${col('Common mistakes', svg.alert, meta.mistakes, 'is-mistake')}
      </div>
    </section>`;
}
function renderComparison(meta) {
  if (!meta.comparisonIntro) return '';
  return `<div class="tp-comparison">
      <p>${esc(meta.comparisonIntro)}</p>
    </div>`;
}
function renderWorkflow(meta) {
  if (!meta.workflowSteps.length) return '';
  return `<section class="tp-sec" aria-labelledby="tp-wf">
      <h2 id="tp-wf">How it fits your workflow</h2>
      <p class="tp-sub">Step by step, using ${esc(meta.name)}.</p>
      <div class="tp-workflow-timeline">
        ${meta.workflowSteps.map(([t, d]) => `<div class="tp-workflow-step"><h3>${esc(t)}</h3>${d ? `<p>${esc(d)}</p>` : ''}</div>`).join('\n        ')}
      </div>
    </section>`;
}
function renderBenefits(meta, limit) {
  const list = limit ? meta.benefits.slice(0, limit) : meta.benefits;
  return `<section class="tp-sec" aria-labelledby="tp-why">
      <h2 id="tp-why">Why use ${esc(meta.name)}?</h2>
      <p class="tp-sub">Built browser-first \u2014 which changes what you can expect from a free tool.</p>
      <div class="tp-benefits">
        ${list.map(b => `<div class="tp-benefit">${b[0]}<h3>${esc(b[1])}</h3><p>${esc(b[2])}</p></div>`).join('\n        ')}
      </div>
    </section>`;
}
function renderHowTo(meta) {
  return `<section class="tp-sec" aria-labelledby="tp-how">
      <h2 id="tp-how">How to use ${esc(meta.name)}</h2>
      <p class="tp-sub">${meta.howTo.length} step${meta.howTo.length === 1 ? '' : 's'}, no learning curve.</p>
      <ol class="tp-steps">
        ${meta.howTo.map((s, i) => `<li class="tp-step"><span class="tp-step-n" aria-hidden="true">${i + 1}</span><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div></li>`).join('\n        ')}
      </ol>
    </section>`;
}
function renderFeatures(meta) {
  return `<section class="tp-sec" aria-labelledby="tp-feat">
      <h2 id="tp-feat">Features</h2>
      <p class="tp-sub">Everything included, nothing gated.</p>
      <div class="tp-features">
        ${meta.features.map(f => `<div class="tp-feature">${svg.check}${esc(f)}</div>`).join('\n        ')}
      </div>
    </section>`;
}

/* Section-composition variants — the brief's A/B/C/D, implemented as
   one data-driven dispatcher (not four copy-pasted template
   functions), so adding a variant E is a data change, not a new
   function to keep in sync with the other four. */
const SECTION_COMPOSITION = {
  A: ['benefits', 'howto', 'usecases'],
  B: ['comparison', 'benefits3', 'guides'],
  C: ['tips'],
  D: ['usecases', 'workflow', 'guides']
};
function renderSection(key, meta) {
  switch (key) {
    case 'benefits': return renderBenefits(meta);
    case 'benefits3': return renderBenefits(meta, 3);
    case 'howto': return renderHowTo(meta);
    case 'usecases': return renderUseCases(meta);
    case 'tips': return renderTips(meta);
    case 'comparison': return meta.comparisonIntro ? `<section class="tp-sec" aria-label="Comparison">${renderComparison(meta)}</section>` : '';
    case 'workflow': return renderWorkflow(meta);
    case 'guides': return ''; /* rendered separately below — needs guide data, not just meta */
    default: return '';
  }
}

/* ── 7. Per-page schema graph — unchanged from the original ── */
function schemaGraph(t, faqPairs) {
  const [slug, name, cat, desc] = t;
  const url = `${SITE}/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url + '#page', url, name: pageTitle(name), description: trimDesc(desc, 155), isPartOf: { '@id': SITE + '/#website' }, dateModified: TODAY },
      { '@type': 'Organization', '@id': SITE + '/#org', name: 'Tarumak Studio', url: SITE, logo: SITE + '/og-image.png' },
      { '@type': 'SoftwareApplication', '@id': url + '#app', name, url, description: desc, applicationCategory: 'WebApplication', applicationSubCategory: CAT[cat], operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: CAT[cat], item: SITE + CAT_PAGE[cat] }, { '@type': 'ListItem', position: 3, name }] },
      { '@type': 'FAQPage', mainEntity: faqPairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

/* ── 8. Page assembly ──────────────────────────────────────────── */
function buildPage(t) {
  const [slug, name, cat, desc, chips] = t;
  const url = `${SITE}/${slug}`;
  const title = pageTitle(name);
  const metaDesc = trimDesc(desc, 155);
  const meta = resolveMeta(t);

  const specificFaq = (FAQ && FAQ[slug]) ? FAQ[slug] : [];
  const faqPairs = mergeFaq(specificFaq, generalFaq(t, cat, meta.isFileTool)).slice(0, 12);

  /* Related tools: WORKFLOW_NEXT (cross-category, curated) when this
     slug has an entry; same-category fallback otherwise — identical
     fallback logic to the original script. */
  const related = (WORKFLOW_NEXT[slug] ? WORKFLOW_NEXT[slug].map(s => TOOLS_BY_SLUG[s]).filter(Boolean)
    : TOOLS.filter(x => x[2] === cat && x[0] !== slug).sort((a, b) => (FEAT_SET.has(b[0]) ? 1 : 0) - (FEAT_SET.has(a[0]) ? 1 : 0))
  ).slice(0, 6);

  const guideSlugs = (TOOL_ARTICLES && TOOL_ARTICLES[slug]) || [];
  const guides = guideSlugs.map(g => ({ slug: g, meta: ARTICLES[g] })).filter(g => g.meta);

  const schema = schemaGraph(t, faqPairs);
  const composition = SECTION_COMPOSITION[meta.variant] || SECTION_COMPOSITION.A;

  const guidesHTML = guides.length ? `<section class="tp-sec" aria-labelledby="tp-guides">
      <h2 id="tp-guides">Related guides</h2>
      <p class="tp-sub">From the Tarumak Studio blog.</p>
      <div class="tp-guides">
        ${guides.map(g => `<a class="tp-guide" href="${g.meta.url.replace(SITE, '')}"><span class="tp-g-badge">Guide</span><h3>${esc(g.meta.title)}</h3><span class="tp-g-meta">${esc(g.meta.date)} \u00B7 ${esc(g.meta.read)} read</span></a>`).join('\n        ')}
      </div>
    </section>` : '';

  /* 'guides' is the one composition key needing data other than meta
     (the actual guide objects), so it's substituted here rather than
     inside renderSection — this is also what makes variant C (which
     never lists 'guides') correctly show no guides section at all. */
  const middleHTML = composition.map(k => k === 'guides' ? guidesHTML : renderSection(k, meta)).filter(Boolean).join('\n\n    ');

  const relatedHTML = related.length ? `<section class="tp-sec" aria-labelledby="tp-rel">
      <h2 id="tp-rel">Related tools</h2>
      <p class="tp-sub">${WORKFLOW_NEXT[slug] ? 'What people typically reach for next.' : `More free ${esc(CAT[cat]).toLowerCase()} \u2014 same privacy, same price.`}</p>
      <div class="tp-related">
        ${related.map(r => `<a class="tp-rel-card" href="/${r[0]}"><h3>${esc(r[1])}</h3><p>${esc(r[3])}</p><span class="tp-rel-cta">Try Tool \u2192</span></a>`).join('\n        ')}
      </div>
    </section>` : '';

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
  <link rel="stylesheet" href="/tool-variants.css">
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
      ${renderHero(meta)}
    </section>

    <section class="tp-mount" aria-label="${esc(name)} tool">
      <div id="toolPanel" class="tp-panel-frame">
        <div class="tp-panel-loading"><span class="dot"></span><span class="dot" style="animation-delay:.18s"></span><span class="dot" style="animation-delay:.36s"></span>Loading ${esc(name)}\u2026</div>
        <noscript><p style="text-align:center;color:var(--text-dim);padding:20px">This tool runs entirely in your browser and needs JavaScript enabled.</p></noscript>
      </div>
    </section>

    ${middleHTML}

    <section class="tp-sec tp-faq" aria-labelledby="tp-faq-h">
      <h2 id="tp-faq-h">Frequently asked questions</h2>
      <p class="tp-sub">About ${esc(name)} and how Tarumak Studio works.</p>
      ${faqPairs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </section>

    ${relatedHTML}

    <section class="tp-cta-band" aria-label="Explore more tools">
      <div>
        <h2>${esc(meta.ctaVerb)}</h2>
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
${MEGA_MENU_SCRIPT}
<script src="/tool-hero.js" defer></script>
<script src="/static-tool-bootstrap.js" defer></script>
</body>
</html>`;
}

/* ── 9. Generate all pages ─────────────────────────────────────── */
let written = 0;
const variantCounts = {};
for (const t of TOOLS) {
  fs.writeFileSync(t[0] + '.html', buildPage(t));
  const m = resolveMeta(t);
  variantCounts[m.variant] = (variantCounts[m.variant] || 0) + 1;
  written++;
}
console.log(`Wrote ${written} tool pages`);
console.log('Variant distribution:', variantCounts);

/* ── 10. Sitemaps (index + three children) — unchanged ──────────── */
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

/* ── 11. Same-deploy schema fix: homepage ItemList — unchanged ──── */
let idx = fs.readFileSync('index.html', 'utf8');
const beforeCount = (idx.match(/#\/t\//g) || []).length;
idx = idx.replace(/https:\/\/tarumakstudio\.com\/#\/t\//g, 'https://tarumakstudio.com/');
idx = idx.replace('"numberOfItems": 63', '"numberOfItems": ' + TOOLS.length);
fs.writeFileSync('index.html', idx);
console.log(`index.html: ${beforeCount} hash tool URLs -> real URLs; numberOfItems -> ${TOOLS.length}`);
