/* imgconvert-engine.js — Universal Image Converter
 *
 * Decodes JPG, PNG, WebP, AVIF, GIF, BMP and HEIC, optionally resizes, and
 * really re-encodes to JPG, PNG, WebP or AVIF. Runs in Web Workers; the same
 * file works as a normal script (window.ImgConvert) where OffscreenCanvas is
 * missing.
 *
 * JPG, PNG and (usually) WebP are encoded by the browser. These are fetched
 * only when needed, pinned and integrity-checked:
 *   HEIC decoding  libheif-js 1.19.8    (LGPL-3.0)
 *   AVIF encoding  @jsquash/avif 2.1.1  (Apache-2.0)
 *   WebP encoding  @jsquash/webp 1.5.0  (Apache-2.0), Safari only
 */
(function (scope) {
  'use strict';
  var IN_WORKER = typeof document === 'undefined';
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var LIB = {
    heif: ['libheif-js@1.19.8/libheif-wasm/libheif-bundle.js', 'sha384-HXIRij9wEcFbMeYe8lcO83/544aNPhd8574RnlD/cQVbNPdq5iBkjgGPpxtsycNv'],
    avifJs: ['@jsquash/avif@2.1.1/codec/enc/avif_enc.js', 'sha384-CSCv5W4tWhwNEV016b7Cf+Z7a+XAf4Z8tY/79BEKL+PJSO96cZrxu+ryYFU+den3'],
    avifWasm: ['@jsquash/avif@2.1.1/codec/enc/avif_enc.wasm', 'sha384-05Hrg6MAEOyGEl+DBp138l7mH4bs/srHNfuLKY1bXS0R9WI/amgsW509B8FkaZWr'],
    webpJs: ['@jsquash/webp@1.5.0/codec/enc/webp_enc.js', 'sha384-+NybhuNYvhOCu52DiwXVrsgEsGfQwDrgazWPdVRcBZ3DfgCsbIzV4ADZJdShYmTT'],
    webpWasm: ['@jsquash/webp@1.5.0/codec/enc/webp_enc.wasm', 'sha384-5pp8Sua04ZAgzA3LRivE+IYO5SQYGnP/O+vSbXmVhcmsO8vWK16Ae7EaO/6JWqyl']
  };
  var AVIF_OPT = { quality: 60, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0, speed: 6, subsample: 1, chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false, bitDepth: 8, lossless: false };
  var WEBP_OPT = { quality: 85, target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50, filter_strength: 60, filter_sharpness: 0, filter_type: 1, partitions: 0, segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0, partition_limit: 0, alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100, lossless: 0, exact: 0, image_hint: 0, emulate_jpeg_size: 0, thread_level: 0, low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0 };

  function fail(msg) { var e = new Error(msg); e.shown = true; return e; }
  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined' && (IN_WORKER || OffscreenCanvas.prototype.convertToBlob)) return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  function toBlob(c, type, q) {
    if (c.convertToBlob) return c.convertToBlob({ type: type, quality: q });
    return new Promise(function (res) { c.toBlob(res, type, q); });
  }

  /* ── Libraries ── */
  var memo = {};
  function once(key, fn) { if (!memo[key]) memo[key] = fn().catch(function (e) { delete memo[key]; throw e; }); return memo[key]; }
  async function get(name) {
    var r;
    try { r = await fetch(CDN + LIB[name][0], { integrity: LIB[name][1], mode: 'cors', credentials: 'omit' }); }
    catch (e) { throw fail('A converter component could not be downloaded. Check your connection and try again.'); }
    if (!r.ok) throw fail('A converter component could not be downloaded (error ' + r.status + '). Try again later.');
    return r;
  }
  async function runScript(text) {
    var url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    try {
      if (IN_WORKER) scope.importScripts(url);
      else await new Promise(function (ok, no) { var s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = function () { no(fail('A converter component could not start.')); }; document.head.appendChild(s); });
    } finally { URL.revokeObjectURL(url); }
  }
  /* The jSquash codecs are ES modules; run them as classic scripts so this
     also works in browsers without module support in workers. */
  function codec(js, wasm) {
    return once(js, async function () {
      var parts = await Promise.all([get(js).then(function (r) { return r.text(); }), get(wasm).then(function (r) { return r.arrayBuffer(); })]);
      var mod = await WebAssembly.compile(parts[1]);
      scope.__xcvMeta = CDN + LIB[js][0];
      await runScript('(function(){' + parts[0].replace(/import\.meta\.url/g, 'self.__xcvMeta').replace(/export default Module;?\s*$/, 'self.__xcvCodec=Module;') + '})();');
      var factory = scope.__xcvCodec; delete scope.__xcvCodec;
      return factory({ noInitialRun: true, instantiateWasm: function (imports, cb) { var inst = new WebAssembly.Instance(mod, imports); cb(inst); return inst.exports; } });
    });
  }
  function heif() {
    return once('heif', async function () {
      await runScript(await (await get('heif')).text());
      if (typeof scope.libheif !== 'function') throw fail('The HEIC decoder could not start in this browser.');
      return await scope.libheif();
    });
  }

  /* ── What is this file really? ── */
  async function sniff(file) {
    var b = new Uint8Array(await file.slice(0, 4096).arrayBuffer()), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return { type: 'image/jpeg', name: 'JPG' };
    if (b[0] === 0x89 && s.substr(1, 3) === 'PNG') { var a = s.indexOf('acTL'), d = s.indexOf('IDAT'); return { type: 'image/png', name: 'PNG', animated: a > 0 && (d < 0 || a < d) }; }
    if (s.substr(0, 4) === 'RIFF' && s.substr(8, 4) === 'WEBP') return { type: 'image/webp', name: 'WebP', animated: s.indexOf('ANIM') > 0 };
    if (s.substr(0, 4) === 'GIF8') return { type: 'image/gif', name: 'GIF', animated: s.indexOf('NETSCAPE2.0') > 0 };
    if (s.substr(0, 2) === 'BM' && b.length > 26) return { type: 'image/bmp', name: 'BMP' };
    if (s.substr(4, 4) === 'ftyp') {
      var brands = s.substr(8, Math.max(8, Math.min(((b[0] << 24 | b[1] << 16 | b[2] << 8 | b[3]) >>> 0) - 8, 200)));
      if (/avif|avis/.test(brands)) return { type: 'image/avif', name: 'AVIF', animated: /avis/.test(brands.substr(0, 4)) };
      if (/hei[cxms]|hev[cxms]|mif1|msf1/.test(brands)) return { type: 'image/heic', name: 'HEIC' };
    }
    if (/^(II\*\0|MM\0\*)/.test(s)) throw fail('TIFF and camera RAW files are not supported.');
    if (/<svg[\s>]/i.test(s)) throw fail('SVG is not supported here. Use the SVG to JPG Converter.');
    if (s.substr(0, 4) === '%PDF') throw fail('This is a PDF, not an image. Use the PDF to JPG Converter.');
    throw fail('This is not a supported image. Use JPG, PNG, WebP, AVIF, HEIC, GIF or BMP.');
  }

  async function decode(file, info, report) {
    report('Reading', 15);
    /* Native first: fast, and Safari can read HEIC itself */
    try { return await createImageBitmap(file.slice(0, file.size, info.type)); }
    catch (e) {
      if (info.type === 'image/avif') throw fail('This AVIF file could not be read. It may be damaged, or this browser is too old to read AVIF.');
      if (info.type !== 'image/heic') throw fail('This ' + info.name + ' file could not be read. It may be damaged.');
    }
    report('Loading HEIC decoder', 20);
    var lib = await heif();
    report('Decoding HEIC', 35);
    var images;
    try { images = new lib.HeifDecoder().decode(new Uint8Array(await file.arrayBuffer())); } catch (e) { images = null; }
    if (!images || !images.length) throw fail('This HEIC file could not be read. It may be damaged or use a newer format.');
    var img = images[0];           /* is_primary() throws in this libheif-js build; the first image is the photo */
    var w = img.get_width(), h = img.get_height(), data = new ImageData(w, h);
    await new Promise(function (ok, no) { img.display(data, function (r) { r ? ok() : no(fail('This HEIC file could not be decoded.')); }); });
    images.forEach(function (x) { x.free && x.free(); });
    var c = makeCanvas(w, h); c.getContext('2d').putImageData(data, 0, 0);
    return c;
  }

  function outSize(ow, oh, o) {
    var w = o.width || 0, h = o.height || 0;
    if (!w && !h) return [ow, oh];
    if (!o.keep) return [w || ow, h || oh];
    var k = w && h ? Math.min(w / ow, h / oh) : w ? w / ow : h / oh;
    return [Math.max(1, Math.round(ow * k)), Math.max(1, Math.round(oh * k))];
  }

  async function run(o, report) {
    var info = await sniff(o.file);
    var src = await decode(o.file, info, report);
    var ow = src.width, oh = src.height, size = outSize(ow, oh, o), w = size[0], h = size[1], cap = o.maxPixels || 50e6;
    if (w * h > cap) throw fail('The result would be ' + w + ' × ' + h + ' px, which is too large for this device. Set a smaller width or height.');
    if (w > 16384 || h > 16384) throw fail('The longest side can be at most 16,384 px. Set a smaller width or height.');
    report('Preparing', 45);

    var type = o.type, opaque = type === 'image/jpeg' || o.flatten, s = src, sw = ow, sh = oh;
    while (sw / 2 > w && sh / 2 > h) {          /* halve in steps: one big jump looks jagged */
      var nw = Math.round(sw / 2), nh = Math.round(sh / 2), hc = makeCanvas(nw, nh), hx = hc.getContext('2d');
      hx.imageSmoothingEnabled = true; hx.imageSmoothingQuality = 'high'; hx.drawImage(s, 0, 0, nw, nh); s = hc; sw = nw; sh = nh;
    }
    var c = makeCanvas(w, h), x = c.getContext('2d', { willReadFrequently: type === 'image/avif' });
    if (!x) throw fail('This image is too large for this device. Set a smaller width or height.');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(s, 0, 0, w, h);

    /* Was there transparency? Checked on a small copy. */
    var alpha = false;
    if (info.type !== 'image/jpeg' && info.type !== 'image/bmp') {
      var k = Math.min(1, 400 / Math.max(w, h)), tc = makeCanvas(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))), tx = tc.getContext('2d', { willReadFrequently: true });
      tx.drawImage(c, 0, 0, tc.width, tc.height);
      var td = tx.getImageData(0, 0, tc.width, tc.height).data;
      for (var t = 3; t < td.length; t += 4) if (td[t] < 250) { alpha = true; break; }
    }
    if (opaque) { x.globalCompositeOperation = 'destination-over'; x.fillStyle = o.bg || '#ffffff'; x.fillRect(0, 0, w, h); }
    if (src.close) src.close();

    var blob, name = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/avif': 'AVIF' }[type];
    if (type === 'image/avif') {
      report('Loading AVIF encoder', 55);
      var av = await codec('avifJs', 'avifWasm');
      report('Encoding AVIF', 65);
      var px = w * h, out = av.encode(new Uint8Array(x.getImageData(0, 0, w, h).data.buffer), w, h, Object.assign({}, AVIF_OPT, { quality: o.quality, speed: px < 5e5 ? 6 : px < 2e6 ? 8 : 9 }));
      if (!out) throw fail('The AVIF encoder could not process this image.');
      blob = new Blob([out], { type: type });
    } else {
      report('Encoding ' + name, 70);
      blob = await toBlob(c, type, type === 'image/png' ? undefined : o.quality / 100);
      if (type === 'image/webp' && (!blob || blob.type !== type)) {
        report('Loading WebP encoder', 60);
        var we = await codec('webpJs', 'webpWasm');
        report('Encoding WebP', 75);
        var wo = we.encode(new Uint8Array(x.getImageData(0, 0, w, h).data.buffer), w, h, Object.assign({}, WEBP_OPT, { quality: o.quality }));
        if (wo) blob = new Blob([wo], { type: type });
      }
    }
    if (!blob || blob.type !== type) throw fail('This browser could not create the ' + name + ' file. The image may be too large for this device.');
    /* Prove the bytes are the format we promise before handing them over */
    var check = await sniff(blob);
    if (check.type !== type) throw fail('The converted file failed its format check.');
    return { blob: blob, type: type, inName: info.name, animated: !!info.animated, alpha: alpha, flattened: alpha && opaque, ow: ow, oh: oh, w: w, h: h };
  }

  if (IN_WORKER) {
    scope.onmessage = function (e) {
      var id = e.data.id;
      run(e.data.job, function (stage, pct) { scope.postMessage({ id: id, stage: stage, pct: pct }); })
        .then(function (r) { scope.postMessage({ id: id, done: r }); })
        .catch(function (err) { scope.postMessage({ id: id, error: err && err.shown ? err.message : 'This image could not be converted. It may be damaged or too large for this device.' }); });
    };
    scope.postMessage({ ready: typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined' && !!new OffscreenCanvas(1, 1).getContext('2d') });
  } else {
    scope.ImgConvert = { run: run };
  }
})(typeof self !== 'undefined' ? self : window);
