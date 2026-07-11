/* upscaler-engine.js — Tarumak Studio AI Image Upscaler engine
 *
 * Loaded LAZILY by INIT['ai-image-upscaler'] on first use — this file is
 * never part of any other page's payload (code-splitting contract).
 *
 * PROVIDER ABSTRACTION
 * ────────────────────
 *   UpscaleEngine.run({canvas, scale, onProgress, signal}) -> Promise<{canvas, engine}>
 *
 *   Providers (tried in order of `PROVIDER_ORDER`, first available wins):
 *     browser-neural    ESRGAN via UpscalerJS + TF.js, loaded from CDN on
 *                       demand. Best quality. May be unavailable (CDN
 *                       blocked, WebGL missing, old browser) — that is a
 *                       normal, handled state, not an error.
 *     browser-classical Progressive 2-step Lanczos-style canvas resize +
 *                       gated unsharp mask. Always available, zero
 *                       downloads, transparency-safe. Guaranteed baseline.
 *     cloudflare-ai     Server-side stub — OFF until an endpoint is
 *                       configured (see REMOTE below). Never fakes output.
 *     replicate         Same contract, OFF by default.
 *     fal               Same contract, OFF by default.
 *
 *   Remote providers are wired but disabled: they require a proxy endpoint
 *   (never an API key in client JS — same rule as worker.js for AI search).
 *   To enable one later: set REMOTE.endpoint to your Worker URL and flip
 *   REMOTE.provider. No UI changes needed.
 */
(function () {
  'use strict';

  /* ── Remote provider config (single switch point) ─────────────── */
  var REMOTE = {
    provider: null,          /* 'cloudflare-ai' | 'replicate' | 'fal' | null */
    endpoint: null           /* your proxy Worker URL; keys live server-side */
  };

  var NEURAL_CDN = {
    upscaler: 'https://cdn.jsdelivr.net/npm/upscaler@1.0.0-beta.19/+esm',
    model2x:  'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-slim@1.0.0-beta.12/+esm'
  };

  var neuralPromise = null;

  /* ── Provider: browser-neural ──────────────────────────────────── */
  var BrowserNeural = {
    id: 'browser-neural',
    label: 'AI model (in your browser)',
    available: function () {
      /* WebGL or WASM needed for TF.js; feature-detect cheaply */
      try {
        var c = document.createElement('canvas');
        return !!(window.WebAssembly && (c.getContext('webgl2') || c.getContext('webgl')));
      } catch (e) { return false; }
    },
    load: function () {
      if (neuralPromise) return neuralPromise;
      neuralPromise = Promise.all([
        import(NEURAL_CDN.upscaler),
        import(NEURAL_CDN.model2x)
      ]).then(function (mods) {
        var Upscaler = mods[0].default || mods[0].Upscaler || mods[0];
        var modelPkg = mods[1];
        var model = modelPkg.default || modelPkg.x2 || modelPkg;
        if (typeof Upscaler !== 'function') throw new Error('upscaler module shape unexpected');
        return new Upscaler({ model: model });
      }).catch(function (e) {
        neuralPromise = null;      /* allow retry next run */
        throw e;
      });
      return neuralPromise;
    },
    run: function (opts) {
      var factor = opts.scale, canvas = opts.canvas;
      return BrowserNeural.load().then(function (upscaler) {
        /* ESRGAN-slim is a 2x model: run once for 2x, twice for 4x. */
        function pass(srcCanvas, passIdx, passes) {
          if (opts.signal && opts.signal.cancelled) throw new Error('cancelled');
          return upscaler.upscale(srcCanvas, {
            output: 'base64',            /* broadest support across the beta API */
            patchSize: 64, padding: 2,
            progress: function (p) {
              if (opts.signal && opts.signal.cancelled) return;
              if (opts.onProgress) opts.onProgress((passIdx + p) / passes, 'AI pass ' + (passIdx + 1) + ' of ' + passes);
            }
          }).then(function (b64) {
            return new Promise(function (res, rej) {
              var img = new Image();
              img.onload = function () {
                var c = document.createElement('canvas');
                c.width = img.naturalWidth; c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                res(c);
              };
              img.onerror = function () { rej(new Error('neural output decode failed')); };
              img.src = b64;
            });
          });
        }
        var passes = factor >= 4 ? 2 : 1;
        var p = pass(canvas, 0, passes);
        if (passes === 2) p = p.then(function (c1) { return pass(c1, 1, 2); });
        return p.then(function (out) { return { canvas: out, engine: BrowserNeural.label }; });
      });
    }
  };

  /* ── Provider: browser-classical (guaranteed baseline) ─────────── */
  var BrowserClassical = {
    id: 'browser-classical',
    label: 'High-quality resampling',
    available: function () { return true; },
    run: function (opts) {
      return new Promise(function (resolve, reject) {
        try {
          var src = opts.canvas, factor = opts.scale;
          var steps = factor >= 4 ? 2 : 1;          /* progressive: 2x per step */
          var cur = src, done = 0;
          function step() {
            if (opts.signal && opts.signal.cancelled) { reject(new Error('cancelled')); return; }
            var c = document.createElement('canvas');
            c.width = Math.round(cur.width * 2);
            c.height = Math.round(cur.height * 2);
            var x = c.getContext('2d');
            x.imageSmoothingEnabled = true;
            x.imageSmoothingQuality = 'high';
            x.drawImage(cur, 0, 0, c.width, c.height);
            cur = c; done++;
            if (opts.onProgress) opts.onProgress(done / (steps + 1), 'Resampling ' + done + '/' + steps);
            if (done < steps) { setTimeout(step, 0); }   /* yield to UI */
            else { setTimeout(sharpen, 0); }
          }
          function sharpen() {
            if (opts.signal && opts.signal.cancelled) { reject(new Error('cancelled')); return; }
            var px = cur.width * cur.height;
            /* Above ~24MP the sharpen pass costs many seconds of main-thread
               work for detail nobody can see at fit zoom — skip it honestly. */
            if (px > 24000000) {
              if (opts.onProgress) opts.onProgress(1, 'Done (sharpen skipped on very large image)');
              resolve({ canvas: cur, engine: BrowserClassical.label });
              return;
            }
            unsharpAsync(cur, 0.55, 2, function (p, label) {
              if (opts.onProgress) opts.onProgress(0.66 + p * 0.34, label);
            }, opts.signal).then(function () {
              if (opts.onProgress) opts.onProgress(1, 'Finishing');
              resolve({ canvas: cur, engine: BrowserClassical.label });
            }).catch(function (e) {
              if (e && e.message === 'cancelled') { reject(e); return; }
              /* sharpening is optional — never fail the whole job over it */
              resolve({ canvas: cur, engine: BrowserClassical.label });
            });
          }
          step();
        } catch (e) { reject(e); }
      });
    }
  };

  /* Gated unsharp mask — ASYNC, processed in row bands so the main thread
     yields between bands (UI stays responsive, Cancel works, progress is
     real). Sharpen RGB only (alpha untouched → transparency preserved);
     skip pixels whose local contrast is below `threshold` (suppresses
     halo/ringing on smooth gradients). */
  function unsharpAsync(canvas, amount, threshold, onP, signal) {
    return new Promise(function (res, rej) {
      var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d');
      var id, d, blur;
      try {
        id = ctx.getImageData(0, 0, w, h); d = id.data;
        blur = new Uint8ClampedArray(d.length);
      } catch (e) { res(); return; }              /* readback blocked/OOM: skip */
      var BAND = Math.max(64, Math.round(2000000 / w));  /* ~2M px per slice */
      var phase = 0, y = 0;                        /* 0 = blur, 1 = apply */
      function blurBand(y0, y1) {
        for (var yy = y0; yy < y1; yy++) for (var x = 0; x < w; x++) {
          var i = (yy * w + x) * 4, r = 0, g = 0, b = 0, n = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var nx = x + dx, ny = yy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            var j = (ny * w + nx) * 4;
            r += d[j]; g += d[j + 1]; b += d[j + 2]; n++;
          }
          blur[i] = r / n; blur[i + 1] = g / n; blur[i + 2] = b / n; blur[i + 3] = d[i + 3];
        }
      }
      function applyBand(y0, y1) {
        for (var i = y0 * w * 4, end = y1 * w * 4; i < end; i += 4) {
          for (var k = 0; k < 3; k++) {
            var diff = d[i + k] - blur[i + k];
            if (diff > threshold || diff < -threshold) {
              var v = d[i + k] + diff * amount;
              d[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
            }
          }
          /* d[i+3] (alpha) intentionally untouched */
        }
      }
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(h, y + BAND);
        if (phase === 0) blurBand(y, end); else applyBand(y, end);
        y = end;
        var frac = phase === 0 ? (y / h) * 0.6 : 0.6 + (y / h) * 0.4;
        if (onP) onP(frac, 'Sharpening ' + Math.round(frac * 100) + '%');
        if (y >= h) {
          if (phase === 0) { phase = 1; y = 0; }
          else { ctx.putImageData(id, 0, 0); res(); return; }
        }
        setTimeout(tick, 0);                       /* yield to the UI thread */
      }
      tick();
    });
  }

  /* ── Remote provider template (cloudflare-ai / replicate / fal) ── */
  function remoteProvider(id, label) {
    return {
      id: id, label: label,
      available: function () { return REMOTE.provider === id && !!REMOTE.endpoint; },
      run: function (opts) {
        return new Promise(function (resolve, reject) {
          opts.canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('encode failed')); return; }
            var fd = new FormData();
            fd.append('image', blob, 'input.png');
            fd.append('scale', String(opts.scale));
            fetch(REMOTE.endpoint, { method: 'POST', body: fd })
              .then(function (r) { if (!r.ok) throw new Error('server ' + r.status); return r.blob(); })
              .then(function (out) {
                var img = new Image();
                img.onload = function () {
                  var c = document.createElement('canvas');
                  c.width = img.naturalWidth; c.height = img.naturalHeight;
                  c.getContext('2d').drawImage(img, 0, 0);
                  URL.revokeObjectURL(img.src);
                  resolve({ canvas: c, engine: label });
                };
                img.onerror = function () { reject(new Error('remote output decode failed')); };
                img.src = URL.createObjectURL(out);
              }).catch(reject);
          }, 'image/png');
        });
      }
    };
  }

  var PROVIDERS = {
    'browser-neural':    BrowserNeural,
    'browser-classical': BrowserClassical,
    'cloudflare-ai':     remoteProvider('cloudflare-ai', 'Cloudflare AI'),
    'replicate':         remoteProvider('replicate', 'Replicate'),
    'fal':               remoteProvider('fal', 'Fal.ai')
  };
  /* Remote first IF configured, then browser AI, then guaranteed baseline */
  var PROVIDER_ORDER = ['cloudflare-ai', 'replicate', 'fal', 'browser-neural', 'browser-classical'];

  window.UpscaleEngine = {
    providers: PROVIDERS,
    remoteConfig: REMOTE,
    run: function (opts) {
      var chain = PROVIDER_ORDER.filter(function (id) { return PROVIDERS[id].available(); });
      function attempt(idx) {
        if (idx >= chain.length) return Promise.reject(new Error('no provider available'));
        var prov = PROVIDERS[chain[idx]];
        if (opts.onEngine) opts.onEngine(prov.label);
        return prov.run(opts).catch(function (e) {
          if (e && e.message === 'cancelled') throw e;      /* user cancel: stop */
          if (idx + 1 < chain.length && opts.onProgress) opts.onProgress(0, 'Switching engine\u2026');
          if (idx + 1 >= chain.length) throw e;
          return attempt(idx + 1);                           /* graceful fallback */
        });
      }
      return attempt(0);
    }
  };
})();
