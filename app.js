/* TARUMAK STUDIO — app.js
   Loaded LAST. All files below must load before this.
   Load order: config → utils → data → [tools] → blog-data → features → app
   ─────────────────────────────────────────────────────────────────────
   NOT declared here (already in other files):
     AFFS     → config.js
     PSIZE    → pdf-tools.js
     ARTICLES → blog-data.js
     buildGrid, setActiveNav → features.js
   ================================================================ */

/* counts(), buildTabs() — moved to features.js (the /tools directory
   page loads features.js but not app.js, which is homepage-only). */

/* Affiliate banner builder (AFFS is in config.js, not here) */
function buildAffBanners(cat){
  var items=(AFFS[cat]||[]).concat(AFFS.all);
  return '<div class="aff-section"><div class="aff-label">Recommended Tools</div>'
    +items.map(function(a){return '<a class="aff-card" href="'+a.url+'" target="_blank" rel="noopener sponsored"><div class="aff-ico">'+a.ico+'</div><div class="aff-info"><strong>'+a.name+'</strong><span>'+a.desc+'</span></div><span class="aff-cta">'+a.cta+' \u2192</span></a>';}).join('')+'</div>';
}

/* Blog renderers */
function buildBlogIndex(){
  var slugs=Object.keys(ARTICLES);
  return '<div class="wrap" style="max-width:1240px;padding:40px 24px 80px"><div class="crumb"><a href="/">Home</a> &rsaquo; <span>Blog</span></div>'
    +'<h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:32px 0 10px">Blog & Guides</h1>'
    +'<p style="font-size:16px;color:var(--text-dim);margin-bottom:8px">Free guides for designers, marketers and developers. Every article links to free tools you can use right now.</p>'
    +'<div class="blog-grid">'+slugs.map(function(slug){var a=ARTICLES[slug];
      return '<a href="/article-'+slug+'.html" class="blog-card" style="text-decoration:none">'
        +'<a class="bc-cat" href="'+(CAT_SLUGS[a.cat]||'#')+'" style="text-decoration:none">'+a.cat+'</a>'
        +'<h3>'+a.title+'</h3>'
        +'<p>'+a.excerpt+'</p>'
        +'<div class="bc-meta"><span>'+a.date+'</span><span>'+a.read+' read</span></div></div>';
    }).join('')+'</div></div>';
}

function buildArticlePage(slug){
  var a=ARTICLES[slug];if(!a)return buildBlogIndex();
  if(!a.html||a.html.length<500){window.location.href='/article-'+slug+'.html';return '';}
  var all=Object.keys(ARTICLES);var idx=all.indexOf(slug);
  var prev=all[idx-1],next=all[idx+1];
  return '<div class="wrap" style="max-width:1240px"><div class="article-body">'
    +'<div class="crumb"><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; <a href="'+(CAT_SLUGS[a.cat]||'#')+'" style="color:var(--text-dim)">'+a.cat+'</a></div>'
    +'<h1>'+a.title+'</h1>'
    +'<div class="a-meta"><span>'+a.date+'</span><span>'+a.read+' read</span><span style="background:rgba(99,102,241,.1);color:var(--p1);padding:2px 10px;border-radius:100px">'+a.cat+'</span></div>'
    +a.html
    +'<div style="display:flex;gap:10px;margin-top:40px;padding-top:24px;border-top:1px solid var(--border)">'
    +(prev?'<a href="/article-'+prev+'.html" style="flex:1;padding:14px;border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none">\u2190 '+ARTICLES[prev].title.substring(0,40)+'...</a>':'')
    +(next?'<a href="/article-'+next+'.html" style="flex:1;padding:14px;border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;text-align:right">'+ARTICLES[next].title.substring(0,40)+'... \u2192</a>':'')
    +'</div>'
    +buildAffBanners((a.cat==='PDF Tools'?'pdf':a.cat==='Marketing Designer'?'marketing':'image'))
    +'</div></div>';
}


/* Category → landing page URL map */
var CAT_SLUGS={'Image Tools':'/image-tools','PDF Tools':'/pdf-tools','Developer Tools':'/developer-tools','Marketing Designer':'/marketing-tools','Converter Tools':'/converter-tools'};

function openBlog(slug){
  homeEl.hidden=true;toolEl.hidden=false;mm.classList.remove('open');
  setActiveNav('blog');
  toolEl.innerHTML=slug&&ARTICLES[slug]?buildArticlePage(slug):buildBlogIndex();
  fadeIn(toolEl);buildToolArticles(slug);scrollTo(0,0);
  window._ga('page_view',{page:'blog'+(slug?'/'+slug:'')});
}

/* Core navigation: go, homeEl, showHome, noInit, openTool, route */
function go(path){/* LEGACY SHIM \u2014 internal navigation uses real URLs since the
  routing migration; setting the hash feeds the redirect layer in route(),
  which forwards to the canonical page. Kept only for old external callers. */
  location.hash=path?('#/'+path):'#/';}
const homeEl=$('#home'),toolEl=$('#tool');

/* ──────────────────────────────────────────────────
   buildCategoryCards — renders premium category grid
   on homepage. Reads CAT, CAT_META, ICON, TOOLS to
   produce one .cat-card per category with: icon,
   title, tagline, popular tool chips, count, arrow.
────────────────────────────────────────────────── */
/* buildCategoryCards \u2014 redesigned as compact navigation, not a
   feature showcase. Two-row layout (icon+title+arrow, then a
   one-line description) replaces the old vertical stack of
   icon-block / title / description / 4-chip-row / divider /
   footer. Height cut from ~230px to ~120-130px (roughly 45%),
   comfortably past the requested 30-40% while staying above the
   comfortable touch-target floor. Popular-tool chips reduced from
   4 to exactly 1 \u2014 enough to hint at content, not enough to
   compete with Featured Tools below it. */
function buildCategoryCards(){
  const grid=document.getElementById('cat-grid');
  if(!grid||typeof CAT_META==='undefined')return;
  const order=['image','pdf','developer','marketing','converter'];
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  grid.innerHTML=order.map(cat=>{
    const meta=CAT_META[cat];if(!meta)return '';
    const count=TOOLS.filter(t=>t[2]===cat).length;
    /* Real popular-tools list (top 3 of the same curated CAT_META.popular
       array the mega menu already uses) instead of a single "Incl. X"
       hint — genuine reuse, not new data authored a third time. */
    const popularTools=meta.popular.map(slug=>bySlug(slug)).filter(Boolean).slice(0,3);
    const popularHtml=popularTools.length
      ? '<ul class="cc-popular">'+popularTools.map(t=>'<li>'+t[1]+'</li>').join('')+'</ul>'
      : '';
    return ''+
      '<a class="cat-card" data-cat="'+cat+'" href="/'+cat+'-tools" aria-label="Browse '+CAT[cat]+' — '+count+' tools">'+
        '<div class="cc-row">'+
          '<div class="cc-ico">'+ICON[cat]+'</div>'+
          '<div class="cc-heading"><h3>'+CAT[cat]+'</h3><span class="cc-count">'+count+' tools</span></div>'+
          '<span class="cc-arrow">'+arrow+'</span>'+
        '</div>'+
        '<p class="cc-tag">'+meta.tagline+'</p>'+
        popularHtml+
      '</a>';
  }).join('');
}

/* ──────────────────────────────────────────────────
   buildFeaturedTools — renders the 8 flagship-tool
   cards on the homepage. Reads FEATURED[] (slug+hook)
   from data.js, validates each slug against TOOLS via
   bySlug, and skips silently if a slug doesn't exist
   (e.g. tool renamed/removed) so the section never
   shows a broken card.
────────────────────────────────────────────────── */
function buildFeaturedTools(cat){
  cat=cat||'all';
  const grid=document.getElementById('feat-grid');
  if(!grid||typeof FEATURED==='undefined')return;
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  /* "All" shows the curated flagship 8. A specific category swaps to
     that category's top picks (CAT_META.popular) so every filter pill
     always shows real, relevant tools — never an empty grid. */
  let items;
  if(cat==='all'){
    items=FEATURED;
  } else {
    const meta=CAT_META&&CAT_META[cat];
    items=meta?meta.popular.map(slug=>({slug:slug,hook:null})):[];
  }

  const NEW_SLUGS=new Set(['ai-object-remover','ai-photo-enhancer','ai-image-upscaler']);
  grid.innerHTML=items.map(f=>{
    const t=bySlug(f.slug);
    if(!t)return '';
    const hook=f.hook||t[3];
    const preview=FEATURED_PREVIEWS[f.slug]?FEATURED_PREVIEWS[f.slug]():'';
    return ''+
      '<a class="feat-card cat-'+t[2]+'" href="/'+t[0]+'" aria-label="Open '+t[1]+'">'+
        (NEW_SLUGS.has(t[0])?'<span class="fc-badge-new">NEW</span>':'')+
        '<div class="fc-head">'+
          '<div class="fc-ico">'+ICON[t[2]]+'</div>'+
          '<h3>'+t[1]+'</h3>'+
        '</div>'+
        (preview?'<div class="fc-preview-panel">'+preview+'</div>':'')+
        '<p class="fc-hook">'+hook+'</p>'+
        '<span class="fc-cta">Try Now '+arrow+'</span>'+
      '</a>';
  }).join('');
}

/* ──────────────────────────────────────────────────
   FEATURED_PREVIEWS

   Honest breakdown of what's REAL vs REPRESENTATIVE below,
   because "should every card show real output" deserves a
   real answer, not a blanket yes:

   GENUINELY REAL (computed live, right here, every render):
     - Regex Tester   — an actual RegExp executed against a
                         sample string via .exec(); the highlighted
                         span is the real match, not hardcoded HTML.
     - Markdown→HTML  — a real (small, inline) markdown transform
                         run against real markdown source text.
   Both are free: no external library, no network request, no
   asset — just JS that already ships with the page.

   REPRESENTATIVE / STATIC (and why, honestly):
     - Background Remover, OCR, Image Compressor, Word→PDF,
       HEIC→JPG, QR Generator all need either a real photo/
       document asset we don't host on the homepage, or a heavy
       external library (Tesseract.js for OCR, @imgly for BG
       removal, mammoth.js for DOCX, heic2any, a QR-encoding
       library) that would have to load on first paint just to
       render a decorative preview. That directly contradicts
       "fast loading, no heavy animations" — so these stay as
       polished, honest illustrations rather than fake-real output.
────────────────────────────────────────────────── */
const FEATURED_PREVIEWS={

  'background-remover':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-row-label">Before</span><span class="fcp-photo fcp-before"><span class="fcp-subject"></span></span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-row-label">After</span><span class="fcp-photo fcp-after"><span class="fcp-subject"></span></span></div>'+
    '</div>',

  /* Reuses the same generic "photo" glyph (fcp-img-mini) on both rows —
     deliberately: unlike background-remover this isn't a transparency
     transform, it's the same photo minus clutter, so the icon should
     look like the same photo, not a different visual language. */
  'ai-object-remover':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-row-label">With clutter</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-row-label">Cleaned up</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
    '</div>',

  'ai-photo-enhancer':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-row-label">Flat &amp; dull</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-row-label">Sharp &amp; vivid</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
    '</div>',

  'ai-image-upscaler':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-row-label">1\u00d7</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-row-label">4\u00d7, still sharp</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
    '</div>',

  'image-compressor':()=>
    '<div class="fc-preview fc-preview-size">'+
      '<div class="fcp-bar-row">'+
        '<span class="fcp-bar fcp-bar-before" style="width:100%"></span>'+
        '<span class="fcp-size-label">3.6 MB</span>'+
      '</div>'+
      '<div class="fcp-bar-row">'+
        '<span class="fcp-bar fcp-bar-after" style="width:19%"></span>'+
        '<span class="fcp-size-label fcp-size-label-accent">540 KB</span>'+
      '</div>'+
    '</div>',

  'ocr-image-to-text':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-row-label">Scanned image</span><span class="fcp-img-mini"><i></i><i></i><i></i></span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-row-label">Extracted text</span><span class="fcp-text-mini">Invoice #4471<br>Total: $214.00</span></div>'+
    '</div>',

  'pdf-merger':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-row-label">3 separate PDFs</span><span class="fcp-file fcp-file-pdf">PDF</span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-row-label">One combined file</span><span class="fcp-file fcp-file-pdf">PDF</span></div>'+
    '</div>',

  'word-to-pdf':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-file fcp-file-docx">DOCX</span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-file fcp-file-pdf">PDF</span></div>'+
    '</div>',

  'heic-to-jpg':()=>
    '<div class="fc-preview fc-preview-stack">'+
      '<div class="fcp-row"><span class="fcp-file fcp-file-heic">HEIC</span></div>'+
      '<span class="fcp-down-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></span>'+
      '<div class="fcp-row"><span class="fcp-file fcp-file-jpg">JPG</span></div>'+
    '</div>',

  /* GENUINELY REAL: pattern + sample string are real JS values run
     through an actual RegExp.exec() call below. The highlighted
     portion is the true match span, not a hand-written string. */
  'regex-tester':()=>{
    const pattern=/(\d{3})-(\d{4})/;
    const sample='Call 555-0148 for support';
    const m=pattern.exec(sample);
    let highlighted=sample;
    if(m){
      const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      highlighted=esc(sample.slice(0,m.index))+'<mark>'+esc(m[0])+'</mark>'+esc(sample.slice(m.index+m[0].length));
    }
    return '<div class="fc-preview fc-preview-regex">'+
      '<code class="fcp-pattern">/(\\d{3})-(\\d{4})/</code>'+
      '<code class="fcp-code">'+highlighted+'</code>'+
    '</div>';
  },

  'qr-code-generator':()=>
    '<div class="fc-preview fc-preview-qr">'+
      '<span class="fcp-url">tarumakstudio.com</span>'+
      '<span class="fcp-mid-arrow">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>'+
      '</span>'+
      '<svg class="fcp-qr-mini" viewBox="0 0 28 28" fill="currentColor">'+
        '<rect x="0" y="0" width="8" height="8" rx="1.5"/><rect x="2" y="2" width="4" height="4" rx="0.8" fill="var(--bg-2)"/>'+
        '<rect x="20" y="0" width="8" height="8" rx="1.5"/><rect x="22" y="2" width="4" height="4" rx="0.8" fill="var(--bg-2)"/>'+
        '<rect x="0" y="20" width="8" height="8" rx="1.5"/><rect x="2" y="22" width="4" height="4" rx="0.8" fill="var(--bg-2)"/>'+
        '<rect x="11" y="2" width="2.5" height="2.5"/><rect x="16" y="11" width="2.5" height="2.5"/>'+
        '<rect x="11" y="11" width="2.5" height="2.5"/><rect x="11" y="16" width="2.5" height="2.5"/>'+
        '<rect x="20" y="11" width="2.5" height="2.5"/><rect x="11" y="20" width="2.5" height="2.5"/>'+
        '<rect x="16" y="20" width="2.5" height="2.5"/><rect x="20" y="16" width="2.5" height="2.5"/>'+
      '</svg>'+
    '</div>',

  /* GENUINELY REAL: this is a real (deliberately minimal) markdown
     transform \u2014 bold/italic/heading only \u2014 run against real
     markdown source text below. Not the full `marked` library used
     by the actual tool (that stays CDN-loaded, on the tool page
     only), but the transform IS actually executed here, not faked. */
  'markdown-to-html':()=>{
    /* Real newlines (not escaped \n) so the heading regex only
       matches its own line -- fixes an earlier version where the
       heading match greedily absorbed the rest of the text because
       the source still had literal backslash-n at match time. */
    const src='## Release notes\n**v2.4** adds _dark mode_.';
    function tinyMarkdown(md){
      const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return md.split('\n').map(function(line){
        var headingMatch=line.match(/^## (.+)$/);
        if(headingMatch)return '<strong class="fcp-h">'+esc(headingMatch[1])+'</strong>';
        return esc(line)
          .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
          .replace(/_(.+?)_/g,'<i>$1</i>');
      }).join('<br>');
    }
    return '<div class="fc-preview fc-preview-md">'+
      '<code class="fcp-code fcp-code-src">'+src.split('\n').map(l=>l.replace(/&/g,'&amp;')).join('<br>')+'</code>'+
      '<span class="fcp-mid-arrow">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>'+
      '</span>'+
      '<span class="fcp-html-mini">'+tinyMarkdown(src)+'</span>'+
    '</div>';
  }
};


function wireFilterPills(){
  const wrap=document.getElementById('filterPills');
  if(!wrap||wrap.dataset.wired)return;
  wrap.dataset.wired='1';

  function selectPill(btn,{focus}={}){
    wrap.querySelectorAll('.fp-pill').forEach(p=>{
      p.classList.remove('active');
      p.setAttribute('aria-selected','false');
      p.tabIndex=-1;
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    btn.tabIndex=0;
    if(focus)btn.focus();
    const grid=document.getElementById('feat-grid');
    if(grid){
      grid.classList.add('fading');
      setTimeout(()=>{
        buildFeaturedTools(btn.dataset.cat);
        grid.classList.remove('fading');
      },140);
    }
    /* Latest Guides reacts to the SAME pill \u2014 selecting a category
       filters both the tools grid and the blog strip together, so
       the guides stop feeling like an unrelated section. */
    const blogGrid=document.getElementById('blog-strip-grid');
    if(blogGrid){
      blogGrid.classList.add('fading');
      setTimeout(()=>{
        buildLatestArticles(btn.dataset.cat);
        blogGrid.classList.remove('fading');
      },140);
    }
  }

  wrap.addEventListener('click',e=>{
    const btn=e.target.closest('.fp-pill');
    if(!btn)return;
    selectPill(btn);
  });

  /* Roving tabindex + arrow-key navigation \u2014 standard WAI-ARIA
     tablist pattern. Only the active pill is in the tab order; arrow
     keys move focus AND selection between pills, Home/End jump to
     the first/last pill. */
  wrap.addEventListener('keydown',e=>{
    const pills=Array.from(wrap.querySelectorAll('.fp-pill'));
    const current=document.activeElement.closest('.fp-pill');
    if(!current)return;
    const i=pills.indexOf(current);
    let next=null;
    if(e.key==='ArrowRight')next=pills[(i+1)%pills.length];
    else if(e.key==='ArrowLeft')next=pills[(i-1+pills.length)%pills.length];
    else if(e.key==='Home')next=pills[0];
    else if(e.key==='End')next=pills[pills.length-1];
    if(next){ e.preventDefault(); selectPill(next,{focus:true}); }
  });
}


/* ──────────────────────────────────────────────────
   buildLatestArticles — renders the "Latest guides"
   homepage strip from blog-data.js ARTICLES. Takes the
   4 most recently added entries (Object.keys preserves
   insertion order for string keys in JS).
────────────────────────────────────────────────── */
function buildLatestArticles(cat){
  cat=cat||'all';
  const grid=document.getElementById('blog-strip-grid');
  if(!grid||typeof ARTICLES==='undefined')return;
  const CLOCK_ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';
  const catKeyByLabel={};
  if(typeof CAT!=='undefined'){
    Object.keys(CAT).forEach(k=>{ catKeyByLabel[CAT[k]]=k; });
  }

  /* When a category pill is selected, show guides tagged for that
     category instead of the global latest-4 \u2014 ties the blog
     directly to whatever the visitor is currently browsing rather
     than sitting as an unrelated section. Falls back to the newest
     articles overall if a category has fewer than 4 matches, so the
     grid never looks sparse. */
  let slugs;
  const allSlugs=Object.keys(ARTICLES);
  if(cat==='all'){
    slugs=allSlugs.slice(-4).reverse();
  } else {
    const matched=allSlugs.filter(s=>catKeyByLabel[ARTICLES[s].cat]===cat).slice(-4).reverse();
    if(matched.length>=4){
      slugs=matched;
    } else {
      const fill=allSlugs.slice().reverse().filter(s=>!matched.includes(s)).slice(0,4-matched.length);
      slugs=matched.concat(fill);
    }
  }

  grid.innerHTML=slugs.map((slug,i)=>{
    const a=ARTICLES[slug];
    if(!a)return '';
    const key=catKeyByLabel[a.cat]||'image';
    const icoSvg=(typeof ICON!=='undefined'&&ICON[key])?ICON[key]:'';
    return ''+
      '<a class="blog-strip-card cat-'+key+'" href="/article-'+slug+'.html">'+
        (i===0?'<span class="bsc-featured">Featured</span>':'')+
        getArticleThumb(slug, key, icoSvg)+
        '<span class="bsc-cat">'+a.cat+'</span>'+
        '<h3>'+a.title+'</h3>'+
        '<p>'+a.excerpt+'</p>'+
        '<div class="bsc-meta"><span>'+a.date+'</span><span class="bsc-dot">&bull;</span><span class="bsc-read">'+CLOCK_ICO+a.read+' read</span></div>'+
      '</a>';
  }).join('');
}

/* ──────────────────────────────────────────────────
   getArticleThumb \u2014 bespoke, topic-specific mini
   illustrations for guides where a generic category icon
   undersells the content (a HEIC guide showing the same
   plain "image" icon as a compression guide isn't very
   informative). Matched by slug KEYWORD, not a hardcoded
   list of specific articles, so any future guide on the
   same topic automatically gets the right treatment.
   Falls back to the existing category-icon block for
   everything else \u2014 CSS/SVG only, no real photography,
   same honesty standard as the Featured Tools previews.
────────────────────────────────────────────────── */
function getArticleThumb(slug, key, fallbackIcoSvg){
  if(/heic|iphone/i.test(slug)){
    return '<div class="bsc-thumb bsc-thumb-heic">'+
      '<span class="bsct-phone"><span class="bsct-phone-notch"></span></span>'+
      '<span class="bsct-heic-badge">HEIC</span>'+
    '</div>';
  }
  if(/\bocr\b|image-to-text|text-extract/i.test(slug)){
    return '<div class="bsc-thumb bsc-thumb-ocr">'+
      '<span class="bsct-scanlines"><i></i><i></i><i></i></span>'+
      '<span class="bsct-ocr-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>'+
      '<span class="bsct-textlines"><i></i><i></i></span>'+
    '</div>';
  }
  if(/remov.*background|background.*remov/i.test(slug)){
    return '<div class="bsc-thumb bsc-thumb-bgr">'+
      '<span class="bsct-swatch bsct-swatch-before"><span class="bsct-subject"></span></span>'+
      '<span class="bsct-swatch bsct-swatch-after"><span class="bsct-subject"></span></span>'+
    '</div>';
  }
  if(/timestamp|json|regex|base64|markdown|slug-generator|text-diff|html-to-pdf/i.test(slug)){
    return '<div class="bsc-thumb bsc-thumb-code">'+
      '<span class="bsct-editor-bar"><i></i><i></i><i></i></span>'+
      '<span class="bsct-editor-lines"><i></i><i></i><i></i></span>'+
    '</div>';
  }
  return '<div class="bsc-thumb"><span class="bsc-thumb-ico">'+fallbackIcoSvg+'</span></div>';
}



/* ──────────────────────────────────────────────────
   buildNavToolsDropdown — lightweight category dropdown
   under the "Tools" nav link. 5 categories, each with
   its 3 most popular tools (from CAT_META) + a direct
   category link. Pure hover/focus CSS panel, no JS state.
────────────────────────────────────────────────── */
/* buildNavToolsDropdown() removed \u2014 the Tools mega menu is now baked once at
   build time (header-chrome.js), identically for every page including this
   one, and its own JS wiring (mega-menu.js) runs once on load. Re-running a
   dynamic rebuild here on every route() call would wipe out the baked mega
   menu's data script and event listeners on every homepage navigation. */


/* ──────────────────────────────────────────────────
   wireHeroSearch — prominent hero search bar. Separate
   from the nav Cmd+K search (which stays focused on
   #navSearch since it's the only search box visible once
   the hero scrolls out of view). Same filtering pattern,
   larger result set, basic keyboard navigation.
────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────
   Shared search helpers \u2014 used by BOTH the hero search
   and the persistent nav search, so behaviour (extension
   matching, highlighting, ranking) stays identical no matter
   which search box the visitor is using.
────────────────────────────────────────────────── */

/* normalizeSearchTerm \u2014 strips a leading "." so typing a
   file extension like ".png" or ".pdf" matches naturally
   against tool names/slugs (which contain "png"/"pdf" as
   plain text, not literally ".png"). Also folds a couple of
   very common extension synonyms so "jpeg" also finds "jpg"
   tools and vice versa. */

/* ── Hero AI demo loop ─────────────────────────────────────────────────
   Cycles the hero illustration through the 4 AI tools' effects (~3s hold,
   600ms CSS transitions — see .ai-demo styles). All visuals are CSS class
   swaps; this driver only rotates classes, badge text and the link href.
   Sub-steps: upscale shows 2× then 4× mid-state; erase shows the dashed
   ring first, then a small secondary element (not the main subject)
   vanishing. Hover/focus pauses the state advance, so the link's href
   can't change out from under someone between hovering and clicking.
   Under prefers-reduced-motion the loop never starts and the panel stays
   on its static initial state (Background Remover result) — matching how
   the old card cluster froze to a fixed rotation rather than spinning
   slower. */
function wireAiDemo(){
  var demo=document.getElementById('aiDemo');
  var badge=document.getElementById('aiDemoBadge');
  if(!demo||!badge)return;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion)return; /* static st-bg end-state, set in the markup */
  var STATES=[
    {cls:'st-bg',      slug:'background-remover', label:'Background Remover'},
    {cls:'st-enhance', slug:'ai-photo-enhancer',  label:'AI Photo Enhancer'},
    {cls:'st-upscale', slug:'ai-image-upscaler',  label:'AI Image Upscaler'},
    {cls:'st-erase',   slug:'ai-object-remover',  label:'AI Object Remover'}
  ];
  var idx=0,subTimers=[],paused=false;
  function clearSubs(){subTimers.forEach(clearTimeout);subTimers=[];}
  function apply(){
    var s=STATES[idx];
    clearSubs();
    demo.className='ai-demo '+s.cls;
    demo.setAttribute('href','/'+s.slug);
    /* badge: quick fade-out, swap text, fade back — 300ms transition */
    badge.classList.add('ai-badge-swap');
    subTimers.push(setTimeout(function(){badge.textContent=s.label;badge.classList.remove('ai-badge-swap');},300));
    if(s.cls==='st-upscale'){
      subTimers.push(setTimeout(function(){demo.classList.add('st-x4');},1500));
    }
    if(s.cls==='st-erase'){
      subTimers.push(setTimeout(function(){demo.classList.add('st-erased');},1300));
    }
  }
  apply();
  setInterval(function(){
    if(paused)return; /* href/state must stay put while the user is looking at or focused on it */
    idx=(idx+1)%STATES.length;apply();
  },3000);
  /* Hover or keyboard focus freezes the current state so the link's
     destination never changes out from under someone mid-click — the
     visible hover/focus affordance above is what makes clicking feel
     intentional in the first place, so the target has to hold still
     for that same duration. */
  demo.addEventListener('mouseenter',function(){paused=true;});
  demo.addEventListener('mouseleave',function(){paused=false;});
  demo.addEventListener('focus',function(){paused=true;});
  demo.addEventListener('blur',function(){paused=false;});
}

function wireHeroSearch(){
  const input=document.getElementById('heroSearch');
  const results=document.getElementById('heroSearchResults');
  const popular=document.getElementById('hsPopular');
  if(!input||!results)return;
  let activeIndex=-1;

  /* Rotating placeholder \u2014 an aria-hidden overlay span (NOT the native
     placeholder attribute) that types out real example searches
     character-by-character with a blinking cursor, holds, backspaces,
     and moves to the next. Doubles as implicit tool discovery. Pauses
     whenever the input has a value or focus, and under
     prefers-reduced-motion falls back to instant full-string swaps
     (the pre-typing behaviour) with no cursor. */
  const rotatorEl=document.getElementById('hsRotator');
  const examples=['Search "Compress PDF"','Search "Background Remover"','Search "OCR Image"','Search "Merge PDF"','Search "JPG to PNG"','Search "Image Resizer"','Search "SVG to PNG"','Search "Word to PDF"'];
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(rotatorEl){
    let exIndex=0;

    /* "Paused" = input has a value OR is currently focused, even
       if empty. Only an EMPTY, BLURRED input shows the rotator \u2014
       matches the requested "stop on focus/typing, resume only
       when empty AND blurred" behaviour exactly. */
    function isPaused(){ return !!input.value || document.activeElement===input; }

    function paintPlaceholder(){
      if(isPaused()){ rotatorEl.classList.add('hs-rotator-hidden'); return; }
      rotatorEl.textContent=examples[exIndex];
      rotatorEl.classList.remove('hs-rotator-hidden');
    }

    if(reduceMotion){
      /* Reduced motion: the pre-existing behaviour, unchanged — full
         strings swap instantly on a timer, no character animation, no
         cursor. (Under reduce, the swap interval itself also never runs
         character steps, so nothing here merely "slows down".) */
      paintPlaceholder();
      setInterval(()=>{
        if(isPaused())return;
        exIndex=(exIndex+1)%examples.length;
        paintPlaceholder();
      },2600);
    }else{
      /* Typing effect: type each example character-by-character with a
         blinking cursor (CSS .hs-typing::after), hold ~1.2s, backspace,
         move to the next. Same examples list, same isPaused() rules,
         same overlay element as the crossfade version it replaces —
         this is that mechanism evolved, not a second parallel system.
         The input's aria-label ("Search tools") is static and never
         touched mid-animation; the overlay itself is aria-hidden. */
      rotatorEl.classList.add('hs-typing');
      let pos=0,phase='type',timer=null;
      const TYPE_MS=46,ERASE_MS=24,HOLD_MS=1200,BETWEEN_MS=350;
      function step(){
        if(isPaused()){
          /* Fully reset so resuming starts a fresh example cleanly */
          rotatorEl.classList.add('hs-rotator-hidden');
          rotatorEl.textContent='';pos=0;phase='type';
          timer=setTimeout(step,500);
          return;
        }
        rotatorEl.classList.remove('hs-rotator-hidden');
        const full=examples[exIndex];
        if(phase==='type'){
          pos++;
          rotatorEl.textContent=full.slice(0,pos);
          if(pos>=full.length){phase='hold';timer=setTimeout(step,HOLD_MS);}
          else timer=setTimeout(step,TYPE_MS);
        }else if(phase==='hold'){
          phase='erase';timer=setTimeout(step,ERASE_MS);
        }else if(phase==='erase'){
          pos--;
          rotatorEl.textContent=full.slice(0,Math.max(0,pos));
          if(pos<=0){phase='type';exIndex=(exIndex+1)%examples.length;timer=setTimeout(step,BETWEEN_MS);}
          else timer=setTimeout(step,ERASE_MS);
        }
      }
      step();
    }

    input.addEventListener('focus',()=>{ rotatorEl.classList.add('hs-rotator-hidden'); });
    input.addEventListener('blur',()=>{ if(reduceMotion)paintPlaceholder(); });
    input.addEventListener('input',()=>{ if(input.value)rotatorEl.classList.add('hs-rotator-hidden'); });
  }

  /* Popular-searches quick chips \u2014 shown only when the input is
     empty and focused, so first-time visitors get an instant sense of
     what's searchable without having to type anything. Hidden the
     moment real results are showing or the input has text. */
  if(popular){
    popular.querySelectorAll('button[data-slug]').forEach(btn=>{
      btn.addEventListener('click',()=>{ location.href='/'+btn.dataset.slug; });
    });
    /* Category list rendered from real ICON/CAT data (not hardcoded
       HTML) so it always matches the site's actual 5 categories and
       reuses the exact same SVG icon language used everywhere else \u2014
       no emoji, for OS-rendering consistency. */
    const catList=document.getElementById('hsCatList');
    if(catList && typeof CAT!=='undefined' && typeof ICON!=='undefined'){
      const order=['image','pdf','developer','marketing','converter'];
      catList.innerHTML=order.map(c=>
        '<button type="button" data-cat="'+c+'"><span class="hs-item-ico">'+ICON[c]+'</span>'+CAT[c]+'</button>'
      ).join('');
      catList.querySelectorAll('button[data-cat]').forEach(btn=>{
        btn.addEventListener('click',()=>{ go(btn.dataset.cat); });
      });
    }
  }
  /* Recently used \u2014 reuses the same RK localStorage key that
     tool-visit tracking already writes to (see features.js), so this
     works immediately with zero new tracking code. Hidden entirely
     if the visitor has no history yet. */
  var HS_DOT_ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4"/></svg>';
  function renderRecent(){
    const section=document.getElementById('hsRecentSection');
    const chips=document.getElementById('hsRecentChips');
    if(!section||!chips||typeof RK==='undefined')return;
    try{
      const entries=(typeof getRecentWithTime==='function')?getRecentWithTime():[];
      const valid=entries.map(e=>({tool:bySlug(e.slug),ts:e.ts})).filter(x=>x.tool).slice(0,4);
      if(!valid.length){ section.style.display='none'; return; }
      chips.innerHTML=valid.map(x=>'<button type="button" data-slug="'+x.tool[0]+'"><span class="hs-item-ico">'+HS_DOT_ICO+'</span>'+x.tool[1]+'<span class="hs-recent-time">'+timeAgo(x.ts)+'</span></button>').join('');
      chips.querySelectorAll('button[data-slug]').forEach(btn=>{
        btn.addEventListener('click',()=>{ location.href='/'+btn.dataset.slug; });
      });
      section.style.display='block';
    }catch(e){ section.style.display='none'; }
  }
  renderRecent();
  function togglePopular(show){
    if(popular)popular.style.display=show?'flex':'none';
  }

  function render(list,rawTerm){
    if(!list.length){
      /* No-results suggestions instead of a bare message: a few
         genuinely popular tools, so the visitor still has a next
         action instead of a dead end. */
      var suggestions=['background-remover','image-compressor','pdf-merger','json-formatter']
        .map(s=>bySlug(s)).filter(Boolean).slice(0,4);
      results.innerHTML=
        '<div class="hs-noresult"><span class="hs-noresult-msg">No matches for &ldquo;'+escapeHtml(rawTerm||'')+'&rdquo;</span></div>'+
        suggestions.map((t,i)=>
          '<a data-i="'+i+'" href="/'+t[0]+'">'+
            '<span class="hsr-ico">'+ICON[t[2]]+'</span>'+
            '<span class="hsr-name">'+t[1]+'</span>'+
            '<span class="chip">'+t[4][0]+'</span>'+
          '</a>'
        ).join('');
      results.classList.add('show');
      return;
    }
    const normTerm=normalizeSearchTerm(rawTerm||'');
    results.innerHTML=list.map((t,i)=>
      '<a data-i="'+i+'" href="/'+t[0]+'">'+
        '<span class="hsr-ico">'+ICON[t[2]]+'</span>'+
        '<span class="hsr-name">'+highlightMatch(t[1],normTerm)+'</span>'+
        '<span class="chip">'+t[4][0]+'</span>'+
      '</a>'
    ).join('');
    results.classList.add('show');
  }

  function search(term){
    activeIndex=-1;
    const t=term.toLowerCase().trim();
    if(!t){
      results.classList.toggle('show', document.activeElement===input);
      togglePopular(document.activeElement===input);
      if(results.querySelector('a[data-i]'))results.innerHTML=popular?results.innerHTML:'';
      return;
    }
    togglePopular(false);
    render(matchTools(term,8),term);
  }

  let _heroSearchTimer=null;
  input.addEventListener('input',()=>{
    search(input.value);
    if(window.trackEvent){
      clearTimeout(_heroSearchTimer);
      const q=input.value;
      _heroSearchTimer=setTimeout(()=>{if(q.trim())window.trackEvent('site_search',{search_term:q.trim().slice(0,80)});},600);
    }
  });
  input.addEventListener('focus',()=>{
    if(input.value.trim()){ search(input.value); }
    else { togglePopular(true); results.classList.add('show'); }
  });

  input.addEventListener('keydown',e=>{
    const items=results.querySelectorAll('a[data-i]');
    if(e.key==='ArrowDown'){
      e.preventDefault();
      activeIndex=Math.min(activeIndex+1,items.length-1);
      items.forEach((el,i)=>el.classList.toggle('active',i===activeIndex));
      if(items[activeIndex])items[activeIndex].scrollIntoView({block:'nearest'});
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      activeIndex=Math.max(activeIndex-1,0);
      items.forEach((el,i)=>el.classList.toggle('active',i===activeIndex));
    } else if(e.key==='Enter'){
      e.preventDefault();
      const target=activeIndex>=0?items[activeIndex]:items[0];
      if(target)target.click();
    } else if(e.key==='Escape'){
      results.classList.remove('show');
      input.blur();
    }
  });

  document.addEventListener('click',e=>{
    if(!e.target.closest('.hero-search'))results.classList.remove('show');
  });
}




function showHome(cat){homeEl.hidden=false;toolEl.hidden=true;toolEl.innerHTML='';document.title='Tarumak Studio — Free Design & Marketing Tools';restoreHomeMeta();
  const _cats=['image','pdf','converter','marketing','developer'];
  setActiveNav(_cats.includes(cat)?'all':cat==='all'?'all':'');
  if(_cats.includes(cat)){activeCat=cat;buildTabs();buildGrid();buildCategoryCards();buildFeaturedTools();buildLatestArticles();wireFilterPills();setTimeout(()=>{const el=$('#tools');if(el)el.scrollIntoView({behavior:'smooth'});},30);}
  
  else{activeCat='all';buildTabs();buildGrid();buildCategoryCards();buildFeaturedTools();buildLatestArticles();wireFilterPills();if(cat==='all'){setTimeout(()=>{const el=$('#tools');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},100);}else{scrollTo(0,0);}}}
function noInit(panel){panel.innerHTML='<div class="note">This tool is being finalized.</div>';}

/* ── SEO: update meta tags + JSON-LD when a tool opens ─────── */
function updateToolMeta(slug,t){
  var baseUrl='https://tarumakstudio.com';
  var toolUrl=baseUrl+'/#/t/'+slug;
  var fullTitle=t[1]+' | Tarumak Studio';
  var desc=t[3];

  /* Meta description */
  var md=document.querySelector('meta[name="description"]');
  if(md) md.setAttribute('content',desc);

  /* Canonical */
  var can=document.querySelector('link[rel="canonical"]');
  if(can) can.setAttribute('href',toolUrl);

  /* Open Graph */
  var _og=function(prop,val){var el=document.querySelector('meta[property="'+prop+'"]');if(el)el.setAttribute('content',val);};
  _og('og:title',fullTitle);
  _og('og:description',desc);
  _og('og:url',toolUrl);
  _og('og:type','website');

  /* Twitter Card */
  var _tw=function(name,val){var el=document.querySelector('meta[name="'+name+'"]');if(el)el.setAttribute('content',val);};
  _tw('twitter:title',fullTitle);
  _tw('twitter:description',desc);

  /* JSON-LD — remove previous, inject fresh */
  var old=document.getElementById('tool-jsonld');
  if(old) old.remove();
  var ld=document.createElement('script');
  ld.type='application/ld+json';
  ld.id='tool-jsonld';
  var graph=[
    {
      '@type':'SoftwareApplication',
      '@id':toolUrl,
      'name':t[1],
      'url':toolUrl,
      'description':(typeof AI_SUMMARY!=='undefined'&&AI_SUMMARY[slug])?AI_SUMMARY[slug]:desc,
      'applicationCategory':'WebApplication',
      'applicationSubCategory':(CAT[t[2]]||t[2]),
      'operatingSystem':'Any',
      'browserRequirements':'Requires JavaScript',
      'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},
      'provider':{'@type':'Organization','name':'Tarumak Studio','url':baseUrl}
    },
    {
      '@type':'BreadcrumbList',
      'itemListElement':[
        {'@type':'ListItem','position':1,'name':'Home','item':baseUrl+'/'},
        {'@type':'ListItem','position':2,'name':(CAT[t[2]]||t[2]),'item':baseUrl+'/#/'+t[2]},
        {'@type':'ListItem','position':3,'name':t[1],'item':toolUrl}
      ]
    }
  ];
  var toolFaqs=FAQ[slug];
  if(toolFaqs&&toolFaqs.length){
    graph.push({
      '@type':'FAQPage',
      'mainEntity':toolFaqs.map(function(q){return{'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};})
    });
  }
  ld.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});
  document.head.appendChild(ld);
}

/* ── SEO: restore homepage meta tags when navigating back ───── */
function restoreHomeMeta(){
  var baseUrl='https://tarumakstudio.com';
  var n=(typeof TOOLS!=='undefined'&&TOOLS.length)||69; /* derive from the live registry, never hardcode */
  var md=document.querySelector('meta[name="description"]');
  if(md) md.setAttribute('content',n+' free browser-based tools for designers, marketers and developers. Compress images, edit PDFs, build UTMs, create social media graphics and more.');
  var can=document.querySelector('link[rel="canonical"]');
  if(can) can.setAttribute('href',baseUrl+'/');
  var _og=function(prop,val){var el=document.querySelector('meta[property="'+prop+'"]');if(el)el.setAttribute('content',val);};
  _og('og:title','Tarumak Studio \u2014 Free Design & Marketing Tools');
  _og('og:description',n+' free browser-based tools for designers, marketers and developers. Compress images, edit PDFs, build UTMs, create social media graphics and more.');
  _og('og:url',baseUrl+'/');
  _og('og:type','website');
  var _tw=function(name,val){var el=document.querySelector('meta[name="'+name+'"]');if(el)el.setAttribute('content',val);};
  _tw('twitter:title','Tarumak Studio \u2014 Free Design & Marketing Tools');
  _tw('twitter:description',n+' free browser-based tools for designers, marketers and developers.');
  var old=document.getElementById('tool-jsonld');
  if(old) old.remove();
}

/* ── SEO: inject related articles under the tool panel ──────── */
function buildToolArticles(slug){
  var sec=document.getElementById('tool-articles');
  if(!sec) return;
  var artSlugs=(TOOL_ARTICLES&&TOOL_ARTICLES[slug])||[];
  if(!artSlugs.length||typeof ARTICLES==='undefined'){sec.style.display='none';return;}
  var cards=artSlugs.slice(0,3).map(function(as){
    var a=ARTICLES[as];
    if(!a) return '';
    var excerpt=a.excerpt?a.excerpt.slice(0,90)+'\u2026':'';
    return '<a href="/article-'+as+'.html" class="rcard" style="text-decoration:none;display:flex;gap:12px;align-items:flex-start">'
      +'<div class="ico" aria-hidden="true">&#128196;</div>'
      +'<div><h3 class="rc-title">'+a.title+'</h3><p>'+excerpt+'</p></div>'
      +'</a>';
  }).filter(Boolean).join('');
  if(!cards){sec.style.display='none';return;}
  sec.innerHTML='<h2>Related reading</h2>'
    +'<p class="lead">Guides that go with this tool.</p>'
    +'<div class="related">'+cards+'</div>';
}

function openTool(slug){const t=bySlug(slug);if(!t){showHome();return;}
  homeEl.hidden=true;toolEl.hidden=false;mm.classList.remove('open');
  setActiveNav('all');
  const cat=t[2],related=TOOLS.filter(x=>x[2]===cat&&x[0]!==slug).slice(0,3);
  const feats=FEAT[slug]||[['Instant &amp; local','Runs entirely in your browser — your files never leave your device.'],[t[1]+' made simple','A focused, no-clutter interface that does one job well.'],['Free forever','No sign-up, no watermark, no limits — use it as often as you like.']];
  const faqs=FAQ[slug]||[['Are my files uploaded to a server?','No. Everything is processed locally in your browser, so your files stay on your device.'],['Is it really free?','Yes — every TARUMAK tool is free, with no account and no watermark.']];

  /* Recently used, read BEFORE saveRecent(slug) below updates it, so the
     current tool doesn't appear in its own "recently used" list. */
  const recentEntries=getRecentWithTime().filter(e=>e.slug!==slug).slice(0,4);
  saveRecent(slug);

  toolEl.innerHTML=
   '<nav class="crumb"><a href="/">Home</a><span class="sep">/</span><a href="/'+cat+'-tools">'+CAT[cat]+'</a><span class="sep">/</span><span class="here">'+t[1]+'</span></nav>'+
   '<div class="tool-head '+cat+'"><div class="badge">'+ICON[cat]+'</div><div style="flex:1"><h1>'+t[1]+'</h1><p>'+t[3]+'</p></div><button class="th-fav'+(isFav(slug)?' active':'')+'" data-slug="'+slug+'" onclick="toggleFav(\''+slug+'\')" aria-label="Save tool" title="Save to favourites">'+heartSvg+'</button></div>'+
   '<div class="panel" id="panel"></div>'+
   buildHowToGuide(t,cat)+
   '<section class="sec"><h2>Tool features</h2><p class="lead">Built to be fast, private and genuinely useful.</p><div class="feat">'+feats.map(f=>'<div class="f"><div class="ico">'+ICON[cat]+'</div><h3 class="f-title">'+f[0]+'</h3><p>'+f[1]+'</p></div>').join('')+'</div></section>'+
   '<section class="sec" style="padding-top:0"><h2>Frequently asked questions</h2><p class="lead">Quick answers before you start.</p><div class="faq">'+faqs.map(q=>'<details class="q"><summary>'+q[0]+'</summary><div class="a">'+q[1]+'</div></details>').join('')+'</div></section>'+
   '<section class="sec" style="padding-top:0"><h2>Related tools</h2><p class="lead">More from '+CAT[cat]+'.</p><div class="related">'+related.map(r=>'<a class="rcard rcard-tool" href="/'+r[0]+'" style="text-decoration:none;color:inherit"><div class="ico">'+ICON[r[2]]+'</div><div><h3 class="rc-title">'+r[1]+'</h3><p>'+r[3]+'</p><span class="rc-cta">Try Tool '+RC_ARROW+'</span></div></a>').join('')+'</div></section>'+
   buildRelatedArticlesSection(slug)+
   buildRecentToolsSection(recentEntries)+
   buildAffBanners(cat);
  document.title=t[1]+' | Tarumak Studio';updateToolMeta(slug,t);
  fadeIn(toolEl);
  (INIT[slug]||noInit)($('#panel'));
  scrollTo(0,0);
}

/* ──────────────────────────────────────────────────
   buildHowToGuide — a genuine, parameterised step-by-step
   guide, not filler text. Wording adapts to the tool's
   category (what you drop in, what you're adjusting, what
   you get out) so it reads as specific to the tool rather
   than a copy-pasted generic block. This is intentionally
   NOT 66 hand-written unique guides — that's a real content
   project of its own — but it IS an accurate, useful guide
   for the drop-configure-download pattern nearly every one
   of these tools actually follows, which is what a visitor
   searching "how to [x]" actually needs to see.
────────────────────────────────────────────────── */
function buildHowToGuide(t,cat){
  const inputNoun={
    image:'your image (JPG, PNG, WebP, or similar)',
    pdf:'your PDF file',
    developer:'your text, code or data',
    marketing:'your details',
    converter:'your file'
  }[cat]||'your file';
  const actionVerb={ image:'Drop', pdf:'Drop', converter:'Drop', developer:'Paste or type', marketing:'Enter' }[cat]||'Drop';
  const steps=[
    ['Open '+t[1], 'No sign-up or install needed — the tool is ready as soon as the page loads.'],
    [actionVerb+' '+inputNoun, actionVerb==='Drop'?'Drag it into the drop zone, or click to browse your files. Nothing is uploaded to a server.':'Type or paste directly into the input field.'],
    ['Adjust the settings if needed', 'Most options have a sensible default already selected — change them only if you need something specific.'],
    ['Download your result', 'Your output is ready instantly. Click download to save it — the file never left your device during processing.']
  ];
  return '<section class="sec" style="padding-top:0"><h2>How to use '+t[1]+'</h2><p class="lead">Four steps, no learning curve.</p>'+
    '<ol class="howto">'+steps.map((s,i)=>'<li class="howto-step"><span class="howto-n">'+(i+1)+'</span><div><h3 class="howto-title">'+s[0]+'</h3><p>'+s[1]+'</p></div></li>').join('')+'</ol>'+
  '</section>';
}

/* ──────────────────────────────────────────────────
   buildRelatedArticlesSection — this slot existed in the
   template before but was never actually populated (an
   empty <section id="tool-articles"> with nothing filling
   it), despite TOOL_ARTICLES/ARTICLES data already covering
   64 of 66 tools. Wiring it up surfaces real, already-written
   content that was completely invisible to visitors until now.
────────────────────────────────────────────────── */
function buildRelatedArticlesSection(slug){
  if(typeof TOOL_ARTICLES==='undefined'||typeof ARTICLES==='undefined')return '';
  const slugs=(TOOL_ARTICLES[slug]||[]).map(s=>ARTICLES[s]?{slug:s,...ARTICLES[s]}:null).filter(Boolean);
  if(!slugs.length)return '';
  /* Deliberately differentiated from .rcard (tools) and
     .rcard-recent: larger thumbnail, a "Guide" badge, and real
     publish date + read time \u2014 so these read as articles to
     click into, not more tools to run. */
  return '<section class="sec" style="padding-top:0"><h2>Related guides</h2><p class="lead">Learn more about this workflow.</p><div class="related related-guides">'+
    slugs.map(a=>
      '<a class="rcard-guide" href="/article-'+a.slug+'.html">'+
        '<span class="rcg-badge">Guide</span>'+
        '<div class="rcg-thumb">'+DOC_ICO+'</div>'+
        '<h3 class="rcg-title">'+a.title+'</h3>'+
        '<p class="rcg-excerpt">'+a.excerpt+'</p>'+
        '<div class="rcg-meta"><span>'+a.date+'</span><span class="rcg-dot">&bull;</span><span class="rcg-read">'+CLOCK_ICO_SM+a.read+' read</span></div>'+
      '</a>'
    ).join('')+
  '</div></section>';
}

/* ──────────────────────────────────────────────────
   buildRecentToolsSection — shows the visitor's own recent
   tool history directly on a tool page (not just the homepage
   search dropdown), so mid-workflow users can jump back to a
   tool they used a few minutes ago without navigating away.
   Renders nothing at all if there's no history yet.
────────────────────────────────────────────────── */
function buildRecentToolsSection(recentEntries){
  if(!recentEntries.length)return '';
  const items=recentEntries.map(e=>({tool:bySlug(e.slug),ts:e.ts})).filter(x=>x.tool);
  if(!items.length)return '';
  return '<section class="sec" style="padding-top:0"><h2>Recently used</h2><p class="lead">Pick up where you left off.</p><div class="related">'+
    items.map((x,i)=>{
      const r=x.tool;
      const subtitle=i===0?'Continue where you left off':timeAgo(x.ts);
      return '<a class="rcard rcard-recent" href="/'+r[0]+'" style="text-decoration:none;color:inherit"><div class="ico">'+ICON[r[2]]+'</div><div><h3 class="rc-title">'+r[1]+'</h3><p class="rc-recent-sub">'+subtitle+'</p></div></a>';
    }).join('')+
  '</div></section>';
}

var DOC_ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>';
var RC_ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
var CLOCK_ICO_SM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

/* getRecentSlugs — small helper so both the homepage search
   dropdown and tool pages read from the exact same source of
   truth (RK localStorage key) without duplicating the parsing
   logic in two places. */
/* getRecentSlugs — plain slug strings, unchanged signature so
   nothing else that already consumes it needs to change. */
function getRecentSlugs(){
  return getRecentWithTime().map(e=>e.slug);
}

/* getRecentWithTime — the new {slug,ts} form, normalised so it
   works identically whether the stored entry is the old plain-
   string format or the new timestamped one. */
function getRecentWithTime(){
  if(typeof RK==='undefined')return [];
  try{
    const raw=JSON.parse(localStorage.getItem(RK)||'[]');
    return raw.map(normalizeRecentEntry).filter(e=>e.slug);
  }catch(e){ return []; }
}

function route(){
  /* ── LEGACY HASH REDIRECTS ─────────────────────────────────────
     Internal navigation no longer uses hash routes anywhere (every
     link is a real URL as of the routing migration). This layer
     exists ONLY so old external links — bookmarks, shares, indexed
     fragments — land on the canonical page instead of a dead view:
       #/t/{slug}   -> /{slug}            #/{cat} -> /{cat}-tools
       #/all        -> /tools             #/blog  -> /blog
       #/p/{page}   -> /{page}             #tools  -> /tools        */
  var _h=location.hash||'';
  if(_h==='#/blog'||_h==='#/blog/'||_h==='/blog'){window.location.replace('/blog');return;}
  var _t=_h.match(/^#\/t\/([a-z0-9-]+)$/);
  if(_t){window.location.replace('/'+_t[1]);return;}
  var _c=_h.match(/^#\/(image|pdf|converter|marketing|developer)$/);
  if(_c){window.location.replace('/'+_c[1]+'-tools');return;}
  if(_h==='#/all'||_h==='#tools'){window.location.replace('/tools');return;}
  var _p=_h.match(/^#\/p\/(about|contact|changelog|privacy-policy|terms|cookie-policy)$/);
  if(_p){window.location.replace('/'+_p[1]);return;}const h=location.hash||'';const m=h.match(/^#\/t\/(.+)$/);if(m){openTool(m[1]);return;}
  const pm=h.match(/^#\/p\/(.+)$/);if(pm){openPage(pm[1]);return;}
  const bm=h.match(/^#\/blog(?:\/(.+))?$/);if(bm){openBlog(bm[1]);return;}
  const seg=h.replace(/^#\/?/,'');if(seg==='blog'){openBlog();return;}showHome(seg);}

/* Static pages */
const PAGES={};
PAGES['about']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="/" style="color:inherit">Home</a> &rsaquo; <span>About Us</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">About TARUMAK Tools</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="margin:36px 0 44px"><h1 style="font-family:var(--fd);font-size:clamp(30px,5vw,44px);font-weight:700;letter-spacing:-1.2px;margin:0 0 16px">Free tools for everyone,<br>built for the browser.</h1><p style="font-size:16px;color:var(--text-dim);max-width:640px;line-height:1.7">TARUMAK Tools is a free online toolkit for image conversion, PDF management, and document conversion. Every tool runs directly in your browser — your files never leave your device.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:44px"><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#128274;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">100% Private</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">No file uploads. No accounts. No tracking. Processing happens entirely in your browser.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#9889;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Instant Results</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">Processing begins the moment you drop a file and finishes in seconds.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#127760;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Always Free</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">38 tools, zero cost. No paywalls, no file size limits, no watermarks.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#128241;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Mobile Friendly</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">Every tool works on phones and tablets. Upload, convert, download on mobile.</p></div></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">Image Tools (15)</h2><p style="color:var(--text-dim);line-height:1.75">Compress, resize, crop, convert between JPG/PNG/WebP/SVG, generate QR codes, add watermarks, remove EXIF data, and create PDFs from images.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">PDF Tools (15)</h2><p style="color:var(--text-dim);line-height:1.75">Merge, split, compress, rotate pages, remove pages, drag-to-reorder, protect with passwords, unlock, extract text, convert to JPG, and read PDFs in the browser.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">Converter Tools (8)</h2><p style="color:var(--text-dim);line-height:1.75">TXT and HTML to PDF, animated GIF maker, WebP and GIF conversion, colour picker, image collage, and favicon generator.</p></div></div></div>';
PAGES['contact']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="/" style="color:inherit">Home</a> &rsaquo; <span>Contact</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Get in Touch</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><p style="font-size:16px;color:var(--text-dim);margin-bottom:36px;line-height:1.7">Have a question, bug report, or suggestion? Reach out and we will respond within 2 business days.</p><div style="display:flex;flex-direction:column;gap:28px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:36px"><div style="padding:22px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:24px;margin-bottom:8px">&#9993;</div><h4 style="font-family:var(--fd);font-weight:600;margin-bottom:4px">Email</h4><p style="color:var(--p1);font-size:14px">hello@tarumak.com</p></div><div style="padding:22px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:24px;margin-bottom:8px">&#128038;</div><h4 style="font-family:var(--fd);font-weight:600;margin-bottom:4px">Twitter / X</h4><p style="color:var(--p1);font-size:14px">@tarumaktools</p></div></div><div style="padding:32px;border-radius:18px;background:var(--surface);border:1px solid var(--border)"><h3 style="font-family:var(--fd);font-weight:600;font-size:17px;margin-bottom:20px">Send a Message</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px"><div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Your Name</label><input id="cf-name" type="text" placeholder="Your name" style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;box-sizing:border-box"></div><div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Email</label><input id="cf-email" type="email" placeholder="you@example.com" style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;box-sizing:border-box"></div></div><div style="margin-bottom:14px"><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Message</label><textarea id="cf-msg" rows="5" placeholder="Question, bug report, or tool suggestion..." style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea></div><button id="cf-send" class="btn btn-primary" style="width:100%;height:46px;font-size:14px;border-radius:11px">Send via Email Client</button><p style="text-align:center;color:var(--text-faint);font-size:12px;margin-top:10px">Opens your email app with the message pre-filled.</p></div></div></div>';
PAGES['privacy']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="/" style="color:inherit">Home</a> &rsaquo; <span>Privacy Policy</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Privacy Policy</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;gap:14px;padding:18px 22px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.2);margin-bottom:36px;align-items:flex-start"><span style="font-size:22px;flex-shrink:0">&#128274;</span><p style="color:var(--text-dim);font-size:14.5px;line-height:1.7;margin:0"><strong style="color:var(--text)">Short version:</strong> TARUMAK Tools processes files entirely in your browser. We never upload, store, or transmit your files. We collect no personal data.</p></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. No File Uploads</h2><p style="color:var(--text-dim);line-height:1.75">All tools process files locally in your browser using JavaScript. Your files are read by your browser and processed in memory. They are never transmitted to our servers or any third-party server.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. No Personal Data</h2><p style="color:var(--text-dim);line-height:1.75">We do not collect names, email addresses, IP addresses, or any other personal information. We do not use Google Analytics, Hotjar, or any tracking platform.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Third-Party Libraries</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools loads open-source libraries (pdf-lib, PDF.js, jsPDF, QRCode.js, html2canvas) from cdnjs.cloudflare.com. Cloudflare may log your IP as part of CDN infrastructure.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Local Storage</h2><p style="color:var(--text-dim);line-height:1.75">We use browser localStorage only to remember your theme preference, recently-used tools, saved tools, and cookie consent. No cookies are set.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Contact</h2><p style="color:var(--text-dim);line-height:1.75">Questions? <a href="/contact" style="color:var(--p1)">Contact us</a> and we will respond within 5 business days.</p></div></div></div>';
PAGES['disclaimer']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="/" style="color:inherit">Home</a> &rsaquo; <span>Disclaimer</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Disclaimer</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. General</h2><p style="color:var(--text-dim);line-height:1.75">Tools are provided on an as-is basis. We make no guarantees regarding accuracy, completeness, or fitness for a particular purpose.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. No Warranty</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools makes no representations or warranties of any kind, express or implied, about the reliability or availability of the website or its tools.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Limitation of Liability</h2><p style="color:var(--text-dim);line-height:1.75">In no event will TARUMAK Tools be liable for any indirect, incidental, or consequential loss or damage arising from use of this website.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Output Accuracy</h2><p style="color:var(--text-dim);line-height:1.75">Some tools (PDF Compressor, PDF Password Protector) rasterise pages, meaning text in the output may not be selectable. Always retain your originals.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Browser Compatibility</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools is designed for modern browsers. Camera access for Scan to PDF requires HTTPS.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';
PAGES['terms']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="/" style="color:inherit">Home</a> &rsaquo; <span>Terms of Service</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Terms of Service</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. Acceptance</h2><p style="color:var(--text-dim);line-height:1.75">By using TARUMAK Tools, you accept these Terms. If you do not agree, please do not use the website.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. Service</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools provides free browser-based file processing tools. All processing is client-side. No files are transmitted to our servers.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Permitted Use</h2><p style="color:var(--text-dim);line-height:1.75">You may use TARUMAK Tools for personal, educational, and commercial purposes. You may not use it to process unlawful content or to disrupt the service.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Intellectual Property</h2><p style="color:var(--text-dim);line-height:1.75">The TARUMAK Tools name, logo, and design are proprietary. Underlying libraries are open-source under their respective licences.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. No Warranty</h2><p style="color:var(--text-dim);line-height:1.75">The service is provided on an as-is basis without warranties of any kind.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Limitation of Liability</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools shall not be liable for any indirect, incidental, or consequential damages from use of the service.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">7. Changes</h2><p style="color:var(--text-dim);line-height:1.75">We may update these terms at any time. Continued use constitutes acceptance.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">8. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';
PAGES['cookie']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="/" style="color:inherit">Home</a> &rsaquo; <span>Cookie Policy</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Cookie Policy</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;gap:14px;padding:18px 22px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.2);margin-bottom:36px;align-items:flex-start"><span style="font-size:22px;flex-shrink:0">&#127850;</span><p style="color:var(--text-dim);font-size:14.5px;line-height:1.7;margin:0"><strong style="color:var(--text)">Short version:</strong> TARUMAK Tools sets no tracking cookies. We only use browser localStorage, which stays entirely on your device.</p></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. No Cookies</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools sets no cookies of any kind — no session cookies, no tracking cookies, no advertising cookies.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. What we store in localStorage</h2><ul style="color:var(--text-dim);line-height:2.1;padding-left:20px"><li><strong style="color:var(--text)">Theme</strong> — dark or light preference</li><li><strong style="color:var(--text)">Recently used</strong> — up to 5 tool slugs</li><li><strong style="color:var(--text)">Saved tools</strong> — your favourited tools</li><li><strong style="color:var(--text)">Conversion count</strong> — local download counter for the hero stat</li><li><strong style="color:var(--text)">Cookie consent</strong> — whether you dismissed the banner</li></ul></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. What we do not store</h2><p style="color:var(--text-dim);line-height:1.75">We do not store your files, file names, or personal information. No Google Analytics, Facebook Pixel, or tracking services are used.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Clearing your data</h2><p style="color:var(--text-dim);line-height:1.75">Clear all data via browser Settings &rarr; Privacy &rarr; Clear site data. This resets your theme, recently used, and saved tools.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Third-party CDN</h2><p style="color:var(--text-dim);line-height:1.75">Libraries load from cdnjs.cloudflare.com. Cloudflare may set infrastructure cookies. See the Cloudflare Cookie Policy for details.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';

/* Contact form handler */
document.addEventListener('click', function(e){
  if(e.target.id==='cf-send'){
    var n=document.getElementById('cf-name'),em=document.getElementById('cf-email'),m=document.getElementById('cf-msg');
    if(!n||!em||!m)return;
    if(!n.value||!em.value||!m.value){toast('Please fill in all fields','err');return;}
    location.href='mailto:hello@tarumak.com?subject='+encodeURIComponent('TARUMAK Tools')+'&body='+encodeURIComponent('From: '+n.value+' <'+em.value+'>\n\n'+m.value);
  }
});

/* openPage renderer */
function openPage(name){
  const html=PAGES[name];
  if(!html){showHome();return;}
  homeEl.hidden=true;
  toolEl.hidden=false;
  mm.classList.remove('open');
  setActiveNav('p/'+name);
  toolEl.innerHTML='<div id="panel" style="min-height:60vh">'+html+'</div>';
  fadeIn(toolEl);
  scrollTo(0,0);
}

/* Patch showHome to also render the Marketing Toolkit cards
   (buildMkCards is defined in marketing-tools.js, loaded before app.js) */
(function(){
  var _sh = showHome;
  showHome = function(cat) {
    _sh(cat);
    if (typeof buildMkCards === 'function') buildMkCards();
  };
})();

/* GA event hooks — tool_open for the homepage's SPA-style quick-launch
   flow (static-tool-bootstrap.js fires the same event for the static SEO
   pages, which is where organic traffic actually lands). download()
   itself now fires tool_download directly (see utils.js) so there's
   nothing left to wrap here for downloads — wrapping it too would just
   double-fire the event on every homepage-launched tool. */
(function(){
  var _ot = openTool;
  openTool = function(slug) { _ot(slug); if(window.trackEvent) window.trackEvent('tool_open', {tool_name:slug}); };
})();

/* ── BOOT: absolute last lines ────────────────────────────────── */
/* SearchAction support: /?q=term (clean URL declared in homepage schema)
   prefills the hero search and runs it — replaces the old #/all?q= target. */
(function(){
  try{
    var q=new URLSearchParams(location.search).get('q');
    if(!q)return;
    var inp=document.getElementById('heroSearch');
    if(!inp)return;
    inp.value=q;
    inp.dispatchEvent(new Event('input',{bubbles:true}));
    inp.focus();
  }catch(e){}
})();
addEventListener('hashchange', route);
route();

/* Auto-update hero tool count from TOOLS array */
(function updateHeroCount(){
  var n        = TOOLS.length;
  var heroEl   = document.getElementById('hero-tool-count');
  var glanceEl = document.getElementById('glance-tool-count');
  var badgeEl  = document.querySelector('.eyebrow');
  var trustEl  = document.getElementById('heroTrustCount');
  if(heroEl)   heroEl.textContent   = n;
  if(glanceEl) glanceEl.textContent = n + '+';
  if(badgeEl)  badgeEl.innerHTML    = badgeEl.innerHTML.replace(/\d+ TOOLS/, n+' TOOLS');
  if(trustEl){
    /* Count up 0 -> n on first paint (~900ms, eased). Value still derives
       from the live TOOLS registry — the animation only changes how the
       number arrives, never what it is. Reduced motion: set instantly. */
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ trustEl.textContent=n; }
    else{
      var t0=null,DUR=900;
      function tick(ts){
        if(t0===null)t0=ts;
        var p=Math.min(1,(ts-t0)/DUR);
        var eased=1-Math.pow(1-p,3);
        trustEl.textContent=Math.round(eased*n);
        if(p<1)requestAnimationFrame(tick);
      }
      trustEl.textContent='0';
      requestAnimationFrame(tick);
    }
  }
})();

/* Boot-time render of category cards */
buildCategoryCards();
buildFeaturedTools();
buildLatestArticles();

wireHeroSearch();
wireAiDemo();
wireFilterPills();
