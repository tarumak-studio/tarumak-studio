/* resync-chrome.js — re-stamps the shared header AND footer (and their
 * required CSS/JS links) onto pages that should have them, whenever
 * header-chrome.js's output changes.
 *
 * Why this exists: build-tool-pages.js fully regenerates its 66 pages
 * from scratch every run, so header/footer changes reach them
 * automatically. index.html and the other static pages (about, contact,
 * blog, articles, category pages, etc.) are NOT regenerated from
 * scratch — their body content is hand-authored and must survive
 * untouched. This script is the permanent, idempotent way to re-sync
 * just the header/mobile-menu block, the footer, and head links/script
 * tags on those pages — run it after any change to header-chrome.js.
 *
 * FOOTER re-sync added in the SEO-recovery round: an audit here found
 * 8 different hand-copied footer variants across the site (the
 * header-unification round explicitly deferred this — "a real
 * inconsistency... a different, larger visual change than 'fix the
 * header'"). Several of those variants still linked /about.html,
 * /work-with-me.html, /terms.html, /privacy-policy.html,
 * /cookie-policy.html, and even /index.html — all of which Google
 * Search Console's own crawl data flagged as duplicate/non-canonical
 * URLs. Fixing footer LINKS is explicitly in scope for that reason,
 * even though a full footer visual redesign still is not.
 *
 * Usage: node resync-chrome.js
 */
'use strict';
const fs = require('fs');
const { getChrome, withActiveNav } = require('./header-chrome.js');

const { CHROME_TOP: BASE, FOOTER, HEAD_LINKS, MEGA_MENU_SCRIPT, TOAST_RACK, NAV_RESPONSIVE_SCRIPT } = getChrome();

/* Same page -> nav-active mapping used by the original migration, plus
   the homepage itself (data-nav=""). */
function activeKeyFor(file) {
  if (file === 'index.html') return '';
  if (file === 'tools.html') return 'all';
  if (/^(image|pdf|developer|marketing|converter)-tools\.html$/.test(file)) return 'all';
  if (file === 'blog.html' || file.startsWith('article-')) return 'blog';
  if (file === 'about.html') return 'about';
  if (file === 'work-with-me.html') return 'work-with-me';
  if (file === 'contact.html') return 'contact';
  return null;
}

const targets = fs.readdirSync('.')
  .filter(f => f.endsWith('.html'))
  .filter(f => fs.readFileSync(f, 'utf8').includes('<header id="header">'));

console.log(`Found ${targets.length} pages with the shared header`);

let changed = 0, unchanged = 0, errors = [], footersReplaced = 0;

for (const file of targets) {
  try {
    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    const headerStart = html.indexOf('<header id="header">');
    const mainStart = html.indexOf('<main', headerStart);
    if (headerStart === -1 || mainStart === -1) throw new Error('header/main boundary not found');

    const key = activeKeyFor(file);
    const chrome = key !== null ? withActiveNav(BASE, key) : BASE;
    const toastPrefix = html.includes('id="toast-rack"') ? '' : TOAST_RACK + '\n';
    html = html.slice(0, headerStart) + toastPrefix + chrome + '\n' + html.slice(mainStart).replace(/^\n+/, '');

    /* Footer: always re-stamp with the current shared FOOTER, except
       404.html (kept deliberately minimal by design). Earlier this
       skipped pages that already had the rich footer's marker class —
       which meant a page migrated once could never pick up a LATER
       change to FOOTER's content, exactly the bug that let several
       pages keep a stale link after an update to index.html's own
       footer. Header re-stamping was never skipped this way; footer
       re-stamping shouldn't be either. */
    if (file !== '404.html') {
      const m = html.match(/<footer\b[\s\S]*?<\/footer>/);
      if (m && html.slice(m.index, m.index + m[0].length) !== FOOTER) {
        html = html.slice(0, m.index) + FOOTER + html.slice(m.index + m[0].length);
        footersReplaced++;
      }
    }

    if (!html.includes('href="/mega-menu.css"')) {
      const headClose = html.indexOf('</head>');
      html = html.slice(0, headClose) + '  <link rel="stylesheet" href="/mega-menu.css">\n' + html.slice(headClose);
    }
    if (!html.includes('href="/nav-responsive.css"')) {
      const headClose = html.indexOf('</head>');
      html = html.slice(0, headClose) + '  <link rel="stylesheet" href="/nav-responsive.css">\n' + html.slice(headClose);
    }
    if (!html.includes('src="/mega-menu.js"')) {
      /* Insert right before </body> — same relative position as every
         other page's script chain (features.js always loads just before
         this point, tool pages already insert MEGA_MENU_SCRIPT right
         after it — matching that placement here too). */
      const bodyClose = html.lastIndexOf('</body>');
      if (bodyClose === -1) throw new Error('no </body> found');
      html = html.slice(0, bodyClose) + MEGA_MENU_SCRIPT + '\n' + html.slice(bodyClose);
    }
    if (!html.includes('src="/nav-responsive.js"')) {
      const bodyClose = html.lastIndexOf('</body>');
      if (bodyClose === -1) throw new Error('no </body> found');
      html = html.slice(0, bodyClose) + NAV_RESPONSIVE_SCRIPT + '\n' + html.slice(bodyClose);
    }

    if (html === before) { unchanged++; continue; }
    fs.writeFileSync(file, html);
    changed++;
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
}

console.log(`Updated: ${changed} | Already current: ${unchanged} | Errors: ${errors.length} | Footers replaced: ${footersReplaced}`);
errors.forEach(e => console.log('  ERROR', e));
