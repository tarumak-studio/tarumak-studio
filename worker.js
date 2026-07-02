/* worker.js — Tarumak Studio AI Search proxy (Cloudflare Worker)
 *
 * The ONLY server-side component in the architecture. Responsibilities:
 *   1. Keep the Anthropic API key out of client JS (it lives in a Worker secret)
 *   2. Enforce a per-IP daily quota (Workers KV) so worst-case spend is bounded
 *   3. Assemble the system prompt with the tool catalog, using Anthropic
 *      prompt caching so the ~3.7k-token catalog is paid for once, not per call
 *   4. Validate the model's JSON against the real catalog before returning
 *      (defense in depth — the client validates again via bySlug)
 *
 * ── Deploy checklist ────────────────────────────────────────────────
 *   1. wrangler kv:namespace create AI_QUOTA        → bind as AI_QUOTA below
 *   2. wrangler secret put ANTHROPIC_API_KEY
 *   3. Upload ai-catalog.json to the site root (build-catalog.js output)
 *   4. wrangler deploy — then set AI_ENDPOINT in the client to this route
 *
 * wrangler.toml minimal:
 *   name = "tarumak-ai-search"
 *   main = "worker.js"
 *   compatibility_date = "2026-01-01"
 *   [[kv_namespaces]]
 *   binding = "AI_QUOTA"
 *   id = "<your-kv-id>"
 */

const CONFIG = {
  ALLOWED_ORIGIN: 'https://tarumakstudio.com',
  CATALOG_URL: 'https://tarumakstudio.com/ai-catalog.json',
  MODEL: 'claude-haiku-4-5',        // 95%-case model per the strategy doc
  MAX_TOKENS: 400,
  DAILY_FREE_QUOTA: 20,             // per IP per UTC day — the real budget ceiling
  UPSTREAM_TIMEOUT_MS: 12000,
  MAX_QUERY_CHARS: 300
};

/* Module-scope catalog cache — survives across requests within an isolate.
   Cloudflare may evict isolates at any time; the Cache API layer below
   covers cold starts cheaply. */
let CATALOG = null;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (request.method !== 'POST') return cors(json({ error: 'method' }, 405));

    // Origin gate — this endpoint serves the site, not the open internet
    const origin = request.headers.get('Origin') || '';
    if (origin !== CONFIG.ALLOWED_ORIGIN) return cors(json({ error: 'origin' }, 403));

    // ── Quota (per IP, per UTC day) ─────────────────────────────────
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const quotaKey = `q:${day}:${ip}`;
    const used = parseInt(await env.AI_QUOTA.get(quotaKey) || '0', 10);
    if (used >= CONFIG.DAILY_FREE_QUOTA) {
      return cors(json({ error: 'quota', remaining: 0 }, 429));
    }

    // ── Input ──────────────────────────────────────────────────────
    let q;
    try {
      const body = await request.json();
      q = String(body.q || '').slice(0, CONFIG.MAX_QUERY_CHARS).trim();
    } catch { return cors(json({ error: 'bad_request' }, 400)); }
    if (!q) return cors(json({ error: 'empty' }, 400));

    // ── Catalog (module cache → edge cache → origin) ───────────────
    const catalog = await getCatalog();
    if (!catalog) return cors(json({ error: 'catalog_unavailable' }, 503));

    // ── Claude call — system prompt cached via cache_control ───────
    const system = [
      {
        type: 'text',
        text: buildSystemPrompt(catalog),
        cache_control: { type: 'ephemeral' }   // catalog block: pay once, ~10% on hits
      }
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.UPSTREAM_TIMEOUT_MS);
    let upstream;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          max_tokens: CONFIG.MAX_TOKENS,
          temperature: 0,
          system,
          messages: [{ role: 'user', content: q }]
        })
      });
    } catch (e) {
      clearTimeout(timer);
      return cors(json({ error: 'upstream_timeout' }, 504));
    }
    clearTimeout(timer);

    if (!upstream.ok) {
      // Do not leak upstream error bodies to the client
      return cors(json({ error: 'upstream', status: upstream.status }, 502));
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text).join('');

    // ── Parse + validate against the real catalog ──────────────────
    const result = parseAndValidate(text, catalog);
    if (!result) return cors(json({ error: 'unparseable' }, 502));

    // Count against quota only on SUCCESS — failed calls shouldn't
    // burn a user's daily allowance
    await env.AI_QUOTA.put(quotaKey, String(used + 1), { expirationTtl: 60 * 60 * 26 });

    result.remaining = CONFIG.DAILY_FREE_QUOTA - used - 1;
    return cors(json(result, 200));
  }
};

/* ── System prompt ──────────────────────────────────────────────── */
function buildSystemPrompt(catalog) {
  return `You are the tool-finding intelligence for Tarumak Studio, a browser-based toolkit where every tool runs locally and files never leave the user's device.

CATALOG — the ONLY tools that exist (${catalog.count} total):
${JSON.stringify(catalog.tools)}

CATEGORY SLUGS (for the "fallback" field): image, pdf, converter, marketing, developer

RULES:
1. Respond with ONLY valid JSON matching the schema. No prose, no markdown fences.
2. Recommend ONLY slugs present in the catalog. Never invent a slug.
3. Multi-intent queries ("remove background and compress it") → ordered tool sequence, "sequence": true, in execution order.
4. Single-intent → the ONE best tool. Maximum 3 tools ever.
5. Each "reason" is 8 words or fewer, plain language, no marketing tone.
6. If nothing fits, return "tools": [] and set "fallback" to the closest category slug.
7. Never mention uploading — nothing uploads on this site.

SCHEMA:
{"tools":[{"slug":"...","reason":"..."}],"sequence":false,"fallback":null}

EXAMPLES:
Q: "I want to remove the background and shrink the file"
{"tools":[{"slug":"background-remover","reason":"removes the background first"},{"slug":"image-compressor","reason":"then shrinks the file size"}],"sequence":true,"fallback":null}

Q: "make my photo smaller"
{"tools":[{"slug":"image-compressor","reason":"reduces file size, keeps quality"}],"sequence":false,"fallback":null}

Q: "edit a video"
{"tools":[],"sequence":false,"fallback":"converter"}`;
}

/* ── Response validation — the model is never trusted blindly ───── */
function parseAndValidate(text, catalog) {
  let obj;
  try {
    // Strip accidental code fences defensively, then parse
    obj = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch { return null; }
  if (!obj || !Array.isArray(obj.tools)) return null;

  const valid = new Set(catalog.tools.map(t => t.slug));
  const cats = new Set(Object.keys(catalog.categories || {}));

  const tools = obj.tools
    .filter(t => t && typeof t.slug === 'string' && valid.has(t.slug))
    .slice(0, 3)
    .map(t => ({
      slug: t.slug,
      reason: String(t.reason || '').slice(0, 80)
    }));

  return {
    tools,
    sequence: obj.sequence === true && tools.length > 1,
    fallback: (typeof obj.fallback === 'string' && cats.has(obj.fallback)) ? obj.fallback : null
  };
}

/* ── Catalog fetch with two cache layers ────────────────────────── */
async function getCatalog() {
  if (CATALOG) return CATALOG;
  try {
    const cache = caches.default;
    const req = new Request(CONFIG.CATALOG_URL);
    let res = await cache.match(req);
    if (!res) {
      res = await fetch(req);
      if (!res.ok) return null;
      const toCache = new Response(res.clone().body, res);
      toCache.headers.set('Cache-Control', 'max-age=3600');
      await cache.put(req, toCache);
    }
    CATALOG = await res.json();
    return CATALOG;
  } catch { return null; }
}

/* ── Helpers ────────────────────────────────────────────────────── */
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'content-type': 'application/json' }
  });
}
function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', CONFIG.ALLOWED_ORIGIN);
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'content-type');
  return res;
}
