#!/usr/bin/env node
/* build-tool-deps.js — writes tool-deps.js: which CDN libraries and which
 * category bundles each tool needs.
 *
 * Why: every tool page used to load all 8 CDN libraries and all 5
 * category bundles (~2.6 MB of JS) whatever the tool. Most tools need no
 * library at all. This script reads the tool code, follows the helper
 * functions each INIT[slug] calls, and records only what is really used.
 *
 * Run it whenever you add a tool or change which library a tool calls:
 *   node build-tool-deps.js        (writes tool-deps.js)
 *   node build-tool-pages.js       (pages pick the map up)
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

/* CDN libraries: pinned versions + SRI hashes (sha384 of the exact file). */
const LIBS = {
  pdflib:      { global: 'PDFLib',      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',        sri: 'sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI' },
  pdfjs:       { global: 'pdfjsLib',    src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',          sri: 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e' },
  jspdf:       { global: 'jspdf',       src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',        sri: 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk' },
  qrcode:      { global: 'QRCode',      src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',        sri: 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU' },
  html2canvas: { global: 'html2canvas', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', sri: 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H' },
  mammoth:     { global: 'mammoth',     src: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', sri: 'sha384-nFoSjZIoH3CCp8W639jJyQkuPHinJ2NHe7on1xvlUA7SuGfJAfvMldrsoAVm6ECz' },
  marked:      { global: 'marked',      src: 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js',          sri: 'sha384-odPBjvtXVM/5hOYIr3A1dB+flh0c3wAT3bSesIOqEGmyUA4JoKf/YTWy0XKOYAY7' },
  purify:      { global: 'DOMPurify',   src: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.17/purify.min.js',       sri: 'sha384-P0JNneQf81HOl9VwNXK76cQ9VMD6Nfsnepxb0cCOg8+UzEdzgPHAPV4wVQrvYQSx' },
};
/* How each library shows up in code (code calls, not prose) */
const USE = {
  pdflib: /PDFLib\./, pdfjs: /pdfjsLib\./, jspdf: /window\.jspdf|jspdf\.jsPDF/,
  qrcode: /new QRCode\(|QRCode\.CorrectLevel/, html2canvas: /html2canvas\(/,
  mammoth: /mammoth\.[a-zA-Z]+\(/, purify: /DOMPurify\.sanitize/, marked: /marked\.(parse|use|setOptions)\(|[^.\w]marked\(/,
};
/* Load order matters: when two bundles define the same INIT, the later one wins. */
const BUNDLES = ['pdf-tools.js', 'image-tools.js', 'converter-tools.js', 'marketing-tools.js', 'developer-tools.js'];
const SHARED = ['utils.js', 'tool-helpers.js']   /* data.js is content, not tool code */;

function chunks(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const re = /(^|\n)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(^|\n)(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\()|(^|\n)INIT\['([^']+)'\]\s*=/g;
  const starts = []; let m;
  while ((m = re.exec(src))) starts.push({ name: m[2] || m[4], init: m[6], idx: m.index });
  return starts.map((s, i) => ({ ...s, file, body: src.slice(s.idx, i + 1 < starts.length ? starts[i + 1].idx : src.length) }));
}
const all = [...SHARED, ...BUNDLES].flatMap(chunks);
const defs = {};
for (const c of all) if (c.name) { (defs[c.name] = defs[c.name] || { body: '', file: c.file }).body += c.body; }
const names = Object.keys(defs);
function closure(text, seen) {
  for (const n of names) {
    if (seen.has(n)) continue;
    if (new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\b').test(text)) { seen.add(n); closure(defs[n].body, seen); }
  }
  return seen;
}
const inits = {};
for (const c of all) if (c.init) (inits[c.init] = inits[c.init] || []).push(c);

const TOOL_DEPS = {};
for (const slug of Object.keys(inits).sort()) {
  const list = inits[slug];
  const winner = list[list.length - 1];           /* last loaded definition runs */
  const fns = closure(winner.body, new Set());
  let code = winner.body; for (const n of fns) code += defs[n].body;
  const libs = Object.keys(USE).filter(k => USE[k].test(code));
  const bundles = new Set([winner.file]);
  for (const n of fns) if (BUNDLES.includes(defs[n].file)) bundles.add(defs[n].file);
  /* any bundle that also defines this INIT must load too, before the winner */
  for (const c of list) bundles.add(c.file);
  if (bundles.size > 1) {
    throw new Error(slug + ' needs more than one bundle (' + [...bundles].join(', ') + '). Move the shared helper to tool-helpers.js and define each INIT once.');
  }
  TOOL_DEPS[slug] = { libs, bundles: BUNDLES.filter(b => bundles.has(b)) };
}

const out = `/* tool-deps.js — GENERATED by build-tool-deps.js. Do not edit by hand.
 * Which CDN libraries and category bundle each tool needs. Build-time
 * input for build-tool-pages.js; no page loads this file. */
(function (root) {
  var LIBS = ${JSON.stringify(LIBS, null, 2).replace(/\n/g, '\n  ')};
  var TOOL_DEPS = ${JSON.stringify(TOOL_DEPS)};
  var api = { LIBS: LIBS, TOOL_DEPS: TOOL_DEPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TarumakDeps = api;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(ROOT, 'tool-deps.js'), out);
const n = Object.keys(TOOL_DEPS).length;
const noLib = Object.values(TOOL_DEPS).filter(d => !d.libs.length).length;
console.log(`tool-deps.js written: ${n} tools, ${noLib} need no CDN library.`);
