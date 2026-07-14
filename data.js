/* TARUMAK STUDIO — data.js
   TOOLS array, categories, icons, INIT/FEAT/FAQ registries.
   INIT is populated by tool files loaded after this. */

const CAT={image:'Image Tools',pdf:'PDF Tools',converter:'Converter Tools',marketing:'Marketing Designer',developer:'Developer & SEO'};

  /* ──────────────────────────────────────────────────
     CAT_META — category metadata for the new homepage
     category cards. Description shown under the title;
     popular: 3-4 hand-picked tool slugs shown as chips.
  ────────────────────────────────────────────────── */
  const CAT_META={
    /* popular[] slugs are verified against the real TOOLS array by
       header-chrome.js at build time (throws if one doesn't resolve) —
       this caught 5 stale slugs here (merge-pdf, split-pdf, compress-pdf,
       og-image-generator, color-palette) that had been silently vanishing
       from the live nav dropdown for who knows how long, since the old
       bake logic just skipped anything it couldn't find. Fixed to the
       real slugs. The first TWO entries in each popular[] are treated as
       the "starred" picks in the mega menu — order here is meaningful.

       blurbs: a short (~7-9 word) one-liner per popular[] slug for the
       mega-menu row, kept separate from each tool's longer marketing
       description (TOOLS[..][3]) which is too long next to an icon.

       thumbs: a tiny (28x20) representative SVG per popular[] slug —
       real per-tool visual recognition, not another category-level icon.
       Kept intentionally simple line art (matching the site's existing
       icon language) so 20 of these cost nothing in bundle size or
       render time.

       highlight: the small callout card at the foot of each category's
       preview. Only 'image' uses type:'new' — the 3 AI tools were
       genuinely just added. dateAdded (ISO) makes that claim
       self-expiring: header-chrome.js checks it against the build date
       at build time and only shows the NEW badge within ~90 days,
       falling back to 'pick' automatically afterward — no one has to
       remember to remove a stale "new" claim by hand. The other four
       categories use type:'pick' ("Editor's Pick"), a curatorial
       statement rather than an unverifiable usage claim — this site has
       no real analytics yet (see the AI-Powered tab reasoning below), so
       a "Most Popular" badge here would be exactly the fabricated-numbers
       problem that reasoning already warns against.

       illustration: small inline SVG, animated via CSS classes in
       mega-menu.css (transform/opacity only, gated behind
       prefers-reduced-motion: no-preference). */
    image:{
      tagline:'Compress, resize, crop and optimize images instantly.',
      desc:'Compress, resize, remove backgrounds and optimize images.',
      popular:['ai-object-remover','ai-photo-enhancer','ai-image-upscaler','background-remover'],
      placeholders:['Remove background…','Upscale image…','Compress JPG…','Resize PNG…'],
      blurbs:{
        'ai-object-remover':'Paint over anything to erase it cleanly.',
        'ai-photo-enhancer':'Auto-fix exposure, color and noise in one tap.',
        'ai-image-upscaler':'Enlarge photos 2\u00d7 or 4\u00d7, edges still crisp.',
        'background-remover':'Erase any background in a single click.'
      },
      thumbs:{
        'ai-object-remover':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="16" rx="2" stroke="currentColor" stroke-width="1.6" opacity=".5"/><circle cx="14" cy="10" r="5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 2.2" opacity=".9"/></svg>',
        'ai-photo-enhancer':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="16" rx="2" fill="currentColor" opacity=".18"/><rect x="14" y="2" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.6" opacity=".9"/><circle cx="20" cy="7" r="2.3" stroke="currentColor" stroke-width="1.4" opacity=".9"/></svg>',
        'ai-image-upscaler':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="6" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6" opacity=".55"/><rect x="13" y="2" width="13" height="16" rx="2" stroke="currentColor" stroke-width="1.6" opacity=".9"/><path d="M10 10h3m0 0-1.6-1.6M13 10l-1.6 1.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></svg>',
        'background-remover':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.6 1.6" opacity=".45"/><circle cx="8" cy="10" r="4.4" fill="currentColor" opacity=".22"/><rect x="14" y="2" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.6" opacity=".9"/><circle cx="20" cy="10" r="4.4" fill="currentColor" opacity=".8"/></svg>'
      },
      highlight:{type:'new',slug:'ai-object-remover',label:'Recently Added',dateAdded:'2026-06-15'},
      illustration:'<svg class="mega-illo" viewBox="0 0 160 100" fill="none" aria-hidden="true">'
        +'<rect class="illo-float illo-d1" x="20" y="34" width="52" height="40" rx="7" fill="currentColor" opacity=".12"/>'
        +'<rect class="illo-float illo-d2" x="42" y="24" width="52" height="40" rx="7" fill="currentColor" opacity=".18" transform="rotate(-6 68 44)"/>'
        +'<rect class="illo-float illo-d3" x="64" y="30" width="52" height="40" rx="7" stroke="currentColor" stroke-width="2" opacity=".55"/>'
        +'<circle class="illo-float illo-d3" cx="80" cy="46" r="6" stroke="currentColor" stroke-width="2" opacity=".7"/>'
        +'<path class="illo-sparkle" d="M132 20l3.2 8.8L144 32l-8.8 3.2L132 44l-3.2-8.8L120 32l8.8-3.2z" fill="currentColor"/>'
        +'</svg>'
    },
    pdf:{
      tagline:'Merge, split, rotate and convert PDFs — fully in-browser.',
      desc:'Merge, split, compress and convert PDFs, no upload required.',
      popular:['pdf-merger','pdf-compressor','pdf-splitter','pdf-to-jpg'],
      placeholders:['Merge PDFs…','Split PDF…','Compress PDF…','Convert PDF…'],
      blurbs:{
        'pdf-merger':'Combine any number of PDFs into one file.',
        'pdf-compressor':'Shrink PDF size without losing readability.',
        'pdf-splitter':'Pull pages out or split into separate files.',
        'pdf-to-jpg':'Turn each PDF page into a sharp JPG image.'
      },
      thumbs:{
        'pdf-merger':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="1" y="1" width="10" height="13" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".5"/><rect x="1" y="6" width="10" height="13" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".85"/><path d="M13 10h6m0 0-2.2-2.2M19 10l-2.2 2.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/><rect x="20" y="3" width="7" height="14" rx="1.6" stroke="currentColor" stroke-width="1.6" opacity=".9"/></svg>',
        'pdf-compressor':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="8" y="1" width="12" height="16" rx="1.8" stroke="currentColor" stroke-width="1.6" opacity=".9"/><path d="M14 6v5m0 0-2-2m2 2 2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/><path d="M10 15h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></svg>',
        'pdf-splitter':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="4" y="1" width="9" height="16" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".9"/><rect x="15" y="1" width="9" height="16" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".55"/><line x1="14" y1="1" x2="14" y2="17" stroke="currentColor" stroke-width="1.3" stroke-dasharray="1.8 1.8" opacity=".7"/></svg>',
        'pdf-to-jpg':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="1" y="2" width="11" height="15" rx="1.6" stroke="currentColor" stroke-width="1.6" opacity=".9"/><path d="M14 9h6m0 0-2-2m2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/><rect x="21" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4" opacity=".9"/><circle cx="23" cy="5" r=".8" fill="currentColor"/></svg>'
      },
      highlight:{type:'pick',slug:'pdf-merger',label:'Editor\u2019s Pick'},
      illustration:'<svg class="mega-illo" viewBox="0 0 160 100" fill="none" aria-hidden="true">'
        +'<rect class="illo-float illo-d1" x="34" y="40" width="46" height="56" rx="5" fill="currentColor" opacity=".12"/>'
        +'<rect class="illo-float illo-d2" x="46" y="30" width="46" height="56" rx="5" fill="currentColor" opacity=".2"/>'
        +'<rect class="illo-float illo-d3" x="58" y="20" width="46" height="56" rx="5" stroke="currentColor" stroke-width="2" opacity=".6"/>'
        +'<path class="illo-float illo-d3" d="M90 20v14h14z" fill="currentColor" opacity=".35"/>'
        +'<line class="illo-float illo-d3" x1="66" y1="42" x2="94" y2="42" stroke="currentColor" stroke-width="2" opacity=".4"/>'
        +'<line class="illo-float illo-d3" x1="66" y1="52" x2="94" y2="52" stroke="currentColor" stroke-width="2" opacity=".4"/>'
        +'</svg>'
    },
    developer:{
      tagline:'JSON, Regex, Base64, color and SEO utilities for builders.',
      desc:'JSON, Regex, Base64 and color utilities built for developers.',
      popular:['json-formatter','regex-tester','color-converter','base64-encoder'],
      placeholders:['Beautify JSON…','Test Regex…','Encode Base64…'],
      blurbs:{
        'json-formatter':'Format, validate and beautify JSON instantly.',
        'regex-tester':'Test patterns with live match highlighting.',
        'color-converter':'Convert HEX, RGB and HSL in one place.',
        'base64-encoder':'Encode or decode Base64 text and files.'
      },
      thumbs:{
        'json-formatter':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><path d="M11 3c-2.5 0-3 1.3-3 3.5S7.5 10 5 10c2.5 0 3 1.3 3 3.5S8 17 11 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" opacity=".85"/><path d="M17 3c2.5 0 3 1.3 3 3.5S19.5 10 22 10c-2.5 0-3 1.3-3 3.5S18 17 17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" opacity=".85"/></svg>',
        'regex-tester':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><path d="M4 17 12 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" opacity=".7"/><circle cx="17" cy="6" r="1.6" fill="currentColor" opacity=".85"/><path d="M20 10h4M20 14h4M20 6h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".55"/></svg>',
        'color-converter':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><circle cx="9" cy="10" r="6.5" fill="currentColor" opacity=".28"/><circle cx="15" cy="7" r="6.5" fill="currentColor" opacity=".4"/><circle cx="15" cy="13" r="6.5" fill="currentColor" opacity=".55"/></svg>',
        'base64-encoder':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="4" width="8" height="12" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".85"/><path d="M12 10h4m0 0-1.8-1.8M16 10l-1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/><rect x="18" y="4" width="8" height="12" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".5"/></svg>'
      },
      highlight:{type:'pick',slug:'json-formatter',label:'Editor\u2019s Pick'},
      illustration:'<svg class="mega-illo" viewBox="0 0 160 100" fill="none" aria-hidden="true">'
        +'<path class="illo-float illo-d1" d="M46 26c-8 0-10 4-10 12s-2 12 -10 12c8 0 10 4 10 12s2 12 10 12" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".55"/>'
        +'<path class="illo-float illo-d2" d="M114 26c8 0 10 4 10 12s2 12 10 12c-8 0-10 4-10 12s-2 12-10 12" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".55"/>'
        +'<rect class="illo-cursor" x="77" y="38" width="4" height="24" fill="currentColor"/>'
        +'<rect class="illo-float illo-d3" x="56" y="70" width="18" height="9" rx="3" fill="currentColor" opacity=".2"/>'
        +'<rect class="illo-float illo-d1" x="86" y="70" width="18" height="9" rx="3" fill="currentColor" opacity=".2"/>'
        +'</svg>'
    },
    marketing:{
      tagline:'UTM builders, OG images, CTAs and campaign tools.',
      desc:'UTM links, OG images and CTAs for marketers and creators.',
      popular:['utm-builder','og-image-gen','qr-code-generator','color-palette-gen'],
      placeholders:['Create QR code…','Generate Open Graph image…','Build a UTM link…'],
      blurbs:{
        'utm-builder':'Build trackable campaign links in seconds.',
        'og-image-gen':'Create social preview images that get clicks.',
        'qr-code-generator':'Generate a scannable QR code for any link.',
        'color-palette-gen':'Extract or build a matching color palette.'
      },
      thumbs:{
        'utm-builder':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="7" width="10" height="6" rx="3" stroke="currentColor" stroke-width="1.6" opacity=".85" transform="rotate(-20 7 10)"/><rect x="16" y="7" width="10" height="6" rx="3" stroke="currentColor" stroke-width="1.6" opacity=".6" transform="rotate(-20 21 10)"/></svg>',
        'og-image-gen':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="16" rx="2" stroke="currentColor" stroke-width="1.6" opacity=".85"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4" opacity=".8"/><path d="M2 15l6-5 5 4 4-3 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/></svg>',
        'qr-code-generator':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="3" y="2" width="5" height="5" fill="currentColor" opacity=".85"/><rect x="20" y="2" width="5" height="5" fill="currentColor" opacity=".85"/><rect x="3" y="13" width="5" height="5" fill="currentColor" opacity=".85"/><rect x="11" y="2" width="2" height="2" fill="currentColor" opacity=".55"/><rect x="15" y="5" width="2" height="2" fill="currentColor" opacity=".55"/><rect x="11" y="9" width="2" height="2" fill="currentColor" opacity=".55"/><rect x="15" y="13" width="2" height="2" fill="currentColor" opacity=".55"/><rect x="20" y="13" width="5" height="5" fill="currentColor" opacity=".5"/></svg>',
        'color-palette-gen':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><circle cx="5" cy="10" r="4" fill="currentColor" opacity=".3"/><circle cx="12" cy="10" r="4" fill="currentColor" opacity=".48"/><circle cx="19" cy="10" r="4" fill="currentColor" opacity=".66"/><circle cx="26" cy="10" r="4" fill="currentColor" opacity=".85"/></svg>'
      },
      highlight:{type:'pick',slug:'og-image-gen',label:'Editor\u2019s Pick'},
      illustration:'<svg class="mega-illo" viewBox="0 0 160 100" fill="none" aria-hidden="true">'
        +'<rect class="illo-float illo-d1" x="24" y="24" width="60" height="56" rx="10" stroke="currentColor" stroke-width="2" opacity=".55"/>'
        +'<circle class="illo-float illo-d1" cx="38" cy="38" r="6" fill="currentColor" opacity=".3"/>'
        +'<line class="illo-float illo-d1" x1="50" y1="35" x2="74" y2="35" stroke="currentColor" stroke-width="2" opacity=".35"/>'
        +'<line class="illo-float illo-d1" x1="50" y1="42" x2="68" y2="42" stroke="currentColor" stroke-width="2" opacity=".35"/>'
        +'<path class="illo-heart" d="M38 60c-8-5-12-14-6-19 3-2.6 7-2 9 1 2-3 6-3.6 9-1 6 5 2 14-6 19-2 1.3-4 1.3-6 0z" fill="currentColor" opacity=".5"/>'
        +'<rect class="illo-bar illo-b1" x="98" y="52" width="10" height="28" rx="2" fill="currentColor" opacity=".3"/>'
        +'<rect class="illo-bar illo-b2" x="114" y="38" width="10" height="42" rx="2" fill="currentColor" opacity=".45"/>'
        +'<rect class="illo-bar illo-b3" x="130" y="22" width="10" height="58" rx="2" fill="currentColor" opacity=".6"/>'
        +'</svg>'
    },
    converter:{
      tagline:'Convert between popular image, document and text formats.',
      desc:'Convert between image, document and text formats instantly.',
      popular:['word-to-pdf','markdown-to-html','png-to-svg','png-to-jpg'],
      placeholders:['PNG to JPG…','Word to PDF…','Markdown to HTML…'],
      blurbs:{
        'word-to-pdf':'Turn a Word doc into a shareable PDF.',
        'markdown-to-html':'Convert Markdown into clean, ready HTML.',
        'png-to-svg':'Trace a PNG into a scalable vector file.',
        'png-to-jpg':'Convert PNG to JPG to save file size.'
      },
      thumbs:{
        'word-to-pdf':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="1" y="2" width="10" height="15" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".85"/><text x="2.6" y="12" font-size="6.5" font-weight="700" fill="currentColor" opacity=".9">W</text><path d="M13 9h5m0 0-1.8-1.8M18 9l-1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/><rect x="19" y="2" width="8" height="15" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".55"/></svg>',
        'markdown-to-html':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><text x="1" y="13" font-size="8" font-weight="700" fill="currentColor" opacity=".85">M\u2193</text><path d="M14 10h5m0 0-1.8-1.8M19 10l-1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/><text x="20" y="13" font-size="7" font-weight="700" fill="currentColor" opacity=".6">&lt;/&gt;</text></svg>',
        'png-to-svg':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="1" y="4" width="2.4" height="2.4" fill="currentColor" opacity=".7"/><rect x="4" y="4" width="2.4" height="2.4" fill="currentColor" opacity=".7"/><rect x="1" y="7" width="2.4" height="2.4" fill="currentColor" opacity=".7"/><rect x="4" y="7" width="2.4" height="2.4" fill="currentColor" opacity=".7"/><path d="M10 10h5m0 0-1.8-1.8M15 10l-1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/><path d="M18 15c2-8 5-11 8-11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".85"/></svg>',
        'png-to-jpg':'<svg viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="2" y="3" width="11" height="11" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".85"/><rect x="15" y="6" width="11" height="11" rx="1.6" stroke="currentColor" stroke-width="1.5" opacity=".5"/></svg>'
      },
      highlight:{type:'pick',slug:'word-to-pdf',label:'Editor\u2019s Pick'},
      illustration:'<svg class="mega-illo" viewBox="0 0 160 100" fill="none" aria-hidden="true">'
        +'<rect class="illo-float illo-d1" x="18" y="26" width="42" height="52" rx="6" stroke="currentColor" stroke-width="2" opacity=".55"/>'
        +'<line x1="26" y1="40" x2="52" y2="40" stroke="currentColor" stroke-width="2" opacity=".35"/>'
        +'<line x1="26" y1="50" x2="52" y2="50" stroke="currentColor" stroke-width="2" opacity=".35"/>'
        +'<line x1="26" y1="60" x2="44" y2="60" stroke="currentColor" stroke-width="2" opacity=".35"/>'
        +'<path class="illo-arrow" d="M68 52h30m0 0-8-8m8 8-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>'
        +'<rect class="illo-float illo-d2" x="100" y="22" width="42" height="52" rx="14" fill="currentColor" opacity=".14"/>'
        +'<rect class="illo-float illo-d2" x="100" y="22" width="42" height="52" rx="14" stroke="currentColor" stroke-width="2" opacity=".5"/>'
        +'</svg>'
    }
  }


  /* ──────────────────────────────────────────────────
     FEATURED — flagship tools shown in the homepage
     "Featured Tools" section. Curated, not automatic —
     update slugs here as priorities shift. hook is a
     short, punchy line distinct from the tool's normal
     card description (used only in the featured section).
  ────────────────────────────────────────────────── */
  /* Single source of truth for "our AI-branded tools" — read by
     header-chrome.js at build time (mega menu's AI Tools tab) AND by
     app.js at runtime (homepage AI Studio section), so adding a 5th AI
     tool later means changing this one array, not two separate
     hardcoded copies that could drift apart. */
  const AI_STUDIO_SLUGS=['background-remover','ai-object-remover','ai-photo-enhancer','ai-image-upscaler'];

  const FEATURED=[
    {slug:'background-remover',  hook:'Erase any background in one click — no design skill needed.'},
    {slug:'ai-object-remover',   hook:'Paint over anything you want gone — it vanishes, seamlessly.'},
    {slug:'ai-photo-enhancer',   hook:'Auto-fix exposure, color and noise in one click — no editing skill needed.'},
    {slug:'ai-image-upscaler',   hook:'Enlarge any photo 2\u00d7 or 4\u00d7 while keeping edges crisp and clean.'},
    {slug:'pdf-merger',          hook:'Combine any number of PDFs into one file, in seconds.'},
    {slug:'word-to-pdf',         hook:'Turn any Word doc into a clean, shareable PDF in seconds.'},
    {slug:'ocr-image-to-text',   hook:'Pull text out of any screenshot, scan or photo instantly.'},
    {slug:'image-compressor',    hook:'Shrink image file size by up to 80% with zero visible quality loss.'}
  ];
const ICON={image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',converter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>',marketing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',developer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'};

/* build a standard dropzone panel; returns refs */
function dz(panel,o){o=o||{};
  panel.innerHTML='<div class="drop '+(o.pdf?'pdf':'')+'" id="d_drop"><input type="file" id="d_file" accept="'+(o.accept||'*/*')+'" '+(o.multiple?'multiple':'')+' hidden>'+
    '<div class="di">'+UP+'</div><h3>'+(o.title||'Drop files here or click to browse')+'</h3><p>'+(o.sub||'')+'</p>'+
    '<div class="formats">'+(o.formats||[]).map(f=>'<span class="chip">'+f+'</span>').join('')+'</div></div>'+
    '<div class="controls" id="d_controls"></div><div class="results" id="d_results"></div><div class="actions" id="d_actions"></div><div class="status" id="d_status"></div>';
  const r={drop:$('#d_drop',panel),file:$('#d_file',panel),controls:$('#d_controls',panel),results:$('#d_results',panel),actions:$('#d_actions',panel),status:$('#d_status',panel)};
  return r;
}
function setStatus(el,msg,err){el.className='status show'+(err?' err':'');el.textContent=msg;}
function row(box,thumb,name,meta,onDl){box.classList.add('show');const d=document.createElement('div');d.className='row';
  d.innerHTML=(thumb?'<img class="thumb" src="'+thumb+'">':'<div class="thumb" style="display:grid;place-items:center;color:var(--accent)">'+ICON.pdf+'</div>')+
  '<div class="meta"><div class="nm">'+name+'</div><div class="sz">'+meta+'</div></div>';
  const b=document.createElement('button');b.className='btn btn-primary dl';b.textContent='Download';b.onclick=onDl;d.appendChild(b);box.appendChild(d);return d;}

/* ---------- tool registry ---------- */
const INIT={};            /* slug -> init(panel) */
const TOOL_ARTICLES={
  'image-compressor':['compress-images-without-losing-quality','compress-images-web'],
  'image-resizer':['social-media-image-sizes-2026','instagram-story-size-guide'],
  'image-cropper':['social-media-image-sizes-2026','best-free-tools-designers-2026'],
  'jpg-to-png':['jpg-vs-png-vs-webp'],
  'png-to-jpg':['jpg-vs-png-vs-webp'],
  'jpg-to-webp':['jpg-vs-png-vs-webp'],
  'webp-to-jpg':['jpg-vs-png-vs-webp'],
  'png-to-webp':['jpg-vs-png-vs-webp'],
  'webp-to-png':['jpg-vs-png-vs-webp'],
  'png-to-svg':['best-free-tools-designers-2026','web-design-tools-2026'],
  'svg-to-jpg':['best-free-tools-designers-2026'],
  'image-to-pdf':['convert-jpg-to-pdf','best-free-pdf-tools-2026'],
  'watermark-image':['add-watermark-photos'],
  'exif-remover':['best-free-tools-designers-2026'],
  'qr-code-generator':['create-qr-code-business'],
  'pdf-merger':['merge-pdf-online-free','how-to-merge-pdfs','pdf-guide-2026'],
  'pdf-splitter':['best-free-pdf-tools-2026','pdf-guide-2026'],
  'pdf-compressor':['reduce-pdf-file-size','best-free-pdf-tools-2026'],
  'pdf-to-jpg':['pdf-to-jpg-convert','best-free-pdf-tools-2026'],
  'jpg-to-pdf':['convert-jpg-to-pdf','best-free-pdf-tools-2026'],
  'png-to-pdf':['best-free-pdf-tools-2026'],
  'pdf-to-text':['best-free-pdf-tools-2026','pdf-guide-2026'],
  'pdf-password-protect':['best-free-pdf-tools-2026'],
  'pdf-unlock':['best-free-pdf-tools-2026'],
  'pdf-page-rotator':['pdf-guide-2026'],
  'pdf-page-remover':['pdf-guide-2026'],
  'pdf-organizer':['pdf-guide-2026','best-free-pdf-tools-2026'],
  'scan-to-pdf':['best-free-pdf-tools-2026'],
  'images-to-pdf':['best-free-pdf-tools-2026'],
  'pdf-reader':['best-free-pdf-tools-2026','pdf-guide-2026'],
  'txt-to-pdf':['best-free-pdf-tools-2026'],
  'html-to-pdf':['meta-tags-seo-guide','web-design-tools-2026'],
  'gif-maker':['create-gif-from-images'],
  'gif-to-webp':['jpg-vs-png-vs-webp'],
  'webp-to-gif':['jpg-vs-png-vs-webp'],
  'color-picker':['brand-color-extraction-guide','color-palette-brand-guide'],
  'image-collage':['best-free-tools-designers-2026'],
  'favicon-generator':['best-favicon-size','free-favicon-generator'],
  'social-image-resizer':['social-media-image-sizes-2026','instagram-story-size-guide'],
  'color-palette-gen':['color-palette-brand-guide','brand-color-extraction-guide'],
  'ad-copy-gen':['best-free-marketing-tools','free-tools-freelancers'],
  'cta-button-gen':['best-free-marketing-tools'],
  'utm-builder':['utm-link-builder-guide'],
  'og-image-gen':['what-is-open-graph-image','meta-tags-seo-guide'],
  'pdf-lead-magnet':['create-pdf-lead-magnet'],
  'brand-color-extract':['brand-color-extraction-guide','color-palette-brand-guide'],
  'word-counter':['meta-tags-seo-guide','free-tools-freelancers'],
  'password-generator':['best-free-tools-designers-2026'],
  'css-gradient-gen':['web-design-tools-2026','best-free-tools-designers-2026'],
  'base64-encoder':['meta-tags-seo-guide'],
  'json-formatter':['web-design-tools-2026'],
  'meta-tag-gen':['meta-tags-seo-guide'],
  'hashtag-gen':['hashtag-strategy-instagram'],
  'lorem-ipsum':['web-design-tools-2026'],
  'color-converter':['brand-color-extraction-guide','color-palette-brand-guide'],
  
  'base64-encoder':[['What can I encode with Base64?','Text strings, HTML, JavaScript, CSS and binary files such as images and PDFs. Base64-encoded images can be embedded directly in HTML or CSS without a separate file request.'],['Why is Base64 used?','It encodes binary data as ASCII text, making it safe to include inside JSON, HTML attributes, XML documents and email messages.'],['Does encoding increase file size?','Yes — Base64 encoding increases size by approximately 33%. It is a trade-off: convenience of inline embedding at the cost of size.']],
  'url-encoder':['utm-link-builder-guide','meta-tags-seo-guide'],
  'word-to-pdf':['how-to-convert-word-to-pdf','convert-jpg-to-pdf','best-free-pdf-tools-2026'],
  'markdown-to-html':['markdown-to-html-guide','meta-tags-seo-guide','web-design-tools-2026'],
  'text-diff':['how-to-compare-two-texts','free-tools-freelancers'],
  'regex-tester':['regex-guide-for-beginners','how-to-compare-two-texts'],
  'slug-generator':['how-to-create-seo-friendly-url-slugs','utm-link-builder-guide','meta-tags-seo-guide'],
  'text-case-converter':['text-case-formats-guide','how-to-create-seo-friendly-url-slugs'],
  'timestamp-converter':['unix-timestamps-explained','json-formatting-validation-guide'],
};
const FEAT={};            /* slug -> [[title,desc],...] optional */
const AI_SUMMARY={
  'image-compressor':'This free online image compressor reduces JPG, PNG, and WebP file sizes by 40-80% inside your browser without uploading anything to a server.',
  'image-resizer':'This free image resizer changes the dimensions of JPG, PNG, and WebP files in batch, preserves aspect ratio, and processes images entirely in the browser.',
  'image-cropper':'This free image cropper trims JPG, PNG, and WebP files to preset aspect ratios (1:1, 16:9, 4:3, 9:16) or a custom freeform region, fully in-browser.',
  'jpg-to-png':'This free converter changes JPG images to PNG format while preserving full quality, processed locally in your browser.',
  'png-to-jpg':'This free converter changes PNG images to JPG format with adjustable quality, processed locally in your browser.',
  'jpg-to-webp':'This free converter changes JPG images to modern WebP format, producing files 25-35% smaller, processed entirely in your browser.',
  'webp-to-jpg':'This free converter changes WebP images to JPG format for universal compatibility, processed locally in your browser.',
  'png-to-webp':'This free converter changes PNG images to WebP format with transparency preserved, producing files 26-34% smaller, processed in-browser.',
  'webp-to-png':'This free converter changes WebP images to lossless PNG format, processed entirely in your browser.',
  'png-to-svg':'This free PNG to SVG converter traces raster logos, icons and simple graphics into clean, editable vector paths — processed entirely in your browser.',
  'svg-to-jpg':'This free SVG to JPG converter renders vector graphics to raster JPG files with adjustable quality, processed in-browser.',
  'image-to-pdf':'This free image to PDF converter combines JPG, PNG, and WebP files into a single multi-page PDF document, processed in-browser.',
  'watermark-image':'This free watermark tool adds text or logo watermarks to images with control over position, opacity, size, and rotation, processed in-browser.',
  'exif-remover':'This free EXIF remover strips GPS location, camera metadata, and personal information from JPG photos before sharing, processed locally.',
  'qr-code-generator':'This free QR code generator encodes URLs, text, Wi-Fi credentials, vCard contacts, and email as scannable QR codes, exportable as PNG or SVG.',
  'pdf-merger':'This free online PDF merger combines multiple PDF files into a single document with drag-and-drop page ordering, processed entirely in your browser.',
  'pdf-splitter':'This free PDF splitter extracts specific pages or page ranges from a PDF into separate files, processed in your browser.',
  'pdf-compressor':'This free PDF compressor reduces PDF file size by 20-70% with an adjustable quality slider, processed entirely in your browser.',
  'pdf-to-jpg':'This free PDF to JPG converter exports every page of a PDF as a separate JPG image at 150 or 300 DPI, processed in-browser.',
  'jpg-to-pdf':'This free JPG to PDF converter combines JPG images into a single multi-page PDF with A4, Letter, or custom page sizes, processed in-browser.',
  'png-to-pdf':'This free PNG to PDF converter combines PNG images into a single multi-page PDF preserving transparency, processed in-browser.',
  'pdf-to-text':'This free PDF to text extractor pulls plain-text content from searchable PDFs and exports it as a .txt file, processed in-browser.',
  'pdf-password-protect':'This free PDF protector adds 256-bit AES encryption with separate user and owner passwords to restrict opening, printing, copying, or editing.',
  'pdf-unlock':'This free PDF unlocker removes password protection and owner restrictions from PDFs you have permission to modify, processed in-browser.',
  'pdf-page-rotator':'This free PDF page rotator rotates individual pages or all pages by 90, 180, or 270 degrees, processed entirely in your browser.',
  'pdf-page-remover':'This free PDF page remover deletes specific pages or page ranges from a PDF document, processed in-browser.',
  'pdf-organizer':'This free PDF organizer rearranges, rotates, and deletes pages in a visual drag-and-drop interface, processed in-browser.',
  'scan-to-pdf':'This free scan to PDF tool converts phone photos or scanned images into multi-page PDF documents, processed in-browser.',
  'images-to-pdf':'This free images to PDF tool combines JPG, PNG, and WebP files into a multi-page PDF with custom page size and margins, processed in-browser.',
  'pdf-reader':'This free PDF reader opens and renders PDF documents in your browser including password-protected files, with no upload required.',
  'txt-to-pdf':'This free TXT to PDF converter turns plain text files into formatted PDF documents with clean typography, processed in-browser.',
  'html-to-pdf':'This free HTML to PDF converter renders pasted HTML and inline CSS into a PDF document, processed entirely in your browser.',
  'gif-maker':'This free GIF maker combines multiple JPG, PNG, or WebP images into an animated GIF with adjustable frame delay, processed in-browser.',
  'gif-to-webp':'This free GIF to WebP converter changes animated GIFs to modern animated WebP format, producing files 50-60% smaller, processed in-browser.',
  'webp-to-gif':'This free WebP to GIF converter changes animated WebP files to animated GIF for older platform compatibility, processed in-browser.',
  'color-picker':'This free color picker reads pixel-perfect HEX, RGB, and HSL values from any pixel in an uploaded image, processed in-browser.',
  'image-collage':'This free image collage maker combines multiple photos into grid layouts (2-4 cells) with adjustable spacing, exportable as JPG or PNG.',
  'favicon-generator':'This free favicon generator outputs all standard sizes (16x16, 32x32, 48x48, 180x180, 192x192, 512x512) for websites and PWA manifests.',
  'social-image-resizer':'This free social media image resizer outputs every required dimension for Instagram, Facebook, Twitter/X, LinkedIn, YouTube, Pinterest, and TikTok.',
  'color-palette-gen':'This free color palette generator extracts up to 8 dominant colors from any uploaded image with HEX, RGB, and HSL values, processed in-browser.',
  'ad-copy-gen':'This free ad copy generator produces headlines, body text, and calls-to-action for social media, Google, and display advertising in multiple tones.',
  'cta-button-gen':'This free CTA button generator outputs ready-to-use HTML and CSS for call-to-action buttons with full customization of color, size, and hover state.',
  'utm-builder':'This free UTM link builder generates Google Analytics campaign tracking URLs with source, medium, campaign, term, and content parameters.',
  'og-image-gen':'This free Open Graph image generator creates 1200x630 pixel social media preview images for Facebook, LinkedIn, and Twitter, exportable as PNG.',
  'pdf-lead-magnet':'This free PDF lead magnet builder creates branded checklists, guides, and resource lists for email list building, exportable as PDF.',
  'brand-color-extract':'This free brand color extractor identifies the most prominent colors from a logo image, filtering out white and grey backgrounds.',
  'word-counter':'This free word counter shows real-time counts of words, characters with and without spaces, sentences, paragraphs, and estimated reading time.',
  'password-generator':'This free password generator creates cryptographically random passwords using window.crypto.getRandomValues with customizable length and character sets.',
  'css-gradient-gen':'This free CSS gradient generator creates linear, radial, and conic gradients with unlimited color stops and copy-ready CSS output.',
  'base64-encoder':'This free Base64 encoder and decoder converts text, HTML, JavaScript, CSS, and binary files to and from Base64 ASCII format, processed in-browser.',
  'json-formatter':'This free JSON formatter and validator pretty-prints JSON with indentation, validates syntax with line-level error reporting, and minifies for production.',
  'meta-tag-gen':'This free meta tag generator outputs ready-to-copy HTML for title, description, Open Graph, Twitter Card, and robots meta tags.',
  'hashtag-gen':'This free hashtag generator suggests Instagram, TikTok, and X hashtag combinations balancing high-reach, medium-reach, and niche tags.',
  'lorem-ipsum':'This free Lorem Ipsum generator produces placeholder text in paragraphs, sentences, or words at any quantity for design mockups.',
  'color-converter':'This free color converter translates between HEX, RGB, RGBA, HSL, HSLA, HSB, and CSS named colors with instant updates across all formats.',
  'url-encoder':'This free URL encoder and decoder converts text to and from percent-encoded format for safe inclusion in URLs, query strings, and API requests.',
  'word-to-pdf':'This free Word to PDF converter changes .docx files to PDF directly in your browser without uploading them to any server.',
  'markdown-to-html':'This free Markdown to HTML converter transforms Markdown text to clean HTML with a live preview pane and one-click copy, processed in your browser.',
  'text-diff':'This free text diff checker compares two texts word-by-word and highlights every addition, deletion and change between them, processed entirely in your browser.',
  'regex-tester':'This free regex tester tests regular expressions against any string in real time, highlighting all matches and showing capture group values, processed in your browser.',
  'slug-generator':'This free URL slug generator converts any text into a clean, SEO-friendly slug using hyphens or underscores, removing special characters and accents.',
  'text-case-converter':'This free text case converter changes text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case and PascalCase instantly.',
  'timestamp-converter':'This free timestamp converter shows the current UNIX timestamp live, converts UNIX timestamps to human-readable dates, and converts dates back to UNIX timestamps.',
};
const FAQ={
  'image-compressor':[['What file formats are supported?','JPG, PNG and WebP. The output format matches your input — a JPG stays a JPG after compression.'],['How much will my file size be reduced?','Typically 40–80% depending on the original file. Images with large uniform areas compress the most. You can preview quality before downloading.'],['Are my files uploaded to a server?','No. Compression happens entirely inside your browser using the Canvas API. Your images never leave your device.']],
  'image-resizer':[['Can I resize multiple images at once?','Yes — drop several files together and each is resized to the same target dimensions in one batch.'],['Will resizing stretch or distort my image?','Not if you lock the aspect ratio. The tool calculates the correct proportional dimensions automatically.'],['Does upscaling add detail to a blurry image?','No. Making an image larger than its original dimensions spreads existing pixels and cannot add new detail. Downscaling always looks cleaner.']],
  'image-cropper':[['Can I crop to a preset aspect ratio?','Yes — 1:1 (square), 16:9 (landscape), 4:3, 3:2 and 9:16 (portrait) presets are available, plus a freeform custom mode.'],['Is a preview shown before I download?','Yes — a live crop preview updates as you adjust the selection. Download only when you are happy.'],['What image formats can I crop?','JPG, PNG and WebP. The downloaded file is in the same format as your original.']],
  'jpg-to-png':[['Why would I convert JPG to PNG?','PNG supports transparency and uses lossless compression, making it the right choice for logos, UI graphics and any image that needs sharp, clean edges.'],['Will the converted PNG be larger than the JPG?','Usually yes — PNG stores all pixel data without compression losses, so files are larger. Use JPG for photos and PNG for graphics.'],['Is there any quality loss in the conversion?','No — converting JPG to PNG is lossless. However, any quality already lost during the original JPG compression cannot be recovered.']],
  'png-to-jpg':[['Why convert PNG to JPG?','JPG files are significantly smaller than PNG, which speeds up page load times and makes sharing by email or social media easier.'],['Will PNG transparency survive the conversion?','No — JPG does not support transparency. Any transparent areas will be filled with a white background.'],['Can I set the JPG quality level?','Yes — a quality slider lets you choose the balance between file size and visual quality. 85% is a good default for most uses.']],
  'jpg-to-webp':[['What is WebP and why convert to it?','WebP is a modern image format developed by Google. It produces files 25–35% smaller than JPG at the same visual quality, improving page speed scores.'],['Is WebP supported in all browsers?','All modern browsers (Chrome, Firefox, Safari 14+, Edge) support WebP. Internet Explorer does not. For maximum compatibility, keep a JPG fallback.'],['Does WebP support transparency like PNG?','Yes — WebP supports both lossless compression and alpha transparency, making it suitable as a replacement for both JPG and PNG.']],
  'webp-to-jpg':[['Why convert WebP to JPG?','Some older software, social media platforms and email clients do not support WebP. Converting to JPG ensures the image displays everywhere.'],['Does the conversion reduce image quality?','Slightly, since JPG uses lossy compression. Setting quality to 85–90% keeps the visual result close to the original WebP.'],['Can I batch-convert multiple WebP files?','Yes — drop multiple WebP images at once and download the converted JPGs together as a ZIP.']],
  'png-to-webp':[['How much smaller will the WebP file be?','Typically 26–34% smaller than the original PNG while maintaining the same visual quality and transparency support.'],['Is PNG transparency preserved when converting to WebP?','Yes — WebP fully supports alpha transparency, so transparent areas in your PNG are carried through to the output.'],['Is there any quality loss in PNG to WebP conversion?','In lossless mode, no. In lossy mode, a small amount of quality is traded for additional file size savings — you can control this with the quality slider.']],
  'webp-to-png':[['When would I need to convert WebP to PNG?','When your image editing software does not support WebP, or when you need a universally accepted format for email attachments or legacy systems.'],['Is WebP to PNG conversion lossless?','Yes — PNG is a lossless format. As long as the source WebP was lossless, all original quality is preserved in the output.'],['Does this tool work on mobile?','Yes — all Tarumak Studio tools run in any modern mobile browser. No app download required.']],
  'png-to-svg':[['What kind of images work best?','Logos, icons, signatures and simple flat-color graphics trace beautifully. Detailed photographs are not a good fit for vector tracing — they produce very large, noisy SVGs.'],['Is the SVG editable?','Yes — the output is standard SVG paths grouped by color, so you can open and edit it in Figma, Illustrator, Inkscape or any vector editor.'],['Does it handle transparent PNGs?','Yes — transparent areas stay transparent in the SVG. Only visible pixels are traced.']],
  'svg-to-jpg':[['What is the difference between SVG to PNG and SVG to JPG?','PNG supports transparency; JPG does not. Use SVG to JPG when file size matters more than a transparent background — for example, for social media posts or hero images.'],['Can I set the JPG quality for the output?','Yes — a quality slider is available. 90% is recommended for preserving the crisp lines typical in SVG-sourced artwork.'],['Will text inside the SVG render correctly?','Yes — text paths and embedded fonts in the SVG are rendered as part of the raster output.']],
  'image-to-pdf':[['Can I combine multiple images into one PDF?','Yes — add several images and each becomes a separate page in the PDF, in the order you arrange them.'],['What page size will the PDF use?','The default matches each image dimensions. You can also choose standard A4 or Letter page sizes with optional margins.'],['What image formats are supported?','JPG, PNG and WebP.']],
  'watermark-image':[['Can I add both a text and an image watermark?','Yes — both text and logo/image watermarks are supported. Set position, opacity, size and rotation for each.'],['Does watermarking affect the original image quality?','No — image quality is unchanged. The watermark is composited as a layer on top of the original pixels.'],['Can I remove the watermark later?','The watermark is baked into the downloaded file. Keep your unwatermarked original before running this tool.']],
  'exif-remover':[['What is EXIF data and why should I remove it?','EXIF metadata embedded in photos can contain your GPS location, camera model, date and time. Removing it before sharing images online protects your privacy.'],['Which file types carry EXIF data?','JPG files are the most common carriers. PNG and WebP carry much less metadata by comparison.'],['Is my original file modified?','No — the tool creates a new clean copy. Your original file is not touched.']],
  'qr-code-generator':[['What types of data can I encode in a QR code?','URLs, plain text, email addresses, phone numbers, SMS messages, Wi-Fi credentials and vCard contact data.'],['What format is the downloaded QR code?','PNG and SVG. Use SVG for print materials — it scales to any size without pixelation.'],['Is there a limit to how much data I can encode?','Technically up to 3,000 characters, but more data means a denser QR code that is harder to scan. Keep URLs under 150 characters for best results.']],
  'pdf-merger':[['How many PDFs can I merge at once?','There is no hard limit. You can merge as many files as your browser memory allows. Very large files may be slow.'],['Can I reorder files before merging?','Yes — drag the files into the order you want before clicking Merge. The final PDF follows that sequence.'],['Is the merged PDF stored anywhere?','No. All processing happens locally. The merged file is generated in your browser and downloaded directly.']],
  'pdf-splitter':[['Can I extract only specific pages?','Yes — enter individual page numbers (e.g. 1, 3, 5) or page ranges (e.g. 2-6) to extract exactly the pages you need.'],['Does splitting produce separate PDF files?','Yes — each split range becomes its own PDF file, downloadable individually or as a ZIP.'],['Is the original PDF affected by splitting?','No — the original file is never modified. The tool creates new PDF files from the pages you specify.']],
  'pdf-compressor':[['How much can the file size be reduced?','Typically 20–70%, depending on content. PDFs heavy with high-resolution images compress the most.'],['Will text remain readable after compression?','Yes — text in PDFs is vector-based and is not affected by compression. Only embedded images are resampled.'],['Can I choose the compression level?','Yes — a quality slider lets you balance file size reduction against visual quality.']],
  'pdf-to-jpg':[['Does it convert all pages?','Yes — every page in the PDF becomes a separate JPG image, packaged in a ZIP file for download.'],['What resolution are the output images?','150 DPI by default, suitable for screens and web use. A higher resolution option (300 DPI) is available for print quality.'],['What if my PDF is password-protected?','You will need to unlock the PDF first using the PDF Unlock tool before converting to JPG.']],
  'jpg-to-pdf':[['Can I combine multiple JPG files into one PDF?','Yes — add multiple JPG files and each becomes a separate page in the PDF.'],['Is image quality reduced when embedding JPG into PDF?','No — the JPG images are embedded without re-compression. The quality you upload is the quality in the PDF.'],['Can I set the page size?','Yes — options include matching the image dimensions, A4 and Letter, with adjustable margins.']],
  'png-to-pdf':[['Does PNG to PDF preserve transparency?','PDF supports transparency, so transparent areas in your PNG images appear correctly in the output.'],['Can I include multiple PNG files in one PDF?','Yes — add several PNGs and each becomes a page in the PDF.'],['Can I set the page orientation?','Yes — portrait and landscape options are available, along with A4 and Letter page sizes.']],
  'pdf-to-text':[['Can it extract text from scanned PDFs?','Only from text-based (searchable) PDFs. Scanned PDFs that are photographs of text require OCR software.'],['What output format is the extracted text?','Plain text (.txt), which opens in any text editor, word processor or code editor.'],['Is formatting like columns and tables preserved?','Basic paragraph structure is preserved. Complex multi-column layouts may not convert perfectly to plain text.']],
  'pdf-password-protect':[['What encryption standard is used?','256-bit AES encryption — the same standard used by modern PDF viewers and recommended for sensitive documents.'],['Can I restrict printing or copying separately from opening?','Yes — opening password and owner permissions (printing, copying, editing) are independently configurable.'],['Can the password be removed later?','Yes — use the PDF Unlock tool with the correct password to remove protection from your own documents.']],
  'pdf-unlock':[['Can this unlock any password-protected PDF?','Only if you know the user password. This tool is designed for recovering access to your own documents, not bypassing security without authorisation.'],['Does it remove editing and printing restrictions?','Yes — it can remove owner-level permission restrictions (printing, copying, editing) in addition to open passwords.'],['Is it legal to use this tool?','Use it only on PDFs you own or have explicit permission to modify. Bypassing protection on documents you do not own may violate copyright law.']],
  'pdf-page-rotator':[['Can I rotate individual pages without affecting others?','Yes — select specific pages and choose 90, 180 or 270 degree rotation. Unselected pages remain unchanged.'],['Is there a way to rotate all pages at once?','Yes — a Rotate All option applies the same rotation angle to every page in the document.'],['Is the rotation permanent in the output PDF?','Yes — the downloaded PDF has rotated pages baked in. Keep your original PDF if you may need to change the rotation later.']],
  'pdf-page-remover':[['Can I preview pages before removing them?','Yes — thumbnail previews are shown for all pages so you can confirm which ones to remove before downloading.'],['Can I remove non-consecutive pages in one step?','Yes — select any combination of individual pages or ranges and remove them all at once.'],['Can I undo a removal after downloading?','Not from the tool — keep your original PDF before making changes so you can recover removed pages if needed.']],
  'pdf-organizer':[['What can the PDF Organizer do?','Reorder, rotate and delete pages in a PDF — all from a visual drag-and-drop interface in one session before downloading.'],['Does it work on large PDFs?','Yes, though rendering thumbnail previews for very large PDFs may take a moment depending on your device.'],['Is there a page limit?','No hard limit. The tool handles as many pages as your browser memory allows.']],
  'scan-to-pdf':[['Do I need a scanner to use this tool?','No — you can take a photo with your phone camera and upload it. The tool converts the image into a PDF page.'],['Can I include multiple scans in one PDF?','Yes — add multiple images and they are combined into a single multi-page PDF in the order you arrange them.'],['Does the tool make scanned text searchable (OCR)?','No — the output is an image-based PDF. The text in scans is not indexed or searchable without separate OCR software.']],
  'images-to-pdf':[['What image formats can I combine into a PDF?','JPG, PNG and WebP images are all supported.'],['Can I reorder images before converting?','Yes — drag images into your preferred order. The PDF pages will follow that sequence.'],['What page size is used?','The default matches each image dimensions. A4 and Letter presets with adjustable margins are also available.']],
  'pdf-reader':[['Can I annotate or highlight text in the PDF Reader?','The reader is designed for viewing. For annotations, highlighting or editing, use a PDF editor application.'],['Does it open password-protected PDFs?','Yes — you will be prompted to enter the password when you open a protected file.'],['Is my PDF uploaded to a server?','No — the PDF is loaded and rendered entirely in your browser memory. Nothing is sent to any server.']],
  'txt-to-pdf':[['Will the formatting of my text file be preserved?','Line breaks and spacing are preserved. Rich text formatting such as bold, italic or headings from word processors is not carried through.'],['What font and page size are used?','A clean, readable sans-serif font at a comfortable size is applied. A4 page size is used by default.'],['Is there a character or file size limit?','No hard limit. Very large text files may take a moment to convert.']],
  'html-to-pdf':[['Will my CSS styles appear in the PDF?','Inline and embedded CSS is supported. External stylesheets and fonts loaded from remote URLs depend on your browser ability to fetch them.'],['Will images in the HTML render?','Images using base64 data URIs will always render. Images referencing external URLs will render if your browser can access them.'],['Can I convert a live web page?','Paste the HTML source code of the page. The tool does not fetch and render live URLs directly — copy the page source and paste it in.']],
  'gif-maker':[['What image formats can I use to make a GIF?','JPG, PNG and WebP images. Each image becomes one frame in the animated GIF.'],['Can I control the speed of the GIF?','Yes — set the delay between frames in milliseconds. 100ms is a medium speed; lower is faster, higher is slower.'],['Why is my GIF file large?','GIF is an inefficient format for animations with many colours. Limit the number of frames and colours per frame to keep file sizes manageable.']],
  'gif-to-webp':[['Does the converted animated WebP play correctly?','Yes — animated WebP is supported in Chrome, Firefox, Edge and Safari 14+.'],['How much smaller is animated WebP compared to GIF?','Typically 50–60% smaller with the same or better visual quality, making it a major web performance improvement.'],['Does Safari support animated WebP?','Safari 14 and later supports animated WebP. Older Safari versions do not. Consider keeping a GIF fallback if you need to support older iOS devices.']],
  'webp-to-gif':[['Does the conversion preserve animation?','Yes — animated WebP files are converted to animated GIF with all frames intact.'],['Why would I convert from WebP to GIF?','GIF is more widely supported across older email clients, messaging apps and platforms that do not handle WebP.'],['Will the GIF file be larger than the WebP?','Usually yes — GIF uses a less efficient compression algorithm than WebP, so file sizes increase in the conversion.']],
  'color-picker':[['How accurate is the colour reading?','It reads the exact pixel value under your cursor, giving you the precise HEX, RGB and HSL values for that pixel.'],['Can I pick multiple colours from one image?','Yes — click different areas of the image and each click copies the colour value. Results are listed below the image.'],['What colour formats are shown?','HEX, RGB and HSL are all displayed simultaneously for every colour you pick.']],
  'image-collage':[['Can I choose the collage layout?','Multiple grid layouts are available — 2, 3 and 4 photo grids in different arrangements.'],['What output format is the finished collage?','JPG or PNG. PNG is recommended if any collage images have transparent areas.'],['Can I adjust spacing between photos?','Yes — a gap setting controls the pixel spacing between collage cells.']],
  'favicon-generator':[['What favicon sizes does this tool output?','16x16, 32x32, 48x48, 180x180 (Apple touch icon), 192x192 and 512x512 — all standard sizes required by modern browsers and PWA manifests.'],['What is the best input image for a favicon?','A square image (1:1 ratio) with a transparent background, at least 512x512 pixels. SVG or high-resolution PNG gives the cleanest result.'],['What HTML code do I add to use the favicon?','Add to your head tag: link rel icon type image/png sizes 32x32 href /favicon-32x32.png and link rel apple-touch-icon href /apple-touch-icon.png']],
  'social-image-resizer':[['Which social media platforms are supported?','Instagram (post, story, reel), Facebook (post, cover, ad), Twitter/X, LinkedIn, YouTube (thumbnail, channel art), Pinterest and TikTok.'],['Are the dimensions updated for 2026?','Yes — dimensions are kept current with the latest platform specifications. Always preview after resizing to confirm the key content is within the crop boundary.'],['Will resizing crop part of my image?','The tool shows a crop preview so you can reposition the image before confirming. Adjust until the important content is within the crop boundary.']],
  'color-palette-gen':[['How many colours are extracted from my image?','Up to 8 dominant colours, displayed with HEX, RGB and HSL values. You can copy any value with one click.'],['What algorithm does the colour extraction use?','A colour quantisation algorithm that groups similar pixels and identifies the most visually representative values in your image.'],['Can I use the extracted colours in design tools?','Yes — copy any HEX code and paste it directly into Figma, Canva, Adobe Illustrator, Photoshop or any design application.']],
  'ad-copy-gen':[['What types of ad copy can it generate?','Headlines, body text, calls-to-action and taglines for social media ads, Google Ads and display advertising.'],['Can I choose a tone for the copy?','Yes — select from professional, casual, urgent, empathetic and humorous tones depending on your campaign.'],['Do I need to create an account?','No — the tool is fully free with no sign-up required.']],
  'cta-button-gen':[['What does the CTA Button Generator output?','A ready-to-use HTML and CSS snippet that you paste directly into your webpage, email or landing page builder.'],['Can I customise colours, size and border radius?','Yes — full controls for background colour, text colour, font size, padding, border radius and hover state are included.'],['Does it generate hover state styles?','Yes — the CSS output includes hover state declarations automatically.']],
  'utm-builder':[['What are UTM parameters?','UTM parameters are tags appended to URLs that tell Google Analytics which campaign, source, medium, term and content drove traffic to a page.'],['Which UTM fields are required?','Source (e.g. google, newsletter) and Medium (e.g. cpc, email) are required. Campaign name is strongly recommended. Term and Content are optional.'],['Do UTM parameters affect SEO?','No. Google ignores UTM parameters for ranking purposes. They are only used by analytics tools to attribute traffic sources.']],
  'og-image-gen':[['What size should an Open Graph image be?','1200 by 630 pixels is the recommended size for Facebook, LinkedIn and most other platforms. Twitter also accepts this size.'],['What format should I use?','PNG is recommended — it gives sharp text and graphics. JPG is also accepted but may show compression artefacts on text.'],['How do I add the OG image to my website?','Add this in your head tag: meta property og:image content https://yourdomain.com/og-image.png — replace the URL with your hosted image path.']],
  'pdf-lead-magnet':[['What is a PDF lead magnet?','A free downloadable resource — such as a checklist, guide or template — offered to visitors in exchange for their email address.'],['Can I add my branding to the PDF?','Yes — add your logo, set brand colours and choose fonts to match your visual identity before exporting.'],['What templates are available?','Checklists, step-by-step guides, resource lists, ebook layouts and case study templates.']],
  'brand-color-extract':[['Can I extract brand colours from a logo image?','Yes — upload your logo and the tool identifies the most prominent colours used, filtering out common background colours like white and light grey.'],['How many colours are extracted?','Up to 6 brand colours, each shown with HEX, RGB and HSL values.'],['Can I use these colours immediately in design tools?','Yes — copy any colour value and paste it directly into Figma, Canva, Adobe XD or any other design application.']],
  'word-counter':[['Does the word count update in real time?','Yes — counts update instantly as you type or paste text, with no need to click a button.'],['What counts are shown besides words?','Characters with spaces, characters without spaces, sentences, paragraphs and an estimated reading time.'],['Is there a text length limit?','No — the counter handles documents of any length.']],
  'password-generator':[['How are the passwords generated?','Using your browser built-in cryptographic random number generator (window.crypto.getRandomValues), not a predictable algorithm. This makes them genuinely random.'],['Are generated passwords stored or sent anywhere?','No — everything happens locally in your browser. Generated passwords are never transmitted to any server.'],['How long should my password be?','At least 16 characters for standard accounts, 20 or more for high-security accounts such as email, banking or password managers.']],
  'css-gradient-gen':[['What gradient types can I create?','Linear, radial and conic gradients with unlimited colour stops, full angle control and gradient repeat options.'],['Does it include browser vendor prefixes?','Yes — the output includes -webkit- prefixes to ensure compatibility with older browsers alongside the standard CSS property.'],['Can I copy the CSS with one click?','Yes — a Copy button copies the complete CSS property value, ready to paste into your stylesheet.']],
  'base64-encoder':[['What can I encode with Base64?','Text strings, HTML, JavaScript, CSS and binary files such as images and PDFs. Base64-encoded images can be embedded directly in HTML or CSS without a separate file request.'],['Why is Base64 used?','It encodes binary data as ASCII text, making it safe to include inside JSON, HTML attributes, XML documents and email messages.'],['Does encoding increase file size?','Yes — Base64 encoding increases size by approximately 33%. It is a trade-off: convenience of inline embedding at the cost of size.']],
  'json-formatter':[['What does the JSON Formatter and Validator do?','It validates your JSON for syntax errors, formats it with proper indentation for readability, and provides a minify option to strip whitespace for production use.'],['Does it show which line has a JSON error?','Yes — the validator identifies the line and column of the syntax error and highlights the issue.'],['Can it handle nested or deeply structured JSON?','Yes — there is no nesting depth limit. Large or deeply nested JSON may take a moment to format on slower devices.']],
  'meta-tag-gen':[['Which meta tags does it generate?','Title, meta description, Open Graph (og:title, og:description, og:image, og:url, og:type), Twitter Card and robots meta tags — all as a ready-to-copy HTML snippet.'],['How long should a meta title be?','50 to 60 characters. Google truncates titles longer than approximately 600 pixels wide, which corresponds to around 60 characters in a standard font.'],['How long should a meta description be?','120 to 160 characters. Google may show longer text but typically truncates around 160 characters in search results.']],
  'hashtag-gen':[['How many hashtags should I use on Instagram?','Instagram recommends 3 to 5 highly relevant hashtags for best reach. The old practice of using 30 generic hashtags is no longer effective.'],['Does the generator check hashtag popularity?','The output includes a mix of high-reach, medium-reach and niche hashtags to balance discoverability with relevance to your specific audience.'],['Should I use the same hashtags on every post?','Rotating your hashtag sets is recommended. Repeating identical hashtags on every post can be interpreted as spam behaviour by platforms.']],
  'lorem-ipsum':[['What is Lorem Ipsum text for?','Lorem Ipsum is placeholder text used in design and typesetting to show what a layout looks like with realistic-length content, without distracting readers with real words.'],['Can I generate paragraphs, sentences or words?','Yes — choose from paragraphs, sentences or individual words, and set the quantity you need.'],['Is Lorem Ipsum based on real Latin?','Yes — it derives from a passage in Cicero De Finibus Bonorum et Malorum written in 45 BC, scrambled to be non-readable.']],
  'color-converter':[['What colour formats does it convert between?','HEX, RGB, RGBA, HSL, HSLA and HSB/HSV. Enter a value in any format and all other formats update instantly.'],['Can I enter a CSS named colour like tomato?','Yes — type any valid CSS named colour and get its HEX, RGB and HSL equivalents immediately.'],['Why do colours look different on screen vs print?','Screens use RGB (additive, light-based) colour; print uses CMYK (subtractive, ink-based) colour. The same HEX value produces a visually different colour on paper.']],
  
  'base64-encoder':[['What can I encode with Base64?','Text strings, HTML, JavaScript, CSS and binary files such as images and PDFs. Base64-encoded images can be embedded directly in HTML or CSS.'],['Why is Base64 used?','It encodes binary data as ASCII text, making it safe to include inside JSON, HTML attributes, XML documents and email messages.'],['Does encoding increase file size?','Yes - Base64 encoding increases size by approximately 33%. It is a trade-off: inline convenience at the cost of larger file size.']],'url-encoder':[['What is URL encoding?','URL encoding converts characters that are not safe in URLs into a percent-encoded format. For example, a space becomes %20 and an ampersand becomes %26.'],['When should I use URL encoding?','When building query strings, passing URLs inside other URLs, constructing API requests, or sending any special characters in URL parameters.'],['What is the difference between encode and decode?','Encoding converts readable text into URL-safe format. Decoding reverses this — converting percent-encoded sequences back into readable characters.']],
  'word-to-pdf':[['Can I convert any Word document?','Yes — .docx files are supported. The tool uses mammoth.js to extract the document content and convert it to HTML, then your browser\'s print-to-PDF function creates the PDF.'],['Will the formatting be preserved?','Basic formatting including headings, bold, italic, lists, and tables is preserved. Complex formatting like multi-column layouts and custom fonts may not carry through exactly.'],['Is my document uploaded anywhere?','No. Everything happens in your browser using the mammoth.js library. Your document never leaves your device.']],
  'markdown-to-html':[['Which Markdown syntax is supported?','CommonMark specification — headings, bold, italic, links, images, lists, code blocks, blockquotes, and tables are all supported.'],['Can I download the converted HTML?','Yes — the Download .html button wraps the output in a complete HTML document and downloads it as a .html file.'],['Does it update in real time?','Yes — the preview and HTML output update as you type in the Markdown input panel.']],
  'text-diff':[['How does the diff algorithm work?','It uses a word-level Longest Common Subsequence (LCS) algorithm — the same approach as git diff — to find the minimal set of additions and deletions that transform the original into the changed text.'],['Can I diff large documents?','Yes, though very large texts (over 50,000 words) may be slow as the LCS algorithm is O(n*m) in complexity.'],['Does it show character-level or word-level differences?','Word-level differences. Whitespace between words is preserved so the output is readable.']],
  'regex-tester':[['What regex syntax does this tool use?','JavaScript\'s built-in RegExp engine, which follows ECMAScript standards. Most standard regex syntax (character classes, quantifiers, groups, lookaheads) is supported.'],['What do the g, i, and m flags do?','g (global) finds all matches not just the first. i makes the pattern case-insensitive. m makes ^ and $ match the start and end of each line rather than the whole string.'],['Can I test capture groups?','Yes — the first match\'s capture groups ($1, $2, etc.) are displayed below the test string.']],
  'slug-generator':[['What characters are removed from the slug?','All characters except a-z, 0-9, hyphens, and underscores are removed. Accented characters (é, ñ, ü) are converted to their ASCII equivalents before removal.'],['Can I choose underscores instead of hyphens?','Yes — toggle between hyphen-separated and underscore_separated output using the buttons above the result.'],['What is a URL slug used for?','A slug is the URL-safe version of a page title used in website addresses. For example \'How to Create a QR Code\' becomes how-to-create-a-qr-code.']],
  'text-case-converter':[['What case formats are supported?','UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case, and PascalCase.'],['What is the difference between camelCase and PascalCase?','camelCase starts with a lowercase letter (myVariableName). PascalCase starts with an uppercase letter (MyVariableName). Both are commonly used in programming.'],['Can I chain conversions?','Yes — use the \'Use as input\' button to swap the output back to the input field, then apply another case conversion.']],
  'timestamp-converter':[['What is a UNIX timestamp?','A UNIX timestamp is the number of seconds that have elapsed since January 1, 1970, at 00:00:00 UTC. It is the standard way computers represent moments in time.'],['Why does the tool auto-detect seconds vs milliseconds?','JavaScript uses milliseconds, most backend systems use seconds. If the input is 13 digits or more it is treated as milliseconds and divided by 1000 automatically.'],['Can I convert a specific date to a UNIX timestamp?','Yes — use the Human to Unix section to pick any date and time and get the corresponding UNIX timestamp in both seconds and milliseconds.']],
};             /* slug -> [[q,a],...] optional */
/* metadata for all 38 tools */
const TOOLS=[
 ['image-compressor','Image Compressor','image','Compress JPG, PNG and WebP images online — reduce file size by up to 80% with no visible quality loss. Free, browser-based, no uploads.',['JPG','PNG','WEBP']],
 ['image-resizer','Image Resizer','image','Resize images to exact pixel dimensions or percentage online. Batch resize multiple images while keeping the original aspect ratio.',['JPG','PNG']],
 ['image-cropper','Image Cropper','image','Crop images online to any custom size or preset ratio (1:1, 16:9, 4:3). Preview before downloading — no software needed.',['JPG','PNG']],
 ['jpg-to-png','JPG to PNG Converter','image','Convert JPG to PNG online for free. Preserve transparency and get lossless quality — instant conversion, no uploads.',['JPG→PNG']],
 ['png-to-jpg','PNG to JPG Converter','image','Convert PNG to JPG online to reduce file size for web and email. Adjust quality level before downloading.',['PNG→JPG']],
 ['jpg-to-webp','JPG to WebP Converter','image','Convert JPG to WebP online — get files 25–35% smaller than JPG with the same visual quality. Works in all modern browsers.',['JPG→WEBP']],
 ['webp-to-jpg','WebP to JPG Converter','image','Convert WebP images to JPG online for compatibility with older software, email clients and social media platforms.',['WEBP→JPG']],
 ['png-to-webp','PNG to WebP Converter','image','Convert PNG to WebP online and save up to 26% file size. Keeps transparency. Ideal for web performance and Core Web Vitals.',['PNG→WEBP']],
 ['webp-to-png','WebP to PNG Converter','image','Convert WebP to PNG for full compatibility with all image editors, design tools and platforms that do not yet support WebP.',['WEBP→PNG']],
 ['png-to-svg','PNG to SVG Converter','image','Convert PNG logos, icons and simple graphics into clean, editable SVG vectors with intelligent tracing — free and fully in-browser.',['PNG→SVG']],
 ['svg-to-jpg','SVG to JPG Converter','image','Convert SVG to JPG online with a white background. Choose output quality and dimensions for social media or print.',['SVG→JPG']],
 ['image-to-pdf','Image to PDF Converter','image','Convert JPG or PNG images to a PDF document online. Combine multiple images into one PDF in seconds — no software needed.',['IMG→PDF']],
 ['watermark-image','Watermark Image Tool','image','Add a text or image watermark to photos online. Adjust opacity, size and position. Protect your images before sharing.',['JPG','PNG']],
 ['exif-remover','EXIF Data Remover','image','Remove EXIF metadata from photos to protect your privacy. Strips GPS location, camera model and timestamps from JPG files.',['JPG']],
 ['qr-code-generator','QR Code Generator','image','Generate a free QR code for any URL, text, email or phone number. Download as high-resolution PNG — no sign-up required.',['PNG']],
 ['pdf-merger','PDF Merger','pdf','Merge multiple PDF files into one online for free. Drag to reorder pages before combining — no uploads, no sign-up.',['PDF']],
 ['pdf-splitter','PDF Splitter','pdf','Split a PDF into separate pages or extract a specific page range online. Download as individual PDFs instantly.',['PDF']],
 ['pdf-compressor','PDF Compressor','pdf','Compress PDF file size online for free. Reduce large PDFs for email attachments and web uploads — all in your browser.',['PDF']],
 ['pdf-to-jpg','PDF to JPG Converter','pdf','Convert PDF pages to JPG images online. Extract every page as a high-quality image — free, fast and private.',['PDF→JPG']],
 ['jpg-to-pdf','JPG to PDF Converter','pdf','Convert JPG images to PDF online in seconds. Combine multiple JPGs into one PDF or convert individually.',['JPG→PDF']],
 ['png-to-pdf','PNG to PDF Converter','pdf','Convert PNG images to PDF online. Preserves transparency as white background. Merge multiple PNGs into one document.',['PNG→PDF']],
 ['pdf-to-text','PDF to Text Converter','pdf','Extract text from a PDF file online. Convert PDF to plain TXT for editing, copying or analysis — no software needed.',['PDF→TXT']],
 ['pdf-password-protect','PDF Password Protector','pdf','Add password protection to a PDF online. Encrypt your PDF before sharing to prevent unauthorised access.',['PDF']],
 ['pdf-unlock','PDF Unlock Tool','pdf','Remove password from a PDF online. Unlock a PDF you own to enable editing, printing and copying.',['PDF']],
 ['pdf-page-rotator','PDF Page Rotator','pdf','Rotate PDF pages online — rotate individual pages or the entire document 90° or 180°. Download the corrected PDF.',['PDF']],
 ['pdf-page-remover','PDF Page Remover','pdf','Delete specific pages from a PDF online. Enter page numbers or ranges and download the PDF with those pages removed.',['PDF']],
 ['pdf-organizer','PDF Organizer','pdf','Reorder PDF pages online with drag-and-drop thumbnail view. Rearrange, rotate and preview before downloading.',['PDF']],
 ['scan-to-pdf','Scan to PDF Tool','pdf','Scan documents to PDF using your device camera. Capture multiple pages and merge them into a single PDF file.',['IMG→PDF']],
 ['images-to-pdf','Multiple Images to PDF','pdf','Convert multiple images to a single PDF online. Drag in JPG, PNG or WebP files, reorder them and download.',['IMG→PDF']],
 ['pdf-reader','PDF Reader Web App','pdf','Read and view PDF files online without downloading software. Navigate pages and zoom in — all in your browser.',['PDF']],
 ['txt-to-pdf','TXT to PDF Converter','converter','Convert plain text files to PDF online. Paste text or upload a .txt file and download a formatted PDF document.',['TXT→PDF']],
 ['html-to-pdf','HTML to PDF Converter','converter','Convert HTML to PDF online. Paste HTML code and generate a PDF document — useful for web page archiving.',['HTML→PDF']],
 ['gif-maker','GIF Maker','converter','Create animated GIFs from multiple images online. Set frame duration and loop settings — free GIF creator in your browser.',['IMG→GIF']],
 ['gif-to-webp','GIF to WebP Converter','converter','Convert animated GIF to WebP online for smaller file sizes and better web performance. Keeps all animation frames.',['GIF→WEBP']],
 ['webp-to-gif','WebP to GIF Converter','converter','Convert animated WebP to GIF for wider compatibility with older browsers, email clients and social platforms.',['WEBP→GIF']],
 ['color-picker','Color Picker from Image','converter','Pick and identify any color from an uploaded image. Get HEX, RGB and HSL values — free online eyedropper tool.',['HEX','RGB']],
 ['image-collage','Image Collage Maker','converter','Create a photo collage online from multiple images. Choose grid layout, gaps and background color — download as PNG.',['JPG','PNG']],
 ['favicon-generator','Favicon Generator','converter','Generate favicons for your website from any image. Creates all required sizes (16x16 to 512x512) — free, instant.',['ICO','PNG']],
 ['social-image-resizer','Social Media Image Resizer','marketing','Resize images for Instagram, Facebook, Twitter, LinkedIn, YouTube and 8 more platforms. Exact pixel dimensions, drag-to-crop.',['RESIZE','SOCIAL','CANVAS']],
 ['color-palette-gen','Color Palette Generator','marketing','Extract a color palette from any image or generate harmonious color schemes (complementary, triadic, analogous) from a base color.',['PALETTE','HEX','CSS']],
 ['ad-copy-gen','Ad Copy Generator','marketing','Generate ad headlines, body copy and CTAs for Facebook, Google and Instagram ads. Template-based, no AI subscription needed.',['ADS','COPY','HEADLINES']],
 ['cta-button-gen','CTA Button Generator','marketing','Design CTA buttons with live preview. Adjust color, radius, size and padding — copy the CSS or download as PNG.',['CTA','BUTTON','CSS']],
 ['utm-builder','UTM Link Builder','marketing','Build UTM campaign URLs for Google Analytics 4. Track source, medium, campaign and content. Also decodes existing UTM links.',['UTM','GA4','TRACKING']],
 ['og-image-gen','Open Graph Image Generator','marketing','Create Open Graph images (1200x630) for social media link previews. Add title, brand colors and logo — download as PNG.',['OG','1200x630','SOCIAL']],
 ['pdf-lead-magnet','PDF Lead Magnet Creator','marketing','Create professional PDF lead magnets — checklists, guides and cheatsheets — to grow your email list. Download instantly.',['PDF','CHECKLIST','LEAD']],
 ['brand-color-extract','Brand Color Extractor','marketing','Extract brand colors from any logo or image. Get HEX, RGB and HSL values plus ready-to-paste CSS custom properties.',['BRAND','HEX','EXTRACT']],
 ['word-counter','Word & Character Counter','developer','Count words, characters, sentences and reading time. Essential for bloggers, copywriters and SEO content creators.',['WORDS','CHARS','SEO']],
 ['password-generator','Secure Password Generator','developer','Generate strong random passwords with custom length, uppercase, numbers and symbols. Uses cryptographic randomness.',['PASSWORD','SECURE','RANDOM']],
 ['css-gradient-gen','CSS Gradient Generator','developer','Create beautiful CSS linear and radial gradients with a live visual picker. Copy the ready-to-use CSS code.',['CSS','GRADIENT','DESIGN']],
 ['base64-encoder','Base64 Encoder & Decoder','developer','Encode text to Base64 and decode Base64 strings back to plain text. Essential for web developers and API work.',['BASE64','ENCODE','DECODE']],
 ['json-formatter','JSON Formatter & Validator','developer','Format, beautify and validate JSON data online. Minify JSON and highlight syntax errors with clear messages.',['JSON','FORMAT','VALIDATE']],
 ['meta-tag-gen','Meta Tag Generator','developer','Generate SEO title tags, meta descriptions and Open Graph tags for any web page. Copy-ready HTML output.',['SEO','META','HTML']],
 ['hashtag-gen','Hashtag Generator','developer','Generate targeted hashtags for Instagram, Twitter and LinkedIn from design, marketing, business and tech categories.',['HASHTAG','SOCIAL','SEO']],
 ['lorem-ipsum','Lorem Ipsum Generator','developer','Generate placeholder text in paragraphs, sentences or words. Start with classic Lorem ipsum or use random text.',['LOREM','PLACEHOLDER','TEXT']],
 ['color-converter','Color Code Converter','developer','Convert between HEX, RGB and HSL color formats instantly. Click any result to copy to clipboard.',['HEX','RGB','HSL']],
 ['url-encoder','URL Encoder & Decoder','developer','Encode special characters in URLs for safe transmission. Decode URL-encoded strings back to readable text.',['URL','ENCODE','DECODE']],

  /* ── New tools batch 2 ── */
  ['word-to-pdf','Word to PDF Converter','converter','Convert Word (.docx) documents to PDF directly in your browser. No upload — files stay on your device.',['DOCX','PDF','CONVERT']],
  ['markdown-to-html','Markdown to HTML Converter','converter','Convert Markdown text to clean HTML instantly. Preview the output and copy the generated HTML code.',['MARKDOWN','HTML','PREVIEW']],
  ['text-diff','Text Diff Checker','developer','Compare two texts side-by-side and highlight every addition, deletion and change between them.',['DIFF','COMPARE','TEXT']],
  ['regex-tester','Regex Tester','developer','Test regular expressions against any string. See matches highlighted in real time with capture group details.',['REGEX','PATTERN','TEST']],
  ['slug-generator','Slug Generator','developer','Convert any text into a clean, SEO-friendly URL slug. Removes special characters and formats with hyphens.',['SLUG','URL','SEO']],
  ['text-case-converter','Text Case Converter','developer','Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case.',['CASE','FORMAT','TEXT']],
  ['timestamp-converter','Timestamp Converter','developer','Convert UNIX timestamps to human-readable dates and back. Show current timestamp in seconds and milliseconds.',['UNIX','DATE','TIME']],
  ['ai-object-remover','AI Object Remover','image','Remove unwanted objects, people, text, wires and watermarks from photos. Paint over anything and the background rebuilds itself — free, in your browser.',['Content-Aware Fill','Brush & Rectangle','Privacy Safe']],
  ['ai-photo-enhancer','AI Photo Enhancer','image','Enhance photos automatically: fix exposure, color, noise and sharpness with intelligent auto-analysis in your browser. Presets for portraits, night shots, documents and old photos.',['Auto-Fix','Presets','Privacy Safe']],
  ['ai-image-upscaler','AI Image Upscaler','image','Upscale images 2x or 4x with AI directly in your browser. Enlarge photos, art and product shots with sharp edges and preserved detail — no upload, free.',['AI-Powered','2x / 4x','Privacy Safe']],
 ['background-remover','Background Remover','image','Remove backgrounds from images automatically using AI. Works on people, products, logos and objects. Downloads as transparent PNG.',['AI-Powered','Transparent PNG','Privacy Safe']],
  ['ocr-image-to-text','OCR Image to Text','image','Extract text from any image — screenshots, scanned documents, photos of signs or handwriting. Powered by Tesseract.js in your browser.',['Multi-Language','Copy & Download','Privacy Safe']],
  ['heic-to-jpg','HEIC to JPG Converter','image','Convert iPhone HEIC and HEIF photos to JPG or PNG online. Batch convert multiple files at once — no upload, no server, all in your browser.',['Batch','JPG & PNG','iPhone Photos']]
];

/* ── Search: moved here from app.js ──────────────────────────
   matchTools() (and its helpers) is called from features.js's nav
   search on EVERY page \u2014 homepage, tool pages, and now every
   static page \u2014 but only data.js loads everywhere search does.
   app.js is homepage-only. Keeping this in app.js meant the nav
   search on all 66 tool pages threw "matchTools is not defined"
   the instant anyone typed into it \u2014 a real bug, not moved
   here for tidiness. One definition, used by every page. */
var EXT_SYNONYMS={jpeg:'jpg',jpg:'jpeg',yml:'yaml',yaml:'yml',htm:'html',
  cleanup:'remove',
  'remove object':'object',
  'remove objects':'object',
  restore:'old photo',
  quality:'enhance'};
function normalizeSearchTerm(raw){
  var t=raw.toLowerCase().trim();
  if(t.charAt(0)==='.')t=t.slice(1);
  return t;
}

/* escapeHtml \u2014 minimal, used before wrapping any user-typed
   substring in <mark> so a search term can never inject HTML. */
function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* highlightMatch \u2014 wraps the first case-insensitive occurrence
   of `term` inside `text` in <mark>, HTML-escaping everything
   else. Falls back to plain escaped text if no match is found
   (e.g. the match came from the description/category, not the
   visible name). */
function highlightMatch(text,term){
  if(!term)return escapeHtml(text);
  var idx=text.toLowerCase().indexOf(term.toLowerCase());
  if(idx<0)return escapeHtml(text);
  return escapeHtml(text.slice(0,idx))+'<mark>'+escapeHtml(text.slice(idx,idx+term.length))+'</mark>'+escapeHtml(text.slice(idx+term.length));
}

/* matchTools \u2014 the shared ranking/matching logic. Checks name,
   description, category label AND slug (slugs like "jpg-to-png"
   catch extension searches that the display name alone might
   miss), plus a small extension-synonym pass. Name matches are
   ranked before description/category-only matches. */
function matchTools(rawTerm,limit){
  var t=normalizeSearchTerm(rawTerm);
  if(!t)return [];
  var syn=EXT_SYNONYMS[t];
  function hit(x){
    var name=x[1].toLowerCase(),desc=x[3].toLowerCase(),cat=CAT[x[2]].toLowerCase(),slug=x[0].toLowerCase();
    var terms=syn?[t,syn]:[t];
    return terms.some(function(term){
      return name.indexOf(term)>-1||slug.indexOf(term)>-1||desc.indexOf(term)>-1||cat.indexOf(term)>-1;
    });
  }
  function nameHit(x){
    var name=x[1].toLowerCase(),slug=x[0].toLowerCase();
    var terms=syn?[t,syn]:[t];
    return terms.some(function(term){ return name.indexOf(term)>-1||slug.indexOf(term)>-1; });
  }
  var all=TOOLS.filter(hit);
  all.sort(function(a,b){
    var an=nameHit(a)?0:1, bn=nameHit(b)?0:1;
    return an-bn;
  });
  return all.slice(0,limit||8);
}

const bySlug=s=>TOOLS.find(t=>t[0]===s);

/* ---------- home grid ---------- */
let activeCat='all',term='';
const tabsEl=$('#tabs'),gridEl=$('#grid');

AI_SUMMARY['ai-object-remover']='Removes objects via brush/rectangle mask + content-aware fill on-device (multiscale diffusion reconstruction + patch-based texture synthesis). Optional cloud tier for LaMa/diffusion inpainting. Input: JPG/PNG/WebP/AVIF ≤16MP. Output: PNG/JPG/WEBP.';
AI_SUMMARY['ai-photo-enhancer']='Enhances photos via on-device auto-analysis (histogram, white balance, noise, sharpness) driving a correction pipeline: tone, color, edge-safe denoise, clarity, gated sharpening. Optional cloud engine adds neural face restoration. Input: JPG/PNG/WebP/AVIF. Output: PNG/JPG/WEBP.';
AI_SUMMARY['ai-image-upscaler']='Upscales images 2x/4x using an ESRGAN super-resolution model in the browser (UpscalerJS + TF.js from CDN), with an automatic high-quality resampling fallback. Input: JPG/PNG/WebP/AVIF. Output: PNG/JPG/WEBP. No upload.';
AI_SUMMARY['background-remover']='Removes image backgrounds using AI (ONNX WASM). Input: JPG/PNG/WebP. Output: transparent PNG. Model runs entirely in the browser — no file upload.';
AI_SUMMARY['ocr-image-to-text']='Extracts text from images using Tesseract.js OCR. Supports English, Hindi, French, German, Spanish, Japanese, Chinese, Arabic. Output: plain text.';
AI_SUMMARY['heic-to-jpg']='Converts iPhone HEIC/HEIF photos to JPG or PNG using heic2any. Batch processing supported. No upload required — runs in browser.';
FAQ['ai-image-upscaler']=[["How does the AI upscaling work?", "The default engine runs an ESRGAN super-resolution model directly in your browser (downloaded once from a CDN, then cached). If your browser can't run the model, the tool automatically falls back to high-quality progressive resampling with edge-aware sharpening \u2014 and always tells you which engine produced your result."], ["Is my image uploaded anywhere?", "No. Both engines process your image entirely on your device. The only network activity is downloading the AI model file itself \u2014 your image never leaves your browser."], ["Does it preserve transparency?", "Yes \u2014 PNG and WEBP output keep the alpha channel intact. JPG doesn't support transparency, so transparent areas are flattened onto white for that format only."], ["What's the maximum image size?", "Input is capped at 25 megapixels and output at 64 megapixels to keep processing stable in browser memory. For very large photos, use 2\u00d7 rather than 4\u00d7."]];
FAQ['background-remover']=[["How long does background removal take?", "AI mode downloads the neural model once \u2014 roughly 20-40 MB, cached by your browser \u2014 so the first run takes 20-60 seconds depending on your connection. After that, removals typically take 2-8 seconds. Solid mode is instant and needs no download at all."], ["What image types work best?", "AI mode handles people, products, animals and complex scenes \u2014 including hair and soft edges. For logos or product shots on a flat colour, Solid mode is instant and gives razor-sharp edges. Extremely busy scenes where subject and background share fine detail can still challenge any remover."], ["Is my photo sent to a server?", "No. Your photo is processed entirely in your browser using WebAssembly \u2014 it never uploads anywhere. The AI model file itself is downloaded to your device from a CDN once (like any script or font a website loads), then cached. Your image never travels in the other direction."]];
FAQ['ocr-image-to-text']=[["What languages are supported?", "English, Hindi, French, German, Spanish, Japanese, Chinese Simplified, and Arabic. Select the language before processing for best accuracy. Multi-language documents should use the primary language of the text."], ["What image quality do I need for good results?", "Images should be at least 300 DPI with clear, high-contrast text. Blurry, low-light or heavily compressed images reduce accuracy. Printed text is recognised more accurately than handwriting."], ["Can it read handwritten text?", "The tool can recognise clear, neat handwriting in some cases, but accuracy is lower than for printed text. For best handwriting results, use a high-resolution scan with good lighting."]];
FAQ['heic-to-jpg']=[["Why are my iPhone photos in HEIC format?", "Apple introduced HEIC (High Efficiency Image Container) in iOS 11 as the default camera format. HEIC files are typically 50% smaller than JPG at the same quality. However, many apps and platforms still don't support HEIC, making conversion necessary."], ["Should I choose JPG or PNG output?", "Choose JPG for smaller file sizes \u2014 ideal for sharing, social media, and general use. Choose PNG if you need lossless quality (no compression artifacts), for example when converting product photos or images you will edit further."], ["Can I convert multiple HEIC files at once?", "Yes \u2014 the tool supports batch conversion. Drop multiple HEIC files at once and they are all converted and available for individual download."]];
TOOL_ARTICLES['background-remover']=[ 'remove-background-image-free' ];
TOOL_ARTICLES['ocr-image-to-text']=[ 'exif-data-privacy-guide' ];
TOOL_ARTICLES['heic-to-jpg']=[ 'jpg-vs-png-vs-webp' ];