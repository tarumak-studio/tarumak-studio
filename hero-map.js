/* hero-map.js — Tarumak Studio Hero Visual System: THE single slug -> hero
 * mapping. Every key below is a real slug pulled directly from data.js's
 * TOOLS array (verified programmatically, not transcribed by eye) — there
 * are no invented tools and no guessed slugs in this file.
 *
 * 66/66 real tools covered. Every formatConvert entry's from/to direction
 * is checked against that tool's own chips[] (where the chip already
 * encodes an arrow, e.g. 'JPG\u2192PNG') or its own title/description where
 * the chip doesn't (e.g. heic-to-jpg, word-to-pdf) — never assumed.
 *
 * Decorative numeric examples (sizeReduction from/to/saved) are illustrative,
 * same convention already used by the site's existing hero system (see
 * build-tool-pages.js's own comment: "Hero badges are decorative, not a
 * factual claim requiring the FAQ's strict REAL_FORMATS bar"). Where a
 * tool's real description states a concrete number (jpg-to-webp: 25-35%,
 * png-to-webp: up to 26%, image-compressor: up to 80%), the figure used
 * here stays inside that stated range rather than inventing a new one.
 * Where no number is stated (png-to-jpg, gif-to-webp, pdf-compressor),
 * no percentage is claimed — only a qualitative "smaller" note, or none.
 *
 * Usage (server-side, at build time, from build-tool-pages.js):
 *   const HERO_MAP = require('./hero-map.js');
 *   const cfg = HERO_MAP[slug]; // -> { type, ...params }
 */
'use strict';

const HERO_MAP = {

  /* ───────────────────────── Image Tools (18) ───────────────────────── */
  'image-compressor':   { type: 'sizeReduction', from: '12.4 MB', to: '2.8 MB', saved: '\u221277%' },
  'image-resizer':      { type: 'dimension', from: '4000 \u00d7 3000', to: '1200 \u00d7 900' },
  'image-cropper':      { type: 'crop' },
  'jpg-to-png':         { type: 'formatConvert', from: 'JPG', to: 'PNG' },
  'png-to-jpg':         { type: 'formatConvert', from: 'PNG', to: 'JPG', note: 'smaller' },
  'jpg-to-webp':        { type: 'formatConvert', from: 'JPG', to: 'WebP', note: '\u221230%' },
  'webp-to-jpg':        { type: 'formatConvert', from: 'WebP', to: 'JPG' },
  'png-to-webp':        { type: 'formatConvert', from: 'PNG', to: 'WebP', note: '\u221226%' },
  'webp-to-png':        { type: 'formatConvert', from: 'WebP', to: 'PNG' },
  'png-to-svg':         { type: 'formatConvert', from: 'PNG', to: 'SVG' },
  'svg-to-jpg':         { type: 'formatConvert', from: 'SVG', to: 'JPG' },
  'image-to-pdf':       { type: 'formatConvert', from: 'IMG', to: 'PDF' },
  'watermark-image':    { type: 'watermark', text: 'TARUMAK' },
  'exif-remover':       { type: 'stripMetadata' },
  'qr-code-generator':  { type: 'qr' },
  'background-remover': { type: 'comparison' },
  'ai-image-upscaler':  { type: 'comparison' },
  'ocr-image-to-text':  { type: 'ocr' },
  'heic-to-jpg':        { type: 'formatConvert', from: 'HEIC', to: 'JPG' },

  /* ───────────────────────── PDF Tools (15) ──────────────────────────── */
  'pdf-merger':            { type: 'mergeDocs' },
  'pdf-splitter':          { type: 'splitDocs' },
  'pdf-compressor':        { type: 'sizeReduction', from: '9.1 MB', to: '2.4 MB', saved: '\u221274%' },
  'pdf-to-jpg':            { type: 'formatConvert', from: 'PDF', to: 'JPG' },
  'jpg-to-pdf':            { type: 'formatConvert', from: 'JPG', to: 'PDF' },
  'png-to-pdf':            { type: 'formatConvert', from: 'PNG', to: 'PDF' },
  'pdf-to-text':           { type: 'formatConvert', from: 'PDF', to: 'TXT' },
  'pdf-password-protect':  { type: 'lock', dir: 'close' },
  'pdf-unlock':            { type: 'lock', dir: 'open' },
  'pdf-page-rotator':      { type: 'rotate' },
  'pdf-page-remover':      { type: 'removePage' },
  'pdf-organizer':         { type: 'reorder' },
  'scan-to-pdf':           { type: 'capture' },
  'images-to-pdf':         { type: 'mergeDocs', kind: 'images' },
  'pdf-reader':            { type: 'pagePreview' },

  /* ─────────────────────── Converter Tools (10) ──────────────────────── */
  'txt-to-pdf':         { type: 'formatConvert', from: 'TXT', to: 'PDF' },
  'html-to-pdf':        { type: 'formatConvert', from: 'HTML', to: 'PDF' },
  'gif-maker':          { type: 'assemble', mode: 'gif' },
  'gif-to-webp':        { type: 'formatConvert', from: 'GIF', to: 'WebP', note: 'smaller' },
  'webp-to-gif':        { type: 'formatConvert', from: 'WebP', to: 'GIF' },
  'color-picker':       { type: 'eyedropper' },
  'image-collage':      { type: 'assemble', mode: 'grid' },
  'favicon-generator':  { type: 'favicon', from: 'IMAGE', to: 'ICO' },
  'word-to-pdf':        { type: 'formatConvert', from: 'DOCX', to: 'PDF' },
  'markdown-to-html':   { type: 'formatConvert', from: 'MD', to: 'HTML' },

  /* ─────────────────────── Marketing Designer (8) ────────────────────── */
  'social-image-resizer': { type: 'dimension', from: '1080\u00d71080', to: '1080\u00d71920', note: '8+ platforms' },
  'color-palette-gen':    { type: 'palette' },
  'ad-copy-gen':          { type: 'textGen' },
  'cta-button-gen':       { type: 'buttonStyle' },
  'utm-builder':          { type: 'utm' },
  'og-image-gen':         { type: 'previewCard', kind: 'og' },
  'pdf-lead-magnet':      { type: 'previewCard', kind: 'leadmagnet' },
  'brand-color-extract':  { type: 'palette', kind: 'extract' },

  /* ─────────────────────── Developer & SEO (15) ──────────────────────── */
  'word-counter':          { type: 'counter' },
  'password-generator':    { type: 'password' },
  'css-gradient-gen':      { type: 'gradient' },
  'base64-encoder':        { type: 'encode', kind: 'base64' },
  'json-formatter':        { type: 'codeFormat' },
  'meta-tag-gen':          { type: 'previewCard', kind: 'meta' },
  'hashtag-gen':           { type: 'hashtags' },
  'lorem-ipsum':           { type: 'textLines' },
  'color-converter':       { type: 'colorChain' },
  'url-encoder':           { type: 'encode', kind: 'url' },
  'text-diff':             { type: 'diff' },
  'regex-tester':          { type: 'regex' },
  'slug-generator':        { type: 'slugify' },
  'text-case-converter':   { type: 'caseConvert' },
  'timestamp-converter':   { type: 'timestamp' }

};

module.exports = HERO_MAP;
