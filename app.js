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

/* counts() and buildTabs() — gap functions not in any other file */
function counts(){const c={all:TOOLS.length,image:0,pdf:0,converter:0,marketing:0,developer:0};TOOLS.forEach(t=>c[t[2]]++);return c;}

function buildTabs(){
  const c=counts(),fv=getFavs().size;
  tabsEl.innerHTML=[['all','All'],['image','Image'],['pdf','PDF'],['converter','Converter'],['marketing','\u2726 Marketing'],['developer','\u2328 Dev & SEO']].map(([k,l])=>'<button class="tab '+(k===activeCat?'active':'')+'" data-cat="'+k+'">'+l+' <span class="ct">'+c[k]+'</span></button>').join('')
  +'<button class="tab t-saved '+(activeCat==='favs'?'active':'')+'" data-cat="favs">&#9829; Saved <span class="ct">'+fv+'</span></button>';
}

/* Affiliate banner builder (AFFS is in config.js, not here) */
function buildAffBanners(cat){
  var items=(AFFS[cat]||[]).concat(AFFS.all);
  return '<div class="aff-section"><div class="aff-label">Recommended Tools</div>'
    +items.map(function(a){return '<a class="aff-card" href="'+a.url+'" target="_blank" rel="noopener sponsored"><div class="aff-ico">'+a.ico+'</div><div class="aff-info"><strong>'+a.name+'</strong><span>'+a.desc+'</span></div><span class="aff-cta">'+a.cta+' \u2192</span></a>';}).join('')+'</div>';
}

/* Blog renderers */
function buildBlogIndex(){
  var slugs=Object.keys(ARTICLES);
  return '<div class="wrap" style="padding:40px 24px 80px"><div class="crumb"><a href="#/">Home</a> &rsaquo; <span>Blog</span></div>'
    +'<h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:32px 0 10px">Blog & Guides</h1>'
    +'<p style="font-size:16px;color:var(--text-dim);margin-bottom:8px">Free guides for designers, marketers and developers. Every article links to free tools you can use right now.</p>'
    +'<div class="blog-grid">'+slugs.map(function(slug){var a=ARTICLES[slug];
      return '<a href="/article-'+slug+'.html" class="blog-card" style="text-decoration:none">'
        +'<a class="bc-cat" href="'+(CAT_SLUGS[a.cat]||'#')+'" style="text-decoration:none">'+a.cat+'</a>'
        +'<h3>'+a.title+'</h3>'
        +'<p>'+a.excerpt+'</p>'
        +'<div class="bc-meta"><span>&#128197; '+a.date+'</span><span>&#9201; '+a.read+' read</span></div></div>';
    }).join('')+'</div></div>';
}

function buildArticlePage(slug){
  var a=ARTICLES[slug];if(!a)return buildBlogIndex();
  if(!a.html||a.html.length<500){window.location.href='/article-'+slug+'.html';return '';}
  var all=Object.keys(ARTICLES);var idx=all.indexOf(slug);
  var prev=all[idx-1],next=all[idx+1];
  return '<div class="wrap"><div class="article-body">'
    +'<div class="crumb"><a href="#/">Home</a> &rsaquo; <a href="#/blog">Blog</a> &rsaquo; <a href="'+(CAT_SLUGS[a.cat]||'#')+'" style="color:var(--text-dim)">'+a.cat+'</a></div>'
    +'<h1>'+a.title+'</h1>'
    +'<div class="a-meta"><span>'+a.date+'</span><span>'+a.read+' read</span><span style="background:rgba(99,102,241,.1);color:var(--p1);padding:2px 10px;border-radius:100px">'+a.cat+'</span></div>'
    +a.html
    +'<div style="display:flex;gap:10px;margin-top:40px;padding-top:24px;border-top:1px solid var(--border)">'
    +(prev?'<a href="#/blog/'+prev+'" style="flex:1;padding:14px;border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none">\u2190 '+ARTICLES[prev].title.substring(0,40)+'...</a>':'')
    +(next?'<a href="#/blog/'+next+'" style="flex:1;padding:14px;border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;text-align:right">'+ARTICLES[next].title.substring(0,40)+'... \u2192</a>':'')
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
function go(path){var h=path?('#/'+path):'#/';if(location.hash===h){route();return;}location.hash=h;}
const homeEl=$('#home'),toolEl=$('#tool');

/* ──────────────────────────────────────────────────
   buildCategoryCards — renders premium category grid
   on homepage. Reads CAT, CAT_META, ICON, TOOLS to
   produce one .cat-card per category with: icon,
   title, tagline, popular tool chips, count, arrow.
────────────────────────────────────────────────── */
function buildCategoryCards(){
  const grid=document.getElementById('cat-grid');
  if(!grid||typeof CAT_META==='undefined')return;
  const order=['image','pdf','developer','marketing','converter'];
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  grid.innerHTML=order.map(cat=>{
    const meta=CAT_META[cat];if(!meta)return '';
    const count=TOOLS.filter(t=>t[2]===cat).length;
    /* Build popular chips — only show tools that actually exist */
    const popularChips=meta.popular
      .map(slug=>bySlug(slug))
      .filter(Boolean)
      .slice(0,4)
      .map(t=>'<span class="cc-chip">'+t[1].replace(/Generator|Converter|Compressor/g,'').trim()+'</span>')
      .join('');
    return ''+
      '<a class="cat-card" href="javascript:void(0)" onclick="go(\''+cat+'\')" aria-label="Explore '+CAT[cat]+'">'+
        '<div class="cc-ico">'+ICON[cat]+'</div>'+
        '<h3>'+CAT[cat]+'</h3>'+
        '<p class="cc-tag">'+meta.tagline+'</p>'+
        '<div class="cc-popular">'+popularChips+'</div>'+
        '<div class="cc-foot">'+
          '<span class="cc-count"><strong>'+count+'</strong> free tools</span>'+
          '<span class="cc-arrow">Explore '+arrow+'</span>'+
        '</div>'+
      '</a>';
  }).join('');
}

function showHome(cat){homeEl.hidden=false;toolEl.hidden=true;toolEl.innerHTML='';document.title='Tarumak Studio — Free Design & Marketing Tools';restoreHomeMeta();
  const _cats=['image','pdf','converter','marketing','developer'];
  setActiveNav(_cats.includes(cat)?'all':cat==='all'?'all':'');
  if(_cats.includes(cat)){activeCat=cat;buildTabs();buildGrid();buildRecent();buildCategoryCards();setTimeout(()=>{const el=$('#tools');if(el)el.scrollIntoView({behavior:'smooth'});},30);}
  
  else{activeCat='all';buildTabs();buildGrid();buildRecent();buildCategoryCards();if(cat==='all'){setTimeout(()=>{const el=$('#tools');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},100);}else{scrollTo(0,0);}}}
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
  var md=document.querySelector('meta[name="description"]');
  if(md) md.setAttribute('content','56 free browser-based tools for designers, marketers and developers. Compress images, edit PDFs, build UTMs, create social media graphics and more.');
  var can=document.querySelector('link[rel="canonical"]');
  if(can) can.setAttribute('href',baseUrl+'/');
  var _og=function(prop,val){var el=document.querySelector('meta[property="'+prop+'"]');if(el)el.setAttribute('content',val);};
  _og('og:title','Tarumak Studio \u2014 Free Design & Marketing Tools');
  _og('og:description','56 free browser-based tools for designers, marketers and developers. Compress images, edit PDFs, build UTMs, create social media graphics and more.');
  _og('og:url',baseUrl+'/');
  _og('og:type','website');
  var _tw=function(name,val){var el=document.querySelector('meta[name="'+name+'"]');if(el)el.setAttribute('content',val);};
  _tw('twitter:title','Tarumak Studio \u2014 Free Design & Marketing Tools');
  _tw('twitter:description','56 free browser-based tools for designers, marketers and developers.');
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
  setActiveNav('all');saveRecent(slug);
  const cat=t[2],related=TOOLS.filter(x=>x[2]===cat&&x[0]!==slug).slice(0,3);
  const feats=FEAT[slug]||[['Instant &amp; local','Runs entirely in your browser — your files never leave your device.'],[t[1]+' made simple','A focused, no-clutter interface that does one job well.'],['Free forever','No sign-up, no watermark, no limits — use it as often as you like.']];
  const faqs=FAQ[slug]||[['Are my files uploaded to a server?','No. Everything is processed locally in your browser, so your files stay on your device.'],['Is it really free?','Yes — every TARUMAK tool is free, with no account and no watermark.']];
  toolEl.innerHTML=
   '<nav class="crumb"><a onclick="go(\'\')">Home</a><span class="sep">/</span><a onclick="go(\''+cat+'\')">'+CAT[cat]+'</a><span class="sep">/</span><span class="here">'+t[1]+'</span></nav>'+
   '<div class="tool-head '+cat+'"><div class="badge">'+ICON[cat]+'</div><div style="flex:1"><h1>'+t[1]+'</h1><p>'+t[3]+'</p></div><button class="th-fav'+(isFav(slug)?' active':'')+'" data-slug="'+slug+'" onclick="toggleFav(\''+slug+'\')" aria-label="Save tool" title="Save to favourites">'+heartSvg+'</button></div>'+
   '<div class="panel" id="panel"></div>'+
   '<section class="sec"><h2>Tool features</h2><p class="lead">Built to be fast, private and genuinely useful.</p><div class="feat">'+feats.map(f=>'<div class="f"><div class="ico">'+ICON[cat]+'</div><h3 class="f-title">'+f[0]+'</h3><p>'+f[1]+'</p></div>').join('')+'</div></section>'+
   '<section class="sec" style="padding-top:0"><h2>Frequently asked questions</h2><p class="lead">Quick answers before you start.</p><div class="faq">'+faqs.map(q=>'<details class="q"><summary>'+q[0]+'</summary><div class="a">'+q[1]+'</div></details>').join('')+'</div></section>'+
   '<section class="sec" style="padding-top:0"><h2>Related tools</h2><p class="lead">More from '+CAT[cat]+'.</p><div class="related">'+related.map(r=>'<div class="rcard" onclick="go(\'t/'+r[0]+'\')"><div class="ico">'+ICON[r[2]]+'</div><div><h3 class="rc-title">'+r[1]+'</h3><p>'+r[3]+'</p></div></div>').join('')+'</div></section>'+'<section class="sec" style="padding-top:0" id="tool-articles"></section>'+buildAffBanners(cat);
  document.title=t[1]+' | Tarumak Studio';updateToolMeta(slug,t);
  fadeIn(toolEl);
  (INIT[slug]||noInit)($('#panel'));
  scrollTo(0,0);
}
function route(){
  /* Redirect bare /#/blog to clean URL /blog */
  var _h=location.hash||'';
  if(_h==='#/blog'||_h==='#/blog/'||_h==='/blog'){window.location.replace('/blog');return;}const h=location.hash||'';const m=h.match(/^#\/t\/(.+)$/);if(m){openTool(m[1]);return;}
  const pm=h.match(/^#\/p\/(.+)$/);if(pm){openPage(pm[1]);return;}
  const bm=h.match(/^#\/blog(?:\/(.+))?$/);if(bm){openBlog(bm[1]);return;}
  const seg=h.replace(/^#\/?/,'');if(seg==='blog'){openBlog();return;}showHome(seg);}

/* Static pages */
const PAGES={};
PAGES['about']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>About Us</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">About TARUMAK Tools</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="margin:36px 0 44px"><h1 style="font-family:var(--fd);font-size:clamp(30px,5vw,44px);font-weight:700;letter-spacing:-1.2px;margin:0 0 16px">Free tools for everyone,<br>built for the browser.</h1><p style="font-size:16px;color:var(--text-dim);max-width:640px;line-height:1.7">TARUMAK Tools is a free online toolkit for image conversion, PDF management, and document conversion. Every tool runs directly in your browser — your files never leave your device.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:44px"><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#128274;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">100% Private</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">No file uploads. No accounts. No tracking. Processing happens entirely in your browser.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#9889;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Instant Results</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">Processing begins the moment you drop a file and finishes in seconds.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#127760;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Always Free</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">38 tools, zero cost. No paywalls, no file size limits, no watermarks.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#128241;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Mobile Friendly</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">Every tool works on phones and tablets. Upload, convert, download on mobile.</p></div></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">Image Tools (15)</h2><p style="color:var(--text-dim);line-height:1.75">Compress, resize, crop, convert between JPG/PNG/WebP/SVG, generate QR codes, add watermarks, remove EXIF data, and create PDFs from images.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">PDF Tools (15)</h2><p style="color:var(--text-dim);line-height:1.75">Merge, split, compress, rotate pages, remove pages, drag-to-reorder, protect with passwords, unlock, extract text, convert to JPG, and read PDFs in the browser.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">Converter Tools (8)</h2><p style="color:var(--text-dim);line-height:1.75">TXT and HTML to PDF, animated GIF maker, WebP and GIF conversion, colour picker, image collage, and favicon generator.</p></div></div></div>';
PAGES['contact']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Contact</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Get in Touch</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><p style="font-size:16px;color:var(--text-dim);margin-bottom:36px;line-height:1.7">Have a question, bug report, or suggestion? Reach out and we will respond within 2 business days.</p><div style="display:flex;flex-direction:column;gap:28px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:36px"><div style="padding:22px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:24px;margin-bottom:8px">&#9993;</div><h4 style="font-family:var(--fd);font-weight:600;margin-bottom:4px">Email</h4><p style="color:var(--p1);font-size:14px">hello@tarumak.com</p></div><div style="padding:22px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:24px;margin-bottom:8px">&#128038;</div><h4 style="font-family:var(--fd);font-weight:600;margin-bottom:4px">Twitter / X</h4><p style="color:var(--p1);font-size:14px">@tarumaktools</p></div></div><div style="padding:32px;border-radius:18px;background:var(--surface);border:1px solid var(--border)"><h3 style="font-family:var(--fd);font-weight:600;font-size:17px;margin-bottom:20px">Send a Message</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px"><div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Your Name</label><input id="cf-name" type="text" placeholder="Your name" style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;box-sizing:border-box"></div><div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Email</label><input id="cf-email" type="email" placeholder="you@example.com" style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;box-sizing:border-box"></div></div><div style="margin-bottom:14px"><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Message</label><textarea id="cf-msg" rows="5" placeholder="Question, bug report, or tool suggestion..." style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea></div><button id="cf-send" class="btn btn-primary" style="width:100%;height:46px;font-size:14px;border-radius:11px">Send via Email Client</button><p style="text-align:center;color:var(--text-faint);font-size:12px;margin-top:10px">Opens your email app with the message pre-filled.</p></div></div></div>';
PAGES['privacy']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Privacy Policy</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Privacy Policy</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;gap:14px;padding:18px 22px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.2);margin-bottom:36px;align-items:flex-start"><span style="font-size:22px;flex-shrink:0">&#128274;</span><p style="color:var(--text-dim);font-size:14.5px;line-height:1.7;margin:0"><strong style="color:var(--text)">Short version:</strong> TARUMAK Tools processes files entirely in your browser. We never upload, store, or transmit your files. We collect no personal data.</p></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. No File Uploads</h2><p style="color:var(--text-dim);line-height:1.75">All tools process files locally in your browser using JavaScript. Your files are read by your browser and processed in memory. They are never transmitted to our servers or any third-party server.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. No Personal Data</h2><p style="color:var(--text-dim);line-height:1.75">We do not collect names, email addresses, IP addresses, or any other personal information. We do not use Google Analytics, Hotjar, or any tracking platform.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Third-Party Libraries</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools loads open-source libraries (pdf-lib, PDF.js, jsPDF, QRCode.js, html2canvas) from cdnjs.cloudflare.com. Cloudflare may log your IP as part of CDN infrastructure.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Local Storage</h2><p style="color:var(--text-dim);line-height:1.75">We use browser localStorage only to remember your theme preference, recently-used tools, saved tools, and cookie consent. No cookies are set.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Contact</h2><p style="color:var(--text-dim);line-height:1.75">Questions? <a href="#/p/contact" style="color:var(--p1)">Contact us</a> and we will respond within 5 business days.</p></div></div></div>';
PAGES['disclaimer']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Disclaimer</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Disclaimer</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. General</h2><p style="color:var(--text-dim);line-height:1.75">Tools are provided on an as-is basis. We make no guarantees regarding accuracy, completeness, or fitness for a particular purpose.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. No Warranty</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools makes no representations or warranties of any kind, express or implied, about the reliability or availability of the website or its tools.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Limitation of Liability</h2><p style="color:var(--text-dim);line-height:1.75">In no event will TARUMAK Tools be liable for any indirect, incidental, or consequential loss or damage arising from use of this website.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Output Accuracy</h2><p style="color:var(--text-dim);line-height:1.75">Some tools (PDF Compressor, PDF Password Protector) rasterise pages, meaning text in the output may not be selectable. Always retain your originals.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Browser Compatibility</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools is designed for modern browsers. Camera access for Scan to PDF requires HTTPS.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="#/p/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';
PAGES['terms']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Terms of Service</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Terms of Service</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. Acceptance</h2><p style="color:var(--text-dim);line-height:1.75">By using TARUMAK Tools, you accept these Terms. If you do not agree, please do not use the website.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. Service</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools provides free browser-based file processing tools. All processing is client-side. No files are transmitted to our servers.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Permitted Use</h2><p style="color:var(--text-dim);line-height:1.75">You may use TARUMAK Tools for personal, educational, and commercial purposes. You may not use it to process unlawful content or to disrupt the service.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Intellectual Property</h2><p style="color:var(--text-dim);line-height:1.75">The TARUMAK Tools name, logo, and design are proprietary. Underlying libraries are open-source under their respective licences.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. No Warranty</h2><p style="color:var(--text-dim);line-height:1.75">The service is provided on an as-is basis without warranties of any kind.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Limitation of Liability</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools shall not be liable for any indirect, incidental, or consequential damages from use of the service.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">7. Changes</h2><p style="color:var(--text-dim);line-height:1.75">We may update these terms at any time. Continued use constitutes acceptance.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">8. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="#/p/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';
PAGES['cookie']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Cookie Policy</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Cookie Policy</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;gap:14px;padding:18px 22px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.2);margin-bottom:36px;align-items:flex-start"><span style="font-size:22px;flex-shrink:0">&#127850;</span><p style="color:var(--text-dim);font-size:14.5px;line-height:1.7;margin:0"><strong style="color:var(--text)">Short version:</strong> TARUMAK Tools sets no tracking cookies. We only use browser localStorage, which stays entirely on your device.</p></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. No Cookies</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools sets no cookies of any kind — no session cookies, no tracking cookies, no advertising cookies.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. What we store in localStorage</h2><ul style="color:var(--text-dim);line-height:2.1;padding-left:20px"><li><strong style="color:var(--text)">Theme</strong> — dark or light preference</li><li><strong style="color:var(--text)">Recently used</strong> — up to 5 tool slugs</li><li><strong style="color:var(--text)">Saved tools</strong> — your favourited tools</li><li><strong style="color:var(--text)">Conversion count</strong> — local download counter for the hero stat</li><li><strong style="color:var(--text)">Cookie consent</strong> — whether you dismissed the banner</li></ul></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. What we do not store</h2><p style="color:var(--text-dim);line-height:1.75">We do not store your files, file names, or personal information. No Google Analytics, Facebook Pixel, or tracking services are used.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Clearing your data</h2><p style="color:var(--text-dim);line-height:1.75">Clear all data via browser Settings &rarr; Privacy &rarr; Clear site data. This resets your theme, recently used, and saved tools.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Third-party CDN</h2><p style="color:var(--text-dim);line-height:1.75">Libraries load from cdnjs.cloudflare.com. Cloudflare may set infrastructure cookies. See the Cloudflare Cookie Policy for details.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="#/p/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';

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

/* GA event hooks */
(function(){
  var _ot = openTool;
  openTool = function(slug) { _ot(slug); window._ga('tool_open', {tool_name:slug}); };
  var _dl = download;
  download = function(blob, name) { _dl(blob, name); window._ga('file_download', {file_name:name}); };
})();

/* ── BOOT: absolute last lines ────────────────────────────────── */
addEventListener('hashchange', route);
route();

/* Auto-update hero tool count from TOOLS array */
(function updateHeroCount(){
  var n        = TOOLS.length;
  var heroEl   = document.getElementById('hero-tool-count');
  var glanceEl = document.getElementById('glance-tool-count');
  var badgeEl  = document.querySelector('.eyebrow');
  if(heroEl)   heroEl.textContent   = n;
  if(glanceEl) glanceEl.textContent = n + '+';
  if(badgeEl)  badgeEl.innerHTML    = badgeEl.innerHTML.replace(/\d+ TOOLS/, n+' TOOLS');
})();

/* Boot-time render of category cards */
buildCategoryCards();
