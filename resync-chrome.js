/* resync-chrome.js — re-stamps the shared header (and its required CSS/JS
 * links) onto pages that already have it, whenever header-chrome.js's
 * output changes.
 *
 * Why this exists: build-tool-pages.js fully regenerates its 66 pages
 * from scratch every run, so header changes reach them automatically.
 * index.html and the other static pages (about, contact, blog, articles,
 * category pages, etc.) are NOT regenerated from scratch — their body
 * content is hand-authored and must survive untouched. This script is
 * the permanent, idempotent way to re-sync just the header/mobile-menu
 * block (and head links / script tag) on those pages, including any
 * future page authored the same way — run it after any change to
 * header-chrome.js.
 *
 * Usage: node resync-chrome.js
 */
'use strict';
const fs = require('fs');
const { getChrome, withActiveNav } = require('./header-chrome.js');

const { CHROME_TOP: BASE, HEAD_LINKS, MEGA_MENU_SCRIPT } = getChrome();

/* Same page -> nav-active mapping used by the original migration, plus
   the homepage itself (data-nav=""). */
function activeKeyFor(file) {
  if (file === 'index.html') return '';
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

let changed = 0, unchanged = 0, errors = [];

for (const file of targets) {
  try {
    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    const headerStart = html.indexOf('<header id="header">');
    const mainStart = html.indexOf('<main', headerStart);
    if (headerStart === -1 || mainStart === -1) throw new Error('header/main boundary not found');

    const key = activeKeyFor(file);
    const chrome = key !== null ? withActiveNav(BASE, key) : BASE;
    html = html.slice(0, headerStart) + chrome + '\n' + html.slice(mainStart).replace(/^\n+/, '');

    if (!html.includes('mega-menu.css')) {
      const headClose = html.indexOf('</head>');
      html = html.slice(0, headClose) + '  <link rel="stylesheet" href="/mega-menu.css">\n' + html.slice(headClose);
    }
    if (!html.includes('mega-menu.js')) {
      /* Insert right before </body> — same relative position as every
         other page's script chain (features.js always loads just before
         this point, tool pages already insert MEGA_MENU_SCRIPT right
         after it — matching that placement here too). */
      const bodyClose = html.lastIndexOf('</body>');
      if (bodyClose === -1) throw new Error('no </body> found');
      html = html.slice(0, bodyClose) + MEGA_MENU_SCRIPT + '\n' + html.slice(bodyClose);
    }

    if (html === before) { unchanged++; continue; }
    fs.writeFileSync(file, html);
    changed++;
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
}

console.log(`Updated: ${changed} | Already current: ${unchanged} | Errors: ${errors.length}`);
errors.forEach(e => console.log('  ERROR', e));
