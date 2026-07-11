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

  /* Verified against the official UpscalerJS docs (script-tag usage):
     TF.js loads FIRST, then the model UMD (exposes a global like
     ESRGANMedium2x), then the upscaler UMD (exposes global Upscaler).
     esrgan-medium = the quality/speed balance tier; native 4x model
     exists, so 4x is ONE real model pass, not two stacked 2x passes. */
  var NEURAL_CDN = {
    tf:      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
    model2x: 'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@latest/dist/umd/2x.min.js',
    model4x: 'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@latest/dist/umd/4x.min.js',
    lib:     'https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js'
  };
  /* Neural input cap: patch-based inference cost grows with input area.
     Above ~4MP the wait becomes minutes — fall through to classical with
     an honest message instead of freezing someone's phone. */
  var NEURAL_MAX_INPUT_PX = 4000000;

  function loadScriptOnce(src, globName) {
    return new Promise(function (res, rej) {
      if (globName && window[globName]) { res(); return; }
      if (document.querySelector('script[src="' + src + '"]')) {
        var n = 0, iv = setInterval(function () {
          if (!globName || window[globName]) { clearInterval(iv); res(); }
          else if (++n > 200) { clearInterval(iv); rej(new Error('timeout ' + src)); }
        }, 150);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('failed ' + src)); };
      document.head.appendChild(s);
    });
  }

  var neuralInstances = {};   /* one Upscaler per scale, cached */

  /* ── Provider: browser-neural ──────────────────────────────────── */
  var BrowserNeural = {
    id: 'browser-neural',
    label: 'AI super-resolution (ESRGAN, in your browser)',
    available: function () {
      try {
        var c = document.createElement('canvas');
        return !!(window.WebAssembly && (c.getContext('webgl2') || c.getContext('webgl')));
      } catch (e) { return false; }
    },
    load: function (factor) {
      var key = factor >= 4 ? '4' : '2';
      if (neuralInstances[key]) return Promise.resolve(neuralInstances[key]);
      var modelSrc  = key === '4' ? NEURAL_CDN.model4x : NEURAL_CDN.model2x;
      var modelGlob = key === '4' ? 'ESRGANMedium4x'   : 'ESRGANMedium2x';
      /* Order matters and is sequential by design: tf → model → lib */
      return loadScriptOnce(NEURAL_CDN.tf, 'tf')
        .then(function () { return loadScriptOnce(modelSrc, modelGlob); })
        .then(function () { return loadScriptOnce(NEURAL_CDN.lib, 'Upscaler'); })
        .then(function () {
          /* Tolerate both UMD global shapes the model packages have used:
             a direct global (ESRGANMedium2x) or a namespace object
             (ESRGANMedium['2x'] / .x2). */
          var model = window[modelGlob]
            || (window.ESRGANMedium && (window.ESRGANMedium[key + 'x'] || window.ESRGANMedium['x' + key]));
          if (typeof window.Upscaler !== 'function') throw new Error('Upscaler library global missing after load');
          if (!model) throw new Error('model global missing after load (' + modelGlob + ')');
          neuralInstances[key] = new window.Upscaler({ model: model });
          return neuralInstances[key];
        });
    },
    run: function (opts) {
      var factor = opts.scale, canvas = opts.canvas;
      if (canvas.width * canvas.height > NEURAL_MAX_INPUT_PX) {
        /* Too large for in-browser inference at usable speed: signal a
           clean fallback (not an error dialog). */
        return Promise.reject(new Error('input too large for in-browser AI (' + Math.round(canvas.width * canvas.height / 1e6) + ' MP > 4 MP)'));
      }
      if (opts.onProgress) opts.onProgress(0.02, 'Loading AI model (one-time, cached)\u2026');
      return BrowserNeural.load(factor).then(function (upscaler) {
        if (opts.signal && opts.signal.cancelled) throw new Error('cancelled');
        if (opts.onProgress) opts.onProgress(0.05, 'AI reconstructing detail\u2026');
        /* UpscalerJS renamed upscale() to execute() around 1.0 — accept
           whichever this build exposes instead of crashing on the rename. */
        var call = upscaler.execute || upscaler.upscale;
        if (typeof call !== 'function') throw new Error('Upscaler instance has neither execute() nor upscale()');
        return call.call(upscaler, canvas, {
          output: 'base64',
          patchSize: 64, padding: 2,
          progress: function (p) {
            if (opts.signal && opts.signal.cancelled) return;
            if (opts.onProgress) opts.onProgress(0.05 + p * 0.9, 'AI reconstructing detail \u2014 ' + Math.round(p * 100) + '%');
          }
        });
      }).then(function (b64) {
        if (opts.signal && opts.signal.cancelled) throw new Error('cancelled');
        return new Promise(function (res, rej) {
          var img = new Image();
          img.onload = function () {
            var c = document.createElement('canvas');
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            c.getContext('2d').drawImage(img, 0, 0);
            res({ canvas: c, engine: BrowserNeural.label });
          };
          img.onerror = function () { rej(new Error('neural output decode failed')); };
          img.src = b64;
        });
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
            fd.append('face', '1');   /* GFPGAN face enhancement on the server */
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
    version: '3.0',
    providers: PROVIDERS,
    remoteConfig: REMOTE,
    lastErrors: {},            /* provider id -> why it fell through (diagnostics) */
    run: function (opts) {
      var self = window.UpscaleEngine;
      self.lastErrors = {};
      var chain = PROVIDER_ORDER.filter(function (id) { return PROVIDERS[id].available(); });
      function attempt(idx) {
        if (idx >= chain.length) return Promise.reject(new Error('no provider available'));
        var prov = PROVIDERS[chain[idx]];
        if (opts.onEngine) opts.onEngine(prov.label);
        return prov.run(opts).catch(function (e) {
          if (e && e.message === 'cancelled') throw e;      /* user cancel: stop */
          /* NEVER swallow the reason: record it and say it out loud. This is
             what makes "why didn't the AI run?" answerable from DevTools. */
          self.lastErrors[prov.id] = (e && e.message) || String(e);
          try { console.warn('[upscaler] ' + prov.id + ' unavailable \u2192 falling back:', e); } catch (_) {}
          if (idx + 1 >= chain.length) throw e;
          if (opts.onProgress) opts.onProgress(0, prov.id === 'browser-neural'
            ? 'AI engine unavailable on this device \u2014 using high-quality resampling instead'
            : 'Switching engine\u2026');
          return attempt(idx + 1);                           /* graceful fallback */
        });
      }
      return attempt(0);
    }
  };
  try { console.log('[upscaler] engine v3.0 loaded — CDN URLs verified against upscalerjs.com docs'); } catch (e) {}
})();
