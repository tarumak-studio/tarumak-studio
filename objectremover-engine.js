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
    /* Edge-stopping ("bilateral") smoothing passes over the masked region.
       Pure isotropic averaging blurs equally in every direction, which turns
       any structure that reached the hole into a soft blob — the main cause
       of the "blurry smear". Here each neighbour's weight decays with its
       colour distance from the current pixel (w = exp(-d²/2σ²)), so the
       diffusion flows ALONG edges/gradients but not ACROSS them: straight
       boundaries and gradient bands continue into the fill and stay crisp. */
    var orig = sm.mask;
    var SIG2 = 2 * 26 * 26;                 /* colour sensitivity (σ≈26) */
    for (var p = 0; p < passes; p++) {
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        i = y * w + x; if (!orig[i]) continue;
        var cr = d[i * 3], cg = d[i * 3 + 1], cb = d[i * 3 + 2];
        var r2 = 0, g2 = 0, b2 = 0, wsum = 0;
        for (k = 0; k < 4; k++) {
          var nx4 = x + OFF[k][0], ny4 = y + OFF[k][1];
          if (nx4 < 0 || ny4 < 0 || nx4 >= w || ny4 >= h) continue;
          var j2 = (ny4 * w + nx4) * 3;
          var dr = d[j2] - cr, dg = d[j2 + 1] - cg, db = d[j2 + 2] - cb;
          var cd = dr * dr + dg * dg + db * db;
          var wt = Math.exp(-cd / SIG2);      /* similar colour → high weight */
          r2 += d[j2] * wt; g2 += d[j2 + 1] * wt; b2 += d[j2 + 2] * wt; wsum += wt;
        }
        if (wsum > 0) {
          d[i * 3] = (cr + r2 / wsum) / 2;
          d[i * 3 + 1] = (cg + g2 / wsum) / 2;
          d[i * 3 + 2] = (cb + b2 / wsum) / 2;
        }
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

  /* O(n) chamfer distance from the nearest masked pixel (whole image). */
  function distFromMask(mask, w, h) {
    var INF = 1e9, dist = new Float32Array(w * h), i, x, y;
    for (i = 0; i < w * h; i++) dist[i] = mask[i] ? 0 : INF;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = y * w + x; var v = dist[i];
      if (x > 0) v = Math.min(v, dist[i - 1] + 1);
      if (y > 0) v = Math.min(v, dist[i - w] + 1);
      if (x > 0 && y > 0) v = Math.min(v, dist[i - w - 1] + 1.4142);
      if (x < w - 1 && y > 0) v = Math.min(v, dist[i - w + 1] + 1.4142);
      dist[i] = v;
    }
    for (y = h - 1; y >= 0; y--) for (x = w - 1; x >= 0; x--) {
      i = y * w + x; var v2 = dist[i];
      if (x < w - 1) v2 = Math.min(v2, dist[i + 1] + 1);
      if (y < h - 1) v2 = Math.min(v2, dist[i + w] + 1);
      if (x < w - 1 && y < h - 1) v2 = Math.min(v2, dist[i + w + 1] + 1.4142);
      if (x > 0 && y < h - 1) v2 = Math.min(v2, dist[i + w - 1] + 1.4142);
      dist[i] = v2;
    }
    return dist;
  }
  /* Grow the mask by `r` pixels (absorbs anti-aliased object fringe so the
     fill boundary sits on clean background). */
  function dilateMask(mask, w, h, r) {
    var dist = distFromMask(mask, w, h), out = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) out[i] = dist[i] <= r ? 1 : 0;
    return out;
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
  /* Luma variance of KNOWN pixels in a window — tells us whether the area
     around a hole is genuinely textured (grass, foliage) or smooth (flat
     illustration, sky, gradient, product surface). */
  function knownVar(d, noSample, w, h, bx, by, B) {
    var pad = B, x0 = Math.max(0, bx - pad), y0 = Math.max(0, by - pad);
    var x1 = Math.min(w, bx + B + pad), y1 = Math.min(h, by + B + pad);
    var sum = 0, sq = 0, n = 0;
    for (var y = y0; y < y1; y += 2) for (var x = x0; x < x1; x += 2) {
      if (noSample[y * w + x]) continue;                 /* skip hole + guard */
      var i = (y * w + x) * 4;
      var l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      sum += l; sq += l * l; n++;
    }
    if (n < 8) return 0;
    return sq / n - (sum / n) * (sum / n);
  }
  function blockVar(d, bx, by, B, w) {
    var sum = 0, sq = 0, n = 0;
    for (var y = by; y < by + B; y += 2) for (var x = bx; x < bx + B; x += 2) {
      var i = (y * w + x) * 4;
      var l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      sum += l; sq += l * l; n++;
    }
    if (!n) return 0;
    return sq / n - (sum / n) * (sum / n);
  }

  function texturize(d, base, mask, w, h, opts, rand, forbid) {
    var B = opts.block, HALF = B >> 1, K = opts.candidates, R = opts.radius;
    rand = rand || Math.random;
    /* Source blocks must avoid `forbid` (the guard band around the object),
       not merely `mask` — otherwise candidates sample the object's own
       anti-aliased fringe and drag its colour back in. */
    var noSample = forbid || mask;
    /* SMOOTHNESS GATE: below this known-neighbourhood variance the area is
       flat (illustration, sky, gradient). The diffused base already
       continues those gradients correctly — injecting patch detail there is
       exactly what produced the "green shards / broken geometry". So in
       smooth areas we keep the pure base and skip texture entirely. */
    var SMOOTH = 55;
    var win = new Float32Array(B * B);
    for (var wy = 0; wy < B; wy++) for (var wx = 0; wx < B; wx++) {
      win[wy * B + wx] = Math.sin(Math.PI * (wx + .5) / B) * Math.sin(Math.PI * (wy + .5) / B);
    }
    function blockKnown(bx, by) {
      if (bx < 0 || by < 0 || bx + B > w || by + B > h) return false;
      for (var y = by; y < by + B; y += 2) for (var x = bx; x < bx + B; x += 2) {
        if (noSample[y * w + x]) return false;
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
        /* Gate: is the surrounding known area textured enough to warrant
           patch synthesis? If not, leave the smooth base as-is. */
        var localVar = knownVar(d, noSample, w, h, bx, by, B);
        if (localVar < SMOOTH) continue;
        var target = blockMean(base, bx, by, 3);
        var best = null, bestScore = 1e18;
        for (var k = 0; k < K; k++) {
          var sx = Math.round(bx + (rand() * 2 - 1) * R);
          var sy = Math.round(by + (rand() * 2 - 1) * R);
          if (!blockKnown(sx, sy)) continue;
          var m2 = blockMean(d, sx, sy, 4);
          var s = 0;
          for (var c = 0; c < 3; c++) { var dv = m2[c] - target[c]; s += dv * dv; }
          /* Variance-match penalty: reject a source block whose internal
             detail level is far from the surrounding texture. This stops an
             edge/high-contrast block being pasted into a milder texture —
             the other source of "duplicated texture patches" and geometry
             breaks. */
          var svar = blockVar(d, sx, sy, B, w);
          var vpen = Math.abs(svar - localVar) * 0.5;
          s += vpen;
          if (s < bestScore) { bestScore = s; best = [sx, sy, m2]; }
        }
        if (!best) continue;
        var sx2 = best[0], sy2 = best[1], srcMean = best[2];
        /* Scale detail by how textured the area is, so mildly-textured
           regions get a gentle amount and never look pasted. */
        var texStrength = opts.strength * Math.min(1, (localVar - SMOOTH) / 120);
        for (var yy = 0; yy < B; yy++) for (var xx = 0; xx < B; xx++) {
          var ti = ((by + yy) * w + (bx + xx));
          if (!mask[ti]) continue;
          var si = ((sy2 + yy) * w + (sx2 + xx)) * 4;
          var a = win[yy * B + xx] * texStrength;
          for (var c2 = 0; c2 < 3; c2++) {
            var detail = d[si + c2] - srcMean[c2];         /* source high-freq only */
            var v = base[ti * 3 + c2] + detail;
            var cur = base[ti * 3 + c2];
            base[ti * 3 + c2] = cur * (1 - a) + Math.max(0, Math.min(255, v)) * a;
          }
        }
      }
    }
  }

  /* ═══════════ v3.0: edge-aware structure propagation ═════════════════
     The diffusion base is deliberately smooth and texturize adds detail —
     but neither CONTINUES an interrupted line: a fence rail, horizon,
     table edge or building line that enters the mask on one side and
     exits on the other used to dissolve into blur across the hole. This
     stage detects strong edges terminating at the mask boundary, pairs
     up entries that are collinear + similar in colour (the two ends of
     the same real-world line), and stamps a feathered strip of pixels
     sampled from both ends through the fill — BEFORE texturize, so
     texture synthesis then builds around restored structure. This is the
     core idea of classic structure-propagation inpainting (the
     literature Photoshop's original CAF built on), sized for browsers. */

  /* Sobel gradient at a known pixel (luma). Returns [gx, gy]. */
  function sobelAt(d, w, h, x, y) {
    function L(xx, yy) {
      xx = Math.max(0, Math.min(w - 1, xx)); yy = Math.max(0, Math.min(h - 1, yy));
      var i = (yy * w + xx) * 4;
      return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }
    var gx = -L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1)
             + L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1);
    var gy = -L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1)
             + L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1);
    return [gx, gy];
  }

  /* Find strong edges that terminate at the mask boundary. Walks the ring
     of known pixels just outside the dilated mask; keeps local gradient-
     magnitude maxima. Each entry: {x, y, angle (edge tangent), mag,
     color:[r,g,b]}. */
  function detectEdgeEntries(d, mask, w, h, threshold) {
    var dist = distFromMask(mask, w, h);
    var entries = [];
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var i = y * w + x;
        if (mask[i]) continue;
        if (dist[i] > 2.5) continue;               /* ring just outside the mask */
        var g = sobelAt(d, w, h, x, y);
        var mag = Math.hypot(g[0], g[1]);
        if (mag < threshold) continue;
        /* edge tangent = gradient rotated 90° */
        var angle = Math.atan2(g[0], -g[1]);
        var ci = (y * w + x) * 4;
        entries.push({ x: x, y: y, angle: angle, mag: mag,
          color: [d[ci], d[ci + 1], d[ci + 2]] });
      }
    }
    /* Non-max suppression: keep the strongest entry per 6px neighbourhood
       so one thick real edge yields one entry, not a smear of dozens. */
    entries.sort(function (a, b) { return b.mag - a.mag; });
    var kept = [];
    for (var e = 0; e < entries.length; e++) {
      var ok = true;
      for (var k = 0; k < kept.length; k++) {
        var dx = entries[e].x - kept[k].x, dy = entries[e].y - kept[k].y;
        if (dx * dx + dy * dy < 36) { ok = false; break; }
      }
      if (ok) kept.push(entries[e]);
      if (kept.length >= 48) break;                /* cap: enough for any real scene */
    }
    return kept;
  }

  /* Pair up entries that look like two ends of the same interrupted line:
     the chord between them must cross the mask, both tangents must align
     with the chord direction, and end colours must be similar. Greedy
     best-score matching, each entry used once. */
  function matchEntryPairs(entries, mask, w, h) {
    function angDiff(u, v) {
      var t = Math.abs(u - v) % Math.PI;           /* tangents are direction-less */
      return Math.min(t, Math.PI - t);
    }
    var cands = [];
    for (var a = 0; a < entries.length; a++) {
      for (var b = a + 1; b < entries.length; b++) {
        var A = entries[a], Bb = entries[b];
        var dx = Bb.x - A.x, dy = Bb.y - A.y;
        var len = Math.hypot(dx, dy);
        if (len < 6) continue;
        var chord = Math.atan2(dy, dx);
        var alignA = angDiff(A.angle, chord), alignB = angDiff(Bb.angle, chord);
        if (alignA > 0.5 || alignB > 0.5) continue; /* ~28° tolerance */
        var cd = 0;
        for (var c = 0; c < 3; c++) { var dv = A.color[c] - Bb.color[c]; cd += dv * dv; }
        if (cd > 3600) continue;                    /* end colours must roughly match */
        /* chord must actually pass through the hole */
        var steps = Math.ceil(len), inside = 0;
        for (var s = 0; s <= steps; s++) {
          var px = Math.round(A.x + dx * s / steps), py = Math.round(A.y + dy * s / steps);
          if (px < 0 || py < 0 || px >= w || py >= h) continue;
          if (mask[py * w + px]) inside++;
        }
        if (inside < len * 0.3) continue;
        cands.push({ a: a, b: b, score: (alignA + alignB) * 100 + cd * 0.02 + len * 0.05 });
      }
    }
    cands.sort(function (p, q) { return p.score - q.score; });
    var used = {}, pairs = [];
    for (var i = 0; i < cands.length && pairs.length < 12; i++) {
      var p = cands[i];
      if (used[p.a] || used[p.b]) continue;
      used[p.a] = used[p.b] = 1;
      pairs.push([entries[p.a], entries[p.b]]);
    }
    return pairs;
  }

  /* Stamp each matched structure through the fill: walk the chord, and at
     each step copy a short pixel strip perpendicular to the chord,
     sampled just outside whichever end is nearer (cross-faded around the
     middle), feathered so it beds into the base. */
  function propagateStructures(d, base, mask, w, h, pairs, stripHalf) {
    /* Sobel detects the light↔dark TRANSITION, not a line's dark center —
       so the chord can sit 1-3px off the true line body. The strip must
       be wide enough to carry the whole cross-profile even with that
       offset. 6px half-width covers lines up to ~8px thick with a
       2-3px detection offset; the profile sampling below reads whatever
       is truly there (line + surrounding), so an over-wide strip stamps
       correct background pixels — harmless — rather than clipping the
       line body, which was the visible failure. */
    stripHalf = stripHalf || 6;
    pairs.forEach(function (pr) {
      var A = pr[0], B = pr[1];
      var dx = B.x - A.x, dy = B.y - A.y;
      var len = Math.hypot(dx, dy);
      var ux = dx / len, uy = dy / len;             /* along the chord */
      var nx = -uy, ny = ux;                        /* perpendicular */
      var steps = Math.ceil(len);
      for (var s = 0; s <= steps; s++) {
        var t = s / steps;
        var cx = A.x + dx * t, cy = A.y + dy * t;
        for (var o = -stripHalf; o <= stripHalf; o++) {
          var px = Math.round(cx + nx * o), py = Math.round(cy + ny * o);
          if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) continue;
          var ti = py * w + px;
          if (!mask[ti]) continue;
          /* source strips: mirror position just OUTSIDE each end, same
             perpendicular offset — reads the line's own cross-profile */
          var back = 2 + (s % 3);                   /* small jitter breaks exact repetition */
          var axs = Math.round(A.x - ux * back + nx * o), ays = Math.round(A.y - uy * back + ny * o);
          var bxs = Math.round(B.x + ux * back + nx * o), bys = Math.round(B.y + uy * back + ny * o);
          var va = null, vb = null;
          if (axs >= 0 && ays >= 0 && axs < w && ays < h && !mask[ays * w + axs]) va = (ays * w + axs) * 4;
          if (bxs >= 0 && bys >= 0 && bxs < w && bys < h && !mask[bys * w + bxs]) vb = (bys * w + bxs) * 4;
          if (va == null && vb == null) continue;
          /* cross-fade A→B along the chord; if one side unavailable use the other */
          var wa = (vb == null) ? 1 : (va == null) ? 0 : 1 - t;
          /* feather only the strip's outer 2px — the inner body must stamp
             at full strength or the propagated line arrives washed out
             (the exact defect this stage exists to fix). */
          var edge = stripHalf - Math.abs(o);
          var f = Math.min(1, (edge + 1) / 2.5);
          for (var c = 0; c < 3; c++) {
            var sv = (va != null ? d[va + c] : 0) * wa + (vb != null ? d[vb + c] : 0) * (1 - wa);
            var cur = base[ti * 3 + c];
            base[ti * 3 + c] = cur * (1 - f) + sv * f;
          }
        }
      }
    });
  }

  /* ═══════════ v3.0: artifact assessment (drives auto-refinement) ═════
     After the fill, compare local detail (luma variance) INSIDE the
     filled region against the ring of known pixels around it. A big
     deficit = the classic "smudged patch" (fill too smooth for its
     surroundings). Returns a 0..1 mismatch score; the pipeline runs an
     extra texturize pass automatically when it exceeds a threshold —
     the user never has to click Remove twice. */
  function assessFillQuality(d, mask, w, h, guard) {
    var inSum = 0, inSq = 0, inN = 0, outSum = 0, outSq = 0, outN = 0;
    var dist = distFromMask(mask, w, h);
    for (var y = 0; y < h; y += 2) {
      for (var x = 0; x < w; x += 2) {
        var i = y * w + x;
        var li = (y * w + x) * 4;
        var l = 0.299 * d[li] + 0.587 * d[li + 1] + 0.114 * d[li + 2];
        if (mask[i]) { inSum += l; inSq += l * l; inN++; }
        else if (dist[i] < 24 && !(guard && guard[i])) { outSum += l; outSq += l * l; outN++; }
      }
    }
    if (inN < 16 || outN < 16) return 0;
    var inVar = inSq / inN - (inSum / inN) * (inSum / inN);
    var outVar = outSq / outN - (outSum / outN) * (outSum / outN);
    if (outVar < 40) return 0;                      /* smooth surroundings: smooth fill is CORRECT */
    var ratio = inVar / outVar;
    return ratio >= 0.55 ? 0 : Math.min(1, (0.55 - ratio) / 0.55);
  }

  /* ═══════════ browser provider: full pipeline ═══════════════════════ */
  var QUALITY = {
    fast:     { smallEdge: 288, passes: 14, texture: false, structure: false, refine: false },
    balanced: { smallEdge: 448, passes: 24, texture: true, block: 20, candidates: 18, strength: 0.9,
                structure: true, edgeThreshold: 120, refine: true },
    best:     { smallEdge: 640, passes: 34, texture: true, block: 14, candidates: 32, strength: 1.0,
                structure: true, edgeThreshold: 90, refine: true, twoScale: true }
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
        var ctx = canvas.getContext('2d', { willReadFrequently: true }), id, d;
        try { id = ctx.getImageData(0, 0, w, h); d = id.data; }
        catch (e) { reject(new Error('image memory readback failed')); return; }
        var mctx = maskCv.getContext('2d', { willReadFrequently: true }), md;
        try { md = mctx.getImageData(0, 0, w, h).data; }
        catch (e) { reject(new Error('mask readback failed')); return; }
        var mask = new Uint8Array(w * h), any = 0;
        /* Threshold LOW (>10): a soft brush's faded edge must still count
           as selected, or anti-aliased object fringes survive removal. */
        for (var i = 0; i < w * h; i++) { if (md[i * 4 + 3] > 10) { mask[i] = 1; any++; } }
        if (!any) { reject(new Error('empty selection \u2014 paint over what you want removed')); return; }
        /* Dilate the mask adaptively (like every professional remover):
           users under-paint, and object edges carry 1\u20133px of anti-aliased
           object color. Absorbing a small ring guarantees the fill boundary
           sits on CLEAN background \u2014 which is also what makes the edge
           feather safe instead of remnant-preserving. */
        var dil = Math.max(3, Math.min(14, Math.round(Math.min(w, h) * 0.008)));
        mask = dilateMask(mask, w, h, dil);
        any = 0; for (i = 0; i < w * h; i++) if (mask[i]) any++;
        if (any > w * h * 0.6) { reject(new Error('selection covers most of the image \u2014 for background replacement use the Background Remover instead')); return; }
        /* Guard ring: texture candidates must ALSO avoid a band around the
           dilated mask, so near-object pixels can never be sampled. */
        var guard = dilateMask(mask, w, h, Math.max(8, dil * 2));

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
            /* v3.0: continue interrupted lines through the hole BEFORE
               texture synthesis, so texture builds around real structure. */
            if (q.structure) {
              if (opts.onProgress) opts.onProgress(0.55, 'Reconnecting edges\u2026');
              var entries = detectEdgeEntries(d, mask, w, h, q.edgeThreshold || 110);
              if (entries.length >= 2) {
                var pairs = matchEntryPairs(entries, mask, w, h);
                if (pairs.length) propagateStructures(d, base, mask, w, h, pairs, 3);
              }
            }
            return base;
          },
          function (base) {
            if (q.texture) {
              if (opts.onProgress) opts.onProgress(0.62, 'Matching textures\u2026');
              /* v3.0 Best: two-scale synthesis — coarse blocks first to lay
                 down large pattern, then finer blocks over it for detail. */
              if (q.twoScale) {
                texturize(d, base, mask, w, h, { block: q.block * 2, candidates: q.candidates, radius: q.block * 12, strength: q.strength * 0.7 }, null, guard);
              }
              texturize(d, base, mask, w, h, { block: q.block, candidates: q.candidates, radius: q.block * 7, strength: q.strength }, null, guard);
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
            return base;
          },
          function (base) {
            /* v3.0 auto-refinement: if the filled area came out smudged
               relative to its textured surroundings, run one more finer
               texturize + re-blend automatically — no second click. */
            if (!q.refine) return;
            var score = assessFillQuality(d, mask, w, h, guard);
            if (score < 0.25) return;
            if (opts.onProgress) opts.onProgress(0.92, 'Refining details\u2026');
            var b2 = Math.max(10, Math.round((q.block || 16) * 0.75));
            texturize(d, base, mask, w, h, { block: b2, candidates: (q.candidates || 24) + 8, radius: b2 * 9, strength: Math.min(1, (q.strength || 0.9) + 0.1) }, null, guard);
            var feather2 = featherMap(mask, w, h, 4);
            for (var jj = 0; jj < w * h; jj++) {
              if (!mask[jj]) continue;
              var a2 = feather2[jj];
              for (var c2 = 0; c2 < 3; c2++) {
                var orig2 = d[jj * 4 + c2], fill2 = base[jj * 3 + c2];
                d[jj * 4 + c2] = Math.round(orig2 * (1 - a2) + fill2 * a2);
              }
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
    version: '3.1',
    providers: PROVIDERS,
    remoteConfig: REMOTE,
    lastErrors: {},
    /* v3.0 internals exposed for unit testing (same pattern as
       PdfToExcelEngine) — pure typed-array functions, no DOM. */
    _test: {
      detectEdgeEntries: detectEdgeEntries,
      matchEntryPairs: matchEntryPairs,
      propagateStructures: propagateStructures,
      assessFillQuality: assessFillQuality,
      dilateMask: dilateMask,
      distFromMask: distFromMask
    },
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
  try { console.log('[object-remover] engine v3.1 loaded'); } catch (e) {}
})();
