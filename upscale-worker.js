/* upscale-worker.js — Tarumak Studio AI Upscaler proxy (Cloudflare Worker)
 *
 * Server-side super-resolution for the AI Image Upscaler, matching the
 * security pattern of worker.js (AI search):
 *   1. The Replicate API token lives in a Worker secret — never in client JS
 *   2. Per-IP daily quota via Workers KV bounds worst-case spend
 *   3. CORS locked to the production origin
 *
 * MODEL: nightmareai/real-esrgan on Replicate — the same Real-ESRGAN family
 * that powers the commercial upscalers (Upscale.media class results), with
 * optional GFPGAN face enhancement. Cost is roughly half a US cent per
 * image (billed by GPU-seconds; verify current pricing on replicate.com
 * before enabling — DAILY_FREE_QUOTA below is your spend ceiling).
 *
 * ── Deploy checklist ────────────────────────────────────────────────
 *   1. wrangler kv:namespace create UPSCALE_QUOTA   → bind below
 *   2. wrangler secret put REPLICATE_API_TOKEN
 *   3. wrangler deploy
 *   4. In upscaler-engine.js set:
 *        REMOTE.provider = 'replicate';
 *        REMOTE.endpoint = 'https://<your-worker-route>';
 *      (no other client change needed — the provider abstraction takes over,
 *       and the browser engines remain the automatic fallback)
 *
 * wrangler.toml minimal:
 *   name = "tarumak-upscale"
 *   main = "upscale-worker.js"
 *   compatibility_date = "2026-01-01"
 *   [[kv_namespaces]]
 *   binding = "UPSCALE_QUOTA"
 *   id = "<your-kv-id>"
 */

const CONFIG = {
  ALLOWED_ORIGIN: 'https://tarumakstudio.com',
  MODEL_PATH: 'nightmareai/real-esrgan',   // Real-ESRGAN + optional GFPGAN
  DAILY_FREE_QUOTA: 10,                    // per IP per UTC day — spend ceiling
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,      // 10 MB input cap
  SYNC_WAIT_SECONDS: 60,                   // Prefer: wait — most jobs finish well within
  POLL_INTERVAL_MS: 2000,
  MAX_POLLS: 30                            // + up to ~60s polling for slow jobs
};

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', CONFIG.ALLOWED_ORIGIN);
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}
function jsonRes(obj, status) {
  return cors(new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  }));
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* Chunked base64 — String.fromCharCode(...bigArray) blows the arg limit */
function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (request.method !== 'POST')    return jsonRes({ error: 'POST only' }, 405);
    if (!env.REPLICATE_API_TOKEN)     return jsonRes({ error: 'server not configured' }, 500);

    /* ── Per-IP daily quota (same pattern as the AI-search worker) ── */
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (env.UPSCALE_QUOTA) {
      const key = 'up:' + ip + ':' + new Date().toISOString().slice(0, 10);
      const used = parseInt(await env.UPSCALE_QUOTA.get(key) || '0', 10);
      if (used >= CONFIG.DAILY_FREE_QUOTA) {
        return jsonRes({ error: 'Daily AI upscale limit reached — try again tomorrow, or use the free in-browser engine.' }, 429);
      }
      await env.UPSCALE_QUOTA.put(key, String(used + 1), { expirationTtl: 90000 });
    }

    /* ── Input ─────────────────────────────────────────────────────── */
    let form;
    try { form = await request.formData(); }
    catch (e) { return jsonRes({ error: 'multipart form-data expected' }, 400); }
    const file = form.get('image');
    if (!file || typeof file.arrayBuffer !== 'function') return jsonRes({ error: 'image field required' }, 400);
    if (file.size > CONFIG.MAX_UPLOAD_BYTES) return jsonRes({ error: 'image too large (max 10 MB)' }, 413);
    const scale = Math.min(4, Math.max(2, parseInt(form.get('scale') || '2', 10) || 2));
    const face  = form.get('face') !== '0';

    const dataUri = 'data:' + (file.type || 'image/png') + ';base64,' + toBase64(await file.arrayBuffer());

    /* ── Run the model (sync-preferred, poll as fallback) ──────────── */
    const create = await fetch(
      'https://api.replicate.com/v1/models/' + CONFIG.MODEL_PATH + '/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.REPLICATE_API_TOKEN,
          'Content-Type': 'application/json',
          'Prefer': 'wait=' + CONFIG.SYNC_WAIT_SECONDS
        },
        body: JSON.stringify({ input: { image: dataUri, scale: scale, face_enhance: face } })
      }
    );
    if (!create.ok) {
      const detail = await create.text().catch(() => '');
      return jsonRes({ error: 'upstream ' + create.status, detail: detail.slice(0, 300) }, 502);
    }
    let pred = await create.json();

    let polls = 0;
    while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled'
           && pred.urls && pred.urls.get && polls < CONFIG.MAX_POLLS) {
      await sleep(CONFIG.POLL_INTERVAL_MS);
      const r = await fetch(pred.urls.get, { headers: { 'Authorization': 'Bearer ' + env.REPLICATE_API_TOKEN } });
      pred = await r.json();
      polls++;
    }
    if (pred.status !== 'succeeded' || !pred.output) {
      return jsonRes({ error: 'upscale failed', status: pred.status, detail: (pred.error || '').slice(0, 300) }, 502);
    }

    /* ── Stream the result image back (engine expects raw image bytes) ── */
    const outUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    const img = await fetch(outUrl);
    if (!img.ok) return jsonRes({ error: 'result fetch failed' }, 502);
    return cors(new Response(img.body, {
      status: 200,
      headers: {
        'Content-Type': img.headers.get('content-type') || 'image/png',
        'Cache-Control': 'no-store'
      }
    }));
  }
};
