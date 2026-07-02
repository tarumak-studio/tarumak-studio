/* build-catalog.js — generates ai-catalog.json from the site's data.js
 *
 * Usage:  node build-catalog.js [path-to-data.js] [output-path]
 * Deploy: upload ai-catalog.json to the site root (same repo as index.html).
 *         The Worker fetches + edge-caches it, so updating tools requires
 *         only re-running this script and re-uploading the JSON — the
 *         Worker never needs redeploying for catalog changes.
 *
 * data.js is executed (not regex-parsed) so the extracted TOOLS/CAT are
 * exactly what the site itself sees. data.js contains some DOM wiring at
 * the end (discovered when a pure-data assumption failed on first run),
 * so a universal absorbing stub stands in for the DOM: every property
 * access returns another absorber, every call returns an absorber, so
 * the wiring code runs to completion harmlessly.
 */
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync(process.argv[2] || '../tarumak-flat/data.js', 'utf8');

// Universal absorber: callable, and every property access yields another absorber.
function makeAbsorber() {
  const fn = function () { return absorber; };
  const absorber = new Proxy(fn, {
    get: (t, p) => {
      if (p === Symbol.toPrimitive) return () => '';
      return absorber;
    },
    set: () => true,
    apply: () => absorber
  });
  return absorber;
}
const stub = makeAbsorber();

const sandbox = {
  window: stub, document: stub, localStorage: stub, navigator: stub,
  matchMedia: stub, $: stub, console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// Append a capture statement INSIDE the same script so const-scoped
// declarations are reachable (const in vm scripts does not attach to
// the context object).
const capture = '\n;__CAPTURE__({ TOOLS: typeof TOOLS !== "undefined" ? TOOLS : null,' +
                ' CAT: typeof CAT !== "undefined" ? CAT : null });';
let captured = null;
sandbox.__CAPTURE__ = (x) => { captured = x; };
vm.runInContext(src + capture, sandbox);

if (!captured || !Array.isArray(captured.TOOLS) || !captured.TOOLS.length) {
  throw new Error('TOOLS not captured from data.js');
}
const { TOOLS, CAT } = captured;

const catalog = {
  updated: new Date().toISOString().slice(0, 10),
  count: TOOLS.length,
  categories: CAT,
  tools: TOOLS.map(t => ({
    slug: t[0], name: t[1], cat: t[2], desc: t[3], chips: t[4] || []
  }))
};

const out = process.argv[3] || 'ai-catalog.json';
fs.writeFileSync(out, JSON.stringify(catalog));
console.log(`Wrote ${out}: ${catalog.count} tools, ${fs.statSync(out).size} bytes`);
