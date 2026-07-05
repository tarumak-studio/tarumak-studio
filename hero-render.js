/* hero-render.js — Tarumak Studio Hero Visual System, server-side renderer.
 *
 * Renders the exact static HTML fragment for a tool's hero at BUILD time
 * (not client-side), matching this codebase's existing convention
 * (header-chrome.js bakes the mega menu at build time; this bakes the
 * hero the same way) — zero new runtime JS, zero client-side templating,
 * zero flash/CLS risk, works with JavaScript disabled exactly like every
 * other hero type already on the site.
 *
 * Single source of truth for "which hero does slug X get": hero-map.js.
 * This file only knows how to DRAW each of the types hero-map.js can
 * name — it never decides which tool gets which type.
 *
 * GPU-only animation contract (unchanged from the system this replaces):
 * every @keyframes below animates transform / opacity / filter ONLY.
 * Every animation has a prefers-reduced-motion fallback that resolves to
 * a meaningful end-state, not a blank frame. See tool-variants.css for
 * the corresponding styles and the shared .tp-hero-visual shell (kept
 * as-is from the previous system).
 */
'use strict';

const HERO_MAP = require('./hero-map.js');

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* Small icon set specific to the new hero types — kept separate from
   build-tool-pages.js's own `svg` object (used elsewhere on the page)
   so this module has no import-order dependency on it. */
const ico = {
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  pipette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-4 9.5-9.5 3 3L6 21z"/><path d="m14.5 6.5 3-3a2.1 2.1 0 0 1 3 3l-3 3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path class="tp-h-shackle" d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  crop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>',
  drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12A7 7 0 0 0 5 10c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h3.2a3 3 0 0 0 2.4-1.2l7-9A3 3 0 0 1 17 6.6H22M2 6h3.2a3 3 0 0 1 2.4 1.2l.6.8M17.6 17.4l.8.8a3 3 0 0 0 2.4 1.2H22M18 3l4 3.6-4 3.4M18 14l4 3.6-4 3.4"/></svg>'
};

/* ---- tiny helpers shared by several renderers ------------------------ */
function tile(label, sub) {
  return '<div class="tp-h-tile">' + ico.doc + '<span class="tp-h-tile-label">' + esc(label) + '</span>'
    + (sub ? '<span class="tp-h-tile-sub">' + esc(sub) + '</span>' : '') + '</div>';
}
function badgeFlow(fromLabel, toLabel, note) {
  return '<div class="tp-h-flow">'
    + '<div class="tp-h-badge">' + esc(fromLabel) + '</div>'
    + '<span class="tp-h-flow-arrow">' + ico.arrow + '</span>'
    + '<div class="tp-h-badge tp-h-badge--to">' + esc(toLabel) + (note ? '<span class="tp-h-note">' + esc(note) + '</span>' : '') + '</div>'
    + '</div>';
}
function pages(n, cls) { return '<div class="tp-h-stack' + (cls ? ' ' + cls : '') + '">' + Array.from({ length: n }, () => '<div class="tp-h-page"></div>').join('') + '</div>'; }

/* ---- one renderer per HERO_MAP "type" -------------------------------- */
const R = {

  /* Comparison family --------------------------------------------------- */
  comparison() {
    return '<div class="tp-h-compare"><div class="tp-h-compare-before"></div><div class="tp-h-compare-after"></div>'
      + '<div class="tp-h-compare-edge"></div>'
      + '<span class="tp-h-label tp-h-label--l">Before</span><span class="tp-h-label tp-h-label--r">After</span></div>';
  },

  /* Transformation family ------------------------------------------------ */
  sizeReduction(cfg) {
    return '<div class="tp-h-size">'
      + '<div class="tp-h-size-col"><span class="tp-h-size-n">' + esc(cfg.from) + '</span><span class="tp-h-size-t">Original</span></div>'
      + '<span class="tp-h-flow-arrow">' + ico.arrow + '</span>'
      + '<div class="tp-h-size-col"><span class="tp-h-size-n tp-h-size-n--ok">' + esc(cfg.to) + '</span><span class="tp-h-size-t">' + esc(cfg.saved) + '</span></div>'
      + '<div class="tp-h-size-bar"><span></span></div>'
      + '</div>';
  },
  dimension(cfg) { return badgeFlow(cfg.from, cfg.to, cfg.note); },
  formatConvert(cfg) { return badgeFlow(cfg.from, cfg.to, cfg.note); },
  colorChain(cfg) {
    return '<div class="tp-h-flow tp-h-flow--chain">'
      + '<div class="tp-h-badge">HEX</div><span class="tp-h-flow-arrow">' + ico.arrow + '</span>'
      + '<div class="tp-h-badge">RGB</div><span class="tp-h-flow-arrow">' + ico.arrow + '</span>'
      + '<div class="tp-h-badge tp-h-badge--to">HSL</div></div>';
  },
  slugify() { return badgeFlow('My Blog Title', 'my-blog-title'); },
  timestamp() { return badgeFlow('1735689600', 'Jan 1 2026'); },
  caseConvert() { return badgeFlow('hello world', 'Hello World'); },

  /* Workflow family ------------------------------------------------------ */
  mergeDocs(cfg) {
    const cls = cfg.kind === 'images' ? ' tp-h-stack--images' : '';
    return pages(3, 'tp-h-stack--merge' + cls) + '<span class="tp-h-stack-arrow">' + ico.arrow + '</span>';
  },
  splitDocs() { return pages(3, 'tp-h-stack--split'); },
  reorder() { return pages(3, 'tp-h-stack--reorder') + ico.drag.replace('<svg', '<svg class="tp-h-drag-ico"'); },
  capture() {
    return '<div class="tp-h-capture">' + ico.camera.replace('<svg', '<svg class="tp-h-cam-ico"') + '<div class="tp-h-cam-flash"></div>' + tile('PDF') + '</div>';
  },
  assemble(cfg) {
    if (cfg.mode === 'gif') {
      return '<div class="tp-h-film"><span></span><span></span><span></span><span></span>'
        + '<div class="tp-h-film-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></div>';
    }
    return '<div class="tp-h-grid"><span></span><span></span><span></span><span></span></div>';
  },

  /* Visualization family --------------------------------------------------- */
  crop() { return '<div class="tp-h-crop"><div class="tp-h-crop-img"></div><div class="tp-h-crop-frame">' + ico.crop + '</div></div>'; },
  watermark(cfg) { return '<div class="tp-h-wm"><div class="tp-h-wm-img"></div><span class="tp-h-wm-text">' + esc(cfg.text) + '</span></div>'; },
  stripMetadata() {
    const tags = [ico.pin, ico.camera, ico.clock];
    return '<div class="tp-h-exif"><div class="tp-h-exif-img"></div>'
      + tags.map((t, i) => '<span class="tp-h-exif-tag" style="--i:' + i + '">' + t + '</span>').join('')
      + '</div>';
  },
  ocr() {
    return '<div class="tp-h-ocr"><div class="tp-h-ocr-doc">'
      + Array.from({ length: 5 }, () => '<span></span>').join('')
      + '<div class="tp-h-ocr-beam"></div></div>'
      + '<div class="tp-h-ocr-langs"><span class="on">EN</span><span class="on">HI</span><span>FR</span><span>ES</span></div></div>';
  },
  eyedropper() {
    return '<div class="tp-h-eye">' + ico.pipette.replace('<svg', '<svg class="tp-h-eye-ico"') + '<div class="tp-h-eye-swatch"></div></div>';
  },
  palette(cfg) {
    const colors = ['#22d3ee', '#6366f1', '#a78bfa', '#34d399', '#fb923c'];
    const src = cfg.kind === 'extract' ? '<div class="tp-h-logo-src"></div>' : '';
    return '<div class="tp-h-palette">' + src + colors.map((c, i) => '<span style="--sw:' + c + ';--i:' + i + '"></span>').join('') + '</div>';
  },
  codeFormat() {
    const lines = ['{', '  "tool": "json-formatter",', '  "valid": true', '}'];
    return '<div class="tp-h-code">' + lines.map((l, i) => '<div class="tp-h-code-line" style="--i:' + i + '">' + esc(l) + '</div>').join('') + '</div>';
  },
  encode(cfg) {
    const label = cfg.kind === 'url' ? 'https://a b' : 'Hello';
    const out = cfg.kind === 'url' ? 'https://a%20b' : 'SGVsbG8=';
    return badgeFlow(label, out);
  },
  regex() {
    return '<div class="tp-h-regex"><span>user</span><mark>@</mark><span>example.com</span> <span class="tp-h-regex-tag">1 match</span></div>';
  },
  diff() {
    return '<div class="tp-h-diff"><div class="tp-h-diff-line tp-h-diff-line--rm">Old line removed</div>'
      + '<div class="tp-h-diff-line tp-h-diff-line--add">New line added</div></div>';
  },
  textLines() {
    return '<div class="tp-h-lines">' + Array.from({ length: 4 }, (_, i) => '<span style="--i:' + i + '"></span>').join('') + '</div>';
  },
  counter() {
    return '<div class="tp-h-counter"><span class="tp-h-counter-n">128</span><span class="tp-h-counter-t">words</span><div class="tp-h-counter-bar"><span></span></div></div>';
  },
  gradient() { return '<div class="tp-h-gradient"></div>'; },
  removePage() { return pages(3, 'tp-h-stack--remove') + ico.trash.replace('<svg', '<svg class="tp-h-trash-ico"'); },

  /* Preview family --------------------------------------------------------- */
  rotate() { return '<div class="tp-h-rotate">' + ico.doc + '</div>'; },
  pagePreview() { return pages(3, 'tp-h-stack--preview'); },
  lock(cfg) {
    const cls = cfg.dir === 'open' ? ' tp-h-lock--open' : ' tp-h-lock--close';
    return '<div class="tp-h-lock' + cls + '">' + ico.lock + '</div>';
  },

  /* Generation family ------------------------------------------------------- */
  qr() {
    const on = [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24];
    return '<div class="tp-h-qr">' + Array.from({ length: 25 }, (_, i) => '<span class="' + (on.indexOf(i) > -1 ? 'on' : '') + '"></span>').join('') + '</div>';
  },
  utm() {
    return '<div class="tp-h-utm"><span class="tp-h-utm-base">tarumakstudio.com/?</span><span class="tp-h-utm-p">utm_source=x</span><span class="tp-h-utm-p" style="--i:1">&amp;utm_campaign=y</span></div>';
  },
  previewCard(cfg) {
    const label = cfg.kind === 'meta' ? 'Meta preview' : cfg.kind === 'leadmagnet' ? 'Lead magnet' : 'OG image';
    return '<div class="tp-h-card"><div class="tp-h-card-img"></div><div class="tp-h-card-title"></div><div class="tp-h-card-sub"></div>'
      + '<span class="tp-h-card-tag">' + esc(label) + '</span></div>';
  },
  favicon(cfg) {
    return '<div class="tp-h-favicon">' + tile(cfg.from) + '<span class="tp-h-flow-arrow">' + ico.arrow + '</span>'
      + '<div class="tp-h-fav-sizes"><span></span><span></span><span></span></div></div>';
  },
  textGen() {
    const lines = ['Save 20% Today', 'Free shipping, every order', 'Shop Now \u2192'];
    return '<div class="tp-h-typed">' + lines.map((l, i) => '<div class="tp-h-typed-line" style="--i:' + i + '">' + esc(l) + '</div>').join('') + '</div>';
  },
  buttonStyle() {
    return '<div class="tp-h-btns"><button class="tp-h-btn-demo tp-h-btn-a">Get Started</button><button class="tp-h-btn-demo tp-h-btn-b">Get Started</button></div>';
  },
  hashtags() {
    const tags = ['#design', '#marketing', '#2026'];
    return '<div class="tp-h-tags">' + tags.map((t, i) => '<span style="--i:' + i + '">' + esc(t) + '</span>').join('') + '</div>';
  },
  password() {
    const chars = 'K7#mP9$q'.split('');
    return '<div class="tp-h-pass">' + chars.map((c, i) => '<span style="--i:' + i + '">' + esc(c) + '</span>').join('') + '</div>';
  }
};

/**
 * renderHero(slug, accent, name) -> HTML string
 * Wraps the type-specific fragment in the same shared shell
 * (.tp-hero-visual) the previous system used, so no other markup on the
 * page needs to change.
 */
function renderHero(slug, accent, name) {
  const cfg = HERO_MAP[slug];
  if (!cfg || !R[cfg.type]) {
    throw new Error('hero-render: no renderer for slug "' + slug + '" (type: ' + (cfg && cfg.type) + ')');
  }
  const inner = R[cfg.type](cfg);
  return '<div class="tp-hero-visual" style="--tp-accent:' + esc(accent) + '" data-hero-type="' + esc(cfg.type) + '" role="img" aria-label="'
    + esc(name) + ' illustration">' + inner + '</div>';
}

module.exports = { renderHero, HERO_MAP };
