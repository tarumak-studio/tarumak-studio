#!/usr/bin/env node
/* build-asset-versions.js — gives every local script and stylesheet link a
 * ?v=<hash of the file's content>.
 *
 * Why: the live domain lets browsers keep .js/.css for hours (Cloudflare's
 * Browser Cache TTL overrides _headers). Without a version that follows the
 * content, a returning visitor gets new HTML with old scripts after a
 * release, and tools can break.
 *
 * Run LAST, after any change to a .js/.css file and after any page builder:
 *   node build-asset-versions.js           stamp
 *   node build-asset-versions.js --check   exit 1 if anything is out of date
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = __dirname;
const CHECK = process.argv.includes('--check');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const hash = f => crypto.createHash('sha256').update(rd(f).replace(/\r\n/g, '\n')).digest('hex').slice(0, 10);
let stale = 0;
function save(f, before, after) {
  if (before === after) return;
  stale++;
  if (!CHECK) fs.writeFileSync(path.join(ROOT, f), after);
}

/* 1. Engines loaded at runtime: the bundle holds their version in a variable.
      Done first, because this changes the bundle's own hash. */
const ENGINES = [
  ['converter-tools.js', 'GCE_V', 'gifcompressor-engine.js'],
  ['image-tools.js', 'ENGINE_V', 'upscaler-engine.js'],
  ['image-tools.js', 'XKB_V', 'exactkb-engine.js'],
  ['image-tools.js', 'EN_ENGINE_V', 'enhancer-engine.js'],
  ['image-tools.js', 'OR_ENGINE_V', 'objectremover-engine.js'],
  ['pdf-tools.js', 'PTE_ENGINE_V', 'pdftoexcel-engine.js'],
];
for (const [bundle, name, engine] of ENGINES) {
  const s = rd(bundle);
  const re = new RegExp("(\\bvar " + name + "=')[^']*(')");
  if (!re.test(s) || !s.includes("'/" + engine + "?v='+" + name)) throw new Error(bundle + ': ' + name + ' / ' + engine + ' not found');
  save(bundle, s, s.replace(re, '$1' + hash(engine) + '$2'));
}

/* 2. Every <script src> and <link href> that points at a file in this folder */
const cache = {};
const ver = f => cache[f] || (cache[f] = hash(f));
let links = 0;
for (const page of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
  const s = rd(page);
  const out = s.replace(/(<(?:script|link)\b[^>]*?\s(?:src|href)=")(\/?)([A-Za-z0-9_-]+\.(?:js|css))(?:\?[^"]*)?"/g, (m, pre, slash, file) => {
    if (!fs.existsSync(path.join(ROOT, file))) throw new Error(page + ' links to missing file ' + file);
    links++;
    return pre + slash + file + '?v=' + ver(file) + '"';
  });
  save(page, s, out);
}
console.log(`${links} links, ${Object.keys(cache).length} files, ${stale} file(s) ${CHECK ? 'out of date' : 'updated'}.`);
if (CHECK && stale) process.exit(1);
