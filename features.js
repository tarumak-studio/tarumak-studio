/* TARUMAK STUDIO — features.js
   UI helpers loaded before app.js.
   Contains buildGrid and setActiveNav — DO NOT re-declare in app.js.
   toggleFav calls buildTabs/buildGrid at RUNTIME only — fine since
   app.js loads before any user interaction. */

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
  $('#cb-accept').onclick=()=>{dismiss(true);toast('Preferences saved','ok',2000);};
  $('#cb-decline').onclick=()=>{dismiss(false);};
})();
