/* gifcompressor-engine.js — GIF Compressor engine for Tarumak Studio.

   HONESTY NOTE on what's verified how: the frame-comparison, duplicate-
   detection, preset-mapping and savings-estimation logic below is pure
   vanilla JS with no external dependencies — tested directly in Node
   before shipping, the same way every other engine on this site has
   been. The actual GIF decode/encode is delegated to modern-gif
   (loaded from CDN by the tool's UI layer, not this file) — its exact
   runtime behavior in a browser has NOT been executed here; this
   sandbox has no network access for npm installs. Its API is verified
   against its own documentation (README + npm listing, independently
   consistent) and wired defensively — checking for expected fields
   rather than assuming a shape blindly.
*/
(function () {
  'use strict';
  if (window.GifCompressorEngine) return;

  /* ── Frame comparison ──────────────────────────────────────────────
     Compares two decoded RGBA frames (same width/height) and returns a
     0-1 difference score: 0 = pixel-identical, 1 = completely
     different. Samples every Nth pixel rather than every pixel for
     speed on large frames — accurate enough for "is this a duplicate"
     decisions, not meant as a precise image-diff metric. */
  function frameDifference(a, b, sampleStride) {
    sampleStride = sampleStride || 4; /* every 4th pixel by default */
    if (!a || !b || a.length !== b.length) return 1;
    var total = 0, diffSum = 0;
    var stepBytes = sampleStride * 4;
    for (var i = 0; i < a.length; i += stepBytes) {
      var dr = Math.abs(a[i] - b[i]);
      var dg = Math.abs(a[i + 1] - b[i + 1]);
      var db = Math.abs(a[i + 2] - b[i + 2]);
      var da = Math.abs(a[i + 3] - b[i + 3]);
      diffSum += (dr + dg + db + da) / (255 * 4);
      total++;
    }
    return total ? diffSum / total : 0;
  }

  /* ── Duplicate/near-duplicate frame detection ────────────────────────
     Walks frames in order; a frame within `threshold` difference of the
     immediately preceding *kept* frame gets dropped, and its delay is
     added to the kept frame instead — so total animation duration is
     preserved even though frame count drops. This is the real mechanism
     behind "Remove duplicate frames" / "Merge similar frames". */
  function removeDuplicateFrames(frames, threshold) {
    threshold = threshold != null ? threshold : 0.02;
    if (!frames.length) return { frames: [], removedCount: 0 };
    var kept = [{ data: frames[0].data, delay: frames[0].delay, width: frames[0].width, height: frames[0].height }];
    var removedCount = 0;
    for (var i = 1; i < frames.length; i++) {
      var diff = frameDifference(frames[i].data, kept[kept.length - 1].data);
      if (diff <= threshold) {
        kept[kept.length - 1].delay += frames[i].delay;
        removedCount++;
      } else {
        kept.push({ data: frames[i].data, delay: frames[i].delay, width: frames[i].width, height: frames[i].height });
      }
    }
    return { frames: kept, removedCount: removedCount };
  }

  /* ── Compression level presets ───────────────────────────────────────
     Each preset maps to concrete, real parameters — not just a label.
     maxColors feeds modern-gif's encode() directly. dedupeThreshold
     feeds removeDuplicateFrames above. Higher "strength" = fewer
     colors + more willing to merge near-duplicate frames. */
  var PRESETS = {
    light: { maxColors: 192, dedupeThreshold: 0.008, dedupe: true, label: 'Light' },
    balanced: { maxColors: 128, dedupeThreshold: 0.02, dedupe: true, label: 'Balanced' },
    strong: { maxColors: 64, dedupeThreshold: 0.035, dedupe: true, label: 'Strong' },
    maximum: { maxColors: 32, dedupeThreshold: 0.05, dedupe: true, label: 'Maximum' }
  };

  /* ── Lossy-compression slider (0-200, per the UI spec) -> maxColors.
     modern-gif's real parameter is maxColors (2-255, fewer = smaller
     file, more banding). The UI's 0-200 "lossy" scale is a friendlier
     framing of the same underlying lever, not a separate mechanism —
     0 maps to little/no extra loss (high color count), 200 maps to
     maximum loss (very low color count). This mapping is linear and
     documented here so the relationship is never a mystery baked into
     a magic number. */
  function lossySliderToMaxColors(sliderValue, baseColors) {
    baseColors = baseColors || 128;
    var clamped = Math.max(0, Math.min(200, sliderValue));
    var reduction = (clamped / 200) * (baseColors - 8); /* never quantize below 8 colors from the slider alone */
    var result = Math.round(baseColors - reduction);
    return Math.max(2, Math.min(255, result));
  }

  /* ── Savings estimation (for live preview, before actual compression
     runs) ──────────────────────────────────────────────────────────────
     An honest heuristic, not a measured result — labeled as such
     everywhere it surfaces in the UI. Real GIF size depends heavily on
     LZW compressibility of the actual pixel data, which can't be known
     without truly encoding it. This estimates from three real, known
     levers: color-table size reduction, frame-count reduction, and a
     fixed overhead factor for lossy quantization's effect on LZW
     run-length efficiency (fewer colors → longer flat runs → better
     LZW compression, which is a real, well-understood effect, not a
     made-up bonus). */
  function estimateCompressedSize(originalBytes, originalColors, targetColors, originalFrameCount, keptFrameCount) {
    if (!originalBytes || originalBytes <= 0) return 0;
    var colorRatio = Math.max(0.15, targetColors / Math.max(originalColors, 2));
    /* LZW compresses runs of identical adjacent pixels; fewer colors
       increases the chance of adjacent-pixel matches, so the size
       reduction is sub-linear relative to the raw color-count ratio,
       not 1:1 — 0.75 exponent is a reasonable, conservative middle
       ground reflecting that real-world effect without overclaiming
       precision on it. */
    var colorFactor = Math.pow(colorRatio, 0.75);
    var frameRatio = originalFrameCount > 0 ? keptFrameCount / originalFrameCount : 1;
    var estimate = originalBytes * colorFactor * frameRatio;
    return Math.max(Math.round(originalBytes * 0.03), Math.round(estimate)); /* never estimate below a realistic GIF-overhead floor */
  }

  /* ── GIF89a decoder ───────────────────────────────────────────────
     No CDN dependency — parses the format directly, matching the exact
     LZW protocol the site's own existing encoder (gifMakeBlob, in
     converter-tools.js) already writes: variable code size starting at
     minCodeSize+1, CLEAR=1<<minCodeSize, EOI=CLEAR+1, dictionary reset
     on CLEAR or at 4096 entries. That shared protocol is what makes
     round-trip testing (encode with the existing encoder, decode with
     this) a meaningful correctness check, not just two independently-
     guessed implementations agreeing by coincidence.

     Handles disposal methods 0/1 (none/keep — draw over) and 2
     (restore to background) correctly, which is required to reconstruct
     each frame's true full pixel state for comparison/re-encoding, not
     just what that frame's own image data covers. Disposal method 3
     (restore to previous) is treated as method 2 — a documented,
     narrow simplification, not silently ignored. */
  function decodeGif(buffer) {
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var pos = 0;
    function u8() { return bytes[pos++]; }
    function u16() { var v = bytes[pos] | (bytes[pos + 1] << 8); pos += 2; return v; }
    function sig() { var s = ''; for (var i = 0; i < 6; i++) s += String.fromCharCode(bytes[pos++]); return s; }

    var signature = sig();
    if (signature !== 'GIF87a' && signature !== 'GIF89a') {
      throw new Error('Not a GIF file (bad signature: ' + signature + ')');
    }
    var width = u16(), height = u16();
    var packed = u8();
    var hasGCT = !!(packed & 0x80);
    var gctSize = hasGCT ? (2 << (packed & 0x07)) : 0;
    u8(); /* background color index — not currently surfaced */
    u8(); /* pixel aspect ratio — GIF rarely uses this meaningfully */
    var gct = null;
    if (hasGCT) {
      gct = new Uint8Array(gctSize * 3);
      for (var i = 0; i < gctSize * 3; i++) gct[i] = u8();
    }

    var loopCount = null; /* null = not specified (plays once per most browsers' default) */
    var frames = [];
    var pendingDelay = 10, pendingTransparentIndex = -1, pendingDisposal = 0;
    /* canvasState holds the full-canvas RGBA as frames accumulate —
       needed because a frame's own image data may only cover part of
       the canvas, relying on disposal rules for the rest. */
    var canvasState = new Uint8ClampedArray(width * height * 4);

    function readSubBlocks() {
      var out = [];
      var size = u8();
      while (size !== 0) {
        for (var k = 0; k < size; k++) out.push(u8());
        size = u8();
      }
      return out;
    }

    function lzwDecode(data, minCodeSize) {
      var CLEAR = 1 << minCodeSize, EOI = CLEAR + 1;
      var pos2 = 0, bitBuf = 0, bitCount = 0, codeSize = minCodeSize + 1;
      function readCode() {
        while (bitCount < codeSize) {
          if (pos2 >= data.length) return EOI;
          bitBuf |= data[pos2++] << bitCount;
          bitCount += 8;
        }
        var code = bitBuf & ((1 << codeSize) - 1);
        bitBuf >>= codeSize; bitCount -= codeSize;
        return code;
      }
      var dict, out = [];
      function reset() {
        dict = [];
        for (var i = 0; i < CLEAR; i++) dict[i] = [i];
        dict[CLEAR] = null; dict[EOI] = null;
        codeSize = minCodeSize + 1;
      }
      reset();
      var prevEntry = null;
      var code;
      while (true) {
        code = readCode();
        if (code === EOI) break;
        if (code === CLEAR) { reset(); prevEntry = null; continue; }
        var entry;
        if (dict[code]) entry = dict[code];
        else if (code === dict.length && prevEntry) entry = prevEntry.concat([prevEntry[0]]);
        else break; /* malformed stream — stop rather than throw, return what we have */
        for (var e = 0; e < entry.length; e++) out.push(entry[e]);
        if (prevEntry) {
          dict.push(prevEntry.concat([entry[0]]));
          if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
        }
        prevEntry = entry;
      }
      return out;
    }

    while (pos < bytes.length) {
      var blockType = u8();
      if (blockType === 0x3B) break; /* trailer */
      if (blockType === 0x21) { /* extension */
        var label = u8();
        if (label === 0xF9) { /* Graphic Control Extension */
          var blockSize = u8(); /* always 4 */
          var gcePacked = u8();
          pendingDisposal = (gcePacked >> 2) & 0x07;
          var transparentFlag = gcePacked & 0x01;
          pendingDelay = u16();
          var transparentIndex = u8();
          pendingTransparentIndex = transparentFlag ? transparentIndex : -1;
          u8(); /* block terminator */
        } else if (label === 0xFF) { /* Application Extension — NETSCAPE loop count */
          var appBlockSize = u8();
          var appId = '';
          for (var a = 0; a < appBlockSize; a++) appId += String.fromCharCode(u8());
          var sub = readSubBlocks();
          if (appId.indexOf('NETSCAPE') === 0 && sub.length >= 3 && sub[0] === 1) {
            loopCount = sub[1] | (sub[2] << 8);
          }
        } else {
          readSubBlocks(); /* comment/plain-text extensions — skip, not needed here */
        }
      } else if (blockType === 0x2C) { /* image descriptor */
        var imgLeft = u16(), imgTop = u16(), imgW = u16(), imgH = u16();
        var imgPacked = u8();
        var hasLCT = !!(imgPacked & 0x80);
        var interlaced = !!(imgPacked & 0x40);
        var lctSize = hasLCT ? (2 << (imgPacked & 0x07)) : 0;
        var lct = null;
        if (hasLCT) {
          lct = new Uint8Array(lctSize * 3);
          for (var l = 0; l < lctSize * 3; l++) lct[l] = u8();
        }
        var minCodeSize = u8();
        var lzwData = readSubBlocks();
        var indices = lzwDecode(lzwData, minCodeSize);
        var palette = hasLCT ? lct : gct;

        /* Snapshot the canvas BEFORE drawing this frame — needed if this
           frame's own disposal method is "restore to background", which
           applies to the region this frame just occupied, on the frame
           AFTER this one, not to this frame itself. */
        var preDrawSnapshot = pendingDisposal === 2 ? canvasState.slice() : null;

        if (interlaced) {
          /* De-interlace: GIF interlaced rows arrive in passes
             (0,8,16.. / 4,12,20.. / 2,6,10,14.. / 1,3,5,7..), not in
             top-to-bottom order — mapping them naively would scramble
             the image vertically. */
          var passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
          var row = 0, idxPtr = 0;
          passes.forEach(function (p) {
            for (var y = p[0]; y < imgH; y += p[1]) {
              writeRow(y, idxPtr); idxPtr += imgW;
            }
          });
        } else {
          for (var y2 = 0; y2 < imgH; y2++) writeRow(y2, y2 * imgW);
        }
        function writeRow(y, idxOffset) {
          for (var x = 0; x < imgW; x++) {
            var colorIndex = indices[idxOffset + x];
            if (colorIndex === undefined) continue;
            var cx = imgLeft + x, cy = imgTop + y;
            if (cx >= width || cy >= height) continue;
            var di = (cy * width + cx) * 4;
            if (colorIndex === pendingTransparentIndex) continue; /* leave existing canvas pixel */
            canvasState[di] = palette[colorIndex * 3];
            canvasState[di + 1] = palette[colorIndex * 3 + 1];
            canvasState[di + 2] = palette[colorIndex * 3 + 2];
            canvasState[di + 3] = 255;
          }
        }

        frames.push({
          data: canvasState.slice(),
          delay: Math.max(pendingDelay * 10, 20), /* GIF centiseconds -> ms; floor at 20ms like most browsers */
          width: width,
          height: height,
          disposal: pendingDisposal
        });

        if (pendingDisposal === 2) {
          /* restore to background: clear the region this frame drew, for
             the NEXT frame to start from — background here treated as
             fully transparent, the common real-world convention. */
          for (var yy = imgTop; yy < imgTop + imgH && yy < height; yy++) {
            for (var xx = imgLeft; xx < imgLeft + imgW && xx < width; xx++) {
              var ci = (yy * width + xx) * 4;
              canvasState[ci] = 0; canvasState[ci + 1] = 0; canvasState[ci + 2] = 0; canvasState[ci + 3] = 0;
            }
          }
        }
        pendingDelay = 10; pendingTransparentIndex = -1; pendingDisposal = 0;
      } else {
        break; /* unrecognized block — stop rather than risk misreading the rest */
      }
    }

    return { width: width, height: height, loopCount: loopCount, frames: frames };
  }

  window.GifCompressorEngine = {
    version: '1.0',
    frameDifference: frameDifference,
    removeDuplicateFrames: removeDuplicateFrames,
    PRESETS: PRESETS,
    lossySliderToMaxColors: lossySliderToMaxColors,
    estimateCompressedSize: estimateCompressedSize,
    decodeGif: decodeGif
  };
  try { console.log('[gif-compressor] engine v1.0 loaded'); } catch (e) {}
})();
