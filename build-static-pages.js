/* build-static-pages.js — replaces the legacy `.site-header` (no search,
 * no theme toggle, no Tools mega-menu, no dropdown arrow) with the SAME
 * shared header used on the homepage and all 66 tool pages, on every
 * remaining static page: category pages, blog, articles, about, contact,
 * french-academy, changelog, and the legal pages.
 *
 * Source of truth: header-chrome.js (shared with build-tool-pages.js —
 * this script does not re-implement the harvest or the dropdown bake).
 *
 * Usage: node build-static-pages.js
 *
 * What this script does NOT touch, by design:
 *   - <title>, meta description, canonical, JSON-LD — all page-specific
 *   - Footer — these pages currently use a different, much simpler
 *     footer than the homepage's. That's a real inconsistency, but it's
 *     a separate decision (a visual redesign of 63 footers) from "fix
 *     the header", so it's left alone here — see the build report.
 *   - Body content, article prose, forms (e.g. contact.html's own
 *     handleContact script)
 *   - Breadcrumb styling on articles/category pages (unrelated to header)
 */
'use strict';
const fs = require('fs');
const { getChrome, withActiveNav } = require('./header-chrome.js');
const { CHROME_TOP: CHROME_TOP_BASE, HEAD_LINKS } = getChrome();

/* Real bug found while unifying the header: main.css already styles
   .nav-active, but nothing was ever setting it \\u2014 not on tool pages,
   not on these pages either. The nav gave no current-page indication
   anywhere on the site. Mapped once here per page type; pages with no
   honest match (changelog, legal pages) are left unmarked rather than
   forcing a wrong "active" tab. */
function activeKeyFor(file) {
  if (/^(image|pdf|developer|marketing|converter)-tools\.html$/.test(file)) return 'all';
  if (file === 'blog.html' || file.startsWith('article-')) return 'blog';
  if (file === 'about.html') return 'about';
  if (file === 'french-academy.html') return 'french-academy';
  if (file === 'contact.html') return 'contact';
  return null; // changelog.html, privacy-policy.html, terms.html, cookie-policy.html, etc.
}

/* Pages to migrate: every .html file using the legacy header, discovered
   by the marker itself rather than a hand-typed list — so a future page
   authored from the old template is caught automatically. */
const targets = fs.readdirSync('.')
  .filter(f => f.endsWith('.html'))
  .filter(f => fs.readFileSync(f, 'utf8').includes('class="site-header"'));

console.log(`Found ${targets.length} pages using the legacy header`);

/* The small set of design tokens main.css defines that these pages' own
   legacy :root block does NOT (main.css supplies the rest of the tokens
   these pages already had — --bg, --text, --border, etc. — with values
   close enough that removing the duplicate definition and letting
   main.css be the single source is a color-consistency improvement, not
   a redesign). Nothing else in this legacy :root is unique. */
const LEGACY_ROOT_RE = /:root\s*\{\s*--bg:[^}]*--bg2:[^}]*\}/;

let migrated = 0, skipped = [], errors = [];

for (const file of targets) {
  try {
    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    /* ── 1. Swap header+mobile-menu for the shared chrome ──────────── */
    const headerStart = html.indexOf('<header class="site-header">');
    const mainStart = html.indexOf('<main', headerStart);
    if (headerStart === -1 || mainStart === -1) throw new Error('header/main boundary not found');
    const oldChrome = html.slice(headerStart, mainStart);
    if (!oldChrome.includes('mob-menu')) throw new Error('expected mobile menu inside old chrome, not found — refusing to touch this file');
    const key = activeKeyFor(file);
    const CHROME_TOP = key !== null ? withActiveNav(CHROME_TOP_BASE, key) : CHROME_TOP_BASE;
    html = html.slice(0, headerStart) + CHROME_TOP + '\n' + html.slice(mainStart).replace(/^\n+/, '');

    /* ── 2. Ensure main.css + font/icon links are present (most pages
       already have them; add only what's missing, never duplicate) ── */
    if (!html.includes('href="/main.css"')) {
      const headClose = html.indexOf('</head>');
      html = html.slice(0, headClose) + '  ' + HEAD_LINKS + '\n' + html.slice(headClose);
    }

    /* ── 3. Remove the now-redundant legacy :root (main.css supersedes
       it once linked — see LEGACY_ROOT_RE comment above) ── */
    html = html.replace(LEGACY_ROOT_RE, '/* :root now supplied by main.css \\u2014 single source of truth for design tokens site-wide */');

    /* ── 4. Remove the now-dead inline burger-open script — the new
       header's burger/theme/search/mobile-menu are wired by features.js,
       not this per-page snippet (which references IDs that no longer
       exist after step 1: #burgerBtn, #mobMenu). Two formatting variants
       exist across page templates (a plain-onclick one on articles/
       category pages, and a fuller addEventListener+closeMenuBtn one on
       about/contact/french-academy/etc) \\u2014 matched by CONTENT (mentions
       both burgerBtn and mobMenu) rather than exact whitespace, so both
       are caught, and any third variant with the same two markers would
       be too. */
    html = html.replace(/<script>((?:(?!<\/script>)[\s\S])*)<\/script>\s*/g, (m, body) =>
      (body.includes('burgerBtn') && body.includes('mobMenu')) ? '' : m
    );

    /* ── 5. Add the script chain the new header needs, right before
       </body>. Deliberately minimal: no category tool files (nothing
       here mounts a tool), no app.js (the dropdown is pre-baked and
       needs no JS at all — see header-chrome.js). Existing page-specific
       scripts (blog-data.js + its listing builder, handleContact, JSON-LD)
       are left exactly where they are; this is inserted before </body>,
       after them, matching the site's established defer order. ── */
    const headerScripts = [
      '<script src="/config.js" defer></script>',
      '<script src="/utils.js" defer></script>',
      '<script src="/data.js" defer></script>',
      '<script src="/features.js" defer></script>',
      '<script src="/analytics.js" defer></script>'
    ].join('\n');
    if (!html.includes('src="/features.js"')) {
      const bodyClose = html.lastIndexOf('</body>');
      if (bodyClose === -1) throw new Error('no </body> found');
      html = html.slice(0, bodyClose) + headerScripts + '\n' + html.slice(bodyClose);
    }

    if (html === before) { skipped.push(file); continue; }
    fs.writeFileSync(file, html);
    migrated++;
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
}

console.log(`Migrated: ${migrated} | Unchanged: ${skipped.length} | Errors: ${errors.length}`);
errors.forEach(e => console.log('  ERROR', e));
