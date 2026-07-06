/* trust-blocks.js — Tarumak Studio's trust framework, as a single module.
 *
 * THE SYSTEM (three tiers, each with one job and one placement rule):
 *
 *   Tier 1 — AMBIENT. One quiet line in the shared footer on every page:
 *     "Built for the browser · No files ever leave your device."
 *     Already exists (header-chrome.js harvests it from index.html).
 *     This module adds nothing at this tier — it documents it so nobody
 *     adds a duplicate.
 *
 *   Tier 2 — MOMENT OF RISK. Exactly one line, rendered directly beneath
 *     the tool panel on every tool page — the instant someone is deciding
 *     whether to hand over a file. Two proofs in one line: local
 *     processing (the promise) + the named open-source library doing the
 *     work (the verifiable evidence). Non-file tools get typed-input
 *     wording instead of file wording.
 *
 *   Tier 3 — PROOF. The deep-dive, once per journey: the homepage's
 *     "How privacy works" section and each tool page's privacy FAQ
 *     answer. Both already exist; this module documents them as the
 *     tier-3 surface so future pages reuse those, not new inventions.
 *
 * FREQUENCY DOCTRINE (why this doesn't wallpaper):
 *   - Max one trust element per viewport. The tier-2 line sits mid-page;
 *     the tier-1 footer line is a full page-height away.
 *   - Wording is IDENTICAL within a tier (users learn it, then trust it)
 *     and DIFFERENT across tiers (repetition reads as insistence).
 *   - No absolute "no tracking" claim anywhere: the site's own homepage
 *     copy correctly says traffic analytics exist ("cookieless-by-default
 *     analytics measure traffic — never the content of what you
 *     process"). Trust claims here are scoped to what is provably true:
 *     FILES never leave the device. A trust framework caught overclaiming
 *     once is worthless forever.
 *
 * EVIDENCE RULES for the library credit:
 *   Only libraries verified in the actual codebase are ever named
 *   (checked against index.html's CDN tags and image-tools.js imports).
 *   If a slug/category has no verified library, the credit is simply
 *   omitted — never guessed.
 */
'use strict';

/* Verified per-slug credits (checked in code, not assumed) */
const LIB_BY_SLUG = {
  'background-remover': '@imgly/background-removal',
  'ocr-image-to-text': 'Tesseract.js',
  'qr-code-generator': 'QRCode.js',
  'word-to-pdf': 'mammoth + jsPDF',
  'markdown-to-html': 'marked',
  'gif-maker': 'gif.js',
  'gif-to-webp': 'gif.js',
  'webp-to-gif': 'gif.js'
};

/* Verified per-category fallbacks */
const LIB_BY_CAT = {
  pdf: 'pdf-lib',           /* merge/split/compress/protect/… all pdf-lib */
  image: 'the Canvas API',  /* native browser API — honest and true */
  converter: null,          /* mixed bag — omit rather than generalize */
  developer: null,          /* pure JS — no external library to credit */
  marketing: null
};

/* PDF tools that render pages (not just restructure them) also use pdf.js;
   keep the credit to the primary library — one name is evidence, a list
   is noise. */

function libFor(slug, cat) {
  if (LIB_BY_SLUG[slug]) return LIB_BY_SLUG[slug];
  return LIB_BY_CAT[cat] || null;
}

const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

/**
 * Tier-2 renderer: the one line under the tool panel.
 * File tools:     lock  Runs locally in your browser — your file never
 *                 leaves this device. Open source: pdf-lib.
 * Non-file tools: lock  Runs locally in your browser — nothing you type
 *                 is sent anywhere.
 */
function trustLine(slug, cat, isFileTool) {
  const lib = libFor(slug, cat);
  const promise = isFileTool
    ? 'Runs locally in your browser — your file never leaves this device.'
    : 'Runs locally in your browser — nothing you type is sent anywhere.';
  /* Label honestly: Canvas is a native browser standard, not an OSS
     library — calling it "open source" would be the exact kind of small
     overclaim this framework exists to prevent. */
  let credit = '';
  if (isFileTool && lib) {
    credit = lib === 'the Canvas API'
      ? ' <span class="trust-line-lib">Powered by the browser\u2019s native Canvas API</span>'
      : ' <span class="trust-line-lib">Open source: ' + lib + '</span>';
  }
  return '<p class="trust-line">' + LOCK_SVG + '<span>' + promise + credit + '</span></p>';
}

module.exports = { trustLine, libFor, LIB_BY_SLUG, LIB_BY_CAT };
