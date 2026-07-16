/* TARUMAK STUDIO — pdf-tools.js  (15 PDF tools)
   PSIZE declared here and NOWHERE ELSE. */

const PSIZE={a4:[595.28,841.89],letter:[612,792]};

function parseRanges(str,max){
  const out=new Set();
  String(str||'').split(',').forEach(p=>{p=p.trim();if(!p)return;
    if(p.indexOf('-')>-1){let a=parseInt(p.split('-')[0],10),b=parseInt(p.split('-')[1],10);
      if(isNaN(a)||isNaN(b))return;if(a>b){const t=a;a=b;b=t;}
      for(let i=a;i<=b;i++)if(i>=1&&i<=max)out.add(i);}
    else{const n=parseInt(p,10);if(!isNaN(n)&&n>=1&&n<=max)out.add(n);}});
  return [...out].sort((x,y)=>x-y);
}

/* PDF.js worker — MUST be configured or getDocument() silently falls back to a
   "fake worker" that runs on the main thread: slow, janky, and it blocks the UI
   during render. Set once, defensively, as soon as the library is present. */
(function(){
  try{
    if(typeof pdfjsLib!=='undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc){
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }catch(e){/* library not ready yet — pdfjsDoc() re-checks below */}
})();

async function pdfjsDoc(file){
  /* Re-assert the worker in case this file parsed before pdf.min.js finished. */
  try{
    if(typeof pdfjsLib!=='undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc){
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }catch(e){}
  const data=await file.arrayBuffer();
  return await pdfjsLib.getDocument({data:data}).promise;
}

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

INIT['pdf-splitter']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Extract a page range into one PDF, or split every page out separately.'});
  let buf=null,count=0;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();
    const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});count=d.getPageCount();
    u.controls.className='controls';
    u.controls.innerHTML='<div class="seg" id="md"><button class="active" data-m="range">Extract range</button><button data-m="each">Split every page</button></div>'+
      '<div class="ctrl" id="rg"><label for="rng">Pages (e.g. 1-3, 5)</label><input type="text" id="rng" value="1-'+count+'" style="width:160px"></div>'+
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

INIT['jpg-to-pdf']=imagesToPdfTool({accept:'image/jpeg',formats:['JPG&#8594;PDF'],outName:'jpg'});

/* ---------- Scan to PDF (camera + files) -------------------------- */
INIT['png-to-pdf']=imagesToPdfTool({accept:'image/png',formats:['PNG&#8594;PDF'],outName:'png'});

/* ---------- Scan to PDF (camera + files) -------------------------- */
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

INIT['pdf-password-protect']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Set a password that will be required to open the file.'});
  let file=null;
  dropzone(u.drop,u.file,fs=>{file=[...fs][0];if(!file)return;
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label for="pw">Password</label><input type="password" id="pw" placeholder="Enter a password"></div><div class="ctrl"><label for="pw2">Confirm</label><input type="password" id="pw2" placeholder="Repeat password"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Protect PDF</button>';
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

INIT['pdf-unlock']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Removes owner restrictions. If the file needs a password to open, enter it below.'});
  let file=null;
  dropzone(u.drop,u.file,async fs=>{file=[...fs][0];if(!file)return;
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label for="pw">Password (if required to open)</label><input type="password" id="pw" placeholder="Leave blank if none" style="width:220px"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Unlock PDF</button>';
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

INIT['pdf-page-rotator']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'Rotate the whole document or just specific pages.'});
  let buf=null,count=0;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();
    const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});count=d.getPageCount();
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label>Rotate by</label><div class="seg" id="ang"><button class="active" data-a="90">90&deg;</button><button data-a="180">180&deg;</button><button data-a="270">270&deg;</button></div></div><div class="ctrl"><label for="rng">Pages (blank = all)</label><input type="text" id="rng" placeholder="e.g. 1-3, 5" style="width:150px"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Rotate PDF</button>';
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

INIT['pdf-page-remover']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'List the pages you want to delete.'});
  let buf=null,count=0;
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;buf=await f.arrayBuffer();
    const d=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});count=d.getPageCount();
    u.controls.className='controls';
    u.controls.innerHTML='<div class="ctrl"><label for="rng">Pages to remove (of '+count+')</label><input type="text" id="rng" placeholder="e.g. 2, 4-6" style="width:200px"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="go">Remove pages</button>';
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
      acts.innerHTML='<button title="Rotate" aria-label="Rotate page">&#8635;</button><button title="Delete" aria-label="Delete page">&#10005;</button>';
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

INIT['images-to-pdf']=imagesToPdfTool({outName:'images',sub:'Batch many photos into one PDF — drag in as many as you like.'});

/* ---------- Scan to PDF (camera + files) -------------------------- */
INIT['scan-to-pdf']=function(panel){
  panel.innerHTML='<div class="controls" id="cam"></div><div class="preview" id="pv"></div>'+
    '<div class="drop" id="d_drop"><input type="file" id="d_file" accept="image/*" multiple hidden><div class="di">'+UP+'</div><h3>Or drop image scans here</h3><p>JPG / PNG photos of your pages</p></div>'+
    '<div class="controls" id="opts"><div class="ctrl"><label for="ps">Page size</label><select id="ps"><option value="fit">Fit to image</option><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="make" disabled>Create PDF</button></div>'+
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

INIT['pdf-reader']=function(panel){
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'View any PDF right here — fit, zoom, jump and scan pages.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;
    if(f.type&&f.type!=='application/pdf'&&!/\.pdf$/i.test(f.name||'')){setStatus(u.status,'That doesn\u2019t look like a PDF.',1);return;}
    setStatus(u.status,'Opening\u2026');
    let pdf;
    try{pdf=await pdfjsDoc(f);}
    catch(e){setStatus(u.status,'Could not open this PDF'+(/password/i.test(e.message||'')?' \u2014 it is password protected.':': '+(e.message||e)),1);return;}

    u.drop.style.display='none';
    const cur={n:1}, DPR=Math.min(window.devicePixelRatio||1,3);
    let mode='fitWidth', scale=1, renderTask=null, renderSeq=0;

    /* ── Toolbar ───────────────────────────────────────────────── */
    u.controls.className='controls';
    u.controls.innerHTML=
      '<div class="pdfr-bar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%">'+
        '<button class="btn btn-ghost" id="prev" aria-label="Previous page">&#8592;</button>'+
        '<span style="display:inline-flex;align-items:center;gap:6px;font-size:13px">'+
          'Page <input id="pg" type="number" min="1" value="1" style="width:56px;text-align:center;padding:5px 6px;border:1px solid var(--border-2);border-radius:8px;background:var(--bg-2);color:var(--text)"> / <span id="pn">?</span>'+
        '</span>'+
        '<button class="btn btn-ghost" id="next" aria-label="Next page">&#8594;</button>'+
        '<div class="ctrl-spacer" style="flex:1"></div>'+
        '<button class="btn btn-ghost" id="zo" aria-label="Zoom out">&#8722;</button>'+
        '<span id="zlbl" style="min-width:48px;text-align:center;font-size:13px;font-variant-numeric:tabular-nums">Fit</span>'+
        '<button class="btn btn-ghost" id="zi" aria-label="Zoom in">+</button>'+
        '<select id="fit" aria-label="Fit mode" style="padding:6px 8px;border:1px solid var(--border-2);border-radius:8px;background:var(--bg-2);color:var(--text);font-size:13px">'+
          '<option value="fitWidth">Fit width</option>'+
          '<option value="fitPage">Fit page</option>'+
          '<option value="actual">Actual size</option>'+
        '</select>'+
        '<input id="find" type="search" placeholder="Search text\u2026" aria-label="Search PDF text" style="width:130px;padding:6px 10px;border:1px solid var(--border-2);border-radius:8px;background:var(--bg-2);color:var(--text);font-size:13px">'+
      '</div>';

    /* ── Layout: thumbnail rail + viewer ───────────────────────── */
    u.results.classList.add('show');u.results.innerHTML='';
    const shell=document.createElement('div');
    shell.style.cssText='display:flex;gap:14px;align-items:flex-start';
    const rail=document.createElement('div');
    rail.setAttribute('aria-label','Page thumbnails');
    rail.style.cssText='width:104px;flex-shrink:0;max-height:74vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px';
    const viewer=document.createElement('div');
    viewer.style.cssText='flex:1;min-width:0;max-height:78vh;overflow:auto;background:var(--bg-2);border:1px solid var(--border);border-radius:14px;padding:18px;display:flex;justify-content:center;align-items:flex-start';
    const canvas=document.createElement('canvas');
    canvas.style.cssText='box-shadow:0 6px 30px rgba(0,0,0,.35);max-width:100%;height:auto;background:#fff';
    viewer.appendChild(canvas);
    shell.appendChild(rail);shell.appendChild(viewer);u.results.appendChild(shell);
    if(window.matchMedia&&window.matchMedia('(max-width:640px)').matches)rail.style.display='none';

    const pn=$('#pn',panel),pgIn=$('#pg',panel),zlbl=$('#zlbl',panel),fitSel=$('#fit',panel);
    pn.textContent=pdf.numPages;pgIn.max=pdf.numPages;

    function fitScale(vp1){
      const avail=viewer.clientWidth-36||600;
      if(mode==='fitWidth')return avail/vp1.width;
      if(mode==='fitPage'){const availH=viewer.clientHeight-36||700;return Math.min(avail/vp1.width,availH/vp1.height);}
      return 1; /* actual */
    }

    async function render(){
      const seq=++renderSeq;
      const page=await pdf.getPage(cur.n);
      const vp1=page.getViewport({scale:1});
      const css=(mode==='actual')?scale:fitScale(vp1)*scale;
      const vp=page.getViewport({scale:css*DPR});
      if(seq!==renderSeq)return; /* a newer render superseded us */
      if(renderTask){try{renderTask.cancel();}catch(e){}}
      canvas.width=Math.floor(vp.width);canvas.height=Math.floor(vp.height);
      canvas.style.width=Math.floor(vp.width/DPR)+'px';
      canvas.style.height=Math.floor(vp.height/DPR)+'px';
      const cx=canvas.getContext('2d',{alpha:false});
      renderTask=page.render({canvasContext:cx,viewport:vp,intent:'display'});
      try{await renderTask.promise;}catch(e){if(e&&e.name==='RenderingCancelledException')return;}
      pgIn.value=cur.n;
      zlbl.textContent=(mode==='actual'||scale!==1)?Math.round(css*100)+'%':'Fit';
    }

    /* ── Thumbnails (lazy, low-res) ────────────────────────────── */
    function buildThumbs(){
      for(let i=1;i<=pdf.numPages;i++){
        (function(i){
          const cell=document.createElement('button');
          cell.className='pdfr-thumb';cell.setAttribute('aria-label','Go to page '+i);
          cell.style.cssText='border:2px solid transparent;border-radius:8px;padding:0;background:#fff;cursor:pointer;line-height:0;overflow:hidden;position:relative';
          const tc=document.createElement('canvas');tc.style.cssText='width:100%;height:auto;display:block';
          const num=document.createElement('span');num.textContent=i;
          num.style.cssText='position:absolute;bottom:2px;right:4px;font-size:10px;color:#333;background:rgba(255,255,255,.8);padding:0 4px;border-radius:4px';
          cell.appendChild(tc);cell.appendChild(num);cell.dataset.p=i;rail.appendChild(cell);
          cell.onclick=()=>{cur.n=i;paintActive();render();};
          pdf.getPage(i).then(p=>{
            const v1=p.getViewport({scale:1}),s=96/v1.width;
            const v=p.getViewport({scale:s});tc.width=v.width;tc.height=v.height;
            p.render({canvasContext:tc.getContext('2d'),viewport:v});
          }).catch(()=>{});
        })(i);
      }
      paintActive();
    }
    function paintActive(){
      $$('.pdfr-thumb',rail).forEach(c=>{
        const on=+c.dataset.p===cur.n;
        c.style.borderColor=on?'var(--p1)':'transparent';
        if(on)c.scrollIntoView({block:'nearest'});
      });
    }

    /* ── Navigation ────────────────────────────────────────────── */
    function go(n){n=Math.max(1,Math.min(pdf.numPages,n|0));if(n===cur.n)return;cur.n=n;paintActive();render();}
    $('#prev',panel).onclick=()=>go(cur.n-1);
    $('#next',panel).onclick=()=>go(cur.n+1);
    pgIn.onchange=()=>go(+pgIn.value);
    function zoom(dir){mode=(mode==='actual')?'actual':'actual';fitSel.value='actual';scale=Math.max(.25,Math.min(5,scale*(dir>0?1.2:1/1.2)));render();}
    $('#zi',panel).onclick=()=>zoom(1);
    $('#zo',panel).onclick=()=>zoom(-1);
    fitSel.onchange=()=>{mode=fitSel.value;scale=1;render();};

    /* Keyboard: arrows / PageUp / PageDown / Home / End */
    viewer.tabIndex=0;
    viewer.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(cur.n+1);}
      else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(cur.n-1);}
      else if(e.key==='Home'){e.preventDefault();go(1);}
      else if(e.key==='End'){e.preventDefault();go(pdf.numPages);}
      else if((e.key==='+'||e.key==='=')){e.preventDefault();zoom(1);}
      else if(e.key==='-'){e.preventDefault();zoom(-1);}
    });

    /* Ctrl/Cmd + wheel = zoom; plain wheel scrolls the viewer normally */
    viewer.addEventListener('wheel',e=>{
      if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?1:-1);}
    },{passive:false});

    /* Pinch-zoom on touch devices */
    let pinchStart=0,pinchBase=1;
    viewer.addEventListener('touchstart',e=>{
      if(e.touches.length===2){pinchStart=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);pinchBase=(mode==='actual'?scale:1);fitSel.value='actual';mode='actual';}
    },{passive:true});
    viewer.addEventListener('touchmove',e=>{
      if(e.touches.length===2&&pinchStart){
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        scale=Math.max(.25,Math.min(5,pinchBase*(d/pinchStart)));render();
      }
    },{passive:true});
    viewer.addEventListener('touchend',()=>{pinchStart=0;});

    /* Re-fit on container resize (fit modes only) */
    let rz;window.addEventListener('resize',()=>{if(mode!=='actual'&&scale===1){clearTimeout(rz);rz=setTimeout(render,150);}});

    /* ── Text search: jump to the first page containing the query ── */
    const findEl=$('#find',panel);let findTimer;
    findEl.addEventListener('input',()=>{
      clearTimeout(findTimer);const q=findEl.value.trim().toLowerCase();
      if(q.length<2){findEl.style.color='';return;}
      findTimer=setTimeout(async()=>{
        for(let i=1;i<=pdf.numPages;i++){
          try{const p=await pdf.getPage(i);const tc=await p.getTextContent();
            const txt=tc.items.map(it=>it.str).join(' ').toLowerCase();
            if(txt.indexOf(q)>-1){findEl.style.color='';go(i);return;}
          }catch(e){}
        }
        findEl.style.color='var(--err,#f87171)'; /* not found */
      },300);
    });

    buildThumbs();
    await render();
    setStatus(u.status,'Opened '+pdf.numPages+' page(s).');
  });
};

/* ═══════════════ PDF TO EXCEL CONVERTER ═══════════════════════════════
   Real text-position table reconstruction (or OCR for scanned pages) via
   /pdftoexcel-engine.js, XLSX written with SheetJS (lazy-loaded). See the
   engine file's own header comment for the honest technique explanation —
   this tool's copy below must stay consistent with it: real reconstruction
   from position data, not an ML table detector. */
INIT['pdf-to-excel']=function(panel){
  var MAX_BYTES=60*1024*1024, MAX_PAGES=60;
  var XLSX_CDN='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  var TESS_CDN='https://cdn.jsdelivr.net/npm/tesseract.js@4.1.2/dist/tesseract.min.js';
  var SENS={
    tight:{yTolerance:2,xTolerance:6,wordGap:2},
    balanced:{yTolerance:3,xTolerance:8,wordGap:3},
    loose:{yTolerance:5,xTolerance:14,wordGap:5}
  };

  var u=dz(panel,{accept:'application/pdf',formats:['PDF\u2192XLSX'],
    title:'Drop a PDF here or click to browse',
    sub:'Reconstructs tables from real text positions \u2014 works best on clean, evenly-spaced tabular PDFs.'});

  u.controls.className='controls';
  u.controls.innerHTML=
    '<div class="ctrl"><label>Table detection</label><div class="seg" id="pteSens" role="group" aria-label="Table detection sensitivity">'+
      '<button data-s="tight" aria-pressed="false">Tight</button>'+
      '<button data-s="balanced" class="active" aria-pressed="true">Balanced</button>'+
      '<button data-s="loose" aria-pressed="false">Loose</button>'+
    '</div></div>'+
    '<div class="ctrl-spacer"></div>'+
    '<button class="btn btn-primary" id="pteRun" disabled>Convert to Excel</button>';
  var sensKey='balanced';
  $('#pteSens',panel).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;sensKey=b.dataset.s;
    $$('#pteSens button',panel).forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});});

  var file=null,running=null;

  dropzone(u.drop,u.file,function(fs){
    var f=[...fs][0];if(!f)return;
    if(!/pdf/i.test(f.type)&&!/\.pdf$/i.test(f.name||'')){setStatus(u.status,'That doesn\u2019t look like a PDF.',1);return;}
    if(f.size>MAX_BYTES){setStatus(u.status,'File is over '+Math.round(MAX_BYTES/1024/1024)+' MB \u2014 too large for browser processing. Try splitting it first with the PDF Splitter.',1);return;}
    file=f;u.results.innerHTML='';u.results.classList.remove('show');
    $('#pteRun',panel).disabled=false;
    setStatus(u.status,'Ready \u2014 '+f.name+' ('+fmtBytes(f.size)+').');
  });

  function loadLib(cdn,glob){return _loadScript(cdn,glob).catch(function(){return _loadScript(cdn+'?r='+Date.now(),glob);});}
  function loadEngine(){return _loadScript('/pdftoexcel-engine.js','PdfToExcelEngine').catch(function(){return _loadScript('/pdftoexcel-engine.js?r='+Date.now(),'PdfToExcelEngine');});}

  async function openPdf(buf,password){
    return await pdfjsLib.getDocument({data:buf,password:password}).promise;
  }

  $('#pteRun',panel).onclick=async function(){
    if(!file||running)return;
    var signal={cancelled:false};running=signal;
    var runBtn=$('#pteRun',panel);runBtn.disabled=true;
    setStatus(u.status,'Reading PDF\u2026');
    if(window._ga)window._ga('conversion_started',{tool_name:'pdf-to-excel'});

    var buf;
    try{buf=await file.arrayBuffer();}
    catch(e){setStatus(u.status,'Could not read this file.',1);runBtn.disabled=false;running=null;return;}

    var pdf;
    try{
      pdf=await openPdf(buf,undefined);
    }catch(e){
      if(/password/i.test(e.message||e.name||'')){
        running=null;runBtn.disabled=false;
        return promptForPassword();
      }
      setStatus(u.status,'Could not open this PDF \u2014 it may be corrupted or not a valid PDF file.',1);
      runBtn.disabled=false;running=null;return;
    }
    await convert(pdf,signal);
  };

  function promptForPassword(){
    var st=u.status;st.className='status show';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
    st.innerHTML='This PDF is password protected. <input type="password" id="ptePw" placeholder="Enter password" aria-label="PDF password" style="margin-left:8px;padding:5px 8px;border:1px solid var(--border-2);border-radius:8px;background:var(--bg-2);color:var(--text)"> <button class="btn btn-primary" id="ptePwGo" style="padding:5px 14px;font-size:12.5px;margin-left:6px">Unlock</button>';
    $('#ptePwGo',panel).onclick=async function(){
      var pw=$('#ptePw',panel).value;
      if(!pw){return;}
      var signal={cancelled:false};running=signal;
      $('#pteRun',panel).disabled=true;
      setStatus(st,'Trying password\u2026');
      var buf;
      try{buf=await file.arrayBuffer();}catch(e){setStatus(st,'Could not read this file.',1);running=null;$('#pteRun',panel).disabled=false;return;}
      var pdf;
      try{pdf=await openPdf(buf,pw);}
      catch(e){setStatus(st,'Wrong password \u2014 try again.',1);running=null;$('#pteRun',panel).disabled=false;return;}
      await convert(pdf,signal);
    };
  }

  async function convert(pdf,signal){
    var runBtn=$('#pteRun',panel);
    if(pdf.numPages>MAX_PAGES){
      setStatus(u.status,'This PDF has '+pdf.numPages+' pages \u2014 the maximum for browser conversion is '+MAX_PAGES+'. Try splitting it first with the PDF Splitter.',1);
      runBtn.disabled=false;running=null;return;
    }
    var st=u.status;st.className='status show';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
    st.innerHTML='Preparing\u2026 <span id="ptePct">0%</span> <button class="btn btn-ghost" id="pteCancel" style="padding:2px 10px;font-size:12px;margin-left:8px">Cancel</button>';
    $('#pteCancel',panel).onclick=function(){signal.cancelled=true;};
    function prog(p,msg){var el=$('#ptePct',panel);if(el)el.textContent=Math.round(p*100)+'%'+(msg?' \u00b7 '+msg:'');}

    var engine,XLSXLib;
    try{
      prog(0.02,'Loading table-reconstruction engine');
      engine=await loadEngine();
    }catch(e){setStatus(st,'Could not load the conversion engine. Refresh and try again.',1);runBtn.disabled=false;running=null;return;}

    var sens=SENS[sensKey]||SENS.balanced;
    var sheets=[],anyTableFound=false,scannedPagesUsed=0;

    for(var i=1;i<=pdf.numPages;i++){
      if(signal.cancelled){setStatus(st,'Cancelled.');runBtn.disabled=false;running=null;return;}
      prog((i-1)/pdf.numPages*0.85+0.05,'Page '+i+' of '+pdf.numPages);
      var page=await pdf.getPage(i);
      var textContent=await page.getTextContent();
      var items;
      if(engine.isScannedPage(textContent)){
        /* Scanned page: render + OCR. Real Tesseract.js recognition, not a
           fallback text guess \u2014 same engine/CDN as the OCR Image to Text tool. */
        scannedPagesUsed++;
        try{ if(!window.Tesseract){ prog((i-1)/pdf.numPages*0.85+0.05,'Loading OCR engine for page '+i); await loadLib(TESS_CDN,'Tesseract'); } }
        catch(e){ sheets.push({name:'Page '+i,grid:[['(OCR engine failed to load \u2014 no text extracted for this scanned page)']],merges:[]}); continue; }
        var renderScale=2;
        var rp=await renderPage(pdf,i,renderScale);
        var ocrResult;
        try{
          ocrResult=await Tesseract.recognize(rp.canvas,'eng',{logger:function(m){
            if(m.status==='recognizing text'&&!signal.cancelled){prog((i-1)/pdf.numPages*0.85+0.05,'OCR page '+i+' \u2014 '+Math.round((m.progress||0)*100)+'%');}
          }});
        }catch(e){ sheets.push({name:'Page '+i,grid:[['(OCR failed for this page)']],merges:[]}); continue; }
        if(signal.cancelled){setStatus(st,'Cancelled.');runBtn.disabled=false;running=null;return;}
        var words=(ocrResult.data&&ocrResult.data.words)||[];
        items=engine.fromOcrWords(words,renderScale);
      }else{
        items=engine.fromPdfTextContent(textContent,page.getViewport({scale:1}).height);
      }
      var result=engine.reconstructTable(items,sens);
      if(result.grid.length)anyTableFound=true;
      sheets.push({name:'Page '+i,grid:result.grid,merges:result.merges});
    }

    if(!anyTableFound){
      setStatus(st,'No tabular data was found in this PDF. If this is a scanned document, image quality may be too low for OCR \u2014 try a higher-resolution scan.',1);
      runBtn.disabled=false;running=null;return;
    }

    prog(0.92,'Building spreadsheet');
    try{XLSXLib=await loadLib(XLSX_CDN,'XLSX');}
    catch(e){setStatus(st,'Could not load the spreadsheet engine. Refresh and try again.',1);runBtn.disabled=false;running=null;return;}

    var wb=XLSXLib.utils.book_new();
    sheets.forEach(function(s){
      if(!s.grid.length){s.grid=[['(No table detected on this page)']];}
      var ws=XLSXLib.utils.aoa_to_sheet(s.grid.map(function(row){return row.map(function(cellText){
        var c=engine.classifyCell(cellText);
        return c.type==='n'?c.value:c.value;
      });}));
      /* Coerce numeric cells to real number type so Excel right-aligns and
         can sum them \u2014 aoa_to_sheet already infers numbers reasonably,
         but we re-apply our own classifier explicitly so currency symbols
         we stripped are reflected (aoa_to_sheet alone would leave "$12.50"
         as text since it can't parse the currency prefix). */
      s.grid.forEach(function(row,r){row.forEach(function(cellText,c){
        var cls=engine.classifyCell(cellText);
        if(cls.type==='n'){
          var addr=XLSXLib.utils.encode_cell({r:r,c:c});
          ws[addr]={t:'n',v:cls.value};
        }
      });});
      (s.merges||[]).forEach(function(m){
        ws['!merges']=ws['!merges']||[];
        ws['!merges'].push({s:{r:m.row,c:m.fromCol},e:{r:m.row,c:m.toCol}});
      });
      var colCount=s.grid.reduce(function(mx,row){return Math.max(mx,row.length);},1);
      var widths=[];
      for(var c=0;c<colCount;c++){
        var maxLen=4;
        s.grid.forEach(function(row){if(row[c]&&String(row[c]).length>maxLen)maxLen=String(row[c]).length;});
        widths.push({wch:Math.min(40,maxLen+2)});
      }
      ws['!cols']=widths;
      var safeName=(s.name||'Sheet').slice(0,31).replace(/[\\/*?:\[\]]/g,'-');
      XLSXLib.utils.book_append_sheet(wb,ws,safeName);
    });

    prog(1,'Done');
    var wbBlob;
    try{
      var wbArr=XLSXLib.write(wb,{bookType:'xlsx',type:'array'});
      wbBlob=new Blob([wbArr],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    }catch(e){setStatus(st,'Failed to build the spreadsheet file: '+(e.message||e),1);runBtn.disabled=false;running=null;return;}

    var baseName=(file.name||'document').replace(/\.pdf$/i,'');
    var outName=baseName+'.xlsx';
    running=null;runBtn.disabled=false;

    u.results.classList.add('show');
    u.results.innerHTML=
      '<p style="text-align:center;font-size:13px;color:var(--text-dim);margin-bottom:12px">'+
        pdf.numPages+' page(s) processed'+(scannedPagesUsed?' \u00b7 '+scannedPagesUsed+' via OCR':'')+
        ' \u00b7 '+sheets.length+' sheet(s) created</p>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
        '<button class="btn btn-primary" id="pteDl">Download .xlsx</button>'+
        '<button class="btn btn-ghost" id="pteReset">Start over</button>'+
      '</div>';
    $('#pteDl',panel).onclick=function(){
      download(wbBlob,outName);
      if(window._ga){window._ga('conversion_completed',{tool_name:'pdf-to-excel',pages:pdf.numPages,sheets:sheets.length});window._ga('file_download',{file_name:outName,tool_name:'pdf-to-excel'});}
      setStatus(st,'Saved '+outName+'.');
    };
    $('#pteReset',panel).onclick=function(){
      file=null;u.results.innerHTML='';u.results.classList.remove('show');
      u.drop.style.display='';$('#pteRun',panel).disabled=true;setStatus(u.status,'');
    };
    setStatus(st,'Converted '+pdf.numPages+' page(s) into '+sheets.length+' sheet(s).');
  }
};
FAQ['pdf-to-excel']=[
  ["How does the table extraction work?","The tool reads each text run's real position on the page from the PDF's own content stream, then groups runs into rows by shared vertical position and into columns by shared horizontal start position \u2014 the same technique used by well-known open-source PDF table tools. It works well on clean, evenly-spaced tabular data (invoices, exports from spreadsheets, bank statements). It does not detect tables via drawn ruling lines, so very unusual layouts may need manual cleanup afterward."],
  ["Does it work on scanned PDFs?","Yes \u2014 pages with no selectable text are automatically run through on-device OCR (the same engine as the OCR Image to Text tool), then the same row/column reconstruction is applied to the recognized words. OCR accuracy depends on scan quality; low-resolution scans may extract less reliably."],
  ["Will dates convert correctly?","Dates are kept as readable text rather than converted to Excel's internal date format. Date text is genuinely ambiguous (03/04/2026 could mean different days in different countries) \u2014 guessing wrong would silently corrupt a date in your spreadsheet, so the tool preserves the text exactly as printed instead."],
  ["Can it open password-protected PDFs?","Yes \u2014 if a PDF needs a password to open, the tool will ask for it before processing. The password is only used locally to decrypt the file in your browser; it is never sent anywhere."],
  ["Does it preserve merged cells?","It approximates section-header-style merged rows (a single wide label spanning what would otherwise be several columns) as a real merged cell in the output. This is a best-effort heuristic, not exact PDF structural data, since PDFs don't expose table cell-merge information directly."]
];
