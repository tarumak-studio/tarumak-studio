/* TARUMAK STUDIO — image-tools.js  (15 image tools) */

function imgConv(outType,ext,opt){opt=opt||{};return function(panel){
  const u=dz(panel,{accept:opt.accept||'image/*',multiple:true,formats:opt.formats||[ext.toUpperCase()],sub:'Convert as many images as you like — all processed locally.'});
  dropzone(u.drop,u.file,async fs=>{const list=[...fs].filter(f=>f.type.startsWith('image/'));if(!list.length)return;u.results.innerHTML='';u.results.classList.add('show');
    for(const f of list){try{const img=await readImg(f);const c=document.createElement('canvas');c.width=img.naturalWidth||512;c.height=img.naturalHeight||512;const x=c.getContext('2d');if(opt.bg){x.fillStyle=opt.bg;x.fillRect(0,0,c.width,c.height);}x.drawImage(img,0,0);
      const blob=await new Promise(r=>c.toBlob(r,outType,opt.quality||.92));const nm=f.name.replace(/\.[^.]+$/,'')+'.'+ext;
      row(u.results,c.toDataURL('image/jpeg',.4),f.name,fmtBytes(f.size)+' <span class="arrow">&#8594;</span> '+fmtBytes(blob.size)+' · '+ext.toUpperCase(),()=>download(blob,nm));}catch(e){}}});
};}




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

INIT['jpg-to-webp']=imgConv('image/webp','webp',{accept:'image/jpeg'});
INIT['webp-to-jpg']=imgConv('image/jpeg','jpg',{accept:'image/webp',bg:'#fff'});
INIT['png-to-webp']=imgConv('image/webp','webp',{accept:'image/png'});
INIT['webp-to-png']=imgConv('image/png','png',{accept:'image/webp'});
INIT['exif-remover']=imgConv('image/jpeg','jpg',{accept:'image/jpeg',bg:'#fff',formats:['JPG']});
INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards EXIF data like GPS location and camera model, then re-exports a clean JPG.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding isn\'t supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */

INIT['webp-to-jpg']=imgConv('image/jpeg','jpg',{accept:'image/webp',bg:'#fff'});
INIT['png-to-webp']=imgConv('image/webp','webp',{accept:'image/png'});
INIT['webp-to-png']=imgConv('image/png','png',{accept:'image/webp'});
INIT['exif-remover']=imgConv('image/jpeg','jpg',{accept:'image/jpeg',bg:'#fff',formats:['JPG']});
INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards EXIF data like GPS location and camera model, then re-exports a clean JPG.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding isn\'t supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */

INIT['png-to-webp']=imgConv('image/webp','webp',{accept:'image/png'});
INIT['webp-to-png']=imgConv('image/png','png',{accept:'image/webp'});
INIT['exif-remover']=imgConv('image/jpeg','jpg',{accept:'image/jpeg',bg:'#fff',formats:['JPG']});
INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards EXIF data like GPS location and camera model, then re-exports a clean JPG.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding isn\'t supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */

INIT['webp-to-png']=imgConv('image/png','png',{accept:'image/webp'});
INIT['exif-remover']=imgConv('image/jpeg','jpg',{accept:'image/jpeg',bg:'#fff',formats:['JPG']});
INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards EXIF data like GPS location and camera model, then re-exports a clean JPG.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding isn\'t supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */

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

/* ═══════════════════════════════════════════════════════════
   SHARED SCRIPT LOADER
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   BACKGROUND REMOVER
   Uses @imgly/background-removal via ESM dynamic module.
   CORRECT API: default export (imglyRemoveBackground), not named.
   No publicPath — models auto-fetched from resources.img.ly.
   ═══════════════════════════════════════════════════════════ */
INIT['background-remover'] = function(panel) {

  panel.innerHTML =
    '<div class="drop" id="bgrDrop" style="cursor:pointer">' +
      '<input type="file" id="bgrIn" accept="image/*" hidden>' +
      '<div class="di">' + UP + '</div>' +
      '<h3>Drop image here or click to browse</h3>' +
      '<p>AI removes the background &middot; Downloads as transparent PNG &middot; No upload</p>' +
      '<div class="formats">' +
        '<span class="chip">AI-Powered</span>' +
        '<span class="chip">Transparent PNG</span>' +
        '<span class="chip">Privacy Safe</span>' +
      '</div>' +
    '</div>' +
    '<div class="status" id="bgrSt"></div>' +
    '<div class="results" id="bgrRes"></div>';

  var drop = $('#bgrDrop', panel),
      inp  = $('#bgrIn',   panel),
      st   = $('#bgrSt',   panel),
      res  = $('#bgrRes',  panel);

  dropzone(drop, inp, function(files) { if (files[0]) run(files[0]); });

  /* Load via ESM dynamic module — CORRECT: default export */
  function getRemoveBg() {
    return new Promise(function(ok, fail) {
      if (window.__tarumakBgr) { ok(window.__tarumakBgr); return; }
      if (window.__tarumakBgrLoading) {
        var n = 0, iv = setInterval(function() {
          if (window.__tarumakBgr) { clearInterval(iv); ok(window.__tarumakBgr); }
          else if (++n > 200) { clearInterval(iv); fail(new Error('Model load timeout')); }
        }, 300);
        return;
      }
      window.__tarumakBgrLoading = true;
      /* NOTE: @imgly/background-removal uses DEFAULT export, not named */
      var s = document.createElement('script');
      s.type = 'module';
      s.textContent =
        'import imglyRemoveBg from' +
        '"https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/browser.mjs";' +
        'window.__tarumakBgr=imglyRemoveBg;' +
        'document.dispatchEvent(new CustomEvent("__bgrOk"));';
      document.addEventListener('__bgrOk', function h() {
        document.removeEventListener('__bgrOk', h);
        ok(window.__tarumakBgr);
      });
      s.onerror = function() { fail(new Error('ESM load failed')); };
      document.head.appendChild(s);
    });
  }

  function run(file) {
    drop.style.display = 'none';
    res.innerHTML = ''; res.classList.remove('show');
    setStatus(st, 'Loading AI model\u2026 (~20 s first time, cached after)');
    getRemoveBg().then(function(removeBg) {
      setStatus(st, '\uD83E\uDDE0 Processing image\u2026');
      var src = URL.createObjectURL(file);
      /* No publicPath — library fetches model from https://resources.img.ly */
      return removeBg(src, { debug: false, model: 'small', output: { format: 'image/png', quality: 1 } })
        .then(function(blob) { URL.revokeObjectURL(src); return blob; });
    }).then(function(blob) {
      st.className = 'status';
      res.classList.add('show');
      var base = file.name.replace(/\.[^.]+$/, '');
      var outUrl  = URL.createObjectURL(blob);
      var origUrl = URL.createObjectURL(file);
      res.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">' +
          '<div><p style="text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint);margin-bottom:6px">Original</p>' +
            '<img src="' + origUrl + '" style="width:100%;max-height:240px;object-fit:contain;border-radius:10px;border:1px solid var(--border-2)"></div>' +
          '<div><p style="text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint);margin-bottom:6px">Background Removed</p>' +
            '<div style="background:repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0/18px 18px;border-radius:10px;overflow:hidden;max-height:240px;display:flex;align-items:center;justify-content:center">' +
              '<img src="' + outUrl + '" style="max-width:100%;max-height:240px;object-fit:contain">' +
            '</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center">' +
          '<button class="btn btn-primary" id="bgrDl">\u2B07 Download PNG</button>' +
          '<button class="btn" id="bgrAgain" style="background:rgba(255,255,255,.06)">Remove another</button>' +
        '</div>';
      $('#bgrDl', res).onclick   = function() { download(blob, base + '-no-bg.png'); };
      $('#bgrAgain', res).onclick = function() { res.innerHTML = ''; res.classList.remove('show'); drop.style.display = ''; inp.value = ''; };
    }).catch(function(e) {
      setStatus(st, '\u26A0\uFE0F ' + (e.message || 'Processing failed') + ' \u2014 try a JPG or PNG image.', true);
      drop.style.display = '';
    });
  }
};

/* ═══════════════════════════════════════════════════════════
   OCR IMAGE TO TEXT  (Tesseract.js v4.1.2)
   v4 works without SharedArrayBuffer — v5 requires COOP/COEP
   headers which Cloudflare Pages doesn't set by default.
   ═══════════════════════════════════════════════════════════ */
INIT['ocr-image-to-text'] = function(panel) {

  var CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.2/dist/tesseract.min.js';

  panel.innerHTML =
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">' +
      '<label style="font-size:13px;font-weight:600">Language:</label>' +
      '<select id="ocrLang" style="background:var(--bg-2);color:var(--text);border:1px solid var(--border-2);border-radius:8px;padding:6px 10px;font-size:13px">' +
        '<option value="eng">English</option>' +
        '<option value="hin">Hindi</option>' +
        '<option value="fra">French</option>' +
        '<option value="deu">German</option>' +
        '<option value="spa">Spanish</option>' +
        '<option value="jpn">Japanese</option>' +
        '<option value="chi_sim">Chinese (Simplified)</option>' +
        '<option value="ara">Arabic</option>' +
      '</select>' +
    '</div>' +
    '<div class="drop" id="ocrDrop" style="cursor:pointer">' +
      '<input type="file" id="ocrIn" accept="image/*" hidden>' +
      '<div class="di">' + UP + '</div>' +
      '<h3>Drop image with text here</h3>' +
      '<p>Screenshots, scanned docs, photos of signs \u2014 extracted in your browser</p>' +
      '<div class="formats">' +
        '<span class="chip">8 Languages</span>' +
        '<span class="chip">Multi-Language</span>' +
        '<span class="chip">Privacy Safe</span>' +
      '</div>' +
    '</div>' +
    '<div class="status" id="ocrSt"></div>' +
    '<div class="results" id="ocrRes"></div>';

  var drop    = $('#ocrDrop', panel),
      inp     = $('#ocrIn',   panel),
      st      = $('#ocrSt',   panel),
      res     = $('#ocrRes',  panel),
      langSel = $('#ocrLang', panel);

  dropzone(drop, inp, function(files) { if (files[0]) run(files[0]); });

  function run(file) {
    drop.style.display = 'none';
    res.innerHTML = ''; res.classList.remove('show');
    setStatus(st, '\u23F3 Loading OCR engine\u2026');
    _loadScript(CDN, 'Tesseract').then(function() {
      setStatus(st, '\uD83D\uDD0D Reading text (0%)\u2026');
      /* Tesseract.js v4 API: Tesseract.recognize(image, lang, options) */
      return Tesseract.recognize(file, langSel.value, {
        logger: function(m) {
          if (m.status === 'recognizing text') {
            st.textContent = '\uD83D\uDD0D Reading text (' + Math.round((m.progress || 0) * 100) + '%)\u2026';
          }
        }
      });
    }).then(function(result) {
      st.className = 'status';
      var text = ((result.data && result.data.text) || '').trim();
      if (!text) {
        setStatus(st, 'No text found \u2014 try a higher-resolution or higher-contrast image.', true);
        drop.style.display = '';
        return;
      }
      res.classList.add('show');
      var safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      res.innerHTML =
        '<div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-faint);margin-bottom:8px">Extracted Text</div>' +
        '<textarea id="ocrOut" style="width:100%;min-height:180px;padding:12px;background:rgba(255,255,255,.04);border:1px solid var(--border-2);border-radius:10px;color:var(--text);font-size:14px;line-height:1.7;resize:vertical;font-family:inherit;box-sizing:border-box" readonly>' + safe + '</textarea>' +
        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
          '<button class="btn btn-primary" id="ocrCopy">\uD83D\uDCCB Copy text</button>' +
          '<button class="btn" id="ocrDl" style="background:rgba(255,255,255,.06)">\u2B07 Download .txt</button>' +
          '<button class="btn" id="ocrNew" style="background:rgba(255,255,255,.06)">New image</button>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:var(--text-faint)">' +
          text.split(/\s+/).filter(Boolean).length + ' words \u00B7 ' + text.length + ' characters' +
        '</div>';
      var ta = $('#ocrOut', res);
      $('#ocrCopy', res).onclick = function() {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(ta.value).then(function() { toast('Copied!', 'ok'); });
        } else { ta.select(); document.execCommand('copy'); toast('Copied!', 'ok'); }
      };
      $('#ocrDl', res).onclick = function() {
        download(new Blob([text], { type: 'text/plain' }), file.name.replace(/\.[^.]+$/, '') + '-text.txt');
      };
      $('#ocrNew', res).onclick = function() {
        res.innerHTML = ''; res.classList.remove('show'); drop.style.display = ''; inp.value = '';
      };
    }).catch(function(e) {
      setStatus(st, '\u26A0\uFE0F Error: ' + (e.message || String(e)), true);
      drop.style.display = '';
    });
  }
};

/* ═══════════════════════════════════════════════════════════
   HEIC TO JPG  (heic2any v0.0.4)
   ═══════════════════════════════════════════════════════════ */
INIT['heic-to-jpg'] = function(panel) {

  var CDN = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';

  panel.innerHTML =
    '<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;flex-wrap:wrap">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<label style="font-size:13px;font-weight:600">Output:</label>' +
        '<select id="h2jFmt" style="background:var(--bg-2);color:var(--text);border:1px solid var(--border-2);border-radius:8px;padding:6px 10px;font-size:13px">' +
          '<option value="image/jpeg">JPG (smaller)</option>' +
          '<option value="image/png">PNG (lossless)</option>' +
        '</select>' +
      '</div>' +
      '<div id="h2jQwrap" style="display:flex;align-items:center;gap:8px">' +
        '<label style="font-size:13px;font-weight:600">Quality: <span id="h2jQv">90%</span></label>' +
        '<input type="range" id="h2jQ" min="60" max="100" value="90" style="width:90px">' +
      '</div>' +
    '</div>' +
    '<div class="drop" id="h2jDrop" style="cursor:pointer">' +
      '<input type="file" id="h2jIn" accept=".heic,.heif,image/heic,image/heif,image/*" multiple hidden>' +
      '<div class="di">' + UP + '</div>' +
      '<h3>Drop HEIC / HEIF files here</h3>' +
      '<p>iPhone photos converted to JPG or PNG &middot; Batch supported &middot; No upload</p>' +
      '<div class="formats">' +
        '<span class="chip">HEIC</span>' +
        '<span class="chip">HEIF</span>' +
        '<span class="chip">Batch</span>' +
        '<span class="chip">iPhone Photos</span>' +
      '</div>' +
    '</div>' +
    '<div class="status" id="h2jSt"></div>' +
    '<div class="results" id="h2jRes"></div>';

  var drop  = $('#h2jDrop',  panel),
      inp   = $('#h2jIn',    panel),
      st    = $('#h2jSt',    panel),
      res   = $('#h2jRes',   panel),
      fmt   = $('#h2jFmt',   panel),
      qual  = $('#h2jQ',     panel),
      qval  = $('#h2jQv',    panel),
      qwrap = $('#h2jQwrap', panel);

  qual.oninput  = function() { qval.textContent = qual.value + '%'; };
  fmt.onchange  = function() { qwrap.style.display = (fmt.value === 'image/png') ? 'none' : 'flex'; };

  dropzone(drop, inp, function(files) { convert([].slice.call(files)); });

  function convert(files) {
    /* Accept by extension first, fall back to all files if none match */
    var heicFiles = files.filter(function(f) {
      return /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type);
    });
    var toProcess = heicFiles.length ? heicFiles : files;
    if (!toProcess.length) { setStatus(st, 'No files selected', true); return; }

    drop.style.display = 'none';
    res.innerHTML = ''; res.classList.add('show');
    setStatus(st, '\u23F3 Loading HEIC converter\u2026');

    _loadScript(CDN, 'heic2any').then(function(lib) {
      var fn = (typeof lib === 'function') ? lib : window.heic2any;
      if (typeof fn !== 'function') throw new Error('heic2any did not load');

      var outFmt = fmt.value,
          q      = parseInt(qual.value) / 100,
          ext    = (outFmt === 'image/jpeg') ? 'jpg' : 'png',
          done   = 0;

      st.className = 'status show';

      function next() {
        if (done >= toProcess.length) { st.className = 'status'; return; }
        var f = toProcess[done];
        st.textContent = 'Converting ' + f.name + ' (' + (done + 1) + '/' + toProcess.length + ')';
        fn({ blob: f, toType: outFmt, quality: q }).then(function(result) {
          var blob = Array.isArray(result) ? result[0] : result;
          var base = f.name.replace(/\.(heic|heif)$/i, '').replace(/\.[^.]+$/, '');
          var url  = URL.createObjectURL(blob);
          row(res, url, base + '.' + ext, fmtBytes(blob.size) + ' \u00B7 ' + ext.toUpperCase(), function() {
            download(blob, base + '.' + ext);
          });
          done++; next();
        }).catch(function() { done++; next(); }); /* skip non-HEIC files silently */
      }
      next();
    }).catch(function(e) {
      setStatus(st, '\u26A0\uFE0F ' + (e.message || 'Failed to load converter'), true);
      drop.style.display = '';
    });
  }
};
