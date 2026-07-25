/* pdftoexcel-engine.js — Tarumak Studio PDF to Excel engine
 *
 * HONESTY NOTE (read before assuming this matches Acrobat/SmallPDF):
 * There is no ML-based table detector here. This is a real, well-established
 * technique — the same family of approach used by open-source tools like
 * pdfplumber and Camelot's "stream" mode: read each text run's actual (x,y)
 * position from the PDF's own content stream (or, for scanned pages, from
 * OCR word bounding boxes), cluster runs into rows by shared Y position and
 * into columns by shared X start position, then place each run into its
 * (row, column) cell. It works well on clean, evenly-spaced tabular data —
 * invoices, exports from spreadsheets, bank statements, most real-world
 * "print to PDF" tables. It does NOT reconstruct tables via drawn ruling
 * lines (that needs the PDF's raw vector operator stream, a materially
 * bigger scope — noted as a future improvement, not silently attempted).
 * The tool's own UI and FAQ must say this plainly, not imply parity with
 * server-side ML table detection.
 *
 * All clustering/grid/classification logic below is pure (no DOM, no
 * pdf.js, no Tesseract) so it can be unit-tested with synthetic data.
 */
(function () {
  'use strict';
  if (window.PdfToExcelEngine) return;

  /* ── Row clustering: group positioned items sharing a Y band ────────
     Greedy nearest-cluster assignment against a running average, which
     tolerates the small per-character baseline jitter real PDFs have
     without needing a fixed grid. */
  function clusterRows(items, yTolerance) {
    var sorted = items.slice().sort(function (a, b) { return a.y - b.y; });
    var rows = [];
    for (var i = 0; i < sorted.length; i++) {
      var it = sorted[i], row = null;
      for (var r = 0; r < rows.length; r++) {
        if (Math.abs(rows[r].yAvg - it.y) <= yTolerance) { row = rows[r]; break; }
      }
      if (!row) { row = { yAvg: it.y, items: [] }; rows.push(row); }
      row.items.push(it);
      var sum = 0; for (var k = 0; k < row.items.length; k++) sum += row.items[k].y;
      row.yAvg = sum / row.items.length;
    }
    rows.forEach(function (row) { row.items.sort(function (a, b) { return a.x - b.x; }); });
    rows.sort(function (a, b) { return a.yAvg - b.yAvg; });
    return rows;
  }

  /* ── Merge adjacent words within a row into "cell runs" ──────────────
     Column-boundary detection below treats each run's START x as a
     column candidate. Without this pass, a two-word cell like "New York"
     — two separate PDF text items with a small (~1-6pt) gap between them
     — gets misread as two DIFFERENT columns, because the second word's
     raw x-start can be far enough from the first to look like a new
     column on its own. The fix: collapse words separated by a SMALL gap
     (ordinary inter-word spacing) into one run before column detection
     ever sees them; only a LARGE gap (an actual column boundary) should
     produce a new run. wordGap is deliberately much smaller than the
     xTolerance used for column clustering — they answer different
     questions ("is this the same word-cluster" vs "is this the same
     column across rows"). */
  /* wordGap accepts either a fixed number (existing behavior, exactly as
     before) or the string 'auto', which scales the gap to each row's own
     font size instead of using one constant for every row. A fixed 3pt
     gap works for typical 10-12pt body text but is too tight for a large
     18pt name or heading, where normal single-space gaps are
     proportionally wider — exactly the case that caused "Marco" and
     "Torres" to stay two separate runs instead of merging into one name
     during testing. 'auto' is opt-in so nothing that already depends on
     a fixed gap changes behavior. */
  function mergeWordRuns(rows, wordGap) {
    var auto = wordGap === 'auto';
    return rows.map(function (row) {
      var runs = [];
      var rowGap = auto ? autoGapForRow(row) : wordGap;
      row.items.forEach(function (it) {
        var last = runs[runs.length - 1];
        if (last && (it.x - (last.x + last.w)) <= rowGap) {
          last.text += ' ' + it.text;
          last.w = (it.x + it.w) - last.x;
          if (isBoldFont(it.fontName)) last.bold = true;
          if (isItalicFont(it.fontName)) last.italic = true;
          if (it.fontSize) last.maxFontSize = Math.max(last.maxFontSize || 0, it.fontSize);
        } else {
          runs.push({
            text: it.text, x: it.x, w: it.w, y: it.y,
            bold: isBoldFont(it.fontName), italic: isItalicFont(it.fontName),
            maxFontSize: it.fontSize || 0
          });
        }
      });
      return { yAvg: row.yAvg, items: runs };
    });
  }
  function autoGapForRow(row) {
    var maxSize = 10;
    row.items.forEach(function (it) { if (it.fontSize) maxSize = Math.max(maxSize, it.fontSize); });
    return Math.max(3, maxSize * 0.32);
  }

  /* ── Column detection: cluster X-start positions across ALL rows into
     shared column anchors. Real tabular data — even without ruling lines
     — reuses the same handful of X starts row after row; this is exactly
     the signal that makes whitespace-based extraction work. Operates on
     merged cell runs (see mergeWordRuns), not raw words. ── */
  function detectColumnBoundaries(rows, xTolerance) {
    var xs = [];
    rows.forEach(function (row) { row.items.forEach(function (it) { xs.push(it.x); }); });
    xs.sort(function (a, b) { return a - b; });
    var cols = [];
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i], col = null;
      for (var c = 0; c < cols.length; c++) {
        if (Math.abs(cols[c].xAvg - x) <= xTolerance) { col = cols[c]; break; }
      }
      if (!col) { col = { xAvg: x, count: 0 }; cols.push(col); }
      col.xAvg = (col.xAvg * col.count + x) / (col.count + 1);
      col.count++;
    }
    cols.sort(function (a, b) { return a.xAvg - b.xAvg; });
    return cols.map(function (c) { return c.xAvg; });
  }

  /* ── Build the row×column text grid, bucketing each item into its
     nearest column anchor. Multiple items landing in the same cell (e.g.
     "Total" and "Cost" both under one wide header) are joined with a
     space rather than one silently overwriting the other. ── */
  function buildGrid(rows, columnXs) {
    var fmt = rows.map(function () {
      var r = new Array(columnXs.length);
      for (var i = 0; i < r.length; i++) r[i] = { bold: false, italic: false, maxFontSize: 0 };
      return r;
    });
    var grid = rows.map(function (row, rIdx) {
      var cells = new Array(columnXs.length);
      for (var i = 0; i < cells.length; i++) cells[i] = '';
      row.items.forEach(function (it) {
        var bestIdx = 0, bestDist = Infinity;
        for (var c = 0; c < columnXs.length; c++) {
          var d = Math.abs(columnXs[c] - it.x);
          if (d < bestDist) { bestDist = d; bestIdx = c; }
        }
        cells[bestIdx] = cells[bestIdx] ? cells[bestIdx] + ' ' + it.text : it.text;
        if (it.bold) fmt[rIdx][bestIdx].bold = true;
        if (it.italic) fmt[rIdx][bestIdx].italic = true;
        if (it.maxFontSize) fmt[rIdx][bestIdx].maxFontSize = Math.max(fmt[rIdx][bestIdx].maxFontSize, it.maxFontSize);
      });
      return cells;
    });
    return { grid: grid, fmt: fmt };
  }

  /* ── Cell type classification ────────────────────────────────────────
     Numbers/currency: safe to coerce to a real numeric cell — parsing
     "$1,234.56" -> 1234.56 is unambiguous.
     Dates: DELIBERATELY kept as readable text, not coerced to an Excel
     date serial. "03/04/2026" is genuinely ambiguous (US MM/DD vs
     international DD/MM) with no reliable way to tell from the text
     alone — silently guessing risks writing a WRONG date into someone's
     spreadsheet, which is worse than a plain but correct text cell. */
  function classifyCell(text) {
    var t = (text || '').trim();
    if (!t) return { type: 's', value: '' };
    if (/^[$€£¥]?\s*-?[\d,]+\.?\d*\s*[$€£¥]?%?$/.test(t) && /\d/.test(t)) {
      var isPct = /%$/.test(t);
      var num = parseFloat(t.replace(/[^0-9.\-]/g, ''));
      if (!isNaN(num)) return { type: 'n', value: isPct ? num / 100 : num, display: t };
    }
    return { type: 's', value: t };
  }

  /* ── Merged-cell heuristic ────────────────────────────────────────────
     A row with far fewer populated cells than the page's typical column
     count, whose one populated cell sits at the row's leftmost column,
     reads as a section header/merged banner (e.g. "Q1 Results" spanning
     the full table width) rather than a sparse data row. Real PDF merge
     info isn't exposed via text position alone, so this is a considered
     approximation — documented, not asserted as exact. */
  function detectMergeRows(grid, typicalColCount) {
    var merges = [];
    grid.forEach(function (row, rIdx) {
      var populated = row.reduce(function (n, c) { return n + (c ? 1 : 0); }, 0);
      if (populated === 1 && row[0] && typicalColCount > 2) {
        merges.push({ row: rIdx, fromCol: 0, toCol: typicalColCount - 1 });
      }
    });
    return merges;
  }

  /* ── Orchestration: positioned items -> grid, given tunable tolerances
     (Best/Balanced/Fast quality tiers translate to tolerance choices at
     the call site, not different algorithms). ── */
  /* ── Document classification ──────────────────────────────────────
     HONESTY NOTE: this is rule-based structural analysis, not a trained
     classifier. It answers a narrower, defensible question — "does this
     page look grid-like, card-like, or prose-like?" — using signals we
     can actually measure (item count, column-alignment strength, font-
     size spread, line length). It does NOT attempt to distinguish
     semantically similar layouts that share the same visual structure
     (e.g. "invoice" vs "price list" vs "bank statement" all look like
     the same grid-of-numbers signature; "brochure" vs "magazine" vs
     "manual" all look like the same multi-column-prose signature). We
     return four honestly-distinguishable buckets, each mapped to a
     genuinely different reconstruction strategy, plus a qualitative
     confidence (based on how many signals agree, not a manufactured
     percentage) and the actual reasons — shown to the user, not hidden. */
  function classifyPage(items, pageWidth) {
    if (!items.length) return { type: 'mixed', confidence: 'low', reasons: ['No text detected on this page.'] };
    var reasons = [];
    var n = items.length;
    var sizes = items.map(function (it) { return it.fontSize || 10; }).sort(function (a, b) { return a - b; });
    var medianSize = sizes[Math.floor(sizes.length / 2)];
    var minSize = sizes[0];
    var maxSize = sizes[sizes.length - 1];
    /* Compared against minSize, not medianSize: with a small sample, a
       title split across multiple items (a first name and last name as
       two separate text items, for instance) can itself dominate the
       item count and pull the median toward the large size rather than
       the body-text size, masking a real dominant title. minSize stays
       anchored to the smallest text on the page regardless of how many
       items share the large size. */
    var hasLargeTitle = maxSize >= minSize * 1.4 && maxSize >= 14;

    var rows = mergeWordRuns(clusterRows(items, 3), 'auto');
    var colXs = detectColumnBoundaries(rows, 8);
    /* Real table signal: does a SMALL set of X-positions get hit by a
       MEANINGFUL share of distinct rows, not just "this row happens to
       have more than one word"? A name like "Marco Torres" and a price
       row like "Widget    $12.99" both have 2+ items per row — the
       difference is that a real table column recurs at the same X
       across many different rows, while prose word-starts don't. */
    var rowsHittingCol = colXs.map(function (cx) {
      var count = 0;
      rows.forEach(function (row) {
        if (row.items.some(function (it) { return Math.abs(it.x - cx) <= 8; })) count++;
      });
      return count;
    });
    /* The leftmost column is almost always just the shared left margin —
       every left-aligned block of text has one, table or not, so on its
       own it's not evidence of a grid. Only count column 2 onward:
       finding via testing (the brief's own business-card example) that
       counting the margin column let a plain left-aligned card trip the
       table threshold. */
    var nonMarginHits = rowsHittingCol.slice(1);
    var realColumns = nonMarginHits.filter(function (c) { return rows.length && (c / rows.length) >= 0.3; }).length;
    /* Require a real minimum sample size before trusting a "recurring
       column" statistic — with only a handful of rows, 30% is just one
       or two rows, which coincidental alignment can satisfy by chance
       (found during testing: short, unrelated second-words on a business
       card landing within the clustering tolerance of each other). */
    var strongTable = realColumns >= 2 && colXs.length <= 12 && rows.length >= 6;
    var columnAlignmentScore = rows.length ? Math.max.apply(null, rowsHittingCol.concat([0])) / rows.length : 0;

    var totalChars = items.reduce(function (s, it) { return s + (it.text || '').length; }, 0);
    var avgLineLen = rows.length ? totalChars / rows.length : 0;
    var isVeryShort = n <= 30 && rows.length <= 14;

    /* Card-likelihood is checked first and on its own merits, not merely
       as a "table signal absent" fallback — a very short document with a
       dominant large title is distinctive enough that it shouldn't be
       overridden by a borderline/coincidental table signal, which is
       exactly the failure mode a small row count makes possible. */
    if (isVeryShort && hasLargeTitle) {
      reasons.push(n + ' text items total \u2014 a very short document.');
      reasons.push('A dominant large title/name (font size ' + Math.round(maxSize) + 'pt vs a ' + Math.round(medianSize) + 'pt median) suggests a name or heading, not a data grid.');
      if (realColumns === 0) reasons.push('No column position repeats across multiple rows.');
      var conf = (n <= 18 && maxSize >= minSize * 1.8 && !strongTable) ? 'high' : 'medium';
      return { type: 'card', confidence: conf, reasons: reasons };
    }
    if (strongTable) {
      reasons.push(realColumns + ' column position(s) each recur across at least 30% of rows.');
      reasons.push(colXs.length + ' distinct column positions detected overall.');
      var conf2 = columnAlignmentScore >= 0.7 ? 'high' : 'medium';
      return { type: 'table', confidence: conf2, reasons: reasons };
    }
    if (avgLineLen >= 45 && rows.length >= 6) {
      reasons.push('Long average line length (' + Math.round(avgLineLen) + ' characters) with no recurring column alignment \u2014 reads like continuous prose.');
      var conf3 = (avgLineLen >= 60 && realColumns === 0) ? 'high' : 'medium';
      return { type: 'report', confidence: conf3, reasons: reasons };
    }
    reasons.push('No single pattern (grid, short card, or long-form prose) dominated strongly enough to classify confidently.');
    return { type: 'mixed', confidence: 'low', reasons: reasons };
  }

  /* ── Paragraph-block grouping ──────────────────────────────────────
     The reconstruction path for 'card' and 'report' pages, and the
     direct fix for the exact bug the brief opens with: a name, handle,
     title line and quote getting torn across unrelated grid cells
     (A4/A5/A6/B6) because the table-grid path assumes everything is a
     table row. This instead groups consecutive rows into logical blocks
     — a new block starts on a real Y-gap (a paragraph/section break) or
     a real jump in font size (a new heading) — and emits ONE block per
     output row, with the full text joined and wrapped, rather than
     splitting it across columns it was never meant to occupy. */
  function groupIntoParagraphBlocks(rows, opts) {
    opts = opts || {};
    var gapMult = opts.gapMultiplier || 1.8;
    if (!rows.length) return [];
    var gaps = [];
    for (var i = 1; i < rows.length; i++) gaps.push(rows[i].yAvg - rows[i - 1].yAvg);
    var sorted = gaps.slice().sort(function (a, b) { return a - b; });
    var median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 14;
    var threshold = Math.max(median * gapMult, median + 6);

    var blocks = [];
    var current = { rows: [rows[0]], maxFontSize: maxRowFontSize(rows[0]) };
    for (var j = 1; j < rows.length; j++) {
      var prevSize = current.maxFontSize;
      var thisSize = maxRowFontSize(rows[j]);
      var bigGap = gaps[j - 1] > threshold;
      var fontJump = prevSize && thisSize && (thisSize / prevSize >= 1.35 || prevSize / thisSize >= 1.35);
      if (bigGap || fontJump) {
        blocks.push(current);
        current = { rows: [rows[j]], maxFontSize: thisSize };
      } else {
        current.rows.push(rows[j]);
        current.maxFontSize = Math.max(current.maxFontSize, thisSize);
      }
    }
    blocks.push(current);

    return blocks.map(function (b) {
      var lineTexts = b.rows.map(function (row) { return row.items.map(function (it) { return it.text; }).join(' '); });
      var anyBold = b.rows.some(function (row) { return row.items.some(function (it) { return it.bold; }); });
      var anyItalic = b.rows.some(function (row) { return row.items.some(function (it) { return it.italic; }); });
      return { text: lineTexts.join('\n'), lineCount: lineTexts.length, bold: anyBold, italic: anyItalic, fontSize: b.maxFontSize };
    });
  }
  function maxRowFontSize(row) {
    var m = 0;
    row.items.forEach(function (it) { if (it.maxFontSize) m = Math.max(m, it.maxFontSize); });
    return m;
  }

  /* ── Multi-column reading order ────────────────────────────────────
     Detects a real gap in the page's X-position histogram (e.g. a
     two-column brochure/report) and, when found, splits items into
     column groups so each column reads top-to-bottom on its own before
     moving to the next column — rather than naively sorting by Y alone,
     which would interleave two unrelated columns' sentences together.
     Only splits when the gap is genuinely wide (a real column gutter,
     not just uneven word spacing); a normal single-column page returns
     unchanged. */
  function detectReadingColumns(items, pageWidth) {
    if (!items.length || !pageWidth) return [items];
    var xs = items.map(function (it) { return it.x; }).sort(function (a, b) { return a - b; });
    var gutterMin = pageWidth * 0.06;
    var bestGap = 0, bestSplit = null;
    for (var i = 1; i < xs.length; i++) {
      var gap = xs[i] - xs[i - 1];
      if (gap > bestGap) { bestGap = gap; bestSplit = (xs[i] + xs[i - 1]) / 2; }
    }
    if (bestGap < gutterMin || bestSplit === null) return [items];
    var left = items.filter(function (it) { return it.x < bestSplit; });
    var right = items.filter(function (it) { return it.x >= bestSplit; });
    /* A genuine 2-column layout has multiple independent ROWS flowing on
       each side — not just 3+ items, which one wide line (a single row
       whose content happens to reach further right than usual) can
       satisfy on its own. Found via testing: a short business card with
       one long line was being split into fake "columns" this way,
       silently scrambling unrelated fields together on reconstruction. */
    var leftRowCount = countDistinctRows(left);
    var rightRowCount = countDistinctRows(right);
    /* 8, not 3 — found via testing that 3 is trivially satisfied by any
       left-aligned multi-word document (the shared margin plus a few
       varying second-word positions easily produces 3+ "rows" on each
       side of some split point, even with no real second column at
       all). Requiring 8 means a short document (a business card, at
       isVeryShort's <=14-row ceiling) structurally cannot trigger a
       split, while a genuinely long two-column page still can. */
    if (leftRowCount < 8 || rightRowCount < 8) return [items];
    return [left, right];
  }
  function countDistinctRows(items) {
    var ys = items.map(function (it) { return it.y; }).sort(function (a, b) { return a - b; });
    var count = 0, lastY = null;
    ys.forEach(function (y) { if (lastY === null || Math.abs(y - lastY) > 3) { count++; lastY = y; } });
    return count;
  }

  function blocksToGrid(blocks) {
    var grid = [], fmt = [];
    blocks.forEach(function (b) {
      grid.push([b.text]);
      fmt.push([{ bold: b.bold, italic: b.italic, maxFontSize: b.fontSize }]);
    });
    return { grid: grid, fmt: fmt, merges: [], columnCount: 1 };
  }

  /* ── Smart reconstruction: the actual "Smart Auto" / "Preserve Visual
     Layout" engine. Classifies the page, detects real multi-column
     layout, and routes each column to the strategy that actually fits
     it — table grid for table-like content, paragraph blocks (readable,
     unsplit sentences) for card/report/mixed content. Returns one
     {grid,fmt,merges} per detected column IN READING ORDER (left column
     fully, then right column), plus the classification actually used,
     so callers can show it to the user rather than hide the reasoning. */
  function reconstructSmart(items, pageWidth, opts) {
    opts = opts || {};
    var yTol = opts.yTolerance || 3, wordGap = opts.wordGap != null ? opts.wordGap : 'auto';
    var classification = classifyPage(items, pageWidth);
    var columnGroups = detectReadingColumns(items, pageWidth);
    var multiColumn = columnGroups.length > 1;
    var results = columnGroups.map(function (colItems) {
      var rows = mergeWordRuns(clusterRows(colItems, yTol), wordGap);
      if (classification.type === 'table') return tableFromRows(rows);
      var blocks = groupIntoParagraphBlocks(rows, opts);
      return blocksToGrid(blocks);
    });
    return { classification: classification, multiColumn: multiColumn, results: results };
  }

  function reconstructTable(items, opts) {
    opts = opts || {};
    var yTol = opts.yTolerance || 3;
    var xTol = opts.xTolerance || 8;
    var wordGap = opts.wordGap != null ? opts.wordGap : 3;
    if (!items.length) return { grid: [], fmt: [], merges: [] };
    var rows = clusterRows(items, yTol);
    rows = mergeWordRuns(rows, wordGap);
    var colXs = detectColumnBoundaries(rows, xTol);
    var built = buildGrid(rows, colXs);
    var grid = built.grid, fmt = built.fmt;
    var colCounts = {};
    grid.forEach(function (row) {
      var n = row.reduce(function (c, v) { return c + (v ? 1 : 0); }, 0);
      colCounts[n] = (colCounts[n] || 0) + 1;
    });
    var typical = 0, best = -1;
    Object.keys(colCounts).forEach(function (k) {
      if (colCounts[k] > best) { best = colCounts[k]; typical = +k; }
    });
    var merges = detectMergeRows(grid, typical);
    return { grid: grid, fmt: fmt, merges: merges, columnCount: colXs.length };
  }

  /* ── Multi-table-per-page detection ──────────────────────────────────
     reconstructTable (above) treats every item on a page as ONE table.
     That's wrong when a page genuinely has two independent tables with
     real vertical space between them — say, a summary table then a
     detail table below it. This detects those breaks and processes each
     block separately, so unrelated tables never get merged into one
     misaligned grid. Added as a NEW function, not a change to
     reconstructTable itself — existing callers are unaffected. */
  function splitRowsIntoBlocks(rows, gapMultiplier, minAbsoluteGap) {
    if (rows.length < 3) return [rows];
    var gaps = [];
    for (var i = 1; i < rows.length; i++) gaps.push(rows[i].yAvg - rows[i - 1].yAvg);
    var sorted = gaps.slice().sort(function (a, b) { return a - b; });
    var median = sorted[Math.floor(sorted.length / 2)] || 12;
    var threshold = Math.max(median * (gapMultiplier || 2.5), minAbsoluteGap || 24);
    var blocks = [], current = [rows[0]];
    for (var j = 1; j < rows.length; j++) {
      if (gaps[j - 1] > threshold) { blocks.push(current); current = []; }
      current.push(rows[j]);
    }
    blocks.push(current);
    return blocks;
  }

  /* Shared by both single- and multi-table paths: rows (already
     clustered + word-merged) -> {grid, fmt, merges, columnCount}. This
     is exactly what reconstructTable did inline; factored out so
     reconstructPageBlocks can call it once per detected table block
     without duplicating the column-detection/grid-build/merge-detect
     logic a second time. */
  function tableFromRows(rows) {
    var colXs = detectColumnBoundaries(rows, 8);
    var built = buildGrid(rows, colXs);
    var grid = built.grid, fmt = built.fmt;
    var colCounts = {};
    grid.forEach(function (row) {
      var n = row.reduce(function (c, v) { return c + (v ? 1 : 0); }, 0);
      colCounts[n] = (colCounts[n] || 0) + 1;
    });
    var typical = 0, best = -1;
    Object.keys(colCounts).forEach(function (k) { if (colCounts[k] > best) { best = colCounts[k]; typical = +k; } });
    var merges = detectMergeRows(grid, typical);
    return { grid: grid, fmt: fmt, merges: merges, columnCount: colXs.length };
  }

  function reconstructPageBlocks(items, opts) {
    opts = opts || {};
    var yTol = opts.yTolerance || 3;
    var wordGap = opts.wordGap != null ? opts.wordGap : 3;
    if (!items.length) return [];
    var rows = clusterRows(items, yTol);
    rows = mergeWordRuns(rows, wordGap);
    var blocks = splitRowsIntoBlocks(rows, opts.gapMultiplier, opts.minAbsoluteGap);
    return blocks.map(function (blockRows) { return tableFromRows(blockRows); });
  }

  /* ── pdf.js text items -> normalized {text,x,y,w,h,fontName,fontSize},
     top-down Y.

     IMPORTANT CORRECTION (found via a real test file, confirmed against
     pdf.js's own API docs and issue tracker): item.fontName is NOT the
     PDF's actual font name — pdf.js's own docs describe it as "Font name
     used by PDF.js for converted font", an internal alias like
     "g_d0_f1". Running isBoldFont() against that alias can never work;
     it was checking the wrong string. The real name has to come from
     page.commonObjs.get(item.fontName), resolved by the caller (pdf.js
     needs the page's font resources loaded first, which this pure
     engine file has no access to) and passed in as realFontNames — a
     plain {alias: realName} map. When no map is given, or an alias
     isn't in it, this now honestly falls back to no bold/italic
     detection for that run rather than silently checking an alias that
     was never going to match. */
  function fromPdfTextContent(textContent, viewportHeight, realFontNames) {
    return textContent.items
      .filter(function (it) { return it.str && it.str.trim(); })
      .map(function (it) {
        var tx = it.transform;
        var x = tx[4], yBottomUp = tx[5];
        var realName = (realFontNames && realFontNames[it.fontName]) || '';
        return {
          text: it.str, x: x, y: viewportHeight - yBottomUp,
          w: it.width || 0, h: it.height || Math.abs(tx[3]) || 10,
          fontName: realName, fontSize: Math.abs(tx[3]) || 10
        };
      });
  }

  /* ── Bold/italic from the PDF's own embedded font name ───────────────
     pdf.js exposes the font's internal PostScript-ish name (e.g.
     "g_d0_f1" is a subset alias, but the ORIGINAL family name — the one
     that actually says "Bold"/"Italic" — is available on many PDFs via
     this same field once pdf.js resolves it; when it isn't (some
     subsetted fonts genuinely don't expose a readable name), this simply
     returns false rather than guessing. Never invents a name PDF didn't
     provide. */
  function isBoldFont(fontName) {
    return /bold|black|heavy|semibold|extrabold/i.test(fontName || '');
  }
  function isItalicFont(fontName) {
    return /italic|oblique/i.test(fontName || '');
  }

  /* ── Tesseract word boxes -> the same normalized shape, converted from
     rendered-canvas pixel space back to page-point space using the same
     scale factor the canvas was rendered at. ── */
  function fromOcrWords(words, renderScale) {
    return (words || [])
      .filter(function (w) { return w.text && w.text.trim(); })
      .map(function (w) {
        var b = w.bbox;
        return {
          text: w.text, x: b.x0 / renderScale, y: b.y0 / renderScale,
          w: (b.x1 - b.x0) / renderScale, h: (b.y1 - b.y0) / renderScale
        };
      });
  }

  /* ── A page is "scanned" if it has effectively no extractable text.
     Threshold: fewer than 8 non-whitespace characters total is treated
     as noise (stray watermarks, page numbers) rather than real content. */
  function isScannedPage(textContent) {
    var total = 0;
    textContent.items.forEach(function (it) { total += (it.str || '').replace(/\s/g, '').length; });
    return total < 8;
  }

  /* ── Repeated header/footer detection across pages ───────────────────
     Real page furniture — a letterhead line, "Page 3 of 12" — repeats
     essentially verbatim at the same position (first or last row) on
     most pages of a multi-page document. Genuine table data almost
     never does that (different rows on every page). Requires at least
     3 pages and the text to repeat on a real majority, not just twice,
     to avoid flagging a genuinely repeated DATA value (e.g. the same
     company name heading every table) as furniture. Returns the exact
     text strings to exclude, not page/row indices — callers filter by
     matching text, which is robust even if page ordering changes. */
  function detectRepeatedFurniture(perPageFirstLast) {
    if (perPageFirstLast.length < 3) return { headers: [], footers: [] };
    function majorityRepeated(strs) {
      var counts = {};
      strs.forEach(function (s) { var k = (s || '').trim(); if (k) counts[k] = (counts[k] || 0) + 1; });
      var out = [];
      Object.keys(counts).forEach(function (k) { if (counts[k] >= Math.ceil(strs.length * 0.6)) out.push(k); });
      return out;
    }
    return {
      headers: majorityRepeated(perPageFirstLast.map(function (p) { return p.first; })),
      footers: majorityRepeated(perPageFirstLast.map(function (p) { return p.last; }))
    };
  }

  window.PdfToExcelEngine = {
    version: '3.0',
    clusterRows: clusterRows,
    mergeWordRuns: mergeWordRuns,
    detectColumnBoundaries: detectColumnBoundaries,
    buildGrid: buildGrid,
    classifyCell: classifyCell,
    detectMergeRows: detectMergeRows,
    reconstructTable: reconstructTable,
    reconstructPageBlocks: reconstructPageBlocks,
    splitRowsIntoBlocks: splitRowsIntoBlocks,
    detectRepeatedFurniture: detectRepeatedFurniture,
    isBoldFont: isBoldFont,
    isItalicFont: isItalicFont,
    fromPdfTextContent: fromPdfTextContent,
    fromOcrWords: fromOcrWords,
    isScannedPage: isScannedPage,
    classifyPage: classifyPage,
    groupIntoParagraphBlocks: groupIntoParagraphBlocks,
    detectReadingColumns: detectReadingColumns,
    reconstructSmart: reconstructSmart,
    blocksToGrid: blocksToGrid
  };
  try { console.log('[pdf-to-excel] engine v3.0 loaded'); } catch (e) {}
})();
