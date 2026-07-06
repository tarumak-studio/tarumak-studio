/* TARUMAK STUDIO — features.js
   UI helpers loaded before app.js.
   Contains buildGrid, buildTabs, counts, and setActiveNav — DO NOT
   re-declare in app.js. toggleFav calls buildTabs/buildGrid at
   RUNTIME only — fine since app.js (or the /tools page's own boot
   script) loads before any user interaction. */

const arrowSvg='<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const heartSvg='<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

/* counts() and buildTabs() — moved here from app.js so the /tools
   directory page (which loads features.js but not the homepage-only
   app.js) has everything it needs to render the tabs + grid without
   pulling in unrelated homepage code. */
function counts(){const c={all:TOOLS.length,image:0,pdf:0,converter:0,marketing:0,developer:0};TOOLS.forEach(t=>c[t[2]]++);return c;}

/* buildTabs — deliberately reduced to just All + Saved. The
   5 category tabs that used to live here were functionally
   redundant with the "Browse by Category" cards on the homepage:
   clicking a category card already sets activeCat and filters this
   exact grid — so a visitor arriving via a category card would see
   the same 5 options twice in a row. "All" (reset) and "Saved"
   (favourites, which has no other entry point) are the only two
   that do something a category card can't. */
function buildTabs(){
  if(!tabsEl)return;
  const c=counts(),fv=getFavs().size;
  const catKeys=['image','pdf','converter','marketing','developer'];
  /* When something sets activeCat to a real category (not
     'all'/'favs'), show a dismissible "currently showing" chip —
     without this, arriving here already filtered would show no
     visible confirmation of what's active. */
  const activeCatChip=catKeys.includes(activeCat)
    ? '<button class="tab active tab-active-cat" data-cat="'+activeCat+'">'+CAT[activeCat]+' <span class="ct">'+c[activeCat]+'</span><span class="tab-clear" data-clear="1">&times;</span></button>'
    : '';
  tabsEl.innerHTML='<button class="tab '+(activeCat==='all'?'active':'')+'" data-cat="all">All <span class="ct">'+c['all']+'</span></button>'
  +activeCatChip
  +'<button class="tab t-saved '+(activeCat==='favs'?'active':'')+'" data-cat="favs">&#9829; Saved <span class="ct">'+fv+'</span></button>';
}

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
  if(tabsEl&&gridEl){if(activeCat==='favs'){/* buildTabs/buildGrid called by route() in app.js */}else buildTabs();}
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
  if(!gridEl)return;
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
    return '<div class="tool cat-'+x[2]+'" onclick="location.href=\'/'+x[0]+'\'">'+arrowSvg+'<button class="fav-btn'+(faved?' active':'')+'" data-slug="'+x[0]+'" onclick="toggleFav(\''+x[0]+'\',event)" aria-label="Save '+x[1]+'">'+heartSvg+'</button><div class="ico">'+ICON[x[2]]+'</div><h3><a href="/'+x[0]+'" style="color:inherit;text-decoration:none">'+x[1]+'</a></h3><p>'+x[3]+'</p><div class="chips">'+x[4].map(c=>'<span class="chip">'+c+'</span>').join('')+'</div></div>';
  }).join('');
}
if(tabsEl)tabsEl.addEventListener('click',e=>{
  /* The clear (x) button is nested inside the active-category
     chip, so it needs to be checked BEFORE the general .tab
     handler below — otherwise closest('.tab') would just find
     the parent chip and re-select the same category instead of
     clearing it. */
  if(e.target.closest('[data-clear]')){ activeCat='all'; buildTabs(); buildGrid(); return; }
  const b=e.target.closest('.tab');if(!b)return;activeCat=b.dataset.cat;buildTabs();buildGrid();
});
var _gs=$('#gridSearch');if(_gs)_gs.addEventListener('input',e=>{term=e.target.value;buildGrid();});
/* grid initialised by route() boot call in app.js */

/* ---------- nav search ---------- */
const navSearch=$('#navSearch'),navPop=$('#navPop');
let navActiveIndex=-1;
navSearch.addEventListener('input',()=>{
  navActiveIndex=-1;
  const raw=navSearch.value;
  const t=raw.toLowerCase().trim();
  if(!t){navPop.classList.remove('show');return;}
  const list=matchTools(raw,8);
  if(!list.length){
    const suggestions=['background-remover','image-compressor','pdf-merger','json-formatter']
      .map(s=>bySlug(s)).filter(Boolean).slice(0,4);
    navPop.innerHTML=
      '<div class="hs-noresult"><span class="hs-noresult-msg">No matches for &ldquo;'+escapeHtml(raw)+'&rdquo;</span></div>'+
      suggestions.map((x,i)=>'<a data-i="'+i+'" href="/'+x[0]+'"><span class="hsr-ico">'+ICON[x[2]]+'</span><span class="hsr-name">'+x[1]+'</span><span class="chip">'+x[4][0]+'</span></a>').join('');
  } else {
    const normTerm=normalizeSearchTerm(raw);
    navPop.innerHTML=list.map((x,i)=>'<a data-i="'+i+'" href="/'+x[0]+'"><span class="hsr-ico">'+ICON[x[2]]+'</span><span class="hsr-name">'+highlightMatch(x[1],normTerm)+'</span><span class="chip">'+x[4][0]+'</span></a>').join('');
  }
  navPop.classList.add('show');});
navSearch.addEventListener('keydown',e=>{
  const items=navPop.querySelectorAll('a[data-i]');
  if(e.key==='ArrowDown'){e.preventDefault();navActiveIndex=Math.min(navActiveIndex+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('active',i===navActiveIndex));}
  else if(e.key==='ArrowUp'){e.preventDefault();navActiveIndex=Math.max(navActiveIndex-1,0);items.forEach((el,i)=>el.classList.toggle('active',i===navActiveIndex));}
  else if(e.key==='Enter'){const target=navActiveIndex>=0?items[navActiveIndex]:items[0];if(target)target.click();}
});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))navPop.classList.remove('show');});

/* ---------- theme / header / menu ---------- */
const root=document.documentElement,tIcon=$('#themeIcon');
const moon='<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
var _th=$('#theme');if(_th)_th.onclick=()=>{const l=root.getAttribute('data-theme')==='light';root.setAttribute('data-theme',l?'dark':'light');tIcon.innerHTML=l?sun:moon;_th.setAttribute('aria-label',l?'Switch to light theme':'Switch to dark theme');_th.setAttribute('aria-pressed',l?'false':'true');};
/* scroll handled in quick-win features block above */
/* Mobile drawer open/close, focus trap, backdrop, and the Tools
   accordion now live in nav-responsive.js — consolidated there as
   one coherent module rather than split across two files. */

/* ══════════════════════════════════════════════════════
   QUICK-WIN FEATURES
   ══════════════════════════════════════════════════════ */

/* 1 ─ Toast notifications ─────────────────────────── */
const toastRack=$('#toast-rack');
function toast(msg,type='ok',dur=3200){
  if(!toastRack)return;
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
/* normalizeRecentEntry \u2014 accepts either a legacy plain slug
   string or a {slug,ts} object and always returns {slug,ts}
   (ts:null for legacy entries with no recorded time). Used by
   every reader/writer of the RK localStorage key so the storage
   format can evolve without ever breaking a returning visitor's
   existing history. */
function normalizeRecentEntry(entry){
  if(typeof entry==='string')return {slug:entry,ts:null};
  return entry&&entry.slug?entry:{slug:null,ts:null};
}

/* timeAgo \u2014 small relative-time humaniser. No timestamp
   (legacy entry) falls back to a neutral, still-true label rather
   than guessing or showing an implausible "0 minutes ago". */
function timeAgo(ts){
  if(!ts)return 'Recently';
  var s=Math.floor((Date.now()-ts)/1000);
  if(s<60)return 'Just now';
  var m=Math.floor(s/60);
  if(m<60)return m+' minute'+(m===1?'':'s')+' ago';
  var h=Math.floor(m/60);
  if(h<24)return h+' hour'+(h===1?'':'s')+' ago';
  var d=Math.floor(h/24);
  if(d<7)return d+' day'+(d===1?'':'s')+' ago';
  var w=Math.floor(d/7);
  if(w<5)return w+' week'+(w===1?'':'s')+' ago';
  return 'A while ago';
}

/* saveRecent now stores {slug, ts} objects instead of plain slug
   strings, so "recently used" can show relative time ("2 hours
   ago"). normalizeRecentEntry (shared, see app.js) transparently
   upgrades any OLD plain-string entries already sitting in a
   visitor's localStorage — existing history is never lost or
   reset by this change. */
function saveRecent(slug){
  try{
    let r=JSON.parse(localStorage.getItem(RK)||'[]');
    r=r.map(normalizeRecentEntry).filter(e=>e.slug!==slug);
    r=[{slug:slug,ts:Date.now()},...r].slice(0,5);
    localStorage.setItem(RK,JSON.stringify(r));
  }catch(e){}
}
function buildRecent(){
  const row=$('#recent-row'),list=$('#recent-list');if(!row||!list)return;
  try{
    const r=JSON.parse(localStorage.getItem(RK)||'[]');
    const valid=r.map(s=>bySlug(s)).filter(Boolean);
    if(!valid.length){row.style.display='none';return;}
    row.style.display='';
    list.innerHTML=valid.map(t=>'<div class="recent-pill" onclick="location.href=\'/'+t[0]+'\'"><span class="rp-ico">'+ICON[t[2]]+'</span>'+t[1]+'</div>').join('');
  }catch(e){row.style.display='none';}
}

/* 4 ─ Scroll-to-top ───────────────────────────────── */
const topBtn=$('#top-btn');
addEventListener('scroll',()=>{
  $('#header').classList.toggle('scrolled',scrollY>20);
  if(topBtn)topBtn.classList.toggle('show',scrollY>300);
},{ passive:true });
if(topBtn)topBtn.onclick=()=>scrollTo({top:0,behavior:'smooth'});

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

(()=>{
  const CKEY='tmk_cookie';
  const bar=$('#cookie-bar');
  if(!bar||localStorage.getItem(CKEY))return;
  /* Show after 1.2s so the page settles first */
  setTimeout(()=>bar.classList.add('show'),1200);
  function dismiss(accepted){
    bar.classList.remove('show');
    localStorage.setItem(CKEY,accepted?'1':'0');
    setTimeout(()=>bar.style.display='none',420);
  }
  var _ca=$('#cb-accept'),_cd=$('#cb-decline');
  if(_ca)_ca.onclick=()=>{dismiss(true);toast('Preferences saved','ok',2000);};
  if(_cd)_cd.onclick=()=>{dismiss(false);};
})();
