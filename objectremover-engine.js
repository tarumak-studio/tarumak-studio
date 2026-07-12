/* objectremover-engine.js — Tarumak Studio AI Object Remover engine
 *
 * Provider architecture (same as upscaler/enhancer engines):
 *   ObjectRemoveEngine.run({canvas, mask, quality, ...})
 *     ├─ remote providers (Cloudflare AI / Fal / Replicate / OpenAI) —
 *     │   plug-and-play, OFF until REMOTE.endpoint is set; this is where
 *     │   LaMa / diffusion inpainting (Firefly-class) lives when enabled
 *     └─ browser-caf (default): content-aware fill on your device —
 *         multiscale diffusion base fill + patch-based texture synthesis,
 *         the PatchMatch family of techniques (what powered the original
 *         Photoshop Content-Aware Fill). Real algorithmic reconstruction,
 *         not a neural network — the UI copy must say exactly that.
 *
 * Strengths of the browser tier: textured/repeating backgrounds (sky,
 * grass, walls, roads, water), power lines, trash, small-to-medium
 * objects. Weakness: large removals across complex structure (a person
 * occluding architecture) — that's diffusion-model territory (cloud tier).
 *
 * The core fill operates on raw typed arrays with its own resampling, so
 * it is unit-testable outside a browser and has no hidden canvas
 * dependencies. All passes are chunked+cancellable. Alpha preserved.
 */
(function () {
  'use strict';
  if (window.ObjectRemoveEngine) return;

  var REMOTE = { provider: null, endpoint: null };

  /* ═══════════ core: typed-array image ops (canvas-free, testable) ═══ */

  /* Box-downsample RGBA + mask by integer-ish factor to ≤ maxEdge */
  function downsample(data, mask, w, h, maxEdge) {
    var s = Math.max(1, Math.ceil(Math.max(w, h) / maxEdge));
    var sw = Math.ceil(w / s), sh = Math.ceil(h / s);
    var out = new Float32Array(sw * sh * 3), om = new Uint8Array(sw * sh);
    for (var y = 0; y < sh; y++) for (var x = 0; x < sw; x++) {
      var r = 0, g = 0, b = 0, n = 0, mAny = 0, known = 0;
      for (var dy = 0; dy < s; dy++) for (var dx = 0; dx < s; dx++) {
        var yy = y * s + dy, xx = x * s + dx;
        if (yy >= h || xx >= w) continue;
        var i = yy * w + xx;
        if (mask[i]) { mAny = 1; continue; }        /* masked px excluded from color avg */
        r += data[i * 4]; g += data[i * 4 + 1]; b += data[i * 4 + 2]; known++;
      }
      var o = y * sw + x;
      if (known > 0) { out[o * 3] = r / known; out[o * 3 + 1] = g / known; out[o * 3 + 2] = b / known; om[o] = 0; }
      else { om[o] = 1; }                           /* block fully masked → unknown */
      if (mAny && known > 0) om[o] = 0;             /* partially masked block counts as known */
    }
    return { data: out, mask: om, w: sw, h: sh, scale: s };
  }

  /* Fill unknown small-image pixels: onion-peel init (BFS from known
     boundary, each new pixel = mean of already-known neighbours), then
     Jacobi smoothing passes restricted to the masked region → a seamless
     low-frequency base with correct color continuation from all sides. */
  function diffuseFill(sm, passes) {
    var w = sm.w, h = sm.h, d = sm.data, m = sm.mask.slice(0);
    var queue = [], x, y, i;
    var OFF = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    /* seed queue with unknown px adjacent to known */
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = y * w + x;
      if (!m[i]) continue;
      for (var k = 0; k < 4; k++) {
        var nx = x + OFF[k][0], ny = y + OFF[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (!m[ny * w + nx]) { queue.push(i); break; }
      }
    }
    /* onion peel */
    var qi = 0;
    while (qi < queue.length) {
      i = queue[qi++]; if (!m[i]) continue;
      x = i % w; y = (i / w) | 0;
      var r = 0, g = 0, b = 0, n = 0;
      for (k = 0; k < 4; k++) {
        var nx2 = x + OFF[k][0], ny2 = y + OFF[k][1];
        if (nx2 < 0 || ny2 < 0 || nx2 >= w || ny2 >= h) continue;
        var j = ny2 * w + nx2;
        if (!m[j]) { r += d[j * 3]; g += d[j * 3 + 1]; b += d[j * 3 + 2]; n++; }
      }
      if (!n) { queue.push(i); if (queue.length > w * h * 8) break; continue; }
      d[i * 3] = r / n; d[i * 3 + 1] = g / n; d[i * 3 + 2] = b / n; m[i] = 0;
      for (k = 0; k < 4; k++) {
        var nx3 = x + OFF[k][0], ny3 = y + OFF[k][1];
        if (nx3 < 0 || ny3 < 0 || nx3 >= w || ny3 >= h) continue;
        if (m[ny3 * w + nx3]) queue.push(ny3 * w + nx3);
      }
    }
    /* smoothing passes over originally-masked region only */
    var orig = sm.mask;
    for (var p = 0; p < passes; p++) {
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        i = y * w + x; if (!orig[i]) continue;
        var r2 = 0, g2 = 0, b2 = 0, n2 = 0;
        for (k = 0; k < 4; k++) {
          var nx4 = x + OFF[k][0], ny4 = y + OFF[k][1];
          if (nx4 < 0 || ny4 < 0 || nx4 >= w || ny4 >= h) continue;
          var j2 = (ny4 * w + nx4) * 3;
          r2 += d[j2]; g2 += d[j2 + 1]; b2 += d[j2 + 2]; n2++;
        }
        d[i * 3] = (d[i * 3] + r2 / n2) / 2;
        d[i * 3 + 1] = (d[i * 3 + 1] + g2 / n2) / 2;
        d[i * 3 + 2] = (d[i * 3 + 2] + b2 / n2) / 2;
      }
    }
    return sm;
  }

  /* Bilinear sample from the small filled image back to full-res coords */
  function bilinear(sm, fx, fy, out) {
    var x = Math.min(sm.w - 1.001, Math.max(0, fx)), y = Math.min(sm.h - 1.001, Math.max(0, fy));
    var x0 = x | 0, y0 = y | 0, tx = x - x0, ty = y - y0;
    var i00 = (y0 * sm.w + x0) * 3, i10 = i00 + 3, i01 = i00 + sm.w * 3, i11 = i01 + 3;
    for (var c = 0; c < 3; c++) {
      var top = sm.data[i00 + c] * (1 - tx) + sm.data[i10 + c] * tx;
      var bot = sm.data[i01 + c] * (1 - tx) + sm.data[i11 + c] * tx;
      out[c] = top * (1 - ty) + bot * ty;
    }
  }

  /* Distance-to-edge feather (approximate): erode mask N times; feather
     alpha = distIn / featherRadius, clamped. Cheap chamfer-ish pass. */
  function featherMap(mask, w, h, radius) {
    var dist = new Float32Array(w * h);
    var i, x, y;
    for (i = 0; i < w * h; i++) dist[i] = mask[i] ? 1e9 : 0;
    /* two-pass chamfer */
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = y * w + x; if (!mask[i]) continue;
      var v = dist[i];
      if (x > 0) v = Math.min(v, dist[i - 1] + 1);
      if (y > 0) v = Math.min(v, dist[i - w] + 1);
      dist[i] = v;
    }
    for (y = h - 1; y >= 0; y--) for (x = w - 1; x >= 0; x--) {
      i = y * w + x; if (!mask[i]) continue;
      var v2 = dist[i];
      if (x < w - 1) v2 = Math.min(v2, dist[i + 1] + 1);
      if (y < h - 1) v2 = Math.min(v2, dist[i + w] + 1);
      dist[i] = v2;
    }
    for (i = 0; i < w * h; i++) dist[i] = mask[i] ? Math.min(1, dist[i] / radius) : 0;
    return dist;  /* 0 at/outside edge → 1 deep inside */
  }

  /* Patch texture synthesis: for overlapping blocks covering the mask,
     try K random source blocks from fully-known regions nearby, pick the
     one whose low-frequency best matches the base fill, and composite its
     high-frequency detail with a cosine window (texture-quilting lite).
     Detail-transfer (not raw copy) prevents seams and wrong lighting. */
  function texturize(d, base, mask, w, h, opts, rand) {
    var B = opts.block, HALF = B >> 1, K = opts.candidates, R = opts.radius;
    rand = rand || Math.random;
    var win = new Float32Array(B * B);
    for (var wy = 0; wy < B; wy++) for (var wx = 0; wx < B; wx++) {
      win[wy * B + wx] = Math.sin(Math.PI * (wx + .5) / B) * Math.sin(Math.PI * (wy + .5) / B);
    }
    function blockKnown(bx, by) {
      if (bx < 0 || by < 0 || bx + B > w || by + B > h) return false;
      for (var y = by; y < by + B; y += 2) for (var x = bx; x < bx + B; x += 2) {
        if (mask[y * w + x]) return false;
      }
      return true;
    }
    function blockMean(arr, bx, by, stride3) {
      var r = 0, g = 0, b = 0, n = 0;
      for (var y = by; y < by + B; y += 2) for (var x = bx; x < bx + B; x += 2) {
        var i = (y * w + x) * stride3;
        r += arr[i]; g += arr[i + 1]; b += arr[i + 2]; n++;
      }
      return [r / n, g / n, b / n];
    }
    for (var by = 0; by < h; by += HALF) {
      for (var bx = 0; bx < w; bx += HALF) {
        if (bx + B > w || by + B > h) continue;
        var touches = false;
        for (var y = by; y < by + B && !touches; y += 3) for (var x = bx; x < bx + B; x += 3) {
          if (mask[y * w + x]) { touches = true; break; }
        }
        if (!touches) continue;
        var target = blockMean(base, bx, by, 3);
        var best = null, bestScore = 1e18;
        for (var k = 0; k < K; k++) {
          var sx = Math.round(bx + (rand() * 2 - 1) * R);
          var sy = Math.round(by + (rand() * 2 - 1) * R);
          if (!blockKnown(sx, sy)) continue;
          var m2 = blockMean(d, sx, sy, 4);
          var s = 0;
          for (var c = 0; c < 3; c++) { var dv = m2[c] - target[c]; s += dv * dv; }
          if (s < bestScore) { bestScore = s; best = [sx, sy, m2]; }
        }
        if (!best) continue;
        var sx2 = best[0], sy2 = best[1], srcMean = best[2];
        for (var yy = 0; yy < B; yy++) for (var xx = 0; xx < B; xx++) {
          var ti = ((by + yy) * w + (bx + xx));
          if (!mask[ti]) continue;
          var si = ((sy2 + yy) * w + (sx2 + xx)) * 4;
          var a = win[yy * B + xx] * opts.strength;
          for (var c2 = 0; c2 < 3; c2++) {
            /* transfer DETAIL: source high-freq re-lit onto the base */
            var detail = d[si + c2] - srcMean[c2];
            var v = base[ti * 3 + c2] + detail;
            var cur = base[ti * 3 + c2];
            base[ti * 3 + c2] = cur * (1 - a) + Math.max(0, Math.min(255, v)) * a;
          }
        }
      }
    }
  }

  /* ═══════════ browser provider: full pipeline ═══════════════════════ */
  var QUALITY = {
    fast:     { smallEdge: 200, passes: 12, texture: false },
    balanced: { smallEdge: 256, passes: 20, texture: true, block: 24, candidates: 10, strength: 0.75 },
    best:     { smallEdge: 320, passes: 30, texture: true, block: 16, candidates: 22, strength: 0.85 }
  };

  var BrowserCAF = {
    id: 'browser-caf',
    label: 'Content-aware fill (on-device)',
    available: function () { return true; },
    run: function (opts) {
      var canvas = opts.canvas, maskCv = opts.mask, signal = opts.signal;
      var q = QUALITY[opts.quality] || QUALITY.balanced;
      var w = canvas.width, h = canvas.height;
      return new Promise(function (resolve, reject) {
        var ctx = canvas.getContext('2d'), id, d;
        try { id = ctx.getImageData(0, 0, w, h); d = id.data; }
        catch (e) { reject(new Error('image memory readback failed')); return; }
        var mctx = maskCv.getContext('2d'), md;
        try { md = mctx.getImageData(0, 0, w, h).data; }
        catch (e) { reject(new Error('mask readback failed')); return; }
        var mask = new Uint8Array(w * h), any = 0;
        for (var i = 0; i < w * h; i++) { if (md[i * 4 + 3] > 40) { mask[i] = 1; any++; } }
        if (!any) { reject(new Error('empty selection \u2014 paint over what you want removed')); return; }
        if (any > w * h * 0.6) { reject(new Error('selection covers most of the image \u2014 for background replacement use the Background Remover instead')); return; }

        var steps = [
          function () {
            if (opts.onProgress) opts.onProgress(0.08, 'Analyzing surroundings\u2026');
            var sm = downsample(d, mask, w, h, q.smallEdge);
            if (opts.onProgress) opts.onProgress(0.2, 'Reconstructing background\u2026');
            diffuseFill(sm, q.passes);
            return sm;
          },
          function (sm) {
            if (opts.onProgress) opts.onProgress(0.45, 'Rebuilding at full resolution\u2026');
            var base = new Float32Array(w * h * 3), px = [0, 0, 0];
            for (var y = 0; y < h; y++) {
              for (var x = 0; x < w; x++) {
                var ii = y * w + x;
                if (!mask[ii]) { base[ii * 3] = d[ii * 4]; base[ii * 3 + 1] = d[ii * 4 + 1]; base[ii * 3 + 2] = d[ii * 4 + 2]; continue; }
                bilinear(sm, x / sm.scale, y / sm.scale, px);
                base[ii * 3] = px[0]; base[ii * 3 + 1] = px[1]; base[ii * 3 + 2] = px[2];
              }
            }
            return base;
          },
          function (base) {
            if (q.texture) {
              if (opts.onProgress) opts.onProgress(0.62, 'Matching textures\u2026');
              texturize(d, base, mask, w, h, { block: q.block, candidates: q.candidates, radius: q.block * 7, strength: q.strength });
            }
            return base;
          },
          function (base) {
            if (opts.onProgress) opts.onProgress(0.85, 'Blending edges\u2026');
            var feather = featherMap(mask, w, h, 4);
            for (var ii = 0; ii < w * h; ii++) {
              if (!mask[ii]) continue;
              var a = feather[ii];               /* 0 at edge → keep original; 1 inside → fill */
              for (var c = 0; c < 3; c++) {
                var orig = d[ii * 4 + c], fill = base[ii * 3 + c];
                d[ii * 4 + c] = Math.round(orig * (1 - a) + fill * a);
              }
              /* alpha untouched */
            }
          }
        ];
        /* run steps with yields between them (each step is bounded work) */
        var si = 0, carry;
        function tick() {
          if (signal && signal.cancelled) { reject(new Error('cancelled')); return; }
          if (si >= steps.length) {
            ctx.putImageData(id, 0, 0);
            if (opts.onProgress) opts.onProgress(1, 'Done');
            resolve({ canvas: canvas, engine: BrowserCAF.label });
            return;
          }
          try { carry = steps[si++](carry); } catch (e) { reject(e); return; }
          setTimeout(tick, 0);
        }
        tick();
      });
    }
  };

  /* ═══════════ remote providers (plug-and-play, OFF) ═════════════════ */
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
              fd.append('image', imgBlob, 'input.png');
              fd.append('mask', maskBlob, 'mask.png');
              fd.append('mode', 'inpaint');
              if (opts.onProgress) opts.onProgress(0.2, 'Removing on secure server\u2026');
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
    'browser-caf':   BrowserCAF
  };
  var ORDER = ['cloudflare-ai', 'fal', 'replicate', 'openai', 'browser-caf'];

  window.ObjectRemoveEngine = {
    version: '1.0',
    providers: PROVIDERS,
    remoteConfig: REMOTE,
    lastErrors: {},
    run: function (opts) {
      var self = window.ObjectRemoveEngine;
      self.lastErrors = {};
      var chain = ORDER.filter(function (id) { return PROVIDERS[id].available(); });
      function attempt(idx) {
        if (idx >= chain.length) return Promise.reject(new Error('no provider available'));
        var prov = PROVIDERS[chain[idx]];
        if (opts.onEngine) opts.onEngine(prov.label);
        return prov.run(opts).catch(function (e) {
          if (e && e.message === 'cancelled') throw e;
          /* user-fixable errors (empty selection etc.) must NOT be
             swallowed by fallback: surface them directly */
          if (/selection/.test(e && e.message || '')) throw e;
          self.lastErrors[prov.id] = (e && e.message) || String(e);
          try { console.warn('[object-remover] ' + prov.id + ' unavailable \u2192 falling back:', e); } catch (_) {}
          if (idx + 1 >= chain.length) throw e;
          return attempt(idx + 1);
        });
      }
      return attempt(0);
    }
  };
  try { console.log('[object-remover] engine v1.0 loaded'); } catch (e) {}
})();
