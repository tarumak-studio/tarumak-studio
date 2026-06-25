/* ================================================================
   TARUMAK STUDIO — shared tool helpers
   These were missing from the original file split.
   Must be defined AFTER utils.js (needs download, ab, readImg)
   and BEFORE image-tools.js / pdf-tools.js (uses them)
   ================================================================ */

function setStatus(el,msg,err){el.className='status show'+(err?' err':'');el.textContent=msg;}

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
      const mk=(html,fn,dis)=>{const b=document.createElement('button');b.className='btn btn-ghost';b.style.cssText='height:34px;padding:0 11px;font-size:15px';b.innerHTML=html;b.disabled=!!dis;if(dis)b.style.opacity='.35';b.onclick=fn;return b;};
      g.appendChild(mk('&#8593;',()=>{const t=arr[i-1];arr[i-1]=arr[i];arr[i]=t;paint();},i===0));
      g.appendChild(mk('&#8595;',()=>{const t=arr[i+1];arr[i+1]=arr[i];arr[i]=t;paint();},i===arr.length-1));
      g.appendChild(mk('&#10005;',()=>{arr.splice(i,1);paint();}));
      d.appendChild(g);box.appendChild(d);});
    if(!arr.length)box.classList.remove('show');}
  paint();
}

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

function dz(panel,o){o=o||{};
  panel.innerHTML='<div class="drop '+(o.pdf?'pdf':'')+'" id="d_drop"><input type="file" id="d_file" accept="'+(o.accept||'*/*')+'" '+(o.multiple?'multiple':'')+' hidden>'+
    '<div class="di">'+UP+'</div><h3>'+(o.title||'Drop files here or click to browse')+'</h3><p>'+(o.sub||'')+'</p>'+
    '<div class="formats">'+(o.formats||[]).map(f=>'<span class="chip">'+f+'</span>').join('')+'</div></div>'+
    '<div class="controls" id="d_controls"></div><div class="results" id="d_results"></div><div class="actions" id="d_actions"></div><div class="status" id="d_status"></div>';
  const r={drop:$('#d_drop',panel),file:$('#d_file',panel),controls:$('#d_controls',panel),results:$('#d_results',panel),actions:$('#d_actions',panel),status:$('#d_status',panel)};
  return r;
}

async function renderPage(pdf,num,scale){const page=await pdf.getPage(num);const vp=page.getViewport({scale:scale});
  const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;
  await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
  const v1=page.getViewport({scale:1});return {canvas:c,w:v1.width,h:v1.height};}

function noInit(panel){panel.innerHTML='<div class="note">This tool is being finalized.</div>';}