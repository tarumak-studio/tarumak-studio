/* recommend.js — pure scoring functions, tested standalone before
   integration into build-tool-pages.js. No DOM, no build-script state. */

const STOPWORDS = new Set(['a','an','the','and','or','to','of','in','on','for','with','your','you',
  'online','free','browser','instantly','directly','no','not','it','is','are','this','that',
  'files','file','from','into','using','use','without','any','all','every','one','fast','easy',
  'get','make','create','convert','tool','tools','upload','uploads','sign','signup','need','needed']);

function tokenize(name, desc) {
  const text = (name + ' ' + desc).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const toks = text.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  return new Set(toks);
}

function expandFormats(chips) {
  const out = new Set();
  (chips || []).forEach(c => {
    c.split(/→|->/).forEach(part => { const p = part.trim().toUpperCase(); if (p) out.add(p); });
  });
  return out;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach(x => { if (b.has(x)) inter++; });
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

/* Build once per build run (or once per test), reused for every tool's
   recommendations — O(n) prep, O(n) score per source tool. */
function buildIndex(TOOLS) {
  const bySlug = {};
  TOOLS.forEach(t => {
    bySlug[t[0]] = { slug: t[0], name: t[1], cat: t[2], desc: t[3], chips: t[4] || [],
      tokens: tokenize(t[1], t[3]), formats: expandFormats(t[4]) };
  });
  return bySlug;
}

/* Weighted score: WORKFLOW_NEXT curated relation is the strongest signal;
   same category next; then keyword/format overlap; popular + recent are
   small tie-break nudges, never enough alone to outrank a real relation. */
function score(source, candidate, opts) {
  const { workflowNext, popularSet, recentSet } = opts;
  let s = 0;
  const wf = workflowNext[source.slug] || [];
  if (wf.includes(candidate.slug)) s += 100 - wf.indexOf(candidate.slug); /* earlier in the curated list = stronger */
  if (candidate.cat === source.cat) s += 40;
  s += jaccard(source.tokens, candidate.tokens) * 30;
  s += jaccard(source.formats, candidate.formats) * 20;
  if (popularSet && popularSet.has(candidate.slug)) s += 8;
  if (recentSet && recentSet.has(candidate.slug)) s += 4;
  return s;
}

/* Main entry: ranked, deduped candidates for `slug`, excluding itself and
   anything in opts.exclude (so later sections never repeat earlier ones). */
function recommend(slug, index, opts) {
  opts = opts || {};
  const exclude = opts.exclude || new Set();
  const source = index[slug];
  if (!source) return [];
  const scored = Object.values(index)
    .filter(c => c.slug !== slug && !exclude.has(c.slug))
    .map(c => ({ c, s: score(source, c, opts) }))
    .filter(r => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(r => r.c);
  return scored.slice(0, opts.limit || 6);
}

module.exports = { tokenize, expandFormats, jaccard, buildIndex, score, recommend };
