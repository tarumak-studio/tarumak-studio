/* ============================================================================
   Tarumak Studio — Hero Visual Engine  (vanilla, zero-dependency)
   ----------------------------------------------------------------------------
   USAGE (per tool page, between the <h1> block and the tool mount):
       <div class="hv" data-hero-slug="image-compressor"></div>
       <script src="/hero-visuals.js" defer></script>

   The build pipeline only needs to write the slug — everything else is
   resolved from HERO_MAP below, which is the single source of truth.

   Runtime: renders on init, pauses when off-screen, and respects
   prefers-reduced-motion by rendering the resolved end-state without motion.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     SINGLE SOURCE OF TRUTH — slug → hero config
     `verified:true`  = slug confirmed from the live site
     `verified:false` = tool exists but slug is inferred; confirm the exact
                        slug against data.js and adjust the KEY only.
     -------------------------------------------------------------------------- */
  var HERO_MAP = {
    /* ---- Image ---------------------------------------------------------- */
    "background-remover": { type: "comparison", verified: true },
    "image-compressor":   { type: "sizeReduction", from: "12.4 MB", to: "2.8 MB", saved: "−77%", verified: true },
    "image-resizer":      { type: "dimension", from: "4000 × 3000", to: "1200 × 900", verified: true },
    "image-cropper":      { type: "crop", verified: true },
    "blur-image":         { type: "blur", verified: false },
    "watermark-image":    { type: "watermark", text: "TARUMAK", verified: false },
    "palette-generator":  { type: "palette", verified: false },
    "image-to-text":      { type: "ocr", verified: false }, // OCR

    /* ---- Converters (direction verified via slug) ----------------------- */
    "jpg-to-png":  { type: "formatConvert", from: "JPG",  to: "PNG",  verified: true },
    "png-to-jpg":  { type: "formatConvert", from: "PNG",  to: "JPG",  note: "smaller", verified: true },
    "jpg-to-webp": { type: "formatConvert", from: "JPG",  to: "WebP", note: "−30%", verified: true },
    "webp-to-jpg": { type: "formatConvert", from: "WebP", to: "JPG",  verified: true },
    "heic-to-jpg": { type: "formatConvert", from: "HEIC", to: "JPG",  verified: true },
    "svg-to-png":  { type: "formatConvert", from: "SVG",  to: "PNG",  verified: true },
    "pdf-to-jpg":  { type: "formatConvert", from: "PDF",  to: "JPG",  verified: true },
    "word-to-pdf": { type: "formatConvert", from: "DOCX", to: "PDF",  verified: true },
    "txt-to-pdf":  { type: "formatConvert", from: "TXT",  to: "PDF",  verified: true },
    "html-to-pdf": { type: "formatConvert", from: "HTML", to: "PDF",  verified: true },
    "markdown-to-html": { type: "formatConvert", from: "MD", to: "HTML", verified: true },
    "gif-to-webp": { type: "formatConvert", from: "GIF",  to: "WebP", note: "−60%", verified: true },
    "webp-to-gif": { type: "formatConvert", from: "WebP", to: "GIF",  verified: true },
    "png-to-ico":  { type: "formatConvert", from: "PNG",  to: "ICO",  verified: false },
    "csv-to-json": { type: "formatConvert", from: "CSV",  to: "JSON", verified: false, alt: true },
    "json-to-csv": { type: "formatConvert", from: "JSON", to: "CSV",  verified: false, alt: true },

    /* ---- Workflow / assembly -------------------------------------------- */
    "favicon-generator": { type: "favicon", from: "PNG", to: "ICO", verified: true },
    "gif-maker":         { type: "assemble", mode: "gif", verified: true },
    "image-collage":     { type: "assemble", mode: "grid", verified: true },
    "merge-pdf":         { type: "mergeDocs", verified: false },
    "split-pdf":         { type: "splitDocs", verified: false },

    /* ---- PDF ------------------------------------------------------------ */
    "compress-pdf": { type: "sizeReduction", from: "8.6 MB", to: "2.1 MB", saved: "−76%", verified: false },
    "rotate-pdf":   { type: "rotate", verified: false },
    "pdf-reader":   { type: "pagePreview", verified: false },
    "unlock-pdf":   { type: "lock", dir: "open",  verified: false },
    "protect-pdf":  { type: "lock", dir: "close", verified: false },

    /* ---- Developer / data ----------------------------------------------- */
    "json-formatter": { type: "codeFormat", verified: true },
    "base64-encoder": { type: "encode", verified: true },
    "hash-generator": { type: "hash", verified: false },
    "regex-tester":   { type: "regex", verified: true },
    "color-converter":{ type: "colorChain", verified: true },
    "color-picker":   { type: "eyedropper", verified: true },

    /* ---- Marketing ------------------------------------------------------ */
    "qr-code-generator":  { type: "qr", verified: true },
    "utm-builder":        { type: "utm", verified: true },
    "meta-tag-generator": { type: "previewCard", kind: "meta", verified: false },
    "og-image-generator": { type: "previewCard", kind: "og", verified: false }
  };

  /* Human-readable family label shown in the corner caption */
  var CAPTION = {
    comparison: "Before <b>·</b> After",
    sizeReduction: "Size reduced",
    dimension: "Resized",
    formatConvert: "Converted",
    colorChain: "HEX <b>→</b> RGB <b>→</b> HSL",
    crop: "Cropped",
    blur: "Blur applied",
    watermark: "Watermarked",
    palette: "Palette extracted",
    eyedropper: "Color picked",
    codeFormat: "Formatted",
    encode: "Encoded",
    hash: "Hashed",
    regex: "Matches found",
    ocr: "Text extracted",
    mergeDocs: "Merged",
    splitDocs: "Split",
    assemble: "Assembled",
    rotate: "Rotated",
    pagePreview: "Preview",
    lock: "Secured",
    qr: "Generated",
    utm: "Link built",
    previewCard: "Preview built",
    favicon: "Icons generated"
  };

  /* small helpers */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  }); }
  function chip(name, sub, alt) {
    return '<div class="hv-chip' + (sub ? " is-to" : "") + '">' +
      '<span class="hv-chip__badge' + (alt ? " hv-chip__badge--alt" : "") + '">' + esc(name) + "</span>" +
      '<span class="hv-chip__meta"><span class="hv-chip__name">' + esc(name) + "</span>" +
      (sub ? '<span class="hv-chip__sub">' + esc(sub) + "</span>" : "") + "</span></div>";
  }
  function flow(vertical) {
    if (vertical) {
      return '<div class="hv-flow hv-flow--v"><svg viewBox="0 0 16 40" preserveAspectRatio="none">' +
        '<path class="hv-flow__track" d="M8 2 V34"/><path class="hv-flow__dash" d="M8 2 V34"/>' +
        '<path class="hv-flow__head" d="M8 40 L3 32 H13 Z"/></svg></div>';
    }
    return '<div class="hv-flow"><svg viewBox="0 0 74 16" preserveAspectRatio="none">' +
      '<path class="hv-flow__track" d="M2 8 H66"/><path class="hv-flow__dash" d="M2 8 H66"/>' +
      '<path class="hv-flow__head" d="M74 8 L64 3 V13 Z"/></svg></div>';
  }
  var photo = '<span class="hv-photo__sky"></span><span class="hv-photo__hill"></span>' +
              '<span class="hv-photo__hill2"></span><span class="hv-photo__sun"></span>';

  /* --------------------------------------------------------------------------
     RENDERERS — each returns { cls, html }
     -------------------------------------------------------------------------- */
  var R = {
    comparison: function () {
      return { cls: "hv--comparison", html:
        '<div class="hv-photo hv--comparison" style="width:132px;height:98px">' +
          '<div class="hv-cmp__cutout"></div>' +
          '<div class="hv-cmp__subject"></div>' +
          '<div class="hv-cmp__reveal"></div>' +
          '<div class="hv-cmp__wipe"></div>' +
          '<span class="hv-cmp__tag hv-cmp__tag--before">Original</span>' +
          '<span class="hv-cmp__tag hv-cmp__tag--after">Removed</span>' +
        "</div>" };
    },

    sizeReduction: function (c) {
      return { cls: "hv--size", html:
        '<div class="hv-size"><span class="hv-size__val">' + esc(c.from) + "</span>" +
          '<span class="hv-size__lbl">Original</span></div>' +
        flow(false) +
        '<div class="hv-size">' +
          '<span class="hv-size__val hv-size__val--to">' + esc(c.to) + "</span>" +
          '<div class="hv-bar"><div class="hv-bar__fill"></div></div>' +
          '<span class="hv-size__saved">' + esc(c.saved || "") + " saved</span>" +
        "</div>" };
    },

    dimension: function (c) {
      var p = String(c.from).split("×"), q = String(c.to).split("×");
      return { cls: "hv--dim", html:
        '<div class="hv-dim__dims"><div class="hv-size"><span class="hv-size__val">' + esc(p[0]) +
          '</span><span class="hv-size__lbl">width px</span></div></div>' +
        '<div class="hv-dim__frame"><div class="hv-dim__canvas">' + photo +
          '<span class="hv-dim__handle hv-dim__handle--tl"></span><span class="hv-dim__handle hv-dim__handle--tr"></span>' +
          '<span class="hv-dim__handle hv-dim__handle--bl"></span><span class="hv-dim__handle hv-dim__handle--br"></span>' +
        "</div></div>" +
        '<div class="hv-dim__dims"><div class="hv-size"><span class="hv-size__val hv-size__val--to">' + esc(q[0]) +
          '</span><span class="hv-size__lbl">width px</span></div></div>' };
    },

    formatConvert: function (c) {
      return { cls: "hv--format", html:
        ftile(c.from) +
        '<div class="hv-morph">' + flow(false) + '<span class="hv-morph__spark"></span></div>' +
        ftile(c.to, c.note, c.alt) };
    },

    colorChain: function () {
      function node(color, code, lbl) {
        return '<div class="hv-cnode"><span class="hv-swatch" style="background:' + color + '"></span>' +
          '<span class="hv-cnode__code">' + esc(code) + "</span>" +
          '<span class="hv-cnode__lbl">' + esc(lbl) + "</span></div>";
      }
      return { cls: "hv--cchain", html:
        '<div class="hv-cchain">' + node("#5b8cff", "#5B8CFF", "HEX") +
        flow(false) + node("#5b8cff", "91,140,255", "RGB") +
        flow(false) + node("#5b8cff", "222 100 65", "HSL") + "</div>" };
    },

    crop: function () {
      return { cls: "hv--crop", html:
        '<div class="hv-crop">' + '<div class="hv-crop__frame"></div>' +
        '<div class="hv-crop__ok">' + check() + "</div></div>" };
    },

    blur: function () {
      return { cls: "hv--blur", html:
        '<div class="hv-blur__img hv-photo" style="width:150px;height:96px">' + photo + "</div>" };
    },

    watermark: function (c) {
      return { cls: "hv--wm", html:
        '<div class="hv-wm hv-photo" style="width:150px;height:96px">' + photo +
        '<span class="hv-wm__mark">' + esc(c.text || "TARUMAK") + "</span></div>" };
    },

    palette: function () {
      var cols = ["#e8734a", "#f2b45c", "#7b57d8", "#3bb6a6"];
      var sw = cols.map(function (c) { return '<span class="hv-pal__sw" style="background:' + c + '"></span>'; }).join("");
      return { cls: "hv--pal", html:
        '<div class="hv-pal"><div class="hv-pal__strip"></div>' +
        '<div class="hv-pal__swatches">' + sw + "</div></div>" };
    },

    eyedropper: function () {
      return { cls: "hv--eye", html:
        '<div class="hv-eye"><span class="hv-eye__drop">' +
          '<svg width="26" height="26" viewBox="0 0 26 26">' +
            '<path d="M17.5 3.2a3 3 0 0 1 4.3 4.2l-7.1 7.1-1.4 3.4-2.8-2.8 3.4-1.4 7.1-7.1" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>' +
            '<path d="M13.3 12.7 5.4 20.6a2 2 0 0 0 0 2.8h0a2 2 0 0 0 2.8 0l7.9-7.9" fill="#0d1420" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>' +
            '<circle cx="9" cy="19" r="1.6" fill="var(--hv-accent)"/>' +
          "</svg></span>" +
        '<span class="hv-eye__read">#7B57D8</span></div>' };
    },

    codeFormat: function () {
      return { cls: "hv--code", html:
        '<div class="hv-code"><div class="hv-code__bar"><span class="hv-code__dot"></span>' +
          '<span class="hv-code__dot"></span><span class="hv-code__dot"></span></div>' +
        '<div class="hv-code__body">' +
          '<div class="hv-code__messy"><div class="hv-code__row">{<span class="k">"id"</span>:7,<span class="k">"ok"</span>:true}</div></div>' +
          '<div class="hv-code__clean">' +
            '<div class="hv-code__row">{</div>' +
            '<div class="hv-code__row">  <span class="k">"id"</span>: <span class="v">7</span>,</div>' +
            '<div class="hv-code__row">  <span class="k">"ok"</span>: <span class="v">true</span></div>' +
            '<div class="hv-code__row">}</div>' +
          "</div>" +
        "</div></div>" };
    },

    encode: function () {
      return { cls: "hv--code", html:
        '<div class="hv-code"><div class="hv-code__bar"><span class="hv-code__dot"></span>' +
          '<span class="hv-code__dot"></span><span class="hv-code__dot"></span></div>' +
        '<div class="hv-code__body">' +
          '<div class="hv-code__row" style="color:var(--hv-ink)">Tarumak</div>' +
          flow(true) +
          '<div class="hv-code__row hv-type" style="color:var(--hv-accent-2)">' +
            typed("VGFydW1haw==") + "</div>" +
        "</div></div>" };
    },

    hash: function () {
      return { cls: "hv--code", html:
        '<div class="hv-code"><div class="hv-code__bar"><span class="hv-code__dot"></span>' +
          '<span class="hv-code__dot"></span><span class="hv-code__dot"></span></div>' +
        '<div class="hv-code__body">' +
          '<div class="hv-code__row" style="color:var(--hv-ink)">tarumak · SHA-256</div>' +
          '<div class="hv-code__row hv-type" style="color:var(--hv-accent);word-break:break-all;white-space:normal">' +
            typed("9f2c1e7a4b8d0c63") + "</div>" +
        "</div></div>" };
    },

    regex: function () {
      return { cls: "hv--code", html:
        '<div class="hv-code"><div class="hv-code__bar"><span class="hv-code__dot"></span>' +
          '<span class="hv-code__dot"></span><span class="hv-code__dot"></span></div>' +
        '<div class="hv-code__body hv-rx"><div class="hv-code__row" style="color:var(--hv-muted);white-space:normal">' +
          'ping <mark>tarumak</mark>, ship <mark>tarumak</mark>, love <mark>tarumak</mark></div>' +
          '<div class="hv-code__row" style="color:var(--hv-accent-2);margin-top:8px">/tarumak/g → 3 matches</div>' +
        "</div></div>" };
    },

    ocr: function () {
      return { cls: "hv--ocr", html:
        '<div class="hv-ocr"><div class="hv-ocr__txt"><i></i><i style="width:80%"></i><i style="width:60%"></i>' +
        '<i style="width:88%"></i><i style="width:45%"></i></div><div class="hv-ocr__scan"></div></div>' };
    },

    mergeDocs: function () {
      return { cls: "hv--merge", html:
        '<div class="hv-merge">' + doc("m-a") + doc("m-b") + doc("m-c") + "</div>" };
    },
    splitDocs: function () {
      return { cls: "hv--split", html:
        '<div class="hv-split">' + doc("s-src") + doc("s-a") + doc("s-b") + doc("s-c") + "</div>" };
    },

    assemble: function (c) {
      if (c.mode === "gif") {
        return { cls: "hv--film", html:
          '<div class="hv-film">' +
            '<span class="hv-film__frame f1"></span><span class="hv-film__frame f2"></span>' +
            '<span class="hv-film__frame f3"></span><span class="hv-film__frame f4"></span>' +
            '<span class="hv-film__play">' +
              '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M6 4 L16 10 L6 16 Z" fill="#0d1420"/></svg>' +
            '</span>' +
          "</div>" };
      }
      return { cls: "hv--assemble", html:
        '<div class="hv-grid"><span class="hv-grid__cell"></span><span class="hv-grid__cell"></span>' +
        '<span class="hv-grid__cell"></span><span class="hv-grid__cell"></span></div>' };
    },

    rotate: function () {
      return { cls: "hv--rotate", html: doc("", "width:70px;height:88px") };
    },

    pagePreview: function () {
      return { cls: "hv--pages", html:
        '<div class="hv-pages">' + doc("p3") + doc("p2") + doc("p1") + "</div>" };
    },

    lock: function (c) {
      var open = c.dir === "open";
      return { cls: "hv--lock", html:
        '<div class="hv-lock ' + (open ? "hv-lock--open" : "hv-lock--close") + '">' +
        '<svg viewBox="0 0 88 88">' +
          '<path class="hv-lock__shackle" d="M28 44 V30 a16 16 0 0 1 32 0 V44"/>' +
          '<rect class="hv-lock__body" x="22" y="42" width="44" height="34" rx="7"/>' +
        "</svg></div>" };
    },

    qr: function () {
      var cells = "";
      // deterministic pseudo-QR pattern (49 cells)
      var pat = "1101011 1001101 1110010 0101110 1011001 0110101 1010111";
      pat.replace(/ /g, "").split("").forEach(function (b, i) {
        cells += '<i style="' + (b === "1" ? "" : "background:transparent;") +
          "animation-delay:" + (i * 0.02).toFixed(2) + 's"></i>';
      });
      return { cls: "hv--qr", html: '<div class="hv-qr">' + cells + "</div>" };
    },

    utm: function () {
      return { cls: "hv--utm", html:
        '<div class="hv-utm"><span class="hv-utm__base">tarumak.studio/?</span>' +
        '<span class="hv-utm__p">utm_source=news</span>' +
        '<span class="hv-utm__p">&amp;utm_medium=email</span>' +
        '<span class="hv-utm__p">&amp;utm_campaign=launch</span></div>' };
    },

    previewCard: function () {
      return { cls: "hv--card", html:
        '<div class="hv-card"><div class="hv-card__img"></div>' +
        '<div class="hv-card__body"><div class="hv-card__t"></div><div class="hv-card__d"></div></div></div>' };
    },

    favicon: function (c) {
      return { cls: "hv--fav", html:
        '<div class="hv-fav"><div class="hv-fav__src">' + esc(String(c.from).charAt(0)) + "</div>" +
        flow(false) +
        '<div class="hv-fav__out"><span class="hv-fav__ic i1"></span><span class="hv-fav__ic i2"></span>' +
        '<span class="hv-fav__ic i3"></span><span class="hv-fav__ic i4"></span></div></div>' };
    }
  };

  function ftile(fmt, sub, alt) {
    return '<div class="hv-ftile' + (alt ? " is-alt" : "") + '">' +
      '<span class="hv-ftile__doc">' +
        '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 1 h14 l6 6 v22 a1 1 0 0 1-1 1 H3 a1 1 0 0 1-1-1 V2 a1 1 0 0 1 1-1 Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 1 v6 h6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
      "</span>" +
      '<span class="hv-ftile__fmt">' + esc(fmt) + "</span>" +
      (sub ? '<span class="hv-ftile__sub">' + esc(sub) + "</span>" : "") +
      "</div>";
  }
  function check() {
    return '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6 L5 9 L10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function doc(cls, style) {
    return '<div class="hv-doc ' + (cls || "") + '"' + (style ? ' style="' + style + '"' : "") + '>' +
      '<span class="hv-doc__line"></span><span class="hv-doc__line"></span>' +
      '<span class="hv-doc__line"></span><span class="hv-doc__line"></span>' +
      '<span class="hv-doc__tag">PDF</span></div>';
  }
  function typed(str) {
    return str.split("").map(function (ch, i) {
      return '<span style="animation-delay:' + (i * 0.06).toFixed(2) + 's">' + esc(ch) + "</span>";
    }).join("");
  }

  /* --------------------------------------------------------------------------
     RUNTIME
     -------------------------------------------------------------------------- */
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render(host) {
    var slug = host.getAttribute("data-hero-slug");
    var cfg = HERO_MAP[slug];
    if (!cfg) { host.setAttribute("data-hero-missing", "1"); return; }
    var fn = R[cfg.type];
    if (!fn) return;

    var out = fn(cfg);
    host.className = "hv " + out.cls + (REDUCED ? " hv--still" : "");
    var cap = CAPTION[cfg.type] || "";
    host.innerHTML =
      '<div class="hv__stage">' + out.html + "</div>" +
      (cap ? '<span class="hv__caption">' + cap + "</span>" : "");
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", host.getAttribute("data-hero-label") || (cap.replace(/<[^>]+>/g, "") + " preview"));
  }

  var io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle("hv-paused", !e.isIntersecting);
        });
      }, { rootMargin: "120px" })
    : null;

  function init(root) {
    (root || document).querySelectorAll(".hv[data-hero-slug], [data-hero-slug]").forEach(function (host) {
      if (host.__hvDone) return;
      host.__hvDone = true;
      if (!host.classList.contains("hv")) host.classList.add("hv");
      render(host);
      if (io) io.observe(host);
    });
  }

  // Expose for build-time / manual use
  window.TarumakHero = { init: init, map: HERO_MAP, render: render };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(document); });
  } else {
    init(document);
  }
})();
