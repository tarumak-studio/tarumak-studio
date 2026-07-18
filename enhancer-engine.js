/* enhancer-engine.js — Tarumak Studio AI Photo Enhancer engine
 *
 * Same provider-abstraction architecture as upscaler-engine.js:
 *
 *   EnhanceEngine.run(opts)
 *     ├─ remote provider (Cloudflare AI / Replicate / Fal — plug-and-play,
 *     │   OFF until REMOTE.endpoint is configured; this is where GFPGAN-class
 *     │   face restoration lives when enabled)
 *     └─ browser-auto (default, always available): intelligent auto-analysis
 *         + a full tone/color/noise/clarity/sharpen correction pipeline,
 *         processed in row bands so the UI never freezes and Cancel works.
 *
 * HONESTY NOTE (per the site's own doctrine): the default browser engine is
 * algorithmic image science — histogram analysis, gray-world white balance,
 * luminance-masked tone curves, gated sharpening — not a neural network.
 * It produces genuinely visible corrections. Neural face reconstruction is
 * only possible via the remote provider; the UI copy must never claim
 * browser-side "AI face enhancement".
 *
 * All processing stays on-device for the browser engine. Loaded lazily.
 */
(function () {
  'use strict';
  if (window.EnhanceEngine) return;

  /* ── Remote provider config (identical pattern to the upscaler) ──── */
  var REMOTE = {
    provider: null,          /* 'replicate' | 'cloudflare-ai' | 'fal' */
    endpoint: null           /* your Worker proxy URL — see upscale-worker.js */
  };

  /* ═══════════════════ ANALYSIS ══════════════════════════════════════
     Sample the image on a proxy (≤640px) and measure what's wrong with it.
     Returns both machine settings and human-readable findings. */
  function analyze(canvas) {
    var maxEdge = 640, s = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
    var w = Math.max(1, Math.round(canvas.width * s)), h = Math.max(1, Math.round(canvas.height * s));
    var p = document.createElement('canvas'); p.width = w; p.height = h;
    var px = p.getContext('2d', { willReadFrequently: true }); px.drawImage(canvas, 0, 0, w, h);
    var d;
    try { d = px.getImageData(0, 0, w, h).data; }
    catch (e) { return { settings: {}, findings: ['analysis unavailable'], stats: {} }; }

    var n = w * h, sumL = 0, sumR = 0, sumG = 0, sumB = 0, sumSat = 0;
    var darkClip = 0, lightClip = 0, i, l;
    var lumas = new Float32Array(n);
    for (i = 0; i < n; i++) {
      var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      l = 0.299 * r + 0.587 * g + 0.114 * b;
      lumas[i] = l; sumL += l; sumR += r; sumG += g; sumB += b;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      sumSat += mx === 0 ? 0 : (mx - mn) / mx;
      if (l < 10) darkClip++;
      if (l > 245) lightClip++;
    }
    var meanL = sumL / n, meanR = sumR / n, meanG = sumG / n, meanB = sumB / n;
    var varL = 0;
    for (i = 0; i < n; i++) { var dv = lumas[i] - meanL; varL += dv * dv; }
    var stdL = Math.sqrt(varL / n);
    var meanSat = sumSat / n;
    /* Noise estimate: mean |horizontal gradient| of luma — high on noisy
       images, moderate on detailed ones; only large values matter. */
    var grad = 0, cnt = 0;
    for (var y = 0; y < h; y += 2) for (var x = 1; x < w; x += 2) {
      grad += Math.abs(lumas[y * w + x] - lumas[y * w + x - 1]); cnt++;
    }
    var noiseEst = grad / cnt;
    /* Sharpness estimate: variance of 1D Laplacian on luma */
    var lap = 0, lc = 0;
    for (y = 1; y < h - 1; y += 2) for (x = 1; x < w - 1; x += 2) {
      var v2 = lumas[y * w + x] * 2 - lumas[y * w + x - 1] - lumas[y * w + x + 1];
      lap += v2 * v2; lc++;
    }
    var lapVar = lap / lc;

    var set = {}, notes = [];
    /* Exposure */
    if (meanL < 95)  { set.brightness = Math.min(30, Math.round((95 - meanL) * 0.5)); notes.push('underexposed / low light'); }
    if (meanL > 175) { set.brightness = -Math.min(25, Math.round((meanL - 175) * 0.5)); notes.push('overexposed'); }
    /* Contrast: real correction when genuinely flat, PLUS a small always-on
       "punch" floor even on already-decent images. A photo that measures
       fine statistically can still look flat on screen next to nothing —
       every product in this category (Remini, Pixelcut, Fotor) applies
       some baseline punch rather than only correcting outright faults. */
    if (stdL < 48)   { set.contrast = Math.min(28, Math.round((48 - stdL) * 0.9)); notes.push('low contrast / faded'); }
    else             { set.contrast = 11; }
    /* Clipping → shadow lift / highlight recovery */
    if (darkClip / n > 0.05)  { set.shadows = 25; notes.push('crushed shadows'); }
    if (lightClip / n > 0.05) { set.highlights = -25; notes.push('blown highlights'); }
    /* Gray-world white balance: cast = channel deviation from luma mean */
    var castRB = meanR - meanB;                       /* + = warm, − = cool */
    if (Math.abs(castRB) > 8) { set.temperature = -Math.max(-30, Math.min(30, Math.round(castRB * 0.6))); notes.push(castRB > 0 ? 'warm color cast' : 'cool color cast'); }
    var castG = meanG - (meanR + meanB) / 2;
    if (Math.abs(castG) > 8)  { set.tint = -Math.max(-25, Math.min(25, Math.round(castG * 0.6))); notes.push('green/magenta cast'); }
    /* Color richness: strong correction when genuinely faded, PLUS a small
       always-on floor otherwise — vibrance (which protects already-
       saturated pixels from clipping into neon) is the single most
       reliably visible, least risky perceptual lift available, which is
       exactly why it's the one every competitor leans on hardest. */
    if (meanSat < 0.16) { set.vibrance = 26; notes.push('faded colors'); }
    else                { set.vibrance = 15; }
    /* Noise */
    if (noiseEst > 9)   { set.noise = Math.min(45, Math.round((noiseEst - 9) * 5)); notes.push('visible noise'); }
    /* Softness: real correction when genuinely soft, PLUS a stronger
       always-on baseline than before — 18/10 rounded to nothing once run
       through the pipeline's own amount math (sharpen amt = value/100*0.9,
       clarity amt = value/100*0.8); 34/26 is the smallest floor that
       actually survives that math as a visible change without crossing
       into the halo/oversharpen territory the brief explicitly rules out. */
    if (lapVar < 60)    { set.sharpness = 40; set.clarity = 30; notes.push('soft focus'); }
    else                { set.sharpness = 34; set.clarity = 26; }

    return {
      settings: set,
      findings: notes.length ? notes : ['balanced exposure — applying color, clarity & sharpness enhancement'],
      stats: { meanLuma: Math.round(meanL), contrastStd: Math.round(stdL), meanSat: +meanSat.toFixed(2), noiseEst: +noiseEst.toFixed(1), sharpnessVar: Math.round(lapVar) }
    };
  }

  /* ═══════════════════ PIPELINE ═════════════════════════════════════
     Order (per the product spec): white balance → exposure → contrast →
     shadows/highlights/whites/blacks → vibrance/saturation, all in ONE
     banded pixel pass; then optional passes: noise reduction, clarity
     (large-radius local contrast), sharpening (small-radius, gated).
     Alpha is never modified anywhere → transparency preserved. */

  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function tonePass(canvas, s, onP, signal) {
    return new Promise(function (res, rej) {
      var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d', { willReadFrequently: true });
      var id, d;
      try { id = ctx.getImageData(0, 0, w, h); d = id.data; }
      catch (e) { rej(new Error('image memory readback failed')); return; }
      var temp = (s.temperature || 0) * 0.30, tint = (s.tint || 0) * 0.30;
      var bri = 1 + (s.brightness || 0) / 100;
      var con = 1 + (s.contrast || 0) / 100;
      var sh = (s.shadows || 0) / 100, hi = (s.highlights || 0) / 100;
      var wh = (s.whites || 0) / 100, bl = (s.blacks || 0) / 100;
      var vib = (s.vibrance || 0) / 100, sat = 1 + (s.saturation || 0) / 100;
      var BAND = Math.max(64, Math.round(2000000 / w)), y = 0;
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(h, y + BAND);
        for (var i = y * w * 4, stop = end * w * 4; i < stop; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          /* white balance / temperature / tint */
          r += temp; b -= temp; g += tint;
          /* exposure */
          r *= bri; g *= bri; b *= bri;
          /* contrast around mid-gray */
          r = (r - 128) * con + 128; g = (g - 128) * con + 128; b = (b - 128) * con + 128;
          /* luminance-masked tone regions */
          var l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (l < 0) l = 0; if (l > 1) l = 1;
          var dk = (1 - l), lt = l;
          var lift = sh * dk * dk * 70 + bl * dk * dk * dk * 45;
          var gain = hi * lt * lt * 70 + wh * lt * lt * lt * 45;
          r += lift + gain; g += lift + gain; b += lift + gain;
          /* vibrance (boost weak colors more) + saturation */
          var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          var curSat = mx <= 0 ? 0 : (mx - mn) / mx;
          var satMul = sat + vib * (1 - curSat);
          var lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = lum + (r - lum) * satMul; g = lum + (g - lum) * satMul; b = lum + (b - lum) * satMul;
          d[i] = clamp255(r); d[i + 1] = clamp255(g); d[i + 2] = clamp255(b);
          /* d[i+3] alpha untouched */
        }
        y = end;
        if (onP) onP(y / h);
        if (y >= h) { ctx.putImageData(id, 0, 0); res(); return; }
        setTimeout(tick, 0);
      }
      tick();
    });
  }

  /* Noise reduction: 3×3 median on RGB, blended by strength; gated so
     strong edges are untouched (protects text and detail). */
  function denoisePass(canvas, strength, onP, signal) {
    return new Promise(function (res, rej) {
      if (!strength) { res(); return; }
      var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d', { willReadFrequently: true });
      var id, d, src;
      try { id = ctx.getImageData(0, 0, w, h); d = id.data; src = d.slice(0); }
      catch (e) { res(); return; }
      var mix = Math.min(1, strength / 100), EDGE = 40;
      var BAND = Math.max(32, Math.round(1200000 / w)), y = 1;
      var win = new Array(9);
      function med9(arr) { arr.sort(function (a, b2) { return a - b2; }); return arr[4]; }
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(h - 1, y + BAND);
        for (var yy = y; yy < end; yy++) {
          for (var x = 1; x < w - 1; x++) {
            var i = (yy * w + x) * 4;
            for (var c = 0; c < 3; c++) {
              var k = 0;
              for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
                win[k++] = src[((yy + dy) * w + (x + dx)) * 4 + c];
              }
              var m = med9(win.slice());
              /* gate: only denoise where the pixel is close to its median
                 (i.e. speckle noise), never across strong edges */
              if (Math.abs(src[i + c] - m) < EDGE) {
                d[i + c] = src[i + c] + (m - src[i + c]) * mix;
              }
            }
          }
        }
        y = end;
        if (onP) onP(y / (h - 1));
        if (y >= h - 1) { ctx.putImageData(id, 0, 0); res(); return; }
        setTimeout(tick, 0);
      }
      tick();
    });
  }

  /* Clarity: large-radius local contrast. Cheap big blur = downscale 1/8
     and upscale back via canvas, then add the luma difference. */
  function clarityPass(canvas, amount, onP, signal) {
    return new Promise(function (res, rej) {
      if (!amount) { res(); return; }
      var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d', { willReadFrequently: true });
      var small = document.createElement('canvas');
      small.width = Math.max(1, Math.round(w / 8)); small.height = Math.max(1, Math.round(h / 8));
      var sx = small.getContext('2d');
      sx.drawImage(canvas, 0, 0, small.width, small.height);
      var blur = document.createElement('canvas'); blur.width = w; blur.height = h;
      var bx = blur.getContext('2d', { willReadFrequently: true });
      bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high';
      bx.drawImage(small, 0, 0, w, h);
      var id, d, bd;
      try {
        id = ctx.getImageData(0, 0, w, h); d = id.data;
        bd = bx.getImageData(0, 0, w, h).data;
      } catch (e) { res(); return; }
      var amt = amount / 100 * 0.8;
      var BAND = Math.max(64, Math.round(2000000 / w)), y = 0;
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(h, y + BAND);
        for (var i = y * w * 4, stop = end * w * 4; i < stop; i += 4) {
          var lSharp = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          var lBlur = 0.299 * bd[i] + 0.587 * bd[i + 1] + 0.114 * bd[i + 2];
          var diff = (lSharp - lBlur) * amt;
          d[i] = clamp255(d[i] + diff); d[i + 1] = clamp255(d[i + 1] + diff); d[i + 2] = clamp255(d[i + 2] + diff);
        }
        y = end;
        if (onP) onP(y / h);
        if (y >= h) { ctx.putImageData(id, 0, 0); res(); return; }
        setTimeout(tick, 0);
      }
      tick();
    });
  }

  /* Sharpen: gated 3×3 unsharp (same proven kernel as the upscaler);
     texture = a second, finer-threshold micro-contrast layer. */
  function sharpenPass(canvas, sharp, texture, onP, signal) {
    return new Promise(function (res, rej) {
      var amount = (sharp || 0) / 100 * 0.9 + (texture || 0) / 100 * 0.35;
      if (amount <= 0) { res(); return; }
      var threshold = texture > 0 ? 1 : 3;
      var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d', { willReadFrequently: true });
      var id, d, blur;
      try { id = ctx.getImageData(0, 0, w, h); d = id.data; blur = new Uint8ClampedArray(d.length); }
      catch (e) { res(); return; }
      var BAND = Math.max(64, Math.round(2000000 / w)), phase = 0, y = 0;
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(h, y + BAND);
        if (phase === 0) {
          for (var yy = y; yy < end; yy++) for (var x = 0; x < w; x++) {
            var i = (yy * w + x) * 4, r = 0, g = 0, b = 0, n = 0;
            for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
              var nx = x + dx, ny = yy + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              var j = (ny * w + nx) * 4;
              r += d[j]; g += d[j + 1]; b += d[j + 2]; n++;
            }
            blur[i] = r / n; blur[i + 1] = g / n; blur[i + 2] = b / n;
          }
        } else {
          for (var i2 = y * w * 4, stop = end * w * 4; i2 < stop; i2 += 4) {
            for (var c = 0; c < 3; c++) {
              var diff = d[i2 + c] - blur[i2 + c];
              if (diff > threshold || diff < -threshold) {
                d[i2 + c] = clamp255(d[i2 + c] + diff * amount);
              }
            }
          }
        }
        y = end;
        if (onP) onP(phase === 0 ? y / h * 0.6 : 0.6 + y / h * 0.4);
        if (y >= h) {
          if (phase === 0) { phase = 1; y = 0; }
          else { ctx.putImageData(id, 0, 0); res(); return; }
        }
        setTimeout(tick, 0);
      }
      tick();
    });
  }

  /* ═══════════════════ STRENGTH CONTROL ═══════════════════════════════
     Scales whatever settings object is already active (auto-analysis OR
     a preset) by one multiplier — Subtle/Balanced/Strong/Maximum, or a
     raw 0–100 slider mapped to the same range. Balanced (1.0) is the new,
     stronger baseline tuned above; this only moves relative to that, so
     "Subtle" still looks like a real (if gentler) enhancement rather than
     the old near-invisible default, and "Maximum" is capped well short
     of the halo/neon territory the brief rules out. Pure function — same
     testing approach as everything else in this engine. */
  var STRENGTH_PRESETS = { subtle: 0.55, balanced: 1.0, strong: 1.35, maximum: 1.7 };
  var SCALED_KEYS = ['contrast', 'vibrance', 'saturation', 'sharpness', 'clarity', 'texture',
    'shadows', 'highlights', 'whites', 'blacks', 'noise'];
  /* Deliberately NOT scaled: brightness/temperature/tint are corrective
     (fixing an actual exposure/cast problem) rather than stylistic —
     scaling them with "strength" would make Subtle under-correct a
     genuinely too-dark photo and Maximum over-correct it, which isn't
     what an intensity slider should mean. */
  function scaleSettings(settings, strength) {
    var mul = typeof strength === 'number' ? Math.max(0, Math.min(2, strength / 50)) : (STRENGTH_PRESETS[strength] || 1);
    var out = {};
    for (var k in settings) {
      if (!Object.prototype.hasOwnProperty.call(settings, k)) continue;
      out[k] = SCALED_KEYS.indexOf(k) !== -1 ? Math.round(settings[k] * mul) : settings[k];
    }
    return out;
  }

  /* ═══════════════════ SKIN-TONE-AWARE PORTRAIT PASS ══════════════════
     HONESTY NOTE: this is a colour-range heuristic, not face detection.
     It cannot find eyes or a face region — it classifies each pixel by
     whether its RGB falls in a broad, well-established skin-tone range
     (the same rule-based test used as a first-pass filter in a lot of
     computer-vision literature before anyone reaches for a trained
     model). Pixels that pass get a very light smoothing (blemish/texture
     softened slightly); pixels that don't — eyes, eyebrows, hair, lips,
     background — get left alone here (the main sharpen/clarity passes
     already sharpen everything, so contrast against the softened skin
     comes from those areas simply NOT being softened). This will not
     work reliably on illustration, anime, or non-photographic input,
     which is exactly why it's only wired into the Portrait preset, not
     applied globally. */
  function isSkinTone(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return r > 95 && g > 40 && b > 20 && (mx - mn) > 15 &&
      Math.abs(r - g) > 15 && r > g && r > b;
  }
  function skinSmoothPass(canvas, strength, onP, signal) {
    return new Promise(function (res, rej) {
      if (!strength) { res(); return; }
      var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d', { willReadFrequently: true });
      var id, d, src;
      try { id = ctx.getImageData(0, 0, w, h); d = id.data; src = d.slice(0); }
      catch (e) { res(); return; }
      var mix = Math.min(1, strength / 100) * 0.55; /* deliberately capped — this must stay subtle */
      var BAND = Math.max(32, Math.round(1200000 / w)), y = 1;
      function tick() {
        if (signal && signal.cancelled) { rej(new Error('cancelled')); return; }
        var end = Math.min(h - 1, y + BAND);
        for (var yy = y; yy < end; yy++) {
          for (var x = 1; x < w - 1; x++) {
            var i = (yy * w + x) * 4;
            if (!isSkinTone(src[i], src[i + 1], src[i + 2])) continue;
            var r = 0, g = 0, b = 0, n = 0;
            for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
              var j = ((yy + dy) * w + (x + dx)) * 4;
              r += src[j]; g += src[j + 1]; b += src[j + 2]; n++;
            }
            r /= n; g /= n; b /= n;
            d[i] = src[i] + (r - src[i]) * mix;
            d[i + 1] = src[i + 1] + (g - src[i + 1]) * mix;
            d[i + 2] = src[i + 2] + (b - src[i + 2]) * mix;
          }
        }
        y = end;
        if (onP) onP(y / (h - 1));
        if (y >= h - 1) { ctx.putImageData(id, 0, 0); res(); return; }
        setTimeout(tick, 0);
      }
      tick();
    });
  }


  var BrowserAuto = {
    id: 'browser-auto',
    label: 'On-device enhancement',
    available: function () { return true; },
    run: function (opts) {
      var canvas = opts.canvas, s = opts.settings || {}, signal = opts.signal;
      function seg(fn, from, to, name) {
        return function () {
          if (opts.onProgress) opts.onProgress(from, name);
          return fn(function (p) {
            if (opts.onProgress) opts.onProgress(from + p * (to - from), name);
          });
        };
      }
      return seg(function (p) { return tonePass(canvas, s, p, signal); }, 0.02, 0.40, 'Correcting tone & color')()
        .then(seg(function (p) { return denoisePass(canvas, s.noise, p, signal); }, 0.40, 0.58, 'Reducing noise'))
        .then(seg(function (p) { return skinSmoothPass(canvas, s.skinSmooth, p, signal); }, 0.58, 0.68, 'Refining skin tones'))
        .then(seg(function (p) { return clarityPass(canvas, s.clarity, p, signal); }, 0.68, 0.80, 'Boosting clarity'))
        .then(seg(function (p) { return sharpenPass(canvas, s.sharpness, s.texture, p, signal); }, 0.80, 0.98, 'Sharpening'))
        .then(function () {
          if (opts.onProgress) opts.onProgress(1, 'Done');
          return { canvas: canvas, engine: BrowserAuto.label };
        });
    }
  };

  /* ── Remote providers (plug-and-play, OFF until configured) ──────── */
  function remoteProvider(id, label) {
    return {
      id: id, label: label + ' (cloud AI \u2014 face restoration)',
      available: function () { return REMOTE.provider === id && !!REMOTE.endpoint; },
      run: function (opts) {
        return new Promise(function (res, rej) {
          opts.canvas.toBlob(function (blob) {
            if (!blob) { rej(new Error('encode failed')); return; }
            var fd = new FormData();
            fd.append('image', blob, 'input.png');
            fd.append('mode', 'enhance');
            fd.append('face', '1');
            if (opts.onProgress) opts.onProgress(0.2, 'Enhancing on secure server\u2026');
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
        });
      }
    };
  }

  var PROVIDERS = {
    'cloudflare-ai': remoteProvider('cloudflare-ai', 'Cloudflare AI'),
    'replicate':     remoteProvider('replicate', 'Replicate'),
    'fal':           remoteProvider('fal', 'Fal.ai'),
    'browser-auto':  BrowserAuto
  };
  var ORDER = ['cloudflare-ai', 'replicate', 'fal', 'browser-auto'];

  window.EnhanceEngine = {
    version: '2.0',
    providers: PROVIDERS,
    remoteConfig: REMOTE,
    analyze: analyze,
    scaleSettings: scaleSettings,
    strengthPresets: STRENGTH_PRESETS,
    lastErrors: {},
    run: function (opts) {
      var self = window.EnhanceEngine;
      self.lastErrors = {};
      var chain = ORDER.filter(function (id) { return PROVIDERS[id].available(); });
      function attempt(idx) {
        if (idx >= chain.length) return Promise.reject(new Error('no provider available'));
        var prov = PROVIDERS[chain[idx]];
        if (opts.onEngine) opts.onEngine(prov.label);
        return prov.run(opts).catch(function (e) {
          if (e && e.message === 'cancelled') throw e;
          self.lastErrors[prov.id] = (e && e.message) || String(e);
          try { console.warn('[enhancer] ' + prov.id + ' unavailable \u2192 falling back:', e); } catch (_) {}
          if (idx + 1 >= chain.length) throw e;
          return attempt(idx + 1);
        });
      }
      return attempt(0);
    }
  };
  try { console.log('[enhancer] engine v2.0 loaded'); } catch (e) {}
})();
