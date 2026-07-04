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

async function pdfjsDoc(file){const data=await file.arrayBuffer();return await pdfjsLib.getDocument({data:data}).promise;}

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
INIT['png-to-pdf']=imagesToPdfTool({accept:'image/png',formats:['PNG&#8594;PDF'],outName:'png'});
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

INIT['png-to-pdf']=imagesToPdfTool({accept:'image/png',formats:['PNG&#8594;PDF'],outName:'png'});
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
  const u=dz(panel,{accept:'application/pdf',formats:['PDF'],title:'Drop a PDF here or click to browse',sub:'View any PDF right here, page by page.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs][0];if(!f)return;setStatus(u.status,'Opening…');
    try{const pdf=await pdfjsDoc(f);let cur=1,scale=1.3;
      u.controls.className='controls';
      u.controls.innerHTML='<button class="btn btn-ghost" id="prev">&#8592; Prev</button><div class="ctrl"><label>Page</label><span class="val" id="pos"></span></div><button class="btn btn-ghost" id="next">Next &#8594;</button><div class="ctrl-spacer"></div><button class="btn btn-ghost" id="zo" aria-label="Zoom out">&#8722;</button><button class="btn btn-ghost" id="zi" aria-label="Zoom in">+</button>';
      const stage=document.createElement('div');stage.className='preview show';u.results.classList.add('show');u.results.innerHTML='';u.results.appendChild(stage);
      async function show(){const r=await renderPage(pdf,cur,scale);stage.innerHTML='';stage.appendChild(r.canvas);$('#pos',panel).textContent=cur+' / '+pdf.numPages;}
      $('#prev',panel).onclick=()=>{if(cur>1){cur--;show();}};
      $('#next',panel).onclick=()=>{if(cur<pdf.numPages){cur++;show();}};
      $('#zi',panel).onclick=()=>{scale=Math.min(3,scale+.25);show();};
      $('#zo',panel).onclick=()=>{scale=Math.max(.5,scale-.25);show();};
      await show();setStatus(u.status,'Opened '+pdf.numPages+' page(s).');}
    catch(e){setStatus(u.status,'Failed: '+(e.message||e),1);}});
};
