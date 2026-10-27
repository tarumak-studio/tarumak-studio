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
  '/svg-to-png': '/png-to-svg',
  '/svg-to-png.html': '/png-to-svg',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'www.tarumakstudio.com') {
    url.hostname = 'tarumakstudio.com';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  const target = PATH_REDIRECTS[url.pathname];
  if (target) {
    url.pathname = target;
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
