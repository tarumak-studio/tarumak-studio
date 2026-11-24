/* Cloudflare Pages Function — runs at the edge before any static asset is
 * served, for every request to this project (apex + www, since both are
 * attached as custom domains on the same Pages project).
 *
 * Why this exists: _redirects already declares
 *   https://www.tarumakstudio.com/*  https://tarumakstudio.com/:splat  301
 * but in production www.tarumakstudio.com is serving the site directly
 * with a 200 instead of redirecting (verified via curl -I against the
 * live site) — a full duplicate copy of all ~130 pages crawlable at a
 * second hostname. _redirects' host-matching for a domain that is itself
 * a custom domain on the same Pages project does not reliably apply this
 * redirect; this Function enforces it unconditionally at the request
 * level instead, which Pages always runs regardless of that.
 *
 * It also now handles a few individual paths where _redirects has a
 * correct, verified-present rule that Cloudflare's edge simply isn't
 * honoring for reasons never fully diagnosable from outside the
 * dashboard (confirmed via raw.githubusercontent.com that the rule is
 * deployed, confirmed via cache purge that it isn't a caching issue —
 * the edge is just not applying it). Handling these explicitly here is
 * a reliable fallback that doesn't depend on that black box. Add future
 * one-off path fixes to PATH_REDIRECTS below rather than fighting
 * _redirects again.
 */
const PATH_REDIRECTS = {
  '/tools/image-converter': '/image-converter',
  '/tools/image-converter/': '/image-converter',
  '/tools/compress-image-to-exact-kb': '/compress-image-to-exact-kb',
  '/tools/compress-image-to-exact-kb/': '/compress-image-to-exact-kb',
  /* Articles merged into a fuller one (November 2026) */
  '/article-how-to-merge-pdfs': '/article-merge-pdf-online-free',
  '/article-how-to-merge-pdfs.html': '/article-merge-pdf-online-free',
  '/article-remove-background-image-free': '/article-how-to-remove-image-background-free',
  '/article-remove-background-image-free.html': '/article-how-to-remove-image-background-free',
  '/article-free-favicon-generator': '/article-best-favicon-size',
  '/article-free-favicon-generator.html': '/article-best-favicon-size',
  '/article-compress-images-web': '/article-compress-images-without-losing-quality',
  '/article-compress-images-web.html': '/article-compress-images-without-losing-quality',
  '/article-pdf-guide-2026': '/article-best-free-pdf-tools-2026',
  '/article-pdf-guide-2026.html': '/article-best-free-pdf-tools-2026',
  '/article-web-design-tools-2026': '/article-best-free-tools-designers-2026',
  '/article-web-design-tools-2026.html': '/article-best-free-tools-designers-2026',
  '/article-free-tools-freelancers': '/article-best-free-tools-designers-2026',
  '/article-free-tools-freelancers.html': '/article-best-free-tools-designers-2026',
  /* The SVG converter outputs PNG too; ?format=png preselects it */
  '/svg-to-png': '/svg-to-jpg?format=png',
  '/svg-to-png.html': '/svg-to-jpg?format=png',
};

/* Internal files that live in the repo root but must not be public:
 * working notes/reports (*.md), diffs, Node build scripts and their
 * build-time inputs, the AI-search Worker source, and test pages.
 * Pages serves everything in the output folder, so they are blocked
 * here with the normal 404 page. Runtime files (tool bundles, engines,
 * llms.txt, robots.txt, ai-catalog.json) are NOT in this list. */
const BLOCKED_FILES = new Set([
  '/header-chrome.js', '/resync-chrome.js', '/category-content.js',
  '/comparison-content.js', '/tool-content.js', '/tool-guides.js', '/tool-guides-2.js', '/hero-render.js',
  '/trust-blocks.js', '/tool-deps.js', '/recommend-prototype.js', '/worker.js',
  '/hero-showcase', '/hero-showcase.html', '/upscaler-test', '/upscaler-test.html',
]);
function isBlocked(pathname) {
  const p = decodeURIComponent(pathname);
  if (BLOCKED_FILES.has(p)) return true;
  if (/^\/[^/]+\.(md|diff)$/i.test(p)) return true;
  if (/^\/build-[^/]*\.js$/i.test(p)) return true;
  return false;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'www.tarumakstudio.com') {
    url.hostname = 'tarumakstudio.com';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  if (isBlocked(url.pathname)) {
    let body = 'Not found';
    let type = 'text/plain; charset=utf-8';
    try {
      const page = await context.env.ASSETS.fetch(new URL('/404', url.origin));
      if (page.ok) { body = await page.text(); type = 'text/html; charset=utf-8'; }
    } catch (e) { /* fall back to plain text */ }
    return new Response(body, {
      status: 404,
      headers: { 'Content-Type': type, 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
    });
  }

  const target = PATH_REDIRECTS[url.pathname];
  if (target) {
    const to = new URL(target, url.origin);
    url.searchParams.forEach((v, k) => { if (!to.searchParams.has(k)) to.searchParams.append(k, v); });
    return Response.redirect(to.toString(), 301);
  }

  return context.next();
}
