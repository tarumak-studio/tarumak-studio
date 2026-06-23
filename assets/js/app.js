/* ============================================================
   TARUMAK STUDIO — Main Application
   Router, grid, navigation, pages, blog, affiliate banners.
   Loaded last — after all data and tool files.
   ============================================================ */

/* ── Core app: showHome, openTool, route ──────────────────── */
function showHome(cat){homeEl.hidden=false;toolEl.hidden=true;toolEl.innerHTML='';document.title='TARUMAK Tools — Free Online Image, PDF & Document Tools';
  setActiveNav(['image','pdf','converter'].includes(cat)?cat:'');
  if(['image','pdf','converter'].includes(cat)){activeCat=cat;buildTabs();buildGrid();buildRecent();setTimeout(()=>{const el=$('#tools');if(el)el.scrollIntoView({behavior:'smooth'});},30);}
  else if(cat==='about'){buildRecent();setTimeout(()=>{const el=$('#about');if(el)el.scrollIntoView({behavior:'smooth'});},30);}
  else{activeCat='all';buildTabs();buildGrid();buildRecent();scrollTo(0,0);}}
function noInit(panel){panel.innerHTML='<div class="note">This tool is being finalized.</div>';}
function openTool(slug){const t=bySlug(slug);if(!t){showHome();return;}
  homeEl.hidden=true;toolEl.hidden=false;mm.classList.remove('open');
  setActiveNav(t[2]);saveRecent(slug);
  const cat=t[2],related=TOOLS.filter(x=>x[2]===cat&&x[0]!==slug).slice(0,3);
  const feats=FEAT[slug]||[['Instant &amp; local','Runs entirely in your browser — your files never leave your device.'],[t[1]+' made simple','A focused, no-clutter interface that does one job well.'],['Free forever','No sign-up, no watermark, no limits — use it as often as you like.']];
  const faqs=FAQ[slug]||[['Are my files uploaded to a server?','No. Everything is processed locally in your browser, so your files stay on your device.'],['Is it really free?','Yes — every TARUMAK tool is free, with no account and no watermark.']];
  toolEl.innerHTML=
   '<nav class="crumb"><a onclick="go(\'\')">Home</a><span class="sep">/</span><a onclick="go(\''+cat+'\')">'+CAT[cat]+'</a><span class="sep">/</span><span class="here">'+t[1]+'</span></nav>'+
   '<div class="tool-head '+cat+'"><div class="badge">'+ICON[cat]+'</div><div style="flex:1"><h1>'+t[1]+'</h1><p>'+t[3]+'</p></div><button class="th-fav'+(isFav(slug)?' active':'')+'" data-slug="'+slug+'" onclick="toggleFav(\''+slug+'\')" aria-label="Save tool" title="Save to favourites">'+heartSvg+'</button></div>'+
   '<div class="panel" id="panel"></div>'+
   '<section class="sec"><h2>Tool features</h2><p class="lead">Built to be fast, private and genuinely useful.</p><div class="feat">'+feats.map(f=>'<div class="f"><div class="ico">'+ICON[cat]+'</div><h4>'+f[0]+'</h4><p>'+f[1]+'</p></div>').join('')+'</div></section>'+
   '<section class="sec" style="padding-top:0"><h2>Frequently asked questions</h2><p class="lead">Quick answers before you start.</p><div class="faq">'+faqs.map(q=>'<details class="q"><summary>'+q[0]+'</summary><div class="a">'+q[1]+'</div></details>').join('')+'</div></section>'+
   '<section class="sec" style="padding-top:0"><h2>Related tools</h2><p class="lead">More from '+CAT[cat]+'.</p><div class="related">'+related.map(r=>'<div class="rcard" onclick="go(\'t/'+r[0]+'\')"><div class="ico">'+ICON[r[2]]+'</div><div><h4>'+r[1]+'</h4><p>'+r[3]+'</p></div></div>').join('')+'</div></section>'+buildAffBanners(cat);
  document.title=t[1]+' — TARUMAK Tools';
  fadeIn(toolEl);
  (INIT[slug]||noInit)($('#panel'));
  scrollTo(0,0);
}
function route(){const h=location.hash||'';const m=h.match(/^#\/t\/(.+)$/);if(m){openTool(m[1]);return;}
  const pm=h.match(/^#\/p\/(.+)$/);if(pm){openPage(pm[1]);return;}
  const bm=h.match(/^#\/blog(?:\/(.+))?$/);if(bm){openBlog(bm[1]);return;}
  const seg=h.replace(/^#\/?/,'');if(seg==='blog'){openBlog();return;}showHome(seg);}
addEventListener('hashchange',route);
route();


/* ── Affiliate data + banner builder ───────────────────────── */
const AFFS={
  image:[{ico:'🎨',name:'Canva Pro',desc:'Professional design templates — 30-day free trial.',cta:'Try Free',url:'https://canva.com'}],
  pdf:[{ico:'📄',name:'Adobe Acrobat',desc:'The industry-standard PDF editor.',cta:'Start Trial',url:'https://adobe.com/acrobat'}],
  marketing:[{ico:'📧',name:'ConvertKit',desc:'Email marketing for creators — free up to 1,000 subscribers.',cta:'Start Free',url:'https://convertkit.com'}],
  converter:[{ico:'✨',name:'Envato Elements',desc:'Unlimited design assets from $16.50/month.',cta:'Browse',url:'https://elements.envato.com'}],
  all:[{ico:'🌐',name:'Namecheap',desc:'Domains from $0.99/yr. Hosting from $1.98/month.',cta:'Find Domain',url:'https://namecheap.com'}],
};
function buildAffBanners(cat){
  var items=(AFFS[cat]||[]).concat(AFFS.all);
  return '<div class="aff-section"><div class="aff-label">Recommended Tools</div>'
    +items.map(function(a){return '<a class="aff-card" href="'+a.url+'" target="_blank" rel="noopener sponsored"><div class="aff-ico">'+a.ico+'</div><div class="aff-info"><strong>'+a.name+'</strong><span>'+a.desc+'</span></div><span class="aff-cta">'+a.cta+' \u2192</span></a>';}).join('')+'</div>';
}



/* ── Grid, tabs, features ───────────────────────────────────── */
function counts(){const c={all:TOOLS.length,image:0,pdf:0,converter:0,marketing:0};TOOLS.forEach(t=>c[t[2]]++);return c;}
function buildTabs(){
  const c=counts(),fv=getFavs().size;
  tabsEl.innerHTML=[['all','All'],['image','Image'],['pdf','PDF'],['converter','Converter'],['marketing','\u2726 Marketing']].map(([k,l])=>'<button class="tab '+(k===activeCat?'active':'')+'" data-cat="'+k+'">'+l+' <span class="ct">'+c[k]+'</span></button>').join('')
  +'<button class="tab t-saved '+(activeCat==='favs'?'active':'')+'" data-cat="favs">&#9829; Saved <span class="ct">'+fv+'</span></button>';
}
const arrowSvg='<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const heartSvg='<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

/* ══════════════════════════════════════════════════
   FAVOURITES — localStorage-backed saved tools
   ══════════════════════════════════════════════════ */
const FK='tmk_favs';
function getFavs(){try{return new Set(JSON.parse(localStorage.getItem(FK)||'[]'));}catch(e){return new Set();}}
function isFav(slug){return getFavs().has(slug);}
function toggleFav(slug,e){
  if(e){e.stopPropagation();e.preventDefault();}
  const favs=getFavs();const t=bySlug(slug);
  if(favs.has(slug)){favs.delete(slug);toast((t?t[1]:'Tool')+' removed from saved','info');}
  else{favs.add(slug);toast((t?t[1]:'Tool')+' saved ♥','ok');}
  localStorage.setItem(FK,JSON.stringify([...favs]));
  const active=favs.has(slug);
  /* update all grid hearts for this slug */
  $$('.fav-btn[data-slug="'+slug+'"]').forEach(b=>b.classList.toggle('active',active));
  /* update tool-page header heart */
  const th=$('.th-fav');if(th&&th.dataset.slug===slug)th.classList.toggle('active',active);
  /* refresh grid if on saved tab */
  if(activeCat==='favs'){buildTabs();buildGrid();}else buildTabs();
}

/* ══════════════════════════════════════════════════
   USAGE COUNTER — seed + per-user increment
   ══════════════════════════════════════════════════ */
const CK='tmk_dl',SK='tmk_seed';
function getCount(){
  if(!localStorage.getItem(SK)){
    localStorage.setItem(SK,String(10000+Math.floor(Math.random()*5000)));
  }
  return parseInt(localStorage.getItem(SK))+parseInt(localStorage.getItem(CK)||'0');
}
function fmtCount(n){return n>=1000?(n/1000).toFixed(1)+'K':String(n);}
function bumpCount(){
  localStorage.setItem(CK,String(parseInt(localStorage.getItem(CK)||'0')+1));
  const el=$('#stat-count');
  if(el){el.textContent=fmtCount(getCount());el.classList.remove('count-pop');void el.offsetWidth;el.classList.add('count-pop');}
}
/* init counter display */
(()=>{const el=$('#stat-count');if(el)el.textContent=fmtCount(getCount());})();
function buildGrid(){
  const t=term.toLowerCase(),favs=getFavs();
  let list;
  if(activeCat==='favs'){
    list=TOOLS.filter(x=>favs.has(x[0])&&(x[1].toLowerCase().includes(t)||x[3].toLowerCase().includes(t)));
    if(!list.length){gridEl.innerHTML='<div class="empty-fav"><div class="ef-ico">&#9825;</div><h3>No saved tools yet</h3><p>Hover any tool card and click the &#9825; heart to save it here.</p></div>';return;}
  } else {
    list=TOOLS.filter(x=>(activeCat==='all'||x[2]===activeCat)&&(x[1].toLowerCase().includes(t)||x[3].toLowerCase().includes(t)));
    if(!list.length){gridEl.innerHTML='<div class="empty">No tools match "'+term+'".</div>';return;}
  }
  gridEl.innerHTML=list.map(x=>{
    const faved=favs.has(x[0]);
    return '<div class="tool cat-'+x[2]+'" onclick="go(\'t/'+x[0]+'\')">'+arrowSvg+'<button class="fav-btn'+(faved?' active':'')+'" data-slug="'+x[0]+'" onclick="toggleFav(\''+x[0]+'\',event)" aria-label="Save '+x[1]+'">'+heartSvg+'</button><div class="ico">'+ICON[x[2]]+'</div><h3>'+x[1]+'</h3><p>'+x[3]+'</p><div class="chips">'+x[4].map(c=>'<span class="chip">'+c+'</span>').join('')+'</div></div>';
  }).join('');
}
tabsEl.addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;activeCat=b.dataset.cat;buildTabs();buildGrid();});
$('#gridSearch').addEventListener('input',e=>{term=e.target.value;buildGrid();});
buildTabs();buildGrid();

/* ---------- nav search ---------- */
const navSearch=$('#navSearch'),navPop=$('#navPop');
navSearch.addEventListener('input',()=>{const t=navSearch.value.toLowerCase().trim();if(!t){navPop.classList.remove('show');return;}
  const list=TOOLS.filter(x=>x[1].toLowerCase().includes(t)).slice(0,6);
  navPop.innerHTML=list.length?list.map(x=>'<a onclick="go(\'t/'+x[0]+'\')">'+x[1]+'<span class="chip">'+x[4][0]+'</span></a>').join(''):'<a style="cursor:default">No matches</a>';
  navPop.classList.add('show');});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))navPop.classList.remove('show');});

/* ---------- theme / header / menu ---------- */
const root=document.documentElement,tIcon=$('#themeIcon');
const moon='<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
$('#theme').onclick=()=>{const l=root.getAttribute('data-theme')==='light';root.setAttribute('data-theme',l?'dark':'light');tIcon.innerHTML=l?sun:moon;};
/* scroll handled in quick-win features block above */
const mm=$('#mobileMenu');$('#burger').onclick=()=>mm.classList.add('open');$('#closeMenu').onclick=()=>mm.classList.remove('open');

/* ══════════════════════════════════════════════════════
   QUICK-WIN FEATURES
   ══════════════════════════════════════════════════════ */

/* 1 ─ Toast notifications ─────────────────────────── */
const toastRack=$('#toast-rack');
function toast(msg,type='ok',dur=3200){
  const el=document.createElement('div');
  el.className='toast t-'+type;
  const icons={ok:'✓',err:'✕',info:'i'};
  el.innerHTML='<em class="t-ico">'+icons[type]+'</em><span class="t-msg">'+msg+'</span><span class="t-close" onclick="this.closest(\'.toast\').remove()">×</span>';
  toastRack.appendChild(el);
  setTimeout(()=>{el.classList.add('out');el.addEventListener('animationend',()=>el.remove(),{once:true});},dur);
}

/* 2 ─ Active nav state ────────────────────────────── */
function setActiveNav(key){
  $$('.nav-links a[data-nav]').forEach(a=>a.classList.toggle('nav-active',a.dataset.nav===key));
}

/* 3 ─ Recently used tools ─────────────────────────── */
const RK='tmk_recent';
function saveRecent(slug){
  try{let r=JSON.parse(localStorage.getItem(RK)||'[]');r=[slug,...r.filter(s=>s!==slug)].slice(0,5);localStorage.setItem(RK,JSON.stringify(r));}catch(e){}
}
function buildRecent(){
  const row=$('#recent-row'),list=$('#recent-list');if(!row||!list)return;
  try{
    const r=JSON.parse(localStorage.getItem(RK)||'[]');
    const valid=r.map(s=>bySlug(s)).filter(Boolean);
    if(!valid.length){row.style.display='none';return;}
    row.style.display='';
    list.innerHTML=valid.map(t=>'<div class="recent-pill" onclick="go(\'t/'+t[0]+'\')"><span class="rp-ico">'+ICON[t[2]]+'</span>'+t[1]+'</div>').join('');
  }catch(e){row.style.display='none';}
}

/* 4 ─ Scroll-to-top ───────────────────────────────── */
const topBtn=$('#top-btn');
addEventListener('scroll',()=>{
  $('#header').classList.toggle('scrolled',scrollY>20);
  topBtn.classList.toggle('show',scrollY>300);
},{ passive:true });
topBtn.onclick=()=>scrollTo({top:0,behavior:'smooth'});

/* 5 ─ Cmd+K / Ctrl+K search shortcut ─────────────── */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){
    e.preventDefault();
    const ns=$('#navSearch');
    if(ns){ns.focus();ns.select();}
  }
  if(e.key==='Escape'){
    navPop.classList.remove('show');
    const ns=$('#navSearch');if(ns&&ns===document.activeElement)ns.blur();
  }
});

/* 6 ─ Page fade-in helper ─────────────────────────── */
function fadeIn(el){el.classList.remove('fade-in');void el.offsetWidth;el.classList.add('fade-in');}

/* ══════════════════════════════════════════════════
   COOKIE CONSENT BANNER
   ══════════════════════════════════════════════════ */

const PAGES={};
PAGES['about']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>About Us</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">About TARUMAK Tools</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="margin:36px 0 44px"><h1 style="font-family:var(--fd);font-size:clamp(30px,5vw,44px);font-weight:700;letter-spacing:-1.2px;margin:0 0 16px">Free tools for everyone,<br>built for the browser.</h1><p style="font-size:16px;color:var(--text-dim);max-width:640px;line-height:1.7">TARUMAK Tools is a free online toolkit for image conversion, PDF management, and document conversion. Every tool runs directly in your browser — your files never leave your device.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:44px"><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#128274;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">100% Private</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">No file uploads. No accounts. No tracking. Processing happens entirely in your browser.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#9889;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Instant Results</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">Processing begins the moment you drop a file and finishes in seconds.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#127760;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Always Free</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">38 tools, zero cost. No paywalls, no file size limits, no watermarks.</p></div><div style="padding:24px;border-radius:16px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:28px;margin-bottom:8px">&#128241;</div><h3 style="font-family:var(--fd);font-weight:600;margin-bottom:6px">Mobile Friendly</h3><p style="color:var(--text-dim);font-size:14px;line-height:1.6">Every tool works on phones and tablets. Upload, convert, download on mobile.</p></div></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">Image Tools (15)</h2><p style="color:var(--text-dim);line-height:1.75">Compress, resize, crop, convert between JPG/PNG/WebP/SVG, generate QR codes, add watermarks, remove EXIF data, and create PDFs from images.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">PDF Tools (15)</h2><p style="color:var(--text-dim);line-height:1.75">Merge, split, compress, rotate pages, remove pages, drag-to-reorder, protect with passwords, unlock, extract text, convert to JPG, and read PDFs in the browser.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">Converter Tools (8)</h2><p style="color:var(--text-dim);line-height:1.75">TXT and HTML to PDF, animated GIF maker, WebP and GIF conversion, colour picker, image collage, and favicon generator.</p></div></div></div>';
PAGES['contact']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Contact</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Get in Touch</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><p style="font-size:16px;color:var(--text-dim);margin-bottom:36px;line-height:1.7">Have a question, bug report, or suggestion? Reach out and we will respond within 2 business days.</p><div style="display:flex;flex-direction:column;gap:28px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:36px"><div style="padding:22px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:24px;margin-bottom:8px">&#9993;</div><h4 style="font-family:var(--fd);font-weight:600;margin-bottom:4px">Email</h4><p style="color:var(--p1);font-size:14px">hello@tarumak.com</p></div><div style="padding:22px;border-radius:14px;background:var(--surface);border:1px solid var(--border)"><div style="font-size:24px;margin-bottom:8px">&#128038;</div><h4 style="font-family:var(--fd);font-weight:600;margin-bottom:4px">Twitter / X</h4><p style="color:var(--p1);font-size:14px">@tarumaktools</p></div></div><div style="padding:32px;border-radius:18px;background:var(--surface);border:1px solid var(--border)"><h3 style="font-family:var(--fd);font-weight:600;font-size:17px;margin-bottom:20px">Send a Message</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px"><div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Your Name</label><input id="cf-name" type="text" placeholder="Your name" style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;box-sizing:border-box"></div><div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Email</label><input id="cf-email" type="email" placeholder="you@example.com" style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;box-sizing:border-box"></div></div><div style="margin-bottom:14px"><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:5px;font-weight:500">Message</label><textarea id="cf-msg" rows="5" placeholder="Question, bug report, or tool suggestion..." style="width:100%;padding:10px 13px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea></div><button id="cf-send" class="btn btn-primary" style="width:100%;height:46px;font-size:14px;border-radius:11px">Send via Email Client</button><p style="text-align:center;color:var(--text-faint);font-size:12px;margin-top:10px">Opens your email app with the message pre-filled.</p></div></div></div>';
PAGES['privacy']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Privacy Policy</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Privacy Policy</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;gap:14px;padding:18px 22px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.2);margin-bottom:36px;align-items:flex-start"><span style="font-size:22px;flex-shrink:0">&#128274;</span><p style="color:var(--text-dim);font-size:14.5px;line-height:1.7;margin:0"><strong style="color:var(--text)">Short version:</strong> TARUMAK Tools processes files entirely in your browser. We never upload, store, or transmit your files. We collect no personal data.</p></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. No File Uploads</h2><p style="color:var(--text-dim);line-height:1.75">All tools process files locally in your browser using JavaScript. Your files are read by your browser and processed in memory. They are never transmitted to our servers or any third-party server.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. No Personal Data</h2><p style="color:var(--text-dim);line-height:1.75">We do not collect names, email addresses, IP addresses, or any other personal information. We do not use Google Analytics, Hotjar, or any tracking platform.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Third-Party Libraries</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools loads open-source libraries (pdf-lib, PDF.js, jsPDF, QRCode.js, html2canvas) from cdnjs.cloudflare.com. Cloudflare may log your IP as part of CDN infrastructure.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Local Storage</h2><p style="color:var(--text-dim);line-height:1.75">We use browser localStorage only to remember your theme preference, recently-used tools, saved tools, and cookie consent. No cookies are set.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Contact</h2><p style="color:var(--text-dim);line-height:1.75">Questions? <a href="#/p/contact" style="color:var(--p1)">Contact us</a> and we will respond within 5 business days.</p></div></div></div>';
PAGES['disclaimer']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Disclaimer</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Disclaimer</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. General</h2><p style="color:var(--text-dim);line-height:1.75">Tools are provided on an as-is basis. We make no guarantees regarding accuracy, completeness, or fitness for a particular purpose.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. No Warranty</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools makes no representations or warranties of any kind, express or implied, about the reliability or availability of the website or its tools.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Limitation of Liability</h2><p style="color:var(--text-dim);line-height:1.75">In no event will TARUMAK Tools be liable for any indirect, incidental, or consequential loss or damage arising from use of this website.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Output Accuracy</h2><p style="color:var(--text-dim);line-height:1.75">Some tools (PDF Compressor, PDF Password Protector) rasterise pages, meaning text in the output may not be selectable. Always retain your originals.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Browser Compatibility</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools is designed for modern browsers. Camera access for Scan to PDF requires HTTPS.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="#/p/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';
PAGES['terms']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Terms of Service</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Terms of Service</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. Acceptance</h2><p style="color:var(--text-dim);line-height:1.75">By using TARUMAK Tools, you accept these Terms. If you do not agree, please do not use the website.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. Service</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools provides free browser-based file processing tools. All processing is client-side. No files are transmitted to our servers.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. Permitted Use</h2><p style="color:var(--text-dim);line-height:1.75">You may use TARUMAK Tools for personal, educational, and commercial purposes. You may not use it to process unlawful content or to disrupt the service.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Intellectual Property</h2><p style="color:var(--text-dim);line-height:1.75">The TARUMAK Tools name, logo, and design are proprietary. Underlying libraries are open-source under their respective licences.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. No Warranty</h2><p style="color:var(--text-dim);line-height:1.75">The service is provided on an as-is basis without warranties of any kind.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Limitation of Liability</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools shall not be liable for any indirect, incidental, or consequential damages from use of the service.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">7. Changes</h2><p style="color:var(--text-dim);line-height:1.75">We may update these terms at any time. Continued use constitutes acceptance.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">8. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="#/p/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';
PAGES['cookie']='<div class="wrap" style="max-width:780px;padding:40px 24px 80px"><div class="crumb"><a href="#/" style="color:inherit">Home</a> &rsaquo; <span>Cookie Policy</span></div><h1 style="font-family:var(--fd);font-size:clamp(28px,5vw,40px);font-weight:700;letter-spacing:-1px;margin:36px 0 8px">Cookie Policy</h1><p style="color:var(--text-faint);font-size:13px;margin-bottom:40px">Last updated: June 2026</p><div style="display:flex;gap:14px;padding:18px 22px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.2);margin-bottom:36px;align-items:flex-start"><span style="font-size:22px;flex-shrink:0">&#127850;</span><p style="color:var(--text-dim);font-size:14.5px;line-height:1.7;margin:0"><strong style="color:var(--text)">Short version:</strong> TARUMAK Tools sets no tracking cookies. We only use browser localStorage, which stays entirely on your device.</p></div><div style="display:flex;flex-direction:column;gap:28px"><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">1. No Cookies</h2><p style="color:var(--text-dim);line-height:1.75">TARUMAK Tools sets no cookies of any kind — no session cookies, no tracking cookies, no advertising cookies.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">2. What we store in localStorage</h2><ul style="color:var(--text-dim);line-height:2.1;padding-left:20px"><li><strong style="color:var(--text)">Theme</strong> — dark or light preference</li><li><strong style="color:var(--text)">Recently used</strong> — up to 5 tool slugs</li><li><strong style="color:var(--text)">Saved tools</strong> — your favourited tools</li><li><strong style="color:var(--text)">Conversion count</strong> — local download counter for the hero stat</li><li><strong style="color:var(--text)">Cookie consent</strong> — whether you dismissed the banner</li></ul></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">3. What we do not store</h2><p style="color:var(--text-dim);line-height:1.75">We do not store your files, file names, or personal information. No Google Analytics, Facebook Pixel, or tracking services are used.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">4. Clearing your data</h2><p style="color:var(--text-dim);line-height:1.75">Clear all data via browser Settings &rarr; Privacy &rarr; Clear site data. This resets your theme, recently used, and saved tools.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">5. Third-party CDN</h2><p style="color:var(--text-dim);line-height:1.75">Libraries load from cdnjs.cloudflare.com. Cloudflare may set infrastructure cookies. See the Cloudflare Cookie Policy for details.</p></div><div><h2 style="font-family:var(--fd);font-size:19px;font-weight:600;margin-bottom:10px">6. Contact</h2><p style="color:var(--text-dim);line-height:1.75"><a href="#/p/contact" style="color:var(--p1)">Contact us</a> with any questions.</p></div></div></div>';

document.addEventListener('click', function(e){
  if(e.target.id==='cf-send'){
    var n=document.getElementById('cf-name'),em=document.getElementById('cf-email'),m=document.getElementById('cf-msg');
    if(!n||!em||!m)return;
    if(!n.value||!em.value||!m.value){toast('Please fill in all fields','err');return;}
    location.href='mailto:hello@tarumak.com?subject='+encodeURIComponent('TARUMAK Tools')+'&body='+encodeURIComponent('From: '+n.value+' <'+em.value+'>\n\n'+m.value);
  }
});

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

/* ===== image format converter factory ===== */
function imgConv(outType,ext,opt){opt=opt||{};return function(panel){
  const u=dz(panel,{accept:opt.accept||'image/*',multiple:true,formats:opt.formats||[ext.toUpperCase()],sub:'Convert as many images as you like — all processed locally.'});
  dropzone(u.drop,u.file,async fs=>{const list=[...fs].filter(f=>f.type.startsWith('image/'));if(!list.length)return;u.results.innerHTML='';u.results.classList.add('show');
    for(const f of list){try{const img=await readImg(f);const c=document.createElement('canvas');c.width=img.naturalWidth||512;c.height=img.naturalHeight||512;const x=c.getContext('2d');if(opt.bg){x.fillStyle=opt.bg;x.fillRect(0,0,c.width,c.height);}x.drawImage(img,0,0);
      const blob=await new Promise(r=>c.toBlob(r,outType,opt.quality||.92));const nm=f.name.replace(/\.[^.]+$/,'')+'.'+ext;
      row(u.results,c.toDataURL('image/jpeg',.4),f.name,fmtBytes(f.size)+' <span class="arrow">&#8594;</span> '+fmtBytes(blob.size)+' · '+ext.toUpperCase(),()=>download(blob,nm));}catch(e){}}});
};}
INIT['jpg-to-png']=imgConv('image/png','png',{accept:'image/jpeg'});
INIT['png-to-jpg']=imgConv('image/jpeg','jpg',{accept:'image/png',bg:'#fff'});
INIT['jpg-to-webp']=imgConv('image/webp','webp',{accept:'image/jpeg'});
INIT['webp-to-jpg']=imgConv('image/jpeg','jpg',{accept:'image/webp',bg:'#fff'});
INIT['png-to-webp']=imgConv('image/webp','webp',{accept:'image/png'});
INIT['webp-to-png']=imgConv('image/png','png',{accept:'image/webp'});
INIT['exif-remover']=imgConv('image/jpeg','jpg',{accept:'image/jpeg',bg:'#fff',formats:['JPG']});
INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards EXIF data like GPS location and camera model, then re-exports a clean JPG.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding isn\'t supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */
function svgConv(outType,ext,bg){return function(panel){
  const u=dz(panel,{accept:'.svg,image/svg+xml',multiple:true,formats:[ext.toUpperCase()],sub:'Vector SVG rendered to '+ext.toUpperCase()+' at your chosen size.'});
  u.controls.innerHTML='<div class="ctrl"><label>Output width</label><select id="sc"><option value="512">512 px</option><option value="1024">1024 px</option><option value="256">256 px</option><option value="2048">2048 px</option></select></div>';
  dropzone(u.drop,u.file,async fs=>{const list=[...fs].filter(f=>/svg/i.test(f.type)||/\.svg$/i.test(f.name));if(!list.length)return;u.results.innerHTML='';u.results.classList.add('show');const W=+$('#sc',panel).value;
    for(const f of list){const txt=await f.text();const url=URL.createObjectURL(new Blob([txt],{type:'image/svg+xml'}));
      await new Promise(res=>{const im=new Image();im.onload=()=>{const ar=(im.naturalWidth&&im.naturalHeight)?im.naturalHeight/im.naturalWidth:1;const c=document.createElement('canvas');c.width=W;c.height=Math.round(W*ar)||W;const x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>{row(u.results,c.toDataURL(),f.name,c.width+'×'+c.height+' · '+ext.toUpperCase(),()=>download(b,f.name.replace(/\.svg$/i,'')+'.'+ext));res();},outType,.95);};im.onerror=()=>{setStatus(u.status,'Could not render '+f.name,1);res();};im.src=url;});}
  });
};}
INIT['svg-to-png']=svgConv('image/png','png',null);
INIT['svg-to-jpg']=svgConv('image/jpeg','jpg','#fff');

/* ===== Image Compressor ===== */
INIT['image-compressor']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',multiple:true,formats:['JPG','PNG','WEBP'],sub:'Compress one image or many at once.'});
  u.controls.innerHTML='<div class="ctrl"><label>Quality · <span class="val" id="qv">75%</span></label><input type="range" id="q" min="10" max="100" value="75"></div><div class="ctrl"><label>Output</label><select id="of"><option value="image/jpeg">JPG (smallest)</option><option value="image/webp">WebP</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Compress images</button>';
  let imgs=[];const q=$('#q',panel),qv=$('#qv',panel);q.oninput=()=>qv.textContent=q.value+'%';
  dropzone(u.drop,u.file,fs=>{imgs=[...fs].filter(f=>/image\/(png|jpeg|webp)/.test(f.type));if(imgs.length)setStatus(u.status,imgs.length+' image(s) ready — set quality and compress.');});
  $('#run',panel).onclick=async()=>{if(!imgs.length){setStatus(u.status,'Drop some images first.',1);return;}u.results.innerHTML='';u.results.classList.add('show');
    const type=$('#of',panel).value,ql=q.value/100,ext=type==='image/webp'?'webp':'jpg';
    for(const f of imgs){const img=await readImg(f);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');if(type==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);}x.drawImage(img,0,0);const blob=await new Promise(r=>c.toBlob(r,type,ql));const saved=Math.max(0,Math.round((1-blob.size/f.size)*100));row(u.results,c.toDataURL('image/jpeg',.4),f.name,fmtBytes(f.size)+' <span class="arrow">&#8594;</span> '+fmtBytes(blob.size)+' <span class="save">−'+saved+'%</span>',()=>download(blob,f.name.replace(/\.[^.]+$/,'')+'-min.'+ext));}
    setStatus(u.status,'Done — '+imgs.length+' image(s) compressed.');};
};

/* ===== Image Resizer ===== */
INIT['image-resizer']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',formats:['JPG','PNG','WEBP'],sub:'Resize a single image to any size.'});
  u.controls.innerHTML='<div class="ctrl"><label>Width</label><input type="number" id="w" min="1" style="width:104px"></div><div class="ctrl"><label>Height</label><input type="number" id="h" min="1" style="width:104px"></div><div class="ctrl"><label>Scale</label><select id="sc" style="width:96px"><option value="">Custom</option><option value="0.25">25%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="2">200%</option></select></div><div class="ctrl"><label>Format</label><select id="fm" style="width:104px"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div><label class="lock"><input type="checkbox" id="lk" checked> Lock ratio</label><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Resize &amp; download</button>';
  let img=null,ratio=1;const W=$('#w',panel),H=$('#h',panel),lk=$('#lk',panel),sc=$('#sc',panel),fm=$('#fm',panel);
  dropzone(u.drop,u.file,fs=>{const f=[...fs].find(x=>/image\/(png|jpeg|webp)/.test(x.type));if(!f)return;readImg(f).then(im=>{img=im;ratio=im.naturalWidth/im.naturalHeight;W.value=im.naturalWidth;H.value=im.naturalHeight;paint();});});
  function paint(){if(!img)return;const c=document.createElement('canvas');c.width=Math.max(1,W.value|0);c.height=Math.max(1,H.value|0);const x=c.getContext('2d');if(fm.value==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);}x.imageSmoothingQuality='high';x.drawImage(img,0,0,c.width,c.height);u.results.innerHTML='';u.results.classList.add('show');const w=document.createElement('div');w.className='preview show';w.appendChild(c);u.results.appendChild(w);u.results._c=c;}
  W.addEventListener('input',()=>{sc.value='';if(lk.checked)H.value=Math.round(W.value/ratio);paint();});
  H.addEventListener('input',()=>{sc.value='';if(lk.checked)W.value=Math.round(H.value*ratio);paint();});
  sc.addEventListener('change',()=>{if(!img||!sc.value)return;W.value=Math.round(img.naturalWidth*sc.value);H.value=Math.round(img.naturalHeight*sc.value);paint();});
  fm.addEventListener('change',paint);
  $('#run',panel).onclick=()=>{const c=u.results._c;if(!c){setStatus(u.status,'Drop an image first.',1);return;}const ext=fm.value.split('/')[1].replace('jpeg','jpg');c.toBlob(b=>download(b,'resized-'+c.width+'x'+c.height+'.'+ext),fm.value,.92);};
};

/* ===== Image Cropper ===== */
INIT['image-cropper']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',formats:['JPG','PNG','WEBP'],sub:'Then drag the box to crop.'});
  u.controls.innerHTML='<div class="ctrl"><label>Aspect ratio</label><div class="seg" id="ar"><button class="active" data-r="0">Free</button><button data-r="1">1:1</button><button data-r="1.3333">4:3</button><button data-r="1.7778">16:9</button><button data-r="1.5">3:2</button></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Crop &amp; download</button>';
  let img=null,scl=1,arr=0;
  dropzone(u.drop,u.file,fs=>{const f=[...fs].find(x=>/image\/(png|jpeg|webp)/.test(x.type));if(!f)return;readImg(f).then(im=>{img=im;draw();});});
  function draw(){u.results.innerHTML='';u.results.classList.add('show');const maxW=Math.min(660,u.results.clientWidth-2||660);scl=Math.min(1,maxW/img.naturalWidth);
    const stage=document.createElement('div');stage.className='crop-stage';const cv=document.createElement('canvas');cv.width=Math.round(img.naturalWidth*scl);cv.height=Math.round(img.naturalHeight*scl);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
    const box=document.createElement('div');box.className='crop-box';box.innerHTML='<span class="h tl"></span><span class="h tr"></span><span class="h bl"></span><span class="h br"></span>';
    stage.appendChild(cv);stage.appendChild(box);u.results.appendChild(stage);u._cv=cv;u._box=box;u._stage=stage;
    const bw=cv.width*.6,bh=arr?bw/arr:cv.height*.6;setBox((cv.width-bw)/2,(cv.height-bh)/2,bw,Math.min(bh,cv.height));wire();}
  function setBox(x,y,w,h){const cv=u._cv,box=u._box;x=Math.max(0,Math.min(x,cv.width-w));y=Math.max(0,Math.min(y,cv.height-h));box.style.left=x+'px';box.style.top=y+'px';box.style.width=w+'px';box.style.height=h+'px';}
  function gb(){const b=u._box;return{x:parseFloat(b.style.left),y:parseFloat(b.style.top),w:parseFloat(b.style.width),h:parseFloat(b.style.height)};}
  function wire(){const box=u._box,stage=u._stage,cv=u._cv;let mode=null,sx,sy,st;
    const pt=e=>{const r=stage.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
    box.addEventListener('pointerdown',e=>{e.preventDefault();box.setPointerCapture(e.pointerId);st=gb();const p=pt(e);sx=p.x;sy=p.y;mode=e.target.classList.contains('h')?[...e.target.classList].find(c=>['tl','tr','bl','br'].includes(c)):'move';});
    box.addEventListener('pointermove',e=>{if(!mode)return;const p=pt(e),dx=p.x-sx,dy=p.y-sy;let{x,y,w,h}=st;
      if(mode==='move'){setBox(x+dx,y+dy,w,h);return;}
      if(mode==='br'){w+=dx;h=arr?w/arr:h+dy;}
      if(mode==='bl'){x+=dx;w-=dx;h=arr?w/arr:h+dy;}
      if(mode==='tr'){w+=dx;h=arr?w/arr:h-dy;y=arr?y+(st.h-h):y+dy;}
      if(mode==='tl'){x+=dx;w-=dx;h=arr?w/arr:h-dy;y=arr?y+(st.h-h):y+dy;}
      w=Math.max(24,w);h=Math.max(24,h);if(x<0){w+=x;x=0;}if(y<0){h+=y;y=0;}if(x+w>cv.width)w=cv.width-x;if(y+h>cv.height)h=cv.height-y;setBox(x,y,w,h);});
    box.addEventListener('pointerup',()=>mode=null);}
  $('#ar',panel).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('#ar button',panel).forEach(x=>x.classList.remove('active'));b.classList.add('active');arr=parseFloat(b.dataset.r);if(u._box){const g=gb();setBox(g.x,g.y,g.w,arr?g.w/arr:g.h);}});
  $('#run',panel).onclick=()=>{if(!img){setStatus(u.status,'Drop an image first.',1);return;}const g=gb(),s=1/scl;const c=document.createElement('canvas');c.width=Math.round(g.w*s);c.height=Math.round(g.h*s);c.getContext('2d').drawImage(img,g.x*s,g.y*s,g.w*s,g.h*s,0,0,c.width,c.height);c.toBlob(b=>download(b,'cropped.png'),'image/png');};
};

/* ===== Watermark ===== */
INIT['watermark-image']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',formats:['JPG','PNG','WEBP'],sub:'Then type your watermark text.'});
  u.controls.innerHTML='<div class="ctrl"><label>Text</label><input type="text" id="tx" value="© TARUMAK" style="width:180px"></div><div class="ctrl"><label>Position</label><select id="ps"><option value="br">Bottom right</option><option value="bl">Bottom left</option><option value="tr">Top right</option><option value="tl">Top left</option><option value="c">Center</option><option value="tile">Tiled</option></select></div><div class="ctrl"><label>Size · <span class="val" id="szv">5%</span></label><input type="range" id="sz" min="2" max="14" value="5"></div><div class="ctrl"><label>Opacity · <span class="val" id="opv">45%</span></label><input type="range" id="op" min="5" max="100" value="45"></div><div class="ctrl"><label>Color</label><div class="color-field"><input type="color" id="cl" value="#ffffff"><span id="clh">#ffffff</span></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Download</button>';
  let img=null;const tx=$('#tx',panel),ps=$('#ps',panel),sz=$('#sz',panel),op=$('#op',panel),cl=$('#cl',panel);
  dropzone(u.drop,u.file,fs=>{const f=[...fs].find(x=>/image\/(png|jpeg|webp)/.test(x.type));if(!f)return;readImg(f).then(im=>{img=im;paint();});});
  function paint(){if(!img)return;$('#szv',panel).textContent=sz.value+'%';$('#opv',panel).textContent=op.value+'%';$('#clh',panel).textContent=cl.value;
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);
    const fs=Math.round(c.width*sz.value/100);x.font='600 '+fs+'px Space Grotesk, Inter, sans-serif';x.fillStyle=cl.value;x.globalAlpha=op.value/100;x.textBaseline='middle';const m=fs*.7,t=tx.value||' ',tw=x.measureText(t).width;
    if(ps.value==='tile'){x.save();x.translate(c.width/2,c.height/2);x.rotate(-Math.PI/6);x.translate(-c.width/2,-c.height/2);x.textAlign='center';const gx=tw+fs*2,gy=fs*3;for(let yy=-c.height;yy<c.height*2;yy+=gy)for(let xx=-c.width;xx<c.width*2;xx+=gx)x.fillText(t,xx,yy);x.restore();}
    else{x.textAlign='left';let px,py;if(ps.value==='tl'){px=m;py=m+fs/2;}if(ps.value==='tr'){px=c.width-tw-m;py=m+fs/2;}if(ps.value==='bl'){px=m;py=c.height-m-fs/2;}if(ps.value==='br'){px=c.width-tw-m;py=c.height-m-fs/2;}if(ps.value==='c'){px=(c.width-tw)/2;py=c.height/2;}x.fillText(t,px,py);}
    x.globalAlpha=1;u.results.innerHTML='';u.results.classList.add('show');const w=document.createElement('div');w.className='preview show';w.appendChild(c);u.results.appendChild(w);u.results._c=c;}
  [tx,ps,sz,op,cl].forEach(el=>el.addEventListener('input',paint));
  $('#run',panel).onclick=()=>{const c=u.results._c;if(!c){setStatus(u.status,'Drop an image first.',1);return;}c.toBlob(b=>download(b,'watermarked.png'),'image/png');};
};

/* ===== QR Code Generator ===== */
INIT['qr-code-generator']=function(panel){
  panel.innerHTML='<div style="display:grid;grid-template-columns:1fr 300px;gap:26px;align-items:start" id="qwrap"></div>';
  const wrap=$('#qwrap',panel);
  wrap.innerHTML='<div><div class="seg" id="ty" style="margin-bottom:18px"><button class="active" data-t="url">Link</button><button data-t="text">Text</button><button data-t="email">Email</button><button data-t="wifi">Wi-Fi</button></div>'+
    '<div id="main"><div class="ctrl" style="margin-bottom:14px"><label id="ml">Website URL</label><input type="text" id="mi" value="https://tarumak.tools" style="width:100%"></div></div>'+
    '<div id="wifi" style="display:none"><div class="ctrl" style="margin-bottom:12px"><label>Network name (SSID)</label><input type="text" id="ssid" style="width:100%"></div><div style="display:flex;gap:12px"><div class="ctrl" style="flex:1"><label>Password</label><input type="text" id="wp" style="width:100%"></div><div class="ctrl"><label>Security</label><select id="wt"><option>WPA</option><option>WEP</option><option value="nopass">None</option></select></div></div></div>'+
    '<div style="display:flex;gap:12px;margin-top:14px"><div class="ctrl"><label>Foreground</label><div class="color-field"><input type="color" id="fg" value="#0a0d18"><span id="fgh">#0a0d18</span></div></div><div class="ctrl"><label>Background</label><div class="color-field"><input type="color" id="bg" value="#ffffff"><span id="bgh">#ffffff</span></div></div></div></div>'+
    '<div style="display:flex;flex-direction:column;gap:16px;align-items:center;padding:22px;background:var(--surface-2);border:1px solid var(--border);border-radius:18px"><div id="qbox" style="width:240px;height:240px;background:#fff;border-radius:14px;display:grid;place-items:center;padding:14px"></div><button class="btn btn-primary" id="dl" style="width:100%" disabled>Download PNG</button></div>';
  let type='url',qr=null;const mi=$('#mi',panel),ml=$('#ml',panel),mainB=$('#main',panel),wifiB=$('#wifi',panel),fg=$('#fg',panel),bg=$('#bg',panel),qbox=$('#qbox',panel),dl=$('#dl',panel);
  const cfg={url:['Website URL','https://example.com'],text:['Text content','Type anything…'],email:['Email address','name@email.com']};
  $('#ty',panel).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('#ty button',panel).forEach(x=>x.classList.remove('active'));b.classList.add('active');type=b.dataset.t;if(type==='wifi'){mainB.style.display='none';wifiB.style.display='block';}else{mainB.style.display='block';wifiB.style.display='none';ml.textContent=cfg[type][0];mi.placeholder=cfg[type][1];}gen();});
  function payload(){if(type==='wifi'){const s=$('#ssid',panel).value,p=$('#wp',panel).value,t=$('#wt',panel).value;if(!s)return'';return'WIFI:T:'+t+';S:'+s+';P:'+p+';;';}const v=mi.value.trim();if(!v)return'';return type==='email'?'mailto:'+v:v;}
  function gen(){const data=payload();qbox.innerHTML='';if(!data){dl.disabled=true;return;}qr=new QRCode(qbox,{text:data,width:460,height:460,colorDark:fg.value,colorLight:bg.value,correctLevel:QRCode.CorrectLevel.M});dl.disabled=false;}
  panel.addEventListener('input',e=>{if(e.target.closest('#qwrap')){$('#fgh',panel).textContent=fg.value;$('#bgh',panel).textContent=bg.value;gen();}});
  dl.onclick=()=>{const src=qbox.querySelector('canvas')||qbox.querySelector('img');if(!src)return;const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=bg.value;x.fillRect(0,0,512,512);const done=()=>c.toBlob(b=>download(b,'qr-code.png'),'image/png');const cv=qbox.querySelector('canvas');if(cv){x.drawImage(cv,16,16,480,480);done();}else{const i=new Image();i.onload=()=>{x.drawImage(i,16,16,480,480);done();};i.src=src.src;}};
  gen();
};

/* ===== Inline GIF89a encoder — no Worker, works everywhere including file:// ===== */
function gifMakeBlob(frames,delayMs){
  const W=frames[0].width,H=frames[0].height;
  const by=[];
  const p16=v=>{by.push(v&0xff,(v>>8)&0xff);};
  const pu=(...a)=>by.push(...a);

  /* LZW encoder for GIF (min code size = 8 for 256-color) */
  function lzwEnc(px){
    const CC=256,EOI=257;
    const out=[];let acc=0,ab=0,cs=9,nc=EOI+1;
    const tbl=new Map();
    const emit=c=>{acc|=c<<ab;ab+=cs;while(ab>=8){out.push(acc&0xff);acc>>>=8;ab-=8;}};
    const resetT=()=>{tbl.clear();nc=EOI+1;cs=9;};
    emit(CC);
    let p=px[0];
    for(let i=1;i<px.length;i++){
      const k=p*256+px[i];
      if(tbl.has(k)){p=tbl.get(k);continue;}
      emit(p);
      if(nc<4096){tbl.set(k,nc++);if(nc===(1<<cs)&&cs<12)cs++;}
      else{emit(CC);resetT();}
      p=px[i];
    }
    emit(p);emit(EOI);if(ab)out.push(acc&0xff);
    return out;
  }

  /* Posterise pixels and collect top-256 by frequency */
  function buildPal(rgba){
    const freq=new Map();
    for(let i=0;i<rgba.length;i+=4){
      const k=((rgba[i]>>2)<<12)|((rgba[i+1]>>2)<<6)|(rgba[i+2]>>2);
      freq.set(k,(freq.get(k)||0)+1);
    }
    const top=[...freq].sort((a,b)=>b[1]-a[1]).slice(0,256);
    const pal=new Uint8Array(768);
    top.forEach(([k],i)=>{pal[i*3]=((k>>12)&63)<<2;pal[i*3+1]=((k>>6)&63)<<2;pal[i*3+2]=(k&63)<<2;});
    return pal;
  }

  /* Map pixels to nearest palette index with per-call cache */
  function mapPx(rgba,pal){
    const n=rgba.length>>2,out=new Uint8Array(n),cache=new Map();
    for(let i=0;i<n;i++){
      const r=rgba[i*4],g=rgba[i*4+1],b=rgba[i*4+2];
      const ck=(r<<16)|(g<<8)|b;
      if(!cache.has(ck)){
        let best=0,bd=Infinity;
        for(let j=0;j<256;j++){const dr=r-pal[j*3],dg=g-pal[j*3+1],db=b-pal[j*3+2];const d=dr*dr+dg*dg+db*db;if(d<bd){bd=d;best=j;if(!d)break;}}
        cache.set(ck,best);
      }
      out[i]=cache.get(ck);
    }
    return out;
  }

  /* Collect all frame pixel data upfront */
  const allRgba=frames.map(cv=>cv.getContext('2d').getImageData(0,0,W,H).data);
  const pal=buildPal(allRgba[0]);

  /* GIF89a Header */
  pu(0x47,0x49,0x46,0x38,0x39,0x61); /* GIF89a */
  p16(W);p16(H);
  pu(0xf7,0x00,0x00); /* global CT flag, 256 entries, bg=0, aspect=0 */
  for(let i=0;i<768;i++)by.push(pal[i]); /* global color table */

  /* Netscape Application Extension — infinite loop */
  pu(0x21,0xff,0x0b);
  [78,69,84,83,67,65,80,69,50,46,48].forEach(c=>by.push(c)); /* NETSCAPE2.0 */
  pu(0x03,0x01,0x00,0x00,0x00); /* loop forever, block term */

  /* Write each frame */
  const dcs=Math.max(1,Math.round(delayMs/10)); /* delay in centiseconds */
  for(let fi=0;fi<frames.length;fi++){
    const px=mapPx(allRgba[fi],pal);
    pu(0x21,0xf9,0x04,0x00);p16(dcs);pu(0x00,0x00); /* GCE */
    pu(0x2c);p16(0);p16(0);p16(W);p16(H);pu(0x00);  /* Image descriptor */
    pu(0x08); /* LZW min code size = 8 */
    const lzwBytes=lzwEnc(px);
    for(let i=0;i<lzwBytes.length;i+=255){
      const chunk=lzwBytes.slice(i,i+255);
      by.push(chunk.length,...chunk);
    }
    pu(0x00); /* block terminator */
  }
  pu(0x3b); /* GIF Trailer */
  return new Uint8Array(by);
}
function gifFromFrames(frames,delayMs,cb,errCb){
  try{cb(new Blob([gifMakeBlob(frames,delayMs)],{type:'image/gif'}));}
  catch(e){errCb&&errCb(e);}
}

/* ===== GIF Maker ===== */
INIT['gif-maker']=function(panel){
  const u=dz(panel,{accept:'image/*',multiple:true,formats:['IMG&#8594;GIF'],sub:'Add images in order; they become animation frames.'});
  u.controls.innerHTML='<div class="ctrl"><label>Frame delay · <span class="val" id="dv">300ms</span></label><input type="range" id="d" min="80" max="1000" step="20" value="300"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Make GIF</button>';
  let files=[];const d=$('#d',panel);d.oninput=()=>$('#dv',panel).textContent=d.value+'ms';
  dropzone(u.drop,u.file,fs=>{files=files.concat([...fs].filter(f=>f.type.startsWith('image/')));if(files.length)setStatus(u.status,files.length+' frame(s) ready.');});
  $('#run',panel).onclick=async()=>{if(files.length<1){setStatus(u.status,'Add at least one image.',1);return;}setStatus(u.status,'Building GIF…');
    const imgs=await Promise.all(files.map(readImg));const W=imgs[0].naturalWidth,H=imgs[0].naturalHeight;
    const frames=imgs.map(im=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);const s=Math.min(W/im.naturalWidth,H/im.naturalHeight);const w=im.naturalWidth*s,h=im.naturalHeight*s;x.drawImage(im,(W-w)/2,(H-h)/2,w,h);return c;});
    gifFromFrames(frames,+d.value,blob=>{u.results.innerHTML='';row(u.results,frames[0].toDataURL('image/png'),'animation.gif',imgs.length+' frames · '+fmtBytes(blob.size),()=>download(blob,'animation.gif'));setStatus(u.status,'Done.');},e=>setStatus(u.status,'Failed: '+e,1));};
};

/* ===== WebP to GIF ===== */
INIT['webp-to-gif']=function(panel){
  const u=dz(panel,{accept:'image/*',formats:['GIF'],sub:'Convert a WebP image to GIF.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f)return;const img=await readImg(f);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);setStatus(u.status,'Encoding GIF…');
    gifFromFrames([c],200,blob=>{u.results.innerHTML='';row(u.results,c.toDataURL('image/png'),f.name,fmtBytes(blob.size)+' · GIF',()=>download(blob,f.name.replace(/\.[^.]+$/,'')+'.gif'));setStatus(u.status,'Done.');},e=>setStatus(u.status,'Failed: '+e,1));});
};
FAQ['webp-to-gif']=[['Does it keep animation?','This converts a still WebP into a single-frame GIF. Decoding animated WebP frames is not supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== Color Picker ===== */
INIT['color-picker']=function(panel){
  const u=dz(panel,{accept:'image/*',formats:['HEX','RGB'],sub:'Then hover or click the image to sample a color.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f)return;const img=await readImg(f);
    u.results.classList.add('show');u.results.innerHTML='<div style="display:grid;grid-template-columns:1fr 220px;gap:20px;align-items:start"><div class="preview show" id="cpw"></div><div id="cpi"></div></div>';
    const maxW=Math.min(580,u.results.clientWidth-260||580);const scl=Math.min(1,maxW/img.naturalWidth);const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*scl);c.height=Math.round(img.naturalHeight*scl);const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);c.style.cursor='crosshair';$('#cpw',panel).appendChild(c);
    const info=$('#cpi',panel);let locked=false;
    function show(px,py){const d=x.getImageData(px,py,1,1).data;const hex='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');const rgb='rgb('+d[0]+', '+d[1]+', '+d[2]+')';info.innerHTML='<div style="height:84px;border-radius:12px;border:1px solid var(--border);background:'+hex+'"></div><div class="ctrl" style="margin-top:12px"><label>HEX</label><input type="text" readonly value="'+hex+'"></div><div class="ctrl" style="margin-top:10px"><label>RGB</label><input type="text" readonly value="'+rgb+'"></div><div class="note">'+(locked?'Locked — click image to resume sampling.':'Click to lock a color.')+'</div>';}
    c.addEventListener('mousemove',e=>{if(locked)return;const r=c.getBoundingClientRect();show((e.clientX-r.left)*c.width/r.width|0,(e.clientY-r.top)*c.height/r.height|0);});
    c.addEventListener('click',e=>{locked=!locked;const r=c.getBoundingClientRect();show((e.clientX-r.left)*c.width/r.width|0,(e.clientY-r.top)*c.height/r.height|0);});
    show(0,0);});
};

/* ===== Image Collage ===== */
INIT['image-collage']=function(panel){
  const u=dz(panel,{accept:'image/*',multiple:true,formats:['JPG','PNG'],sub:'Add photos; they tile into a grid.'});
  u.controls.innerHTML='<div class="ctrl"><label>Columns</label><select id="cols"><option>2</option><option selected>3</option><option>4</option></select></div><div class="ctrl"><label>Gap · <span class="val" id="gv">10px</span></label><input type="range" id="gap" min="0" max="40" value="10"></div><div class="ctrl"><label>Cell</label><select id="cell"><option value="220">Medium</option><option value="160">Small</option><option value="320">Large</option></select></div><div class="ctrl"><label>Background</label><div class="color-field"><input type="color" id="bg" value="#ffffff"><span id="bgh">#ffffff</span></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Build collage</button>';
  let files=[];const gap=$('#gap',panel);gap.oninput=()=>$('#gv',panel).textContent=gap.value+'px';$('#bg',panel).oninput=e=>$('#bgh',panel).textContent=e.target.value;
  dropzone(u.drop,u.file,fs=>{files=files.concat([...fs].filter(f=>f.type.startsWith('image/')));if(files.length)setStatus(u.status,files.length+' photo(s) ready.');});
  $('#run',panel).onclick=async()=>{if(!files.length){setStatus(u.status,'Add some photos first.',1);return;}const imgs=await Promise.all(files.map(readImg));const cols=+$('#cols',panel).value,g=+gap.value,cell=+$('#cell',panel).value,bg=$('#bg',panel).value;const rows=Math.ceil(imgs.length/cols);const W=cols*cell+(cols+1)*g,H=rows*cell+(rows+1)*g;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,W,H);
    imgs.forEach((im,i)=>{const cx=i%cols,cy=(i/cols)|0,dx=g+cx*(cell+g),dy=g+cy*(cell+g),s=Math.max(cell/im.naturalWidth,cell/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;x.save();x.beginPath();x.rect(dx,dy,cell,cell);x.clip();x.drawImage(im,dx+(cell-w)/2,dy+(cell-h)/2,w,h);x.restore();});
    u.results.innerHTML='';u.results.classList.add('show');const wp=document.createElement('div');wp.className='preview show';wp.appendChild(c);u.results.appendChild(wp);c.toBlob(b=>{u.actions.className='actions show';u.actions.innerHTML='';const db=document.createElement('button');db.className='btn btn-primary';db.textContent='Download collage';db.onclick=()=>download(b,'collage.png');u.actions.appendChild(db);},'image/png');};
};

/* ===== Favicon Generator ===== */
function buildIco(canvases){const imgs=canvases.map(c=>{const bin=atob(c.toDataURL('image/png').split(',')[1]);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return{size:c.width,data:arr};});
  const count=imgs.length,header=6+count*16,total=header+imgs.reduce((a,b)=>a+b.data.length,0);const buf=new ArrayBuffer(total),dv=new DataView(buf),u8=new Uint8Array(buf);
  dv.setUint16(0,0,true);dv.setUint16(2,1,true);dv.setUint16(4,count,true);let off=header;
  imgs.forEach((im,i)=>{const e=6+i*16;u8[e]=im.size>=256?0:im.size;u8[e+1]=im.size>=256?0:im.size;dv.setUint16(e+4,1,true);dv.setUint16(e+6,32,true);dv.setUint32(e+8,im.data.length,true);dv.setUint32(e+12,off,true);u8.set(im.data,off);off+=im.data.length;});
  return new Blob([buf],{type:'image/x-icon'});}
INIT['favicon-generator']=function(panel){
  const u=dz(panel,{accept:'image/*',formats:['ICO','PNG'],sub:'Drop a square image — a logo works best.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f)return;const img=await readImg(f);const sizes=[16,32,48,64,128,180,192,512];u.results.innerHTML='';u.results.classList.add('show');const cv={};
    sizes.forEach(s=>{const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(img,0,0,s,s);cv[s]=c;c.toBlob(b=>row(u.results,c.toDataURL(),'favicon-'+s+'.png',s+'×'+s+' PNG',()=>download(b,'favicon-'+s+'x'+s+'.png')),'image/png');});
    setTimeout(()=>{try{const ico=buildIco([cv[16],cv[32],cv[48]]);u.actions.className='actions show';u.actions.innerHTML='';const b=document.createElement('button');b.className='btn btn-primary';b.textContent='Download favicon.ico';b.onclick=()=>download(ico,'favicon.ico');u.actions.appendChild(b);}catch(e){}},250);});
};

/* ===== TXT to PDF ===== */
INIT['txt-to-pdf']=function(panel){
  panel.innerHTML='<div class="ctrl"><label>Paste text, or load a .txt file</label><textarea id="ta" placeholder="Type or paste your text here…"></textarea></div><div class="controls"><label class="btn btn-ghost" style="cursor:pointer">Load .txt<input type="file" id="f" accept=".txt,text/plain" hidden></label><div class="ctrl"><label>Page</label><select id="pg"><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Create PDF</button></div><div class="status" id="st"></div>';
  const ta=$('#ta',panel),st=$('#st',panel);
  $('#f',panel).onchange=e=>{const f=e.target.files[0];if(f)f.text().then(t=>ta.value=t);};
  $('#run',panel).onclick=()=>{const txt=ta.value;if(!txt.trim()){setStatus(st,'Enter some text first.',1);return;}const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'pt',format:$('#pg',panel).value});const M=48,W=doc.internal.pageSize.getWidth()-M*2,PH=doc.internal.pageSize.getHeight()-M;doc.setFont('helvetica');doc.setFontSize(12);const lines=doc.splitTextToSize(txt,W);let y=M;lines.forEach(ln=>{if(y>PH){doc.addPage();y=M;}doc.text(ln,M,y);y+=16;});doc.save('document.pdf');setStatus(st,'PDF created.');};
};

/* ===== HTML to PDF ===== */
INIT['html-to-pdf']=function(panel){
  panel.innerHTML='<div class="ctrl"><label>Paste HTML</label><textarea id="ta" placeholder="&lt;h1&gt;Hello&lt;/h1&gt;&lt;p&gt;Your HTML here…&lt;/p&gt;"></textarea></div><div class="controls"><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Render to PDF</button></div><div class="note">Renders your HTML visually and places it into an A4 PDF. External images must allow cross-origin access to appear.</div><div class="status" id="st"></div>';
  const ta=$('#ta',panel),st=$('#st',panel);
  $('#run',panel).onclick=async()=>{const html=ta.value;if(!html.trim()){setStatus(st,'Paste some HTML first.',1);return;}setStatus(st,'Rendering…');
    const box=document.createElement('div');box.style.cssText='position:fixed;left:-9999px;top:0;width:794px;padding:40px;background:#fff;color:#000;font-family:Arial,sans-serif';box.innerHTML=html;document.body.appendChild(box);
    try{const canvas=await html2canvas(box,{scale:2,backgroundColor:'#fff'});const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'pt',format:'a4'});const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();const iw=pw,ih=canvas.height*pw/canvas.width;const img=canvas.toDataURL('image/jpeg',.92);doc.addImage(img,'JPEG',0,0,iw,ih);let left=ih-ph,pos=0;while(left>0){doc.addPage();pos-=ph;doc.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;}doc.save('document.pdf');setStatus(st,'PDF created.');}catch(e){setStatus(st,'Failed: '+(e.message||e),1);}finally{box.remove();}};
};

/* =====================================================================
   PDF TOOLS  (pdf-lib = PDFLib, pdf.js = pdfjsLib, jsPDF = window.jspdf)
   ===================================================================== */

/* shared helpers --------------------------------------------------- */
function parseRanges(str,max){
  const out=new Set();
  String(str||'').split(',').forEach(p=>{p=p.trim();if(!p)return;
    if(p.indexOf('-')>-1){let a=parseInt(p.split('-')[0],10),b=parseInt(p.split('-')[1],10);
      if(isNaN(a)||isNaN(b))return;if(a>b){const t=a;a=b;b=t;}
      for(let i=a;i<=b;i++)if(i>=1&&i<=max)out.add(i);}
    else{const n=parseInt(p,10);if(!isNaN(n)&&n>=1&&n<=max)out.add(n);}});
  return [...out].sort((x,y)=>x-y);
}
async function pdfjsDoc(file){const data=await file.arrayBuffer();return await pdfjsLib.getDocument({data:data}).promise;}
async function renderPage(pdf,num,scale){const page=await pdf.getPage(num);const vp=page.getViewport({scale:scale});
  const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;
  await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
  const v1=page.getViewport({scale:1});return {canvas:c,w:v1.width,h:v1.height};}

/* reorderable file/page list (rows with up / down / remove) -------- */
function listRows(box,arr,label){
  function paint(){box.innerHTML='';box.classList.add('show');
    arr.forEach((it,i)=>{
      const d=document.createElement('div');d.className='row';
      d.innerHTML='<div class="thumb" style="display:grid;place-items:center;color:var(--accent)">'+ICON.pdf+'</div>'+
        '<div class="meta"><div class="nm">'+label(it)+'</div><div class="sz">Position '+(i+1)+'</div></div>';
      const g=document.createElement('div');g.style.cssText='display:flex;gap:6px';
      const mk=(html,fn,dis)=>{const b=document.createElement('button');b.className='btn btn-ghost';b.style.cssText='height:34px;padding:0 11px;font-size:15px';b.innerHTML=html;b.disabled=!!dis;if(dis)b.style.opacity='.35';b.onclick=fn;return b;};
      g.appendChild(mk('&#8593;',()=>{const t=arr[i-1];arr[i-1]=arr[i];arr[i]=t;paint();},i===0));
      g.appendChild(mk('&#8595;',()=>{const t=arr[i+1];arr[i+1]=arr[i];arr[i]=t;paint();},i===arr.length-1));
      g.appendChild(mk('&#10005;',()=>{arr.splice(i,1);paint();}));
      d.appendChild(g);box.appendChild(d);});
    if(!arr.length)box.classList.remove('show');}
  paint();
}

/* ---------- Images -> PDF factory --------------------------------- */
const PSIZE={a4:[595.28,841.89],letter:[612,792]};
async function embedImage(pdf,file){
  const t=file.type||'';
  if(t==='image/jpeg')return await pdf.embedJpg(await file.arrayBuffer());
  if(t==='image/png')return await pdf.embedPng(await file.arrayBuffer());
  const img=await readImg(file);const c=document.createElement('canvas');
  c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;
  c.getContext('2d').drawImage(img,0,0);
  return await pdf.embedPng(c.toDataURL('image/png'));
}
async function buildImagesPdf(files,mode){
  const pdf=await PDFLib.PDFDocument.create();
  for(const f of files){const e=await embedImage(pdf,f);
    if(mode==='fit'){const pg=pdf.addPage([e.width,e.height]);pg.drawImage(e,{x:0,y:0,width:e.width,height:e.height});}
    else{let pw=PSIZE[mode][0],ph=PSIZE[mode][1];if(e.width>e.height){const t=pw;pw=ph;ph=t;}
      const pg=pdf.addPage([pw,ph]);const m=24,aw=pw-m*2,ah=ph-m*2;
      const s=Math.min(aw/e.width,ah/e.height),w=e.width*s,h=e.height*s;
      pg.drawImage(e,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});}}
  return new Blob([await pdf.save()],{type:'application/pdf'});
}
function imagesToPdfTool(opt){opt=opt||{};return function(panel){
  const u=dz(panel,{accept:opt.accept||'image/*',multiple:true,formats:opt.formats||['JPG','PNG','WEBP'],
    title:opt.title||'Drop images here or click to browse',sub:opt.sub||'Pages appear in the order you add them — reorder below.'});
  let files=[];
  u.controls.className='controls';
  u.controls.innerHTML='<div class="ctrl"><label>Page size</label><select id="ps"><option value="fit">Fit to image</option><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="make" disabled>Create PDF</button>';
  const make=$('#make',panel);
  function refresh(){listRows(u.results,files,f=>f._nm||f.name||'image');make.disabled=!files.length;}
  dropzone(u.drop,u.file,fs=>{[...fs].forEach(f=>{if((f.type||'').startsWith('image/'))files.push(f);});refresh();});
  make.onclick=async()=>{if(!files.length)return;setStatus(u.status,'Building PDF from '+files.length+' image(s)…');make.disabled=true;
    try{const blob=await buildImagesPdf(files,$('#ps',panel).value);download(blob,(opt.outName||'images')+'.pdf');setStatus(u.status,'PDF created with '+files.length+' page(s).');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}finally{make.disabled=false;}};
};}
INIT['image-to-pdf']=imagesToPdfTool({outName:'image'});
INIT['jpg-to-pdf']=imagesToPdfTool({accept:'image/jpeg',formats:['JPG&#8594;PDF'],outName:'jpg'});
INIT['png-to-pdf']=imagesToPdfTool({accept:'image/png',formats:['PNG&#8594;PDF'],outName:'png'});
INIT['images-to-pdf']=imagesToPdfTool({outName:'images',sub:'Batch many photos into one PDF — drag in as many as you like.'});

/* ---------- Scan to PDF (camera + files) -------------------------- */
INIT['scan-to-pdf']=function(panel){
  panel.innerHTML='<div class="controls" id="cam"></div><div class="preview" id="pv"></div>'+
    '<div class="drop" id="d_drop"><input type="file" id="d_file" accept="image/*" multiple hidden><div class="di">'+UP+'</div><h3>Or drop image scans here</h3><p>JPG / PNG photos of your pages</p></div>'+
    '<div class="controls" id="opts"><div class="ctrl"><label>Page size</label><select id="ps"><option value="fit">Fit to image</option><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="make" disabled>Create PDF</button></div>'+
    '<div class="results" id="d_results"></div><div class="status" id="st"></div>';
  const cam=$('#cam',panel),pv=$('#pv',panel),st=$('#st',panel),make=$('#make',panel),res=$('#d_results',panel);
  let files=[],stream=null,video=null;
  function refresh(){listRows(res,files,f=>f._nm||f.name||'scan');make.disabled=!files.length;}
  cam.innerHTML='<button class="btn btn-ghost" id="open">Open camera</button><div class="ctrl-spacer"></div>';
  $('#open',cam).onclick=async()=>{
    try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.srcObject=stream;
      pv.className='preview show';pv.innerHTML='';pv.appendChild(video);
      cam.innerHTML='<button class="btn btn-primary" id="snap">Capture page</button><button class="btn btn-ghost" id="stop">Stop camera</button><div class="ctrl-spacer"></div>';
      $('#snap',cam).onclick=()=>{const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);
        c.toBlob(b=>{b._nm='scan-'+(files.length+1)+'.jpg';files.push(b);refresh();setStatus(st,files.length+' page(s) captured.');},'image/jpeg',.9);};
      $('#stop',cam).onclick=()=>{stream.getTracks().forEach(t=>t.stop());pv.className='preview';pv.innerHTML='';cam.innerHTML='<button class="btn btn-ghost" id="open2">Open camera</button><div class="ctrl-spacer"></div>';$('#open2',cam).onclick=$('#open',cam)&&null;};
    }catch(e){setStatus(st,'Camera unavailable — drop image scans below instead.',1);}
  };
  dropzone($('#d_drop',panel),$('#d_file',panel),fs=>{[...fs].forEach(f=>{if((f.type||'').startsWith('image/'))files.push(f);});refresh();});
  make.onclick=async()=>{if(!files.length)return;setStatus(st,'Building PDF…');make.disabled=true;
    try{download(await buildImagesPdf(files,$('#ps',panel).value),'scan.pdf');setStatus(st,'PDF created with '+files.length+' page(s).');}
    catch(e){setStatus(st,'Failed: '+(e.message||e),1);}finally{make.disabled=false;}};
};

/* ---------- PDF Merger -------------------------------------------- */
INIT['pdf-merger']=function(panel){
  const u=dz(panel,{accept:'application/pdf',multiple:true,formats:['PDF'],title:'Drop PDF files here or click to browse',sub:'Add two or more PDFs, then arrange the order below.'});
  let files=[];
  u.controls.className='controls';u.controls.innerHTML='<div class="ctrl-spacer"></div><button class="btn btn-primary" id="go" disabled>Merge PDFs</button>';
  const go=$('#go',panel);
  function refresh(){listRows(u.results,files,f=>f.name);go.disabled=files.length<2;}
  dropzone(u.drop,u.file,fs=>{[...fs].forEach(f=>{if((f.type||'').indexOf('pdf')>-1||/\.pdf$/i.test(f.name))files.push(f);});refresh();});
  go.onclick=async()=>{if(files.length<2)return;setStatus(u.status,'Merging '+files.length+' files…');go.disabled=true;
    try{const out=await PDFLib.PDFDocument.create();
      for(const f of files){const src=await PDFLib.PDFDocument.load(await f.arrayBuffer(),{ignoreEncryption:true});
        const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}
      download(new Blob([await out.save()],{type:'application/pdf'}),'merged.pdf');
      setStatus(u.status,'Merged into one PDF ('+out.getPageCount()+' pages).');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}finally{go.disabled=false;}};
};

/* ---------- PDF Splitter ------------------------------------------ */
INIT['pdf-splitter']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Extract a page range into one PDF, or split every page out separately.'});
  let buf=null,count=0;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();
    const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});count=d.getPageCount();
    u.controls.className='controls';
    u.controls.innerHTML='<div class="seg" id="md"><button class="active" data-m="range">Extract range</button><button data-m="each">Split every page</button></div>'+
      '<div class="ctrl" id="rg"><label>Pages (e.g. 1-3, 5)</label><input type="text" id="rng" value="1-'+count+'" style="width:160px"></div>'+
      '<div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Split PDF</button>';
    setStatus(u.status,'Loaded '+count+' pages.');
    const seg=$('#md',panel);seg.onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('#md button',panel).forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#rg',panel).style.display=b.dataset.m==='range'?'flex':'none';};
    $('#go',panel).onclick=async()=>{const mode=$('#md button.active',panel).dataset.m;
      try{if(mode==='range'){const idx=parseRanges($('#rng',panel).value,count);if(!idx.length){setStatus(u.status,'Enter a valid page range.',1);return;}
          const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});const out=await PDFLib.PDFDocument.create();
          const cp=await out.copyPages(src,idx.map(n=>n-1));cp.forEach(p=>out.addPage(p));
          download(new Blob([await out.save()],{type:'application/pdf'}),'split-pages.pdf');setStatus(u.status,'Extracted '+idx.length+' page(s).');}
        else{u.results.classList.add('show');u.results.innerHTML='';const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
          for(let i=0;i<count;i++){const out=await PDFLib.PDFDocument.create();const[p]=await out.copyPages(src,[i]);out.addPage(p);
            const blob=new Blob([await out.save()],{type:'application/pdf'});row(u.results,null,'page-'+(i+1)+'.pdf','Page '+(i+1),()=>download(blob,'page-'+(i+1)+'.pdf'));}
          setStatus(u.status,count+' single-page PDFs ready below.');}}
      catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}};
  });
};

/* ---------- PDF Compressor (rasterize + re-encode) ---------------- */
INIT['pdf-compressor']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Best for image-heavy or scanned PDFs.'});
  let file=null;
  dropzone(u.drop,u.file,fs=>{file=[...fs][0];if(!file)return;
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label>Quality</label><div class="seg" id="q"><button data-s="0.4" data-r="1">Strong</button><button class="active" data-s="0.6" data-r="1.3">Balanced</button><button data-s="0.82" data-r="1.6">Light</button></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Compress PDF</button>';
    $('#q',panel).onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('#q button',panel).forEach(x=>x.classList.remove('active'));b.classList.add('active');};
    setStatus(u.status,'Ready — '+fmtBytes(file.size)+'.');
    $('#go',panel).onclick=async()=>{const sel=$('#q button.active',panel);const jpegQ=parseFloat(sel.dataset.s),scale=parseFloat(sel.dataset.r);
      setStatus(u.status,'Compressing… this can take a moment.');
      try{const pdf=await pdfjsDoc(file);const {jsPDF}=window.jspdf;let doc=null;
        for(let i=1;i<=pdf.numPages;i++){const r=await renderPage(pdf,i,scale);const img=r.canvas.toDataURL('image/jpeg',jpegQ);
          const w=r.w,h=r.h,o=w>h?'l':'p';if(i===1)doc=new jsPDF({unit:'pt',format:[w,h],orientation:o});else doc.addPage([w,h],o);
          doc.addImage(img,'JPEG',0,0,w,h);}
        const blob=doc.output('blob');u.results.classList.add('show');u.results.innerHTML='';
        const pct=Math.max(0,Math.round((1-blob.size/file.size)*100));
        row(u.results,null,'compressed.pdf',fmtBytes(file.size)+' <span class="arrow">&#8594;</span> '+fmtBytes(blob.size)+(pct>0?' <span class="save">-'+pct+'%</span>':''),()=>download(blob,'compressed.pdf'));
        setStatus(u.status,pct>0?('Done — '+pct+'% smaller.'):'Done — this PDF was already well optimized.');}
      catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}};
  });
};
FAQ['pdf-compressor']=[['How does compression work?','Each page is rendered to an image and re-encoded as JPEG at your chosen quality. This works best for scanned or image-heavy PDFs; selectable text becomes part of the image.'],['Are my files uploaded?','No — everything runs in your browser.']];

/* ---------- PDF to JPG -------------------------------------------- */
INIT['pdf-to-jpg']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF&#8594;JPG'],title:'Drop a PDF here or click to browse',sub:'Each page is exported as a separate high-quality JPG.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;setStatus(u.status,'Rendering pages…');
    try{const pdf=await pdfjsDoc(f);u.results.classList.add('show');u.results.innerHTML='';
      for(let i=1;i<=pdf.numPages;i++){const r=await renderPage(pdf,i,2);
        await new Promise(res=>r.canvas.toBlob(b=>{const thumb=document.createElement('canvas');const s=54/Math.max(r.canvas.width,r.canvas.height);thumb.width=r.canvas.width*s;thumb.height=r.canvas.height*s;thumb.getContext('2d').drawImage(r.canvas,0,0,thumb.width,thumb.height);
          row(u.results,thumb.toDataURL(),'page-'+i+'.jpg','Page '+i+' &middot; '+r.canvas.width+'&times;'+r.canvas.height,()=>download(b,'page-'+i+'.jpg'));res();},'image/jpeg',.92));}
      setStatus(u.status,pdf.numPages+' page(s) exported as JPG.');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}});
};

/* ---------- PDF to Text ------------------------------------------- */
INIT['pdf-to-text']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF&#8594;TXT'],title:'Drop a PDF here or click to browse',sub:'Pulls out selectable text. Scanned image-only PDFs have no text to extract.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;setStatus(u.status,'Extracting text…');
    try{const pdf=await pdfjsDoc(f);let all='';
      for(let i=1;i<=pdf.numPages;i++){const c=await(await pdf.getPage(i)).getTextContent();all+=c.items.map(x=>x.str).join(' ')+'\n\n';}
      u.controls.className='controls';u.controls.style.flexDirection='column';u.controls.style.alignItems='stretch';
      u.controls.innerHTML='<textarea id="out" style="min-height:220px"></textarea><div style="display:flex;gap:12px;margin-top:12px"><button class="btn btn-ghost" id="cp">Copy text</button><button class="btn btn-primary" id="dl">Download .txt</button></div>';
      $('#out',panel).value=all.trim();
      $('#cp',panel).onclick=()=>{navigator.clipboard.writeText($('#out',panel).value).then(()=>toast('Copied to clipboard','ok')).catch(()=>toast('Copy failed','err'));};
      $('#dl',panel).onclick=()=>download(new Blob([$('#out',panel).value],{type:'text/plain'}),'extracted-text.txt');
      setStatus(u.status,all.trim()?('Extracted text from '+pdf.numPages+' page(s).'):'No selectable text found — this looks like a scanned PDF.');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}});
};

/* ---------- PDF Password Protector -------------------------------- */
INIT['pdf-password-protect']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Set a password that will be required to open the file.'});
  let file=null;
  dropzone(u.drop,u.file,fs=>{file=[...fs][0];if(!file)return;
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label>Password</label><input type="password" id="pw" placeholder="Enter a password"></div><div class="ctrl"><label>Confirm</label><input type="password" id="pw2" placeholder="Repeat password"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Protect PDF</button>';
    setStatus(u.status,'Ready — '+file.name+'.');
    $('#go',panel).onclick=async()=>{const pw=$('#pw',panel).value,pw2=$('#pw2',panel).value;
      if(!pw){setStatus(u.status,'Enter a password.',1);return;}if(pw!==pw2){setStatus(u.status,'Passwords do not match.',1);return;}
      setStatus(u.status,'Encrypting…');
      try{const pdf=await pdfjsDoc(file);const {jsPDF}=window.jspdf;let doc=null;
        for(let i=1;i<=pdf.numPages;i++){const r=await renderPage(pdf,i,1.6);const img=r.canvas.toDataURL('image/jpeg',.85);
          const w=r.w,h=r.h,o=w>h?'l':'p';
          if(i===1)doc=new jsPDF({unit:'pt',format:[w,h],orientation:o,encryption:{userPassword:pw,ownerPassword:pw,userPermissions:['print','copy']}});
          else doc.addPage([w,h],o);doc.addImage(img,'JPEG',0,0,w,h);}
        download(doc.output('blob'),'protected.pdf');setStatus(u.status,'Done — the PDF now asks for your password to open.');}
      catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}};
  });
};
FAQ['pdf-password-protect']=[['Will the text stay selectable?','Pages are rendered to images during encryption, so text in the protected copy is not selectable. The file is genuinely password-locked to open.'],['Where is the password stored?','Nowhere — encryption happens locally in your browser and the password is never sent anywhere.']];

/* ---------- PDF Unlock -------------------------------------------- */
INIT['pdf-unlock']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Removes owner restrictions. If the file needs a password to open, enter it below.'});
  let file=null;
  dropzone(u.drop,u.file,async fs=>{file=[...fs][0];if(!file)return;
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label>Password (if required to open)</label><input type="password" id="pw" placeholder="Leave blank if none" style="width:220px"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Unlock PDF</button>';
    setStatus(u.status,'Ready — '+file.name+'.');
    $('#go',panel).onclick=async()=>{const pw=$('#pw',panel).value;setStatus(u.status,'Working…');
      try{const buf=await file.arrayBuffer();
        try{const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
          download(new Blob([await d.save()],{type:'application/pdf'}),'unlocked.pdf');
          setStatus(u.status,'Done — restrictions removed, text preserved.');return;}
        catch(inner){/* needs password: rebuild via render */}
        const pdf=await pdfjsLib.getDocument({data:buf,password:pw}).promise;const {jsPDF}=window.jspdf;let doc=null;
        for(let i=1;i<=pdf.numPages;i++){const r=await renderPage(pdf,i,1.6);const img=r.canvas.toDataURL('image/jpeg',.9);
          const w=r.w,h=r.h,o=w>h?'l':'p';if(i===1)doc=new jsPDF({unit:'pt',format:[w,h],orientation:o});else doc.addPage([w,h],o);doc.addImage(img,'JPEG',0,0,w,h);}
        download(doc.output('blob'),'unlocked.pdf');setStatus(u.status,'Done — unlocked copy created.');}
      catch(e){setStatus(u.status,(/password/i.test(e.message||'')?'Wrong or missing password.':'Failed: '+(e.message||e)),1);}};
  });
};
FAQ['pdf-unlock']=[['What can this remove?','It removes owner-level restrictions (such as no-print or no-copy) while keeping the text intact. For files that need a password to open, supply that password and an unlocked copy is rebuilt.'],['Is this legal?','Only unlock PDFs you own or have permission to modify.']];

/* ---------- PDF Page Rotator -------------------------------------- */
INIT['pdf-page-rotator']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Rotate the whole document or just specific pages.'});
  let buf=null,count=0;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();
    const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});count=d.getPageCount();
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label>Rotate by</label><div class="seg" id="ang"><button class="active" data-a="90">90&deg;</button><button data-a="180">180&deg;</button><button data-a="270">270&deg;</button></div></div><div class="ctrl"><label>Pages (blank = all)</label><input type="text" id="rng" placeholder="e.g. 1-3, 5" style="width:150px"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Rotate PDF</button>';
    $('#ang',panel).onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('#ang button',panel).forEach(x=>x.classList.remove('active'));b.classList.add('active');};
    setStatus(u.status,'Loaded '+count+' pages.');
    $('#go',panel).onclick=async()=>{const ang=parseInt($('#ang button.active',panel).dataset.a,10);
      const rv=$('#rng',panel).value.trim();const target=rv?parseRanges(rv,count):null;
      try{const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});const pages=d.getPages();
        pages.forEach((p,i)=>{if(!target||target.indexOf(i+1)>-1){const cur=p.getRotation().angle||0;p.setRotation(PDFLib.degrees((cur+ang)%360));}});
        download(new Blob([await d.save()],{type:'application/pdf'}),'rotated.pdf');
        setStatus(u.status,'Rotated '+(target?target.length:count)+' page(s) by '+ang+' degrees.');}
      catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}};
  });
};

/* ---------- PDF Page Remover -------------------------------------- */
INIT['pdf-page-remover']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'List the pages you want to delete.'});
  let buf=null,count=0;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();
    const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});count=d.getPageCount();
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label>Pages to remove (of '+count+')</label><input type="text" id="rng" placeholder="e.g. 2, 4-6" style="width:200px"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Remove pages</button>';
    setStatus(u.status,'Loaded '+count+' pages.');
    $('#go',panel).onclick=async()=>{const rem=parseRanges($('#rng',panel).value,count);
      if(!rem.length){setStatus(u.status,'Enter which pages to remove.',1);return;}
      if(rem.length>=count){setStatus(u.status,'You cannot remove every page.',1);return;}
      try{const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
        rem.slice().sort((a,b)=>b-a).forEach(n=>d.removePage(n-1));
        download(new Blob([await d.save()],{type:'application/pdf'}),'edited.pdf');
        setStatus(u.status,'Removed '+rem.length+' page(s) — '+d.getPageCount()+' remain.');}
      catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}};
  });
};

/* ---------- PDF Organizer (visual reorder / rotate / delete) ------ */
INIT['pdf-organizer']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Drag pages to reorder. Hover a page to rotate or delete it.'});
  let buf=null;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();setStatus(u.status,'Rendering thumbnails…');
    const pdf=await pdfjsDoc(f);let order=[];for(let i=1;i<=pdf.numPages;i++)order.push({n:i,rot:0});
    const grid=document.createElement('div');grid.className='page-grid';
    u.controls.className='controls';u.controls.innerHTML='<div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Export PDF</button>';
    u.results.classList.add('show');u.results.innerHTML='';u.results.appendChild(grid);
    const thumbs={};for(let i=1;i<=pdf.numPages;i++){const r=await renderPage(pdf,i,.5);thumbs[i]=r.canvas;}
    let dragFrom=null;
    function paint(){grid.innerHTML='';order.forEach((it,idx)=>{
      const card=document.createElement('div');card.className='pg';card.draggable=true;
      const cv=document.createElement('canvas');const src=thumbs[it.n];cv.width=src.width;cv.height=src.height;
      const cx=cv.getContext('2d');cx.save();cx.translate(cv.width/2,cv.height/2);cx.rotate(it.rot*Math.PI/180);
      const sw=(it.rot%180===0)?1:cv.height/cv.width,sh=(it.rot%180===0)?1:cv.width/cv.height;cx.scale(sw,sh);
      cx.drawImage(src,-cv.width/2,-cv.height/2);cx.restore();
      card.appendChild(cv);
      const pn=document.createElement('div');pn.className='pn';pn.textContent='Page '+it.n;card.appendChild(pn);
      const acts=document.createElement('div');acts.className='acts';
      acts.innerHTML='<button title="Rotate">&#8635;</button><button title="Delete">&#10005;</button>';
      acts.children[0].onclick=ev=>{ev.stopPropagation();it.rot=(it.rot+90)%360;paint();};
      acts.children[1].onclick=ev=>{ev.stopPropagation();if(order.length>1){order.splice(idx,1);paint();}};
      card.appendChild(acts);
      card.addEventListener('dragstart',()=>{dragFrom=idx;card.classList.add('dragging');});
      card.addEventListener('dragend',()=>card.classList.remove('dragging'));
      card.addEventListener('dragover',ev=>{ev.preventDefault();card.classList.add('over');});
      card.addEventListener('dragleave',()=>card.classList.remove('over'));
      card.addEventListener('drop',ev=>{ev.preventDefault();card.classList.remove('over');if(dragFrom===null||dragFrom===idx)return;const m=order.splice(dragFrom,1)[0];order.splice(idx,0,m);dragFrom=null;paint();});
      grid.appendChild(card);});}
    paint();setStatus(u.status,pdf.numPages+' pages loaded — drag to reorder.');
    $('#go',panel).onclick=async()=>{setStatus(u.status,'Building PDF…');
      try{const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});const out=await PDFLib.PDFDocument.create();
        for(const it of order){const[p]=await out.copyPages(src,[it.n-1]);if(it.rot){const cur=p.getRotation().angle||0;p.setRotation(PDFLib.degrees((cur+it.rot)%360));}out.addPage(p);}
        download(new Blob([await out.save()],{type:'application/pdf'}),'organized.pdf');setStatus(u.status,'Exported '+order.length+' page(s).');}
      catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}};
  });
};

/* ---------- PDF Reader -------------------------------------------- */
INIT['pdf-reader']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'View any PDF right here, page by page.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;setStatus(u.status,'Opening…');
    try{const pdf=await pdfjsDoc(f);let cur=1,scale=1.3;
      u.controls.className='controls';
      u.controls.innerHTML='<button class="btn btn-ghost" id="prev">&#8592; Prev</button><div class="ctrl"><label>Page</label><span class="val" id="pos"></span></div><button class="btn btn-ghost" id="next">Next &#8594;</button><div class="ctrl-spacer"></div><button class="btn btn-ghost" id="zo">&#8722;</button><button class="btn btn-ghost" id="zi">+</button>';
      const stage=document.createElement('div');stage.className='preview show';u.results.classList.add('show');u.results.innerHTML='';u.results.appendChild(stage);
      async function show(){const r=await renderPage(pdf,cur,scale);stage.innerHTML='';stage.appendChild(r.canvas);$('#pos',panel).textContent=cur+' / '+pdf.numPages;}
      $('#prev',panel).onclick=()=>{if(cur>1){cur--;show();}};
      $('#next',panel).onclick=()=>{if(cur<pdf.numPages){cur++;show();}};
      $('#zi',panel).onclick=()=>{scale=Math.min(3,scale+.25);show();};
      $('#zo',panel).onclick=()=>{scale=Math.max(.5,scale-.25);show();};
      await show();setStatus(u.status,'Opened '+pdf.numPages+' page(s).');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}});
};