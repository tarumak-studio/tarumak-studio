/* build-404.js — one-time migration of 404.html onto the shared header
 * chrome (header-chrome.js), the same source every other page uses.
 *
 * Why this is separate from build-static-pages.js: that script finds its
 * targets by the OLD template's `class="site-header"` marker and expects
 * a `mob-menu` block inside it. 404.html predates even that template —
 * it has always been a hand-rolled, inline-styled, standalone header
 * with no Tools nav, no mobile menu, no search, no theme toggle — so it
 * never matched either build script's target-discovery and was silently
 * skipped by both migration rounds.
 *
 * After this runs once, 404.html contains `<header id="header">` like
 * every other page, so resync-chrome.js's own target discovery picks it
 * up automatically from now on — this script never needs to run again.
 *
 * Usage: node build-404.js
 */
'use strict';
const fs = require('fs');
const { getChrome } = require('./header-chrome.js');
const { CHROME_TOP, HEAD_LINKS, MEGA_MENU_SCRIPT } = getChrome();

const file = '404.html';
let html = fs.readFileSync(file, 'utf8');
const before = html;

/* ── 1. Swap the standalone inline header for the shared chrome ──────
   No nav-active key: 404 is not honestly "on" any section, matching
   the same choice already made for changelog.html and the legal pages. */
const headerStart = html.indexOf('<header');
const headerEnd = html.indexOf('</header>') + '</header>'.length;
if (headerStart === -1 || headerEnd === -1) throw new Error('build-404: header boundary not found');
html = html.slice(0, headerStart) + CHROME_TOP + html.slice(headerEnd);

/* ── 2. Replace the single existing /main.css link with the full
   shared HEAD_LINKS block (fonts/preconnect/icon + main.css +
   mega-menu.css) — 404.html had only main.css, nothing else. ── */
if (!html.includes('mega-menu.css')) {
  html = html.replace('<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n', '');
  html = html.replace('<link rel="stylesheet" href="/main.css">', HEAD_LINKS);
}

/* ── 3. Add the standard minimal script chain every other chrome-only
   page (about/contact/category/etc.) loads — 404.html had zero JS
   before this, so the search box, theme toggle, and mega-menu
   interactivity were all inert. ── */
if (!html.includes('mega-menu.js')) {
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) throw new Error('build-404: no </body> found');
  const scripts = ['/config.js', '/utils.js', '/data.js', '/features.js']
    .map(s => `<script src="${s}" defer></script>`).join('\n') + '\n' + MEGA_MENU_SCRIPT;
  html = html.slice(0, bodyClose) + scripts + '\n' + html.slice(bodyClose);
}

if (html === before) {
  console.log('404.html: already current, no changes made');
} else {
  fs.writeFileSync(file, html);
  console.log('404.html: migrated to shared header chrome + mega menu + standard script chain');
}
