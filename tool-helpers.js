/* ================================================================
   TARUMAK STUDIO — shared tool helpers
   These were missing from the original file split.
   Must be defined AFTER utils.js (needs download, ab, readImg)
   and BEFORE image-tools.js / pdf-tools.js (uses them)
   ================================================================ */

function setStatus(el,msg,err){el.className='status show'+(err?' err':'');el.textContent=msg;
  if(err&&window.trackEvent)window.trackEvent('tool_error',{error_message:String(msg).slice(0,150)});}

function row(box,thumb,name,meta,onDl){box.classList.add('show');const d=document.createElement('div');d.className='row';
  d.innerHTML=(thumb?'<img class="thumb" src="'+thumb+'">':'<div class="thumb" style="display:grid;place-items:center;color:var(--accent)">'+ICON.pdf+'</div>')+
  '<div class="meta"><div class="nm">'+name+'</div><div class="sz">'+meta+'</div></div>';
  const b=document.createElement('button');b.className='btn btn-primary dl';b.textContent='Download';b.onclick=onDl;d.appendChild(b);box.appendChild(d);return d;}

function listRows(box,arr,label){
  function paint(){box.innerHTML='';box.classList.add('show');
    arr.forEach((it,i)=>{
      const d=document.createElement('div');d.className='row';
      d.innerHTML='<div class="thumb" style="display:grid;place-items:center;color:var(--accent)">'+ICON.pdf+'</div>'+
        '<div class="meta"><div class="nm">'+label(it)+'</div><div class="sz">Position '+(i+1)+'</div></div>';
      const g=document.createElement('div');g.style.cssText='display:flex;gap:6px';
      const itemLabel=label(it);
      const mk=(html,aria,fn,dis)=>{const b=document.createElement('button');b.className='btn btn-ghost';b.style.cssText='height:34px;padding:0 11px;font-size:15px';b.innerHTML=html;b.setAttribute('aria-label',aria);b.title=aria;b.disabled=!!dis;if(dis)b.style.opacity='.35';b.onclick=fn;return b;};
      g.appendChild(mk('&#8593;','Move '+itemLabel+' up',()=>{const t=arr[i-1];arr[i-1]=arr[i];arr[i]=t;paint();},i===0));
      g.appendChild(mk('&#8595;','Move '+itemLabel+' down',()=>{const t=arr[i+1];arr[i+1]=arr[i];arr[i]=t;paint();},i===arr.length-1));
      g.appendChild(mk('&#10005;','Remove '+itemLabel,()=>{arr.splice(i,1);paint();}));
      d.appendChild(g);box.appendChild(d);});
    if(!arr.length)box.classList.remove('show');}
  paint();
}

async function embedImage(pdf,file){
  try{

  const t=file.type||'';
  if(t==='image/jpeg')return await pdf.embedJpg(await file.arrayBuffer());
  if(t==='image/png')return await pdf.embedPng(await file.arrayBuffer());
  const img=await readImg(file);const c=document.createElement('canvas');
  c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;
  c.getContext('2d').drawImage(img,0,0);
  return await pdf.embedPng(c.toDataURL('image/png'));

  }catch(err){
    console.error('embedImage error:',err);
    throw err;
  }
}

async function buildImagesPdf(files,mode){
  try{

  const pdf=await PDFLib.PDFDocument.create();
  for(const f of files){const e=await embedImage(pdf,f);
    if(mode==='fit'){const pg=pdf.addPage([e.width,e.height]);pg.drawImage(e,{x:0,y:0,width:e.width,height:e.height});}
    else{let pw=PSIZE[mode][0],ph=PSIZE[mode][1];if(e.width>e.height){const t=pw;pw=ph;ph=t;}
      const pg=pdf.addPage([pw,ph]);const m=24,aw=pw-m*2,ah=ph-m*2;
      const s=Math.min(aw/e.width,ah/e.height),w=e.width*s,h=e.height*s;
      pg.drawImage(e,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});}}
  return new Blob([await pdf.save()],{type:'application/pdf'});

  }catch(err){
    console.error('buildImagesPdf error:',err);
    throw err;
  }
}

function dz(panel,o){o=o||{};
  var dropLabel=(o.title||'Drop files here or click to browse')+(o.multiple?'. Multiple files allowed.':'');
  panel.innerHTML='<div class="drop '+(o.pdf?'pdf':'')+'" id="d_drop" tabindex="0" role="button" aria-label="'+dropLabel.replace(/"/g,'&quot;')+'"><input type="file" id="d_file" accept="'+(o.accept||'*/*')+'" '+(o.multiple?'multiple':'')+' hidden aria-hidden="true" tabindex="-1">'+
    '<div class="di">'+UP+'</div><h3>'+(o.title||'Drop files here or click to browse')+'</h3><p>'+(o.sub||'')+'</p>'+
    '<p class="d-trust">Runs locally in your browser. Nothing uploads.</p>'+
    '<div class="formats">'+(o.formats||[]).map(f=>'<span class="chip">'+f+'</span>').join('')+'</div></div>'+
    '<div class="controls" id="d_controls"></div><div class="results" id="d_results"></div><div class="actions" id="d_actions"></div><div class="status" id="d_status"></div>';
  const r={drop:$('#d_drop',panel),file:$('#d_file',panel),controls:$('#d_controls',panel),results:$('#d_results',panel),actions:$('#d_actions',panel),status:$('#d_status',panel)};
  return r;
}

async function renderPage(pdf,num,scale){const page=await pdf.getPage(num);const vp=page.getViewport({scale:scale});
  const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;
  /* willReadFrequently: this canvas gets handed to Tesseract.recognize()
     by OCR-using callers, which reads it back via getImageData — same
     first-call-locks-it-in pattern fixed three times earlier this
     session in the other engines' own canvases. */
  await page.render({canvasContext:c.getContext('2d',{willReadFrequently:true}),viewport:vp}).promise;
  const v1=page.getViewport({scale:1});return {canvas:c,w:v1.width,h:v1.height};}

function noInit(panel){panel.innerHTML='<div class="note">This tool is being finalized.</div>';}
/* ════ Universal Reset system ════════════════════════════════════════
   One shared mechanism instead of per-tool implementations. Every tool
   is a self-contained INIT[slug](panel) render — so a true reset is:
   revoke every object URL the tool created, wipe the panel, re-run the
   same INIT. That returns uploads, previews, results, drag state,
   status, progress and all closure state to first-load — while theme,
   language and preferences (stored outside the panel) are untouched.
   Object URLs are tracked by wrapping URL.createObjectURL once, here,
   so every tool participates automatically with zero changes. */
(function(){
  var registry=[];
  var orig=URL.createObjectURL.bind(URL);
  URL.createObjectURL=function(obj){var url=orig(obj);registry.push(url);return url;};
  function revokeAll(){registry.splice(0).forEach(function(u2){try{URL.revokeObjectURL(u2);}catch(e){}});}
  window.addEventListener('pagehide',revokeAll);
  window.TarumakReset=function(){
    var slug=document.body.getAttribute('data-tool-slug');
    var panel=document.getElementById('toolPanel');
    if(!slug||!panel||typeof INIT==='undefined'||typeof INIT[slug]!=='function')return false;
    revokeAll();
    panel.innerHTML='';
    try{INIT[slug](panel);}catch(e){if(window.console)console.warn('[reset] remount failed:',e);return false;}
    if(window.trackEvent)window.trackEvent('tool_reset',{});
    return true;
  };
})();

/* ════ Shared tool factories ═════════════════════════════════════════
   Used by more than one category bundle, so they live here: each
   *-tools.js bundle must run with only the shared files + itself. A
   bundle that calls another bundle's function at load time would crash
   on a page that loads just its own bundle. build-tool-deps.js checks
   this rule and fails the build when it is broken. */
const PSIZE={a4:[595.28,841.89],letter:[612,792]};

function imagesToPdfTool(opt){opt=opt||{};return function(panel){
  const u=dz(panel,{accept:opt.accept||'image/*',multiple:true,formats:opt.formats||['JPG','PNG','WEBP'],
    title:opt.title||'Drop images here or click to browse',sub:opt.sub||'Pages appear in the order you add them — reorder below.'});
  let files=[];
  u.controls.className='controls';
  u.controls.innerHTML='<div class="ctrl"><label for="ps">Page size</label><select id="ps"><option value="fit">Fit to image</option><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="make" disabled>Create PDF</button>';
  const make=$('#make',panel);
  function refresh(){listRows(u.results,files,f=>f._nm||f.name||'image');make.disabled=!files.length;}
  dropzone(u.drop,u.file,fs=>{[...fs].forEach(f=>{if((f.type||'').startsWith('image/'))files.push(f);});refresh();});
  make.onclick=async()=>{if(!files.length)return;setStatus(u.status,'Building PDF from '+files.length+' image(s)…');make.disabled=true;
    try{const blob=await buildImagesPdf(files,$('#ps',panel).value);download(blob,(opt.outName||'images')+'.pdf');setStatus(u.status,'PDF created with '+files.length+' page(s).');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}finally{make.disabled=false;}};
};}

function imgConv(outType,ext,opt){opt=opt||{};
  var lossy=(outType==='image/jpeg'||outType==='image/webp');
  return function(panel){
  const u=dz(panel,{accept:opt.accept||'image/*',multiple:true,formats:opt.formats||[ext.toUpperCase()],sub:'Convert as many images as you like — all processed locally.'});
  /* Quality control for lossy outputs; PNG stays lossless (no slider). */
  if(lossy){
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label for="cq">Quality · <span class="val" id="cqv">92%</span></label><input type="range" id="cq" min="50" max="100" value="92" style="width:150px"></div>';
    var qEl=$('#cq',panel),qvEl=$('#cqv',panel);qEl.oninput=function(){qvEl.textContent=qEl.value+'%';};
  }
  var made=[]; /* {blob,name} for Download-all */
  function refreshActions(){
    u.actions.innerHTML='';
    if(made.length>1){
      var b=document.createElement('button');b.className='btn btn-primary';b.style.cssText='margin-top:6px';
      b.textContent='Download all ('+made.length+')';
      b.onclick=function(){made.forEach(function(m,i){setTimeout(function(){download(m.blob,m.name);},i*250);});};
      u.actions.appendChild(b);
    }
  }
  dropzone(u.drop,u.file,async fs=>{
    const list=[...fs].filter(f=>(f.type||'').startsWith('image/')||/\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name||''));
    if(!list.length){setStatus(u.status,'No images found — drop PNG, JPG or WebP files.',1);return;}
    u.results.innerHTML='';u.results.classList.add('show');made=[];u.actions.innerHTML='';
    var q=lossy?(parseInt($('#cq',panel).value,10)/100):undefined;
    var ok=0,fail=0;
    for(let idx=0;idx<list.length;idx++){
      const f=list[idx];
      setStatus(u.status,'Converting '+(idx+1)+' / '+list.length+' — '+f.name);
      try{
        const img=await readImg(f);
        const c=document.createElement('canvas');
        c.width=img.naturalWidth||img.width||512;c.height=img.naturalHeight||img.height||512;
        const x=c.getContext('2d');
        /* Only paint a background for formats that can't hold alpha (JPG).
           PNG/WebP outputs preserve the source's transparency. */
        if(opt.bg){x.fillStyle=opt.bg;x.fillRect(0,0,c.width,c.height);}
        x.imageSmoothingQuality='high';x.drawImage(img,0,0);
        const blob=await new Promise((res,rej)=>{c.toBlob(b=>b?res(b):rej(new Error('encode failed')),outType,q);});
        const nm=f.name.replace(/\.[^.]+$/,'')+'.'+ext;
        made.push({blob:blob,name:nm});ok++;
        row(u.results,c.toDataURL('image/jpeg',.4),nm,fmtBytes(f.size)+' <span class="arrow">&#8594;</span> '+fmtBytes(blob.size)+' · '+ext.toUpperCase(),()=>download(blob,nm));
      }catch(e){
        fail++;
        row(u.results,'',f.name,'Could not convert this file · '+(e.message||'unknown error'),function(){});
      }
    }
    refreshActions();
    setStatus(u.status,'Done — '+ok+' converted'+(fail?', '+fail+' failed':'')+'.');
  });
};}

function _loadScript(src, glob) {
  return new Promise(function(ok, fail) {
    if (glob && window[glob]) { ok(window[glob]); return; }
    if (document.querySelector('script[src="' + src + '"]')) {
      var n = 0, iv = setInterval(function() {
        if (glob && window[glob]) { clearInterval(iv); ok(window[glob]); }
        else if (++n > 120) { clearInterval(iv); fail(new Error('Timeout: ' + glob)); }
      }, 250);
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.onload = function() {
      if (!glob) { ok(null); return; }
      var n = 0, iv = setInterval(function() {
        if (window[glob]) { clearInterval(iv); ok(window[glob]); }
        else if (++n > 40) { clearInterval(iv); ok(null); }
      }, 100);
    };
    s.onerror = function() { fail(new Error('Failed to load: ' + src)); };
    document.head.appendChild(s);
  });
}
