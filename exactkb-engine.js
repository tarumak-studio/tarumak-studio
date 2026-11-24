/* exactkb-engine.js — Compress Image to Exact KB
 *
 * Runs in a Web Worker so large images never freeze the page. The same file
 * also works as a normal script (window.ExactKB) for browsers without
 * OffscreenCanvas. No libraries: decoding and JPG/WebP encoding are the
 * browser's own; PNG palette encoding is written here.
 *
 * How it reaches a target size:
 *   1. Encode at full size and find the highest quality that fits, by binary
 *      search between the quality ceiling and a floor.
 *   2. If even the floor is too big, find the largest dimensions that fit at
 *      the floor, then raise quality again as far as the target allows.
 * The result is never larger than the target unless it reports reached:false.
 */
(function (scope) {
  'use strict';
  var IN_WORKER = typeof document === 'undefined';

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined' && (IN_WORKER || OffscreenCanvas.prototype.convertToBlob)) return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  function toBlob(c, type, q) {
    if (c.convertToBlob) return c.convertToBlob({ type: type, quality: q });
    return new Promise(function (res) { c.toBlob(res, type, q); });
  }
  function fail(code, msg) { var e = new Error(msg); e.code = code; return e; }

  /* ── What is this file really? Extensions and MIME types can lie. ── */
  async function sniff(file) {
    var b = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    var txt = function (i, n) { return String.fromCharCode.apply(null, b.subarray(i, i + n)); };
    if (b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if (b.length > 8 && b[0] === 0x89 && txt(1, 3) === 'PNG') return 'image/png';
    if (b.length > 12 && txt(0, 4) === 'RIFF' && txt(8, 4) === 'WEBP') return 'image/webp';
    return '';
  }
  async function isAnimated(file, type) {
    var b = new Uint8Array(await file.slice(0, 4096).arrayBuffer()), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    if (type === 'image/webp') return s.indexOf('ANIM') > 0;
    if (type === 'image/png') { var a = s.indexOf('acTL'), d = s.indexOf('IDAT'); return a > 0 && (d < 0 || a < d); }
    return false;
  }

  /* ── PNG with a palette ─────────────────────────────────────────────
     Canvas can only write full-colour PNG, which has no quality setting.
     Fewer colours is how a PNG gets smaller without losing transparency. */
  var CRC = null;
  function crc32(parts) {
    if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    var r = 0xFFFFFFFF;
    parts.forEach(function (p) { for (var i = 0; i < p.length; i++) r = CRC[(r ^ p[i]) & 255] ^ (r >>> 8); });
    return (r ^ 0xFFFFFFFF) >>> 0;
  }
  function u32(v) { return new Uint8Array([v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255]); }
  function ascii(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function chunk(name, data) { var t = ascii(name); return [u32(data.length), t, data, u32(crc32([t, data]))]; }
  async function deflate(bytes) {
    var st = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }
  /* Median cut over colour+alpha. Images that already use few colours are
     reproduced exactly. */
  function quantize(px, max) {
    var n = px.length / 4, u = new Uint32Array(px.buffer, px.byteOffset, n), idx = new Uint8Array(n), i, j;
    var exact = new Map(), ok = true;
    for (i = 0; i < n; i++) {
      var key = px[i * 4 + 3] ? u[i] : 0, id = exact.get(key);
      if (id === undefined) { if (exact.size >= max) { ok = false; break; } id = exact.size; exact.set(key, id); }
      idx[i] = id;
    }
    if (ok) {
      var pal = [];
      exact.forEach(function (v, k) { pal[v] = [k & 255, k >>> 8 & 255, k >>> 16 & 255, k >>> 24 & 255]; });
      return { pal: pal, idx: idx };
    }
    /* bins: 5 bits per colour, 4 bits of alpha */
    var map = new Int32Array(1 << 19).fill(-1), bins = [], binOf = new Int32Array(n);
    for (i = 0; i < n; i++) {
      var o = i * 4, a = px[o + 3];
      var b = a ? (px[o] >> 3) << 14 | (px[o + 1] >> 3) << 9 | (px[o + 2] >> 3) << 4 | a >> 4 : 0;
      var m = map[b];
      if (m < 0) { m = map[b] = bins.length; bins.push([0, 0, 0, 0, 0]); }
      var B = bins[m]; B[0]++; if (a) { B[1] += px[o]; B[2] += px[o + 1]; B[3] += px[o + 2]; B[4] += a; }
      binOf[i] = m;
    }
    bins.forEach(function (B) { B.c = [B[1] / B[0], B[2] / B[0], B[3] / B[0], B[4] / B[0]]; });
    function box(list) {
      var lo = [1e9, 1e9, 1e9, 1e9], hi = [-1, -1, -1, -1], w = 0;
      list.forEach(function (q) { w += bins[q][0]; for (var d = 0; d < 4; d++) { var v = bins[q].c[d]; if (v < lo[d]) lo[d] = v; if (v > hi[d]) hi[d] = v; } });
      var best = 0, r = -1; for (var d = 0; d < 4; d++) if (hi[d] - lo[d] > r) { r = hi[d] - lo[d]; best = d; }
      return { list: list, dim: best, range: r, w: w, score: list.length > 1 ? r * r * Math.sqrt(w) : -1 };
    }
    var boxes = [box(bins.map(function (_, k) { return k; }))];
    while (boxes.length < max) {
      var pick = -1, top = 0;
      for (j = 0; j < boxes.length; j++) if (boxes[j].score > top) { top = boxes[j].score; pick = j; }
      if (pick < 0) break;
      var bx = boxes[pick], d2 = bx.dim;
      bx.list.sort(function (p, q) { return bins[p].c[d2] - bins[q].c[d2]; });
      var half = bx.w / 2, acc = 0, cut = 1;
      for (j = 0; j < bx.list.length - 1; j++) { acc += bins[bx.list[j]][0]; cut = j + 1; if (acc >= half) break; }
      boxes.splice(pick, 1, box(bx.list.slice(0, cut)), box(bx.list.slice(cut)));
    }
    var palette = [], to = new Uint8Array(bins.length);
    boxes.forEach(function (bx2, k) {
      var s = [0, 0, 0, 0, 0];
      bx2.list.forEach(function (q) { to[q] = k; for (var d = 0; d < 5; d++) s[d] += bins[q][d]; });
      palette.push([1, 2, 3, 4].map(function (d) { return Math.round(s[d] / s[0]); }));
    });
    for (i = 0; i < n; i++) idx[i] = to[binOf[i]];
    return { pal: palette, idx: idx };
  }
  async function palettePng(img, w, h, colours) {
    var q = quantize(img.data, colours), depth = q.pal.length <= 2 ? 1 : q.pal.length <= 4 ? 2 : q.pal.length <= 16 ? 4 : 8;
    var stride = Math.ceil(w * depth / 8), raw = new Uint8Array((stride + 1) * h), per = 8 / depth;
    for (var y = 0; y < h; y++) {
      var off = y * (stride + 1) + 1;
      for (var x = 0; x < w; x++) raw[off + (x / per | 0)] |= q.idx[y * w + x] << (8 - depth - (x % per) * depth);
    }
    var plte = new Uint8Array(q.pal.length * 3), trns = new Uint8Array(q.pal.length), alpha = false;
    q.pal.forEach(function (c, i) { plte[i * 3] = c[0]; plte[i * 3 + 1] = c[1]; plte[i * 3 + 2] = c[2]; trns[i] = c[3]; if (c[3] < 255) alpha = true; });
    var ihdr = new Uint8Array(13); ihdr.set(u32(w), 0); ihdr.set(u32(h), 4); ihdr[8] = depth; ihdr[9] = 3;
    var parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])].concat(chunk('IHDR', ihdr), chunk('PLTE', plte));
    if (alpha) parts = parts.concat(chunk('tRNS', trns));
    return new Blob(parts.concat(chunk('IDAT', await deflate(raw)), chunk('IEND', new Uint8Array(0))), { type: 'image/png' });
  }

  /* ── Optional: fill the last bytes so the file is the target exactly.
     Uses each format's own "ignore this" block; pixels are untouched. ── */
  async function padTo(blob, type, target) {
    var gap = target - blob.size;
    if (gap <= 0) return blob;
    var b = new Uint8Array(await blob.arrayBuffer());
    if (type === 'image/jpeg') {
      if (gap < 4) return blob;
      var at = 2; if (b[2] === 0xFF && b[3] === 0xE0) at = 4 + (b[4] << 8 | b[5]);
      var segs = [];
      while (gap > 0) {
        var n = Math.min(gap, 65537); if (gap - n > 0 && gap - n < 4) n -= 4;
        var s = new Uint8Array(n); s.fill(32); s[0] = 0xFF; s[1] = 0xFE; s[2] = (n - 2) >> 8; s[3] = (n - 2) & 255;
        segs.push(s); gap -= n;
      }
      return new Blob([b.subarray(0, at)].concat(segs, [b.subarray(at)]), { type: type });
    }
    if (type === 'image/png') {
      if (gap < 12) return blob;
      return new Blob([b.subarray(0, b.length - 12)].concat(chunk('paDd', new Uint8Array(gap - 12)), [b.subarray(b.length - 12)]), { type: type });
    }
    if (type === 'image/webp') {
      if (gap % 2) gap--;
      if (gap < 8) return blob;
      var len = gap - 8, head = new Uint8Array(8); head.set(ascii('PAD ')); head[4] = len & 255; head[5] = len >> 8 & 255; head[6] = len >> 16 & 255; head[7] = len >>> 24;
      var out = new Uint8Array(b.length + gap); out.set(b); out.set(head, b.length);
      var riff = out.length - 8; out[4] = riff & 255; out[5] = riff >> 8 & 255; out[6] = riff >> 16 & 255; out[7] = riff >>> 24;
      return new Blob([out], { type: type });
    }
    return blob;
  }

  /* Lowest index whose size fits, assuming later levels are smaller. */
  async function firstFit(count, test) {
    var lo = 0, hi = count - 1, best = null;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1, r = await test(mid);
      if (r.fits) { best = r; hi = mid - 1; } else lo = mid + 1;
    }
    return best;
  }

  /* Automatic + transparency: flat graphics often keep far more pixels as a
     palette PNG, photos as WebP. If WebP had to shrink, try PNG too. */
  async function run(o, report) {
    var r = await runOne(o, report);
    if (o.type !== 'auto' || !r.alpha || r.kept || r.type !== 'image/webp' || (r.reached && r.w === r.ow) || typeof CompressionStream === 'undefined') return r;
    var p = await runOne(Object.assign({}, o, { type: 'image/png' }), report);
    return p.reached && (!r.reached || p.w * p.h > r.w * r.h * 1.15) ? p : r;
  }

  async function runOne(o, report) {
    var file = o.file, target = o.target, tries = 0;
    var inType = await sniff(file);
    if (!inType) throw fail('type', 'This is not a JPG, PNG or WebP image.');
    var animated = await isAnimated(file, inType);
    report('Reading image');
    var bmp;
    try { bmp = await createImageBitmap(file); }
    catch (e) { throw fail('decode', 'The browser could not read this image. The file may be damaged.'); }
    var ow = bmp.width, oh = bmp.height;

    /* Transparency check on a small copy */
    var ts = Math.min(1, 400 / Math.max(ow, oh)), tc = makeCanvas(Math.max(1, Math.round(ow * ts)), Math.max(1, Math.round(oh * ts)));
    tc.getContext('2d', { willReadFrequently: true });
    var alpha = false;
    if (inType !== 'image/jpeg') {
      var tx = tc.getContext('2d', { willReadFrequently: true }); tx.drawImage(bmp, 0, 0, tc.width, tc.height);
      var td = tx.getImageData(0, 0, tc.width, tc.height).data;
      for (var t = 3; t < td.length; t += 4) if (td[t] < 250) { alpha = true; break; }
    }
    var type = o.type;
    var probe = await toBlob(tc, 'image/webp', .8);
    var webpOk = !!probe && probe.type === 'image/webp';
    if (type === 'auto') type = inType === 'image/jpeg' ? 'image/jpeg' : inType === 'image/webp' ? (webpOk ? 'image/webp' : alpha ? 'image/png' : 'image/jpeg') : alpha ? (webpOk ? 'image/webp' : 'image/png') : 'image/jpeg';
    if (type === 'image/webp' && !webpOk) throw fail('webp', 'This browser cannot create WebP files. Choose JPG, or PNG to keep transparency.');
    if (type === 'image/png' && typeof CompressionStream === 'undefined') throw fail('png', 'This browser is too old to make small PNG files. Choose JPG or WebP.');

    var res = { inType: inType, animated: animated, alpha: alpha, ow: ow, oh: oh, originalSize: file.size, target: target };
    var tooWide = o.maxDim && Math.max(ow, oh) > o.maxDim;

    /* Already small enough: re-encoding would only lose quality. */
    if (file.size <= target && !tooWide && (o.type === 'auto' || o.type === inType)) {
      bmp.close && bmp.close();
      res.blob = o.pad ? await padTo(file, inType, target) : file;
      res.type = inType; res.w = ow; res.h = oh; res.kept = true; res.reached = true; res.padded = res.blob.size - file.size; res.tries = 0;
      return res;
    }

    /* Working size: the user's limit and what this device can handle */
    var base = 1, cap = o.maxPixels || 50e6;
    if (tooWide) base = o.maxDim / Math.max(ow, oh);
    if (ow * oh * base * base > cap) { base = Math.sqrt(cap / (ow * oh)); res.limited = true; }

    var cur = null;
    function surface(scale) {
      var w = Math.max(1, Math.round(ow * base * scale)), h = Math.max(1, Math.round(oh * base * scale));
      if (cur && cur.w === w && cur.h === h) return cur;
      var src = bmp, sw = ow, sh = oh;
      /* Halve in steps when shrinking a lot: one big jump looks jagged */
      while (sw / 2 > w && sh / 2 > h) {
        var nw = Math.round(sw / 2), nh = Math.round(sh / 2), hc = makeCanvas(nw, nh), hx = hc.getContext('2d');
        hx.imageSmoothingEnabled = true; hx.imageSmoothingQuality = 'high'; hx.drawImage(src, 0, 0, nw, nh); src = hc; sw = nw; sh = nh;
      }
      var c = makeCanvas(w, h), x = c.getContext('2d', { willReadFrequently: type === 'image/png' });
      if (!x) throw fail('memory', 'This image is too large for this device. Try a smaller one, or set a maximum width.');
      if (type === 'image/jpeg') { x.fillStyle = o.bg || '#ffffff'; x.fillRect(0, 0, w, h); }
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
      cur = { c: c, x: x, w: w, h: h, data: null };
      return cur;
    }

    /* Levels from best to worst. JPG/WebP: quality steps. PNG: colour counts. */
    var png = type === 'image/png', levels = [], floor, i;
    var maxQ = Math.min(100, Math.max(1, o.quality));
    if (png) {
      levels = [0, 256, 128, 64, 32, 16, 8, 4];
      levels = levels.slice(maxQ >= 90 ? 0 : maxQ >= 70 ? 1 : maxQ >= 50 ? 2 : maxQ >= 30 ? 3 : 4);
      floor = o.mode === 'detail' ? 256 : o.mode === 'size' ? 4 : 64;
      floor = Math.max(0, levels.filter(function (v) { return v === 0 || v >= floor; }).length - 1);
    } else {
      for (i = maxQ; i >= 1; i--) levels.push(i);
      floor = o.mode === 'detail' ? 75 : o.mode === 'size' ? 1 : 50;
      floor = Math.max(0, levels.filter(function (v) { return v >= floor; }).length - 1);
    }
    function label(v) { return png ? (v ? v + ' colours' : 'lossless') : 'quality ' + v; }
    var smallest = null;
    async function encode(scale, li) {
      var s = surface(scale), v = levels[li], blob; tries++;
      report('Trying ' + label(v) + ' at ' + s.w + ' × ' + s.h);
      if (png && v) { if (!s.data) s.data = s.x.getImageData(0, 0, s.w, s.h); blob = await palettePng(s.data, s.w, s.h, v); }
      else blob = await toBlob(s.c, type, png ? undefined : v / 100);
      if (!blob || blob.type !== type) throw fail('encode', 'The browser could not create the compressed image. It may be too large for this device.');
      var r = { blob: blob, w: s.w, h: s.h, scale: scale, level: v, li: li, fits: blob.size <= target };
      if (!smallest || blob.size < smallest.blob.size) smallest = r;
      return r;
    }

    /* Large image: a small trial shows whether full size has any chance, which
       saves many slow full-size encodes. */
    var best = null, atFloor = null, guess = 0, px = ow * oh * base * base;
    if (o.resize && px > 3e6) {
      var ps = Math.sqrt(1e6 / px), pr = await encode(ps, floor), est = pr.blob.size / (ps * ps);
      if (est > target * 3) { atFloor = est; res.estimated = true; guess = ps * Math.sqrt(target / pr.blob.size) * 0.99; }
    }
    /* 1. Full size: if the floor fits, find the best quality that does */
    if (!guess) {
      var low = await encode(1, floor);
      if (low.fits) best = (floor > 0 && await firstFit(floor, function (l) { return encode(1, l); })) || low;
      else atFloor = low.blob.size;         /* what full dimensions would need */
    }
    if (!best) {
      if (o.resize) {
        /* 2. Largest dimensions that fit at the floor */
        var minS = Math.min(1, Math.max(16 / Math.min(ow * base, oh * base), 0.02));
        var lo = minS, hi = 1, s = Math.min(1, Math.max(minS, guess || Math.sqrt(target / atFloor) * 0.99));
        for (i = 0; i < 12 && hi - lo > 0.0015 * hi; i++) {
          var r = await encode(s, floor);
          if (r.fits) { best = r; lo = s; if (r.blob.size > target * 0.994) break; } else hi = s;
          s = (lo + hi) / 2;
        }
        if (!best) { var m = await encode(minS, floor); if (m.fits) best = m; }
        /* 3. Spend any room left on quality */
        if (best && best.li > 0 && best.blob.size < target * 0.97) {
          var up = await firstFit(best.li, function (l) { return encode(best.scale, l); });
          if (up) best = up;
        }
        if (!best) best = await firstFit(levels.length, function (l) { return encode(minS, l); });
      }
    }
    bmp.close && bmp.close();

    var out = best || smallest;
    res.type = type; res.blob = out.blob; res.w = out.w; res.h = out.h; res.level = out.level; res.levelLabel = label(out.level);
    res.reached = !!best; res.tries = tries; res.fullSizeNeeds = atFloor; res.flattened = alpha && type === 'image/jpeg';
    res.topQuality = !!best && best.li === 0 && best.scale === 1;
    res.unpadded = out.blob.size;
    if (best && o.pad) res.blob = await padTo(out.blob, type, target);
    res.padded = res.blob.size - res.unpadded;
    return res;
  }

  if (IN_WORKER) {
    scope.onmessage = function (e) {
      run(e.data, function (m) { scope.postMessage({ progress: m }); })
        .then(function (r) { scope.postMessage({ done: r }); })
        .catch(function (err) { scope.postMessage({ error: err.message || String(err), code: err.code || '' }); });
    };
    scope.postMessage({ ready: typeof OffscreenCanvas !== 'undefined' && !!new OffscreenCanvas(1, 1).getContext('2d') });
  } else {
    scope.ExactKB = { run: run };
  }
})(typeof self !== 'undefined' ? self : window);
