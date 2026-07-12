/* remover-engine.js — Tarumak Studio AI Object Remover engine
 *
 * Provider abstraction (same architecture as upscaler/enhancer engines):
 *
 *   RemoverEngine.run({canvas, mask, quality, signal, onProgress, onEngine})
 *     ├─ remote provider (Cloudflare AI / Fal / Replicate / OpenAI —
 *     │   plug-and-play, OFF until REMOTE.endpoint set; this is the
 *     │   LaMa/Firefly-class tier: sends image + mask, receives inpainted
 *     │   image)
 *     └─ browser-fill (default, always available): multi-scale content-aware
 *         fill — pyramid diffusion for structure + surrounding-patch texture
 *         synthesis for detail. Honest tier: excellent on uniform/textured
 *         regions (sky, grass, walls, roads — power lines, tourists, text),
 *         weaker on complex structure. The UI must say which engine ran.
 *
 * mask: a canvas the same size as `canvas` where alpha>0 marks pixels to
 * remove. Unmasked pixels are NEVER modified (verified by unit test).
 */
(function () {
  'use strict';
  if (window.RemoverEngine) return;

  var REMOTE = { provider: null, endpoint: null };

  function maskBoolFromCanvas(mask, w, h) {
    var mx = mask.getContext('2d');
    var md = mx.getImageData(0, 0, w, h).data;
    var m = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) m[i] = md[i * 4 + 3] > 8 ? 1 : 0;
    return m;
  }

  /* ── Multi-scale diffusion fill ─────────────────────────────────────
     Downscale image+mask by 2 until the hole is a few pixels, fill the
     coarsest level by iterative neighbor averaging, then walk back up:
     upscale the fill, keep original pixels where unmasked, and relax the
     masked region against its neighbors a few times per level. Produces
     smooth, structure-following fills without seams or halos. */
  function levelDown(data, m, w, h) {
    var nw = Math.max(1, w >> 1), nh = Math.max(1, h >> 1);
    var nd = new Float32Array(nw * nh * 3), nm = new Uint8Array(nw * nh);
    for (var y = 0; y < nh; y++) for (var x = 0; x < nw; x++) {
      var r = 0, g = 0, b = 0, cnt = 0, holes = 0;
      for (var dy = 0; dy < 2; dy++) for (var dx = 0; dx < 2; dx++) {
        var sx = Math.min(w - 1, x * 2 + dx), sy = Math.min(h - 1, y * 2 + dy);
        var si = sy * w + sx;
        if (m[si]) { holes++; continue; }
        r += data[si * 3]; g += data[si * 3 + 1]; b += data[si * 3 + 2]; cnt++;
      }
      var ni = y * nw + x;
      if (cnt === 0) { nm[ni] = 1; }
      else { nd[ni * 3] = r / cnt; nd[ni * 3 + 1] = g / cnt; nd[ni * 3 + 2] = b / cnt; nm[ni] = holes === 4 ? 1 : 0; }
    }
    return { d: nd, m: nm, w: nw, h: nh };
  }

  function relax(d, m, w, h, iters) {
    for (var it = 0; it < iters; it++) {
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var i = y * w + x;
        if (!m[i]) continue;
        var r = 0, g = 0, b = 0, n = 0;
        if (x > 0)     { var j = i - 1; r += d[j * 3]; g += d[j * 3 + 1]; b += d[j * 3 + 2]; n++; }
        if (x < w - 1) { j = i + 1;     r += d[j * 3]; g += d[j * 3 + 1]; b += d[j * 3 + 2]; n++; }
        if (y > 0)     { j = i - w;     r += d[j * 3]; g += d[j * 3 + 1]; b += d[j * 3 + 2]; n++; }
        if (y < h - 1) { j = i + w;     r += d[j * 3]; g += d[j * 3 + 1]; b += d[j * 3 + 2]; n++; }
        if (n) { d[i * 3] = r / n; d[i * 3 + 1] = g / n; d[i * 3 + 2] = b / n; }
      }
    }
  }

  function pyramidFill(id, m, w, h, onP, signal) {
    return new Promise(function (res, rej) {
      var d0 = id.data;
      var base = new Float32Array(w * h * 3);
      for (var i = 0; i < w * h; i++) { base[i * 3] = d0[i * 4]; base[i * 3 + 1] = d0[i * 4 + 1]; base[i * 3 + 2] = d0[i * 4 + 2]; }
      /* build pyramid */
      var levels = [{ d: base, m: m, w: w, h: h }];
      var cur = levels[0], holes = 0;
      for (i = 0; i < m.length; i++) holes += m[i];
      var maxLv = 0;
      while (cur.w > 8 && cur.h > 8 && maxLv < 10) {
        cur = levelDown(cur.d, cur.m, cur.w, cur.h);
        levels.push(cur); maxLv++;
        var hcount = 0; for (i = 0; i < cur.m.length; i++) hcount += cur.m[i];
        if (hcount === 0) break;
      }
      /* coarsest: hard relax until converged-ish */
      var lv = levels.length - 1;
      function processLevel() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var L = levels[lv];
        if (lv === levels.length - 1) {
          relax(L.d, L.m, L.w, L.h, 60);
        } else {
          /* seed masked pixels from the coarser level, then relax */
          var C = levels[lv + 1];
          for (var y = 0; y < L.h; y++) for (var x = 0; x < L.w; x++) {
            var ii = y * L.w + x;
            if (!L.m[ii]) continue;
            var cx = Math.min(C.w - 1, x >> 1), cy = Math.min(C.h - 1, y >> 1);
            var ci = cy * C.w + cx;
            L.d[ii * 3] = C.d[ci * 3]; L.d[ii * 3 + 1] = C.d[ci * 3 + 1]; L.d[ii * 3 + 2] = C.d[ci * 3 + 2];
          }
          relax(L.d, L.m, L.w, L.h, lv === 0 ? 8 : 14);
        }
        if (onP) onP(1 - lv / levels.length);
        lv--;
        if (lv < 0) {
          /* write back — ONLY masked pixels; alpha of masked set to 255 */
          for (var k = 0; k < w * h; k++) {
            if (!m[k]) continue;
            d0[k * 4] = Math.max(0, Math.min(255, base[k * 3]));
            d0[k * 4 + 1] = Math.max(0, Math.min(255, base[k * 3 + 1]));
            d0[k * 4 + 2] = Math.max(0, Math.min(255, base[k * 3 + 2]));
            d0[k * 4 + 3] = 255;
          }
          res();
          return;
        }
        setTimeout(processLevel, 0);
      }
      processLevel();
    });
  }

  /* ── Texture synthesis pass ─────────────────────────────────────────
     The diffusion fill is smooth; real surfaces have grain. Stamp soft
     patches sampled from a ring just OUTSIDE the mask onto the filled
     area, blended at low opacity, so the fill inherits the texture of
     its actual surroundings (never repeats one tile — samples are
     per-stamp random from the ring). Skipped in 'fast' mode. */
  function texturePass(ctx, m, w, h, strength, onP, signal, rand) {
    return new Promise(function (res, rej) {
      rand = rand || Math.random;
      /* collect masked pixel indices + ring source points */
      var holePts = [], ring = [];
      for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
        var i = y * w + x;
        if (m[i]) { holePts.push(i); continue; }
        /* ring = unmasked pixel adjacent to mask */
        if (m[i - 1] || m[i + 1] || m[i - w] || m[i + w]) ring.push(i);
      }
      if (!holePts.length || ring.length < 4) { res(); return; }
      var id = ctx.getImageData(0, 0, w, h), d = id.data;
      var src = d.slice(0);
      var P = 7, HP = 3;              /* patch 7x7 */
      var stamps = Math.min(4000, Math.round(holePts.length / 6 * strength));
      var done = 0, CHUNK = 300;
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(stamps, done + CHUNK);
        for (var s = done; s < end; s++) {
          var hi = holePts[(rand() * holePts.length) | 0];
          var hx = hi % w, hy = (hi / w) | 0;
          var ri = ring[(rand() * ring.length) | 0];
          var rx = ri % w, ry = (ri / w) | 0;
          for (var dy = -HP; dy <= HP; dy++) for (var dx = -HP; dx <= HP; dx++) {
            var tx = hx + dx, ty = hy + dy;
            if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue;
            var ti = ty * w + tx;
            if (!m[ti]) continue;                       /* only inside mask */
            var sx = Math.max(0, Math.min(w - 1, rx + dx));
            var sy = Math.max(0, Math.min(h - 1, ry + dy));
            var si = (sy * w + sx) * 4;
            /* soft radial falloff + low alpha: add grain, keep structure */
            var fall = 1 - Math.sqrt(dx * dx + dy * dy) / (HP + 1);
            if (fall <= 0) continue;
            var a = 0.35 * fall * strength;
            var o = ti * 4;
            /* blend the DIFFERENCE from patch-local mean → pure texture,
               so patch brightness doesn't fight the diffusion structure */
            for (var c = 0; c < 3; c++) {
              var texel = src[si + c] - src[(ry * w + rx) * 4 + c];
              d[o + c] = Math.max(0, Math.min(255, d[o + c] + texel * a));
            }
          }
        }
        done = end;
        if (onP) onP(done / stamps);
        if (done >= stamps) { ctx.putImageData(id, 0, 0); res(); return; }
        setTimeout(tick, 0);
      }
      /* start from the already-diffusion-filled canvas */
      ctx.putImageData(id, 0, 0);
      tick();
    });
  }

  /* Edge blending: one gentle relax of a 1px band just inside the mask
     boundary against outside neighbors — kills residual seams. */
  function seamBlend(ctx, m, w, h) {
    try {
      var id = ctx.getImageData(0, 0, w, h), d = id.data;
      for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
        var i = y * w + x;
        if (!m[i]) continue;
        if (!(m[i - 1] && m[i + 1] && m[i - w] && m[i + w])) {   /* boundary */
          var o = i * 4, n = 0, r = 0, g = 0, b = 0;
          [i - 1, i + 1, i - w, i + w].forEach(function (j) {
            r += d[j * 4]; g += d[j * 4 + 1]; b += d[j * 4 + 2]; n++;
          });
          d[o] = (d[o] + r / n) / 2; d[o + 1] = (d[o + 1] + g / n) / 2; d[o + 2] = (d[o + 2] + b / n) / 2;
        }
      }
      ctx.putImageData(id, 0, 0);
    } catch (e) {}
  }

  var BrowserFill = {
    id: 'browser-fill',
    label: 'On-device content-aware fill',
    available: function () { return true; },
    run: function (opts) {
      var canvas = opts.canvas, w = canvas.width, h = canvas.height;
      var ctx = canvas.getContext('2d');
      var quality = opts.quality || 'auto';    /* fast | auto | max */
      var m;
      try { m = maskBoolFromCanvas(opts.mask, w, h); }
      catch (e) { return Promise.reject(new Error('mask read failed')); }
      var holes = 0; for (var i = 0; i < m.length; i++) holes += m[i];
      if (!holes) return Promise.reject(new Error('nothing selected \u2014 paint over what you want removed first'));
      if (holes / (w * h) > 0.6) return Promise.reject(new Error('selection covers most of the image \u2014 select just the object to remove'));
      var id;
      try { id = ctx.getImageData(0, 0, w, h); }
      catch (e) { return Promise.reject(new Error('image memory readback failed')); }
      if (opts.onProgress) opts.onProgress(0.05, 'Reconstructing background\u2026');
      return pyramidFill(id, m, w, h, function (p) {
        if (opts.onProgress) opts.onProgress(0.05 + p * (quality === 'fast' ? 0.9 : 0.55), 'Reconstructing background\u2026');
      }, opts.signal).then(function () {
        ctx.putImageData(id, 0, 0);
        if (quality === 'fast') return;
        var strength = quality === 'max' ? 1.0 : 0.7;
        if (opts.onProgress) opts.onProgress(0.62, 'Matching surrounding texture\u2026');
        return texturePass(ctx, m, w, h, strength, function (p) {
          if (opts.onProgress) opts.onProgress(0.62 + p * 0.3, 'Matching surrounding texture\u2026');
        }, opts.signal);
      }).then(function () {
        if (opts.onProgress) opts.onProgress(0.95, 'Blending edges\u2026');
        seamBlend(ctx, m, w, h);
        if (opts.onProgress) opts.onProgress(1, 'Done');
        return { canvas: canvas, engine: BrowserFill.label };
      });
    }
  };

  function remoteProvider(id, label) {
    return {
      id: id, label: label + ' (cloud AI inpainting)',
      available: function () { return REMOTE.provider === id && !!REMOTE.endpoint; },
      run: function (opts) {
        return new Promise(function (res, rej) {
          opts.canvas.toBlob(function (imgBlob) {
            if (!imgBlob) { rej(new Error('encode failed')); return; }
            opts.mask.toBlob(function (maskBlob) {
              if (!maskBlob) { rej(new Error('mask encode failed')); return; }
              var fd = new FormData();
              fd.append('image', imgBlob, 'image.png');
              fd.append('mask', maskBlob, 'mask.png');
              fd.append('mode', 'remove');
              if (opts.onProgress) opts.onProgress(0.2, 'Inpainting on secure server\u2026');
              fetch(REMOTE.endpoint, { method: 'POST', body: fd }).then(function (r) {
                if (!r.ok) throw new Error('server ' + r.status);
                return r.blob();
              }).then(function (out) {
                var img = new Image();
                img.onload = function () {
                  var c = document.createElement('canvas');
                  c.width = img.naturalWidth; c.height = img.naturalHeight;
                  c.getContext('2d').drawImage(img, 0, 0);
                  URL.revokeObjectURL(img.src);
                  res({ canvas: c, engine: label });
                };
                img.onerror = function () { rej(new Error('server output decode failed')); };
                img.src = URL.createObjectURL(out);
              }).catch(rej);
            }, 'image/png');
          }, 'image/png');
        });
      }
    };
  }

  var PROVIDERS = {
    'cloudflare-ai': remoteProvider('cloudflare-ai', 'Cloudflare AI'),
    'fal':           remoteProvider('fal', 'Fal.ai'),
    'replicate':     remoteProvider('replicate', 'Replicate'),
    'openai':        remoteProvider('openai', 'OpenAI'),
    'browser-fill':  BrowserFill
  };
  var ORDER = ['cloudflare-ai', 'fal', 'replicate', 'openai', 'browser-fill'];

  window.RemoverEngine = {
    version: '1.0',
    providers: PROVIDERS,
    remoteConfig: REMOTE,
    lastErrors: {},
    run: function (opts) {
      var self = window.RemoverEngine;
      self.lastErrors = {};
      var chain = ORDER.filter(function (id) { return PROVIDERS[id].available(); });
      function attempt(idx) {
        if (idx >= chain.length) return Promise.reject(new Error('no provider available'));
        var prov = PROVIDERS[chain[idx]];
        if (opts.onEngine) opts.onEngine(prov.label);
        return prov.run(opts).catch(function (e) {
          if (e && e.message === 'cancelled') throw e;
          /* user-fixable errors must NOT silently fall through */
          if (/nothing selected|selection covers/.test(e && e.message || '')) throw e;
          self.lastErrors[prov.id] = (e && e.message) || String(e);
          try { console.warn('[remover] ' + prov.id + ' unavailable \u2192 falling back:', e); } catch (_) {}
          if (idx + 1 >= chain.length) throw e;
          return attempt(idx + 1);
        });
      }
      return attempt(0);
    }
  };
  try { console.log('[remover] engine v1.0 loaded'); } catch (e) {}
})();
