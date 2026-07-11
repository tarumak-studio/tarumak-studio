/* TARUMAK STUDIO — image-tools.js  (15 image tools) */

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

INIT['image-compressor']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',multiple:true,formats:['JPG','PNG','WEBP'],sub:'Compress one image or many at once.'});
  u.controls.innerHTML='<div class="ctrl"><label for="q">Quality · <span class="val" id="qv">75%</span></label><input type="range" id="q" min="10" max="100" value="75"></div><div class="ctrl"><label for="of">Output</label><select id="of"><option value="image/jpeg">JPG (smallest)</option><option value="image/webp">WebP</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Compress images</button>';
  let imgs=[];const q=$('#q',panel),qv=$('#qv',panel);q.oninput=()=>qv.textContent=q.value+'%';
  dropzone(u.drop,u.file,fs=>{imgs=[...fs].filter(f=>/image\/(png|jpeg|webp)/.test(f.type));if(imgs.length)setStatus(u.status,imgs.length+' image(s) ready — set quality and compress.');});
  $('#run',panel).onclick=async()=>{if(!imgs.length){setStatus(u.status,'Drop some images first.',1);return;}u.results.innerHTML='';u.results.classList.add('show');
    const type=$('#of',panel).value,ql=q.value/100,ext=type==='image/webp'?'webp':'jpg';
    for(const f of imgs){const img=await readImg(f);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');if(type==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);}x.drawImage(img,0,0);const blob=await new Promise(r=>c.toBlob(r,type,ql));const saved=Math.max(0,Math.round((1-blob.size/f.size)*100));row(u.results,c.toDataURL('image/jpeg',.4),f.name,fmtBytes(f.size)+' <span class="arrow">&#8594;</span> '+fmtBytes(blob.size)+' <span class="save">−'+saved+'%</span>',()=>download(blob,f.name.replace(/\.[^.]+$/,'')+'-min.'+ext));}
    setStatus(u.status,'Done — '+imgs.length+' image(s) compressed.');};
};

INIT['image-resizer']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',formats:['JPG','PNG','WEBP'],sub:'Resize a single image to any size.'});
  u.controls.innerHTML='<div class="ctrl"><label for="w">Width</label><input type="number" id="w" min="1" style="width:104px"></div><div class="ctrl"><label for="h">Height</label><input type="number" id="h" min="1" style="width:104px"></div><div class="ctrl"><label for="sc">Scale</label><select id="sc" style="width:96px"><option value="">Custom</option><option value="0.25">25%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="2">200%</option></select></div><div class="ctrl"><label for="fm">Format</label><select id="fm" style="width:104px"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div><label class="lock"><input type="checkbox" id="lk" checked> Lock ratio</label><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Resize &amp; download</button>';
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
INIT['exif-remover']=imgConv('image/jpeg','jpg',{accept:'image/jpeg,image/png,image/webp',bg:'#fff',formats:['JPG']});
INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards all EXIF metadata (GPS location, camera model, timestamps, copyright), then re-exports a clean file.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding is not supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */

INIT['svg-to-png']=svgConv('image/png','png',null);
INIT['svg-to-jpg']=svgConv('image/jpeg','jpg','#fff');

INIT['image-to-pdf']=imagesToPdfTool({outName:'image'});
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

INIT['watermark-image']=function(panel){
  const u=dz(panel,{accept:'image/png,image/jpeg,image/webp',formats:['JPG','PNG','WEBP'],sub:'Then type your watermark text.'});
  u.controls.innerHTML='<div class="ctrl"><label for="tx">Text</label><input type="text" id="tx" value="© TARUMAK" style="width:180px"></div><div class="ctrl"><label for="ps">Position</label><select id="ps"><option value="br">Bottom right</option><option value="bl">Bottom left</option><option value="tr">Top right</option><option value="tl">Top left</option><option value="c">Center</option><option value="tile">Tiled</option></select></div><div class="ctrl"><label for="sz">Size · <span class="val" id="szv">5%</span></label><input type="range" id="sz" min="2" max="14" value="5"></div><div class="ctrl"><label for="op">Opacity · <span class="val" id="opv">45%</span></label><input type="range" id="op" min="5" max="100" value="45"></div><div class="ctrl"><label>Color</label><div class="color-field"><input type="color" id="cl" value="#ffffff"><span id="clh">#ffffff</span></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Download</button>';
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

/* ===== SVG rasterizer factory ===== */
function svgConv(outType,ext,bg){return function(panel){
  const u=dz(panel,{accept:'.svg,image/svg+xml',multiple:true,formats:[ext.toUpperCase()],sub:'Vector SVG rendered to '+ext.toUpperCase()+' at your chosen size.'});
  u.controls.innerHTML='<div class="ctrl"><label for="sc">Output width</label><select id="sc"><option value="512">512 px</option><option value="1024">1024 px</option><option value="256">256 px</option><option value="2048">2048 px</option></select></div>';
  dropzone(u.drop,u.file,async fs=>{const list=[...fs].filter(f=>/svg/i.test(f.type)||/\.svg$/i.test(f.name));if(!list.length)return;u.results.innerHTML='';u.results.classList.add('show');const W=+$('#sc',panel).value;
    for(const f of list){const txt=await f.text();const url=URL.createObjectURL(new Blob([txt],{type:'image/svg+xml'}));
      await new Promise(res=>{const im=new Image();im.onload=()=>{const ar=(im.naturalWidth&&im.naturalHeight)?im.naturalHeight/im.naturalWidth:1;const c=document.createElement('canvas');c.width=W;c.height=Math.round(W*ar)||W;const x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>{row(u.results,c.toDataURL(),f.name,c.width+'×'+c.height+' · '+ext.toUpperCase(),()=>download(b,f.name.replace(/\.svg$/i,'')+'.'+ext));res();},outType,.95);};im.onerror=()=>{setStatus(u.status,'Could not render '+f.name,1);res();};im.src=url;});}
  });
};}

INIT['qr-code-generator']=function(panel){
  panel.innerHTML='<div style="display:grid;grid-template-columns:1fr 300px;gap:26px;align-items:start" id="qwrap"></div>';
  const wrap=$('#qwrap',panel);
  wrap.innerHTML='<div><div class="seg" id="ty" style="margin-bottom:18px"><button class="active" data-t="url">Link</button><button data-t="text">Text</button><button data-t="email">Email</button><button data-t="wifi">Wi-Fi</button></div>'+
    '<div id="main"><div class="ctrl" style="margin-bottom:14px"><label for="mi" id="ml">Website URL</label><input type="text" id="mi" value="https://tarumak.tools" style="width:100%"></div></div>'+
    '<div id="wifi" style="display:none"><div class="ctrl" style="margin-bottom:12px"><label for="ssid">Network name (SSID)</label><input type="text" id="ssid" style="width:100%"></div><div style="display:flex;gap:12px"><div class="ctrl" style="flex:1"><label for="wp">Password</label><input type="text" id="wp" style="width:100%"></div><div class="ctrl"><label for="wt">Security</label><select id="wt"><option>WPA</option><option>WEP</option><option value="nopass">None</option></select></div></div></div>'+
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
   BACKGROUND REMOVER  —  region-growing flood fill v3
   Pure canvas, zero CDN. Uses a perceptual, chroma-weighted
   colour distance instead of raw RGB Euclidean distance:
   lightness differences (shadows, vignettes, lighting falloff)
   count much LESS, while hue/saturation differences (real
   subject colour — skin, hair, clothing) count much MORE.
   This is what lets it follow large, smooth lighting gradients
   on a backdrop while still stopping cleanly at the subject's
   edge. A short multi-pass growth stage afterwards mops up any
   residual sharp-but-still-background steps (e.g. JPEG banding).
   Known limitation: clothing whose colour is nearly identical
   to the backdrop (e.g. light-grey shirt on a light-grey wall)
   can still be misread as background — this is a shared limit
   of every non-AI colour-distance approach, not just this one.
   ═══════════════════════════════════════════════════════════ */
INIT['background-remover'] = function(panel) {

  /* ═══════════════════════════════════════════════════════════════
     BACKGROUND REMOVER — dual-engine redesign
     · AI mode (default): ISNet neural segmentation via
       @imgly/background-removal (ONNX Runtime, WASM), lazy-loaded
       from CDN on first use. The MODEL downloads to the device once
       (~20–40 MB, browser-cached); the IMAGE never leaves the device.
       API facts validated in prior integration work: the removal
       function is the module's DEFAULT export (not a named export),
       and models auto-fetch from resources.img.ly — do NOT pass a
       publicPath.
     · Solid mode: the tuned region-growing flood fill, preserved
       VERBATIM below (perimeter-median seeding, dual distance
       metrics, escalating multi-pass growth, NaN defences). It is
       instant, offline, and on flat/studio backgrounds produces
       sharper edges than a 1024px neural mask upsampled — which is
       why it stays as a first-class mode, not a deprecated path.
     · If the AI engine cannot load (offline / CDN blocked), the
       tool announces it and auto-falls back to Solid mode.
     ═══════════════════════════════════════════════════════════════ */

  var IMGLY_CDN = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1/+esm';
  var CHECKER = 'background:repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0/18px 18px;';

  panel.innerHTML =
    '<div role="group" aria-label="Background removal mode" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
      '<span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint)">Mode</span>' +
      '<button class="btn" id="bgrModeAi" aria-pressed="true" style="padding:7px 16px;font-size:13px">AI &mdash; any photo</button>' +
      '<button class="btn" id="bgrModeSolid" aria-pressed="false" style="padding:7px 16px;font-size:13px">Solid background &mdash; instant</button>' +
    '</div>' +
    '<p id="bgrAiNote" style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-dim);margin-bottom:12px">' +
      '<span style="width:5px;height:5px;border-radius:50%;background:var(--ok,#34d399);flex-shrink:0"></span>' +
      'Runs entirely in your browser \u2014 nothing is uploaded. The AI model downloads once and is cached locally; your photos never leave your device.' +
    '</p>' +
    '<div class="drop" id="bgrDrop" style="cursor:pointer" tabindex="0" role="button" aria-label="Drop image here or click to browse">' +
      '<input type="file" id="bgrIn" accept="image/*" hidden aria-hidden="true" tabindex="-1">' +
      '<div class="di">' + UP + '</div>' +
      '<h3>Drop image here or click to browse</h3>' +
      '<p>People, products, animals, logos &middot; JPG, PNG, WebP &middot; Downloads as transparent PNG</p>' +
      '<div class="formats">' +
        '<span class="chip">JPG</span><span class="chip">PNG</span>' +
        '<span class="chip">WebP</span><span class="chip">Transparent PNG</span>' +
      '</div>' +
    '</div>' +
    '<div id="bgrOpts" style="display:none;margin-bottom:12px">' +
      '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:8px">' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<label for="bgrTol" style="font-size:13px;font-weight:600">Sensitivity: <span id="bgrTolV">38</span></label>' +
          '<input type="range" id="bgrTol" min="8" max="100" value="38" style="width:120px">' +
        '</div>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;cursor:pointer">' +
          '<input type="checkbox" id="bgrFeather" checked style="accent-color:var(--p1)">Smooth edges' +
        '</label>' +
        '<button class="btn" id="bgrRerun" style="background:rgba(99,179,237,.15);color:#63b3ed;padding:6px 14px;font-size:13px">' +
          '&#8634; Re-apply' +
        '</button>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--text-faint)" id="bgrHint">' +
        'Auto-tuned to your image. Handles gradients, shadows and soft vignettes &mdash; raise sensitivity if any background remains.' +
      '</p>' +
    '</div>' +
    '<div class="status" id="bgrSt"></div>' +
    '<div class="results" id="bgrRes"></div>' +
    '<canvas id="bgrCanvas" style="display:none"></canvas>';

  var drop     = $('#bgrDrop',     panel),
      inp      = $('#bgrIn',       panel),
      opts     = $('#bgrOpts',     panel),
      tolEl    = $('#bgrTol',      panel),
      tolVal   = $('#bgrTolV',     panel),
      feathEl  = $('#bgrFeather',  panel),
      hint     = $('#bgrHint',     panel),
      rerunBtn = $('#bgrRerun',    panel),
      st       = $('#bgrSt',       panel),
      res      = $('#bgrRes',      panel),
      canvas   = $('#bgrCanvas',   panel),
      ctx      = canvas.getContext('2d'),
      modeAiBtn    = $('#bgrModeAi',    panel),
      modeSolidBtn = $('#bgrModeSolid', panel),
      aiNote       = $('#bgrAiNote',    panel);

  var mode = 'ai';
  var currentImg = null, currentFile = null, autoTolSet = false;
  var cutBlob = null, origUrl = null, outUrl = null, bgChoice = null;
  var aiModulePromise = null;

  /* ── Mode pills ─────────────────────────────────────────────── */
  function paintModes() {
    var on  = 'padding:7px 16px;font-size:13px;background:rgba(34,211,238,.15);color:var(--p1);border:1px solid rgba(34,211,238,.35)';
    var off = 'padding:7px 16px;font-size:13px;background:rgba(255,255,255,.05);color:var(--text-dim);border:1px solid transparent';
    modeAiBtn.style.cssText    = (mode === 'ai')    ? on : off;
    modeSolidBtn.style.cssText = (mode === 'solid') ? on : off;
    modeAiBtn.setAttribute('aria-pressed', mode === 'ai' ? 'true' : 'false');
    modeSolidBtn.setAttribute('aria-pressed', mode === 'solid' ? 'true' : 'false');
    aiNote.style.display = (mode === 'ai') ? '' : 'none';
    opts.style.display = (mode === 'solid' && currentImg) ? 'block' : 'none';
  }
  modeAiBtn.onclick = function() {
    if (mode === 'ai') return;
    mode = 'ai'; paintModes();
    if (currentFile) runAI(currentFile);
  };
  modeSolidBtn.onclick = function() {
    if (mode === 'solid') return;
    mode = 'solid'; paintModes();
    if (currentFile) ensureImgThen(function() {
      processImage(currentImg, currentFile, parseInt(tolEl.value), feathEl.checked);
    });
  };
  paintModes();

  function ensureImgThen(cb) {
    if (currentImg) { cb(); return; }
    var img = new Image();
    img.onload = function() { currentImg = img; cb(); };
    img.onerror = function() { setStatus(st, 'Could not load image.', true); };
    img.src = URL.createObjectURL(currentFile);
  }

  /* ── Classic-mode controls (unchanged behaviour) ────────────── */
  tolEl.oninput = function() { tolVal.textContent = tolEl.value; };
  feathEl.onchange = function() {
    if (mode === 'solid' && currentImg && currentFile) processImage(currentImg, currentFile, parseInt(tolEl.value), feathEl.checked);
  };
  rerunBtn.onclick = function() {
    if (mode === 'solid' && currentImg && currentFile) processImage(currentImg, currentFile, parseInt(tolEl.value), feathEl.checked);
  };

  dropzone(drop, inp, function(files) {
    if (!files[0]) return;
    currentFile = files[0];
    currentImg = null;
    autoTolSet = false;
    if (mode === 'ai') {
      runAI(currentFile);
    } else {
      ensureImgThen(function() {
        processImage(currentImg, currentFile, parseInt(tolEl.value), feathEl.checked);
      });
    }
  });

  /* ── AI ENGINE ──────────────────────────────────────────────── */
  function loadAIModule() {
    if (!aiModulePromise) {
      aiModulePromise = import(IMGLY_CDN).then(function(mod) {
        /* Default export is the removal function (validated); keep a
           defensive fallback to a named export in case the package
           reshapes in a future major. */
        var fn = (typeof mod.default === 'function') ? mod.default
               : (typeof mod.removeBackground === 'function') ? mod.removeBackground
               : null;
        if (!fn) throw new Error('AI module loaded but removal function not found');
        return fn;
      });
      /* A failed load must not poison every later retry */
      aiModulePromise.catch(function() { aiModulePromise = null; });
    }
    return aiModulePromise;
  }

  function runAI(file) {
    drop.style.display = 'none';
    res.innerHTML = ''; res.classList.remove('show');
    opts.style.display = 'none';
    setStatus(st, 'Loading AI engine\u2026');

    loadAIModule().then(function(removeBg) {
      return removeBg(file, {
        /* isnet = the full-precision ISNet model. Noticeably better on hair,
           soft edges and colour fidelity than the default fp16 build — the
           quality the "professional" brief is asking for. Costs a larger
           one-time download, which the browser caches. */
        model: 'isnet',
        progress: function(key, current, total) {
          if (key && String(key).indexOf('fetch') === 0 && total) {
            var pct = Math.min(100, Math.round((current / total) * 100));
            setStatus(st, 'Downloading AI model \u2014 one-time, cached by your browser\u2026 ' + pct + '%');
          } else {
            setStatus(st, 'Removing background on your device\u2026');
          }
        },
        output: { format: 'image/png', quality: 1 }
      });
    }).then(function(blob) {
      /* Draw the AI result into the shared canvas so BOTH engines end
         at the same full-resolution canvas → one result pipeline. */
      var img = new Image();
      img.onload = function() {
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(img.src);
        decontaminateEdges(); /* kill white/colour halos on soft edges */
        finalizeResult(currentFile);
      };
      img.onerror = function() { setStatus(st, 'AI produced an unreadable result \u2014 try Solid mode.', true); drop.style.display = ''; };
      img.src = URL.createObjectURL(blob);
    }).catch(function(err) {
      /* Honest, actionable failure + automatic fallback */
      console.warn('[background-remover] AI engine failed:', err);
      setStatus(st, 'AI engine unavailable (offline or CDN blocked) \u2014 switched to Solid background mode.', true);
      mode = 'solid'; paintModes();
      ensureImgThen(function() {
        processImage(currentImg, currentFile, parseInt(tolEl.value), feathEl.checked);
      });
    });
  }

  function pdistGlobal(r,g,b,r2,g2,b2) {
    var l1 = (r+g+b)/3, l2 = (r2+g2+b2)/3, dL = l1-l2;
    var cr1=r-l1, cg1=g-l1, cb1=b-l1, cr2=r2-l2, cg2=g2-l2, cb2=b2-l2;
    var dC = Math.sqrt(Math.pow(cr1-cr2,2)+Math.pow(cg1-cg2,2)+Math.pow(cb1-cb2,2));
    return Math.sqrt(Math.pow(dL*0.30,2) + Math.pow(dC*1.6,2));
  }
  function pdistLocal(r,g,b,r2,g2,b2) {
    var dr=r-r2, dg=g-g2, db=b-b2;
    return Math.sqrt(dr*dr+dg*dg+db*db);
  }

  /* ── SOLID ENGINE — tuned flood fill, preserved verbatim ────── */
  function processImage(img, file, sensitivity, feather) {
    drop.style.display = 'none';
    res.innerHTML = ''; res.classList.remove('show');
    setStatus(st, 'Analysing background\u2026');

    setTimeout(function() {
      try {
        var w = img.naturalWidth, h = img.naturalHeight;
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0);

        var imageData = ctx.getImageData(0, 0, w, h);
        var d = imageData.data;
        var n = w * h;

        /* STEP 1 — sample full perimeter, use median (robust to subject touching edge) */
        var step = Math.max(1, Math.floor(Math.min(w, h) / 400));
        var rs = [], gs = [], bs = [];
        for (var x = 0; x < w; x += step) { pushSample(x, 0); pushSample(x, h - 1); }
        for (var y = 0; y < h; y += step) { pushSample(0, y); pushSample(w - 1, y); }
        function pushSample(px, py) {
          var i = (py * w + px) * 4;
          rs.push(d[i]); gs.push(d[i+1]); bs.push(d[i+2]);
        }
        function median(arr) {
          var a = arr.slice().sort(function(x,y){return x-y;});
          return a[Math.floor(a.length / 2)];
        }
        var bgR = median(rs), bgG = median(gs), bgB = median(bs);

        /* Defensive: rs/gs/bs should never be empty for a valid image,
           and bgR/bgG/bgB/pdist should never yield NaN — but if anything
           upstream ever does (corrupt image data, zero-area canvas, an
           unexpected decode edge case), we must NEVER let an invalid
           number reach the slider. Assigning NaN to a <input type=range>
           silently clamps its DISPLAYED value down to the slider's own
           min attribute (8) without throwing — which is exactly the
           "Sensitivity: 8 / Clean background detected" false-positive
           bug. Every value below is explicitly validated before use. */
        var spreadSum = 0, validSamples = 0;
        for (var s = 0; s < rs.length; s++) {
          var pd = pdistGlobal(rs[s],gs[s],bs[s], bgR,bgG,bgB);
          if (isFinite(pd)) { spreadSum += pd; validSamples++; }
        }
        var spread = validSamples > 0 ? (spreadSum / validSamples) : NaN;
        if (!isFinite(spread)) {
          console.warn('[background-remover] spread calculation invalid (rs.length=' + rs.length + ', bgR/G/B=' + bgR + '/' + bgG + '/' + bgB + ') — falling back to safe default tolerance.');
          spread = 20; /* sane mid-range fallback so the tool still works correctly */
        }

        var suggestedRaw = Math.round(Math.min(90, Math.max(16, spread * 2.4 + 14)));
        var autoSuggested = isFinite(suggestedRaw) ? suggestedRaw : 32; /* hard fallback, never NaN */

        if (!autoTolSet) {
          tolEl.value = autoSuggested; tolVal.textContent = autoSuggested;
          sensitivity = autoSuggested; autoTolSet = true;
        }

        /* Hint is recalculated on EVERY run (fresh upload AND every manual
           Re-apply) so it never goes stale relative to whatever sensitivity
           value is actually being applied right now — this is what
           prevented the confusing "hint says Gradient, value shows 24"
           mismatch from a manually-adjusted slider after the first run. */
        var usingBelowRecommended = sensitivity < autoSuggested - 4;
        if (usingBelowRecommended) {
          hint.innerHTML = 'Note: current sensitivity (' + sensitivity + ') is below the recommended <strong>' + autoSuggested + '</strong> for this image \u2014 raise the slider if background remains.';
        } else if (spread > 14) {
          hint.textContent = 'Gradient or shadowed background detected \u2014 sensitivity auto-tuned to ' + autoSuggested + '. Raise it further if any background remains.';
        } else {
          hint.textContent = 'Clean background detected \u2014 sensitivity auto-tuned to ' + autoSuggested + ' for a precise cut.';
        }

        var tolerance = isFinite(sensitivity) ? sensitivity : 32; /* final defence: never let an invalid value reach the flood fill */
        var localTol  = Math.max(10, tolerance * 0.6);

        /* STEP 2 — region-growing flood fill: each pixel checked against
           BOTH the global background colour AND its classified neighbour,
           using the chroma-weighted distance above. */
        var mask = new Uint8Array(n);
        var visited = new Uint8Array(n);
        var qx = new Int32Array(n), qy = new Int32Array(n);
        var qr = new Uint8Array(n), qg = new Uint8Array(n), qb = new Uint8Array(n);
        var head = 0, tail = 0;

        function tryEnqueue(x, y, pr, pg, pb, gTol, lTol) {
          if (x < 0 || y < 0 || x >= w || y >= h) return;
          var idx = y * w + x;
          if (visited[idx]) return;
          var i = idx * 4, r = d[i], g = d[i+1], b = d[i+2];
          if (pdistGlobal(r,g,b, bgR,bgG,bgB) <= gTol && pdistLocal(r,g,b, pr,pg,pb) <= lTol) {
            visited[idx] = 1; mask[idx] = 1;
            qx[tail]=x; qy[tail]=y; qr[tail]=r; qg[tail]=g; qb[tail]=b; tail++;
          }
        }

        for (var x0 = 0; x0 < w; x0++) {
          tryEnqueue(x0, 0,   bgR,bgG,bgB, tolerance, localTol);
          tryEnqueue(x0, h-1, bgR,bgG,bgB, tolerance, localTol);
        }
        for (var y0 = 1; y0 < h-1; y0++) {
          tryEnqueue(0,   y0, bgR,bgG,bgB, tolerance, localTol);
          tryEnqueue(w-1, y0, bgR,bgG,bgB, tolerance, localTol);
        }
        while (head < tail) {
          var px = qx[head], py = qy[head], pr = qr[head], pg = qg[head], pb = qb[head]; head++;
          tryEnqueue(px-1, py, pr,pg,pb, tolerance, localTol);
          tryEnqueue(px+1, py, pr,pg,pb, tolerance, localTol);
          tryEnqueue(px, py-1, pr,pg,pb, tolerance, localTol);
          tryEnqueue(px, py+1, pr,pg,pb, tolerance, localTol);
        }

        /* STEP 2b — multi-pass escalating growth: mops up any residual
           background left behind by a sharp-but-still-background step
           (e.g. JPEG compression banding inside a smooth gradient). */
        var passMultipliers = [1.7, 2.4];
        for (var pm = 0; pm < passMultipliers.length; pm++) {
          var pLocal  = Math.min(60, localTol * passMultipliers[pm]);
          var pGlobal = Math.min(90, tolerance * (1 + pm * 0.15));
          var grew = false;

          for (var sy = 0; sy < h; sy++) {
            for (var sx = 0; sx < w; sx++) {
              var sidx = sy*w+sx;
              if (visited[sidx]) continue;
              var refR=0, refG=0, refB=0, has=false;
              if      (sx>0   && mask[sidx-1]) { has=true; var ri=(sidx-1)*4; refR=d[ri];refG=d[ri+1];refB=d[ri+2]; }
              else if (sx<w-1 && mask[sidx+1]) { has=true; var ri=(sidx+1)*4; refR=d[ri];refG=d[ri+1];refB=d[ri+2]; }
              else if (sy>0   && mask[sidx-w]) { has=true; var ri=(sidx-w)*4; refR=d[ri];refG=d[ri+1];refB=d[ri+2]; }
              else if (sy<h-1 && mask[sidx+w]) { has=true; var ri=(sidx+w)*4; refR=d[ri];refG=d[ri+1];refB=d[ri+2]; }
              if (!has) continue;
              var i2 = sidx*4, r2=d[i2], g2=d[i2+1], b2=d[i2+2];
              if (pdistGlobal(r2,g2,b2, bgR,bgG,bgB) <= pGlobal && pdistLocal(r2,g2,b2, refR,refG,refB) <= pLocal) {
                visited[sidx]=1; mask[sidx]=1;
                qx[tail]=sx; qy[tail]=sy; qr[tail]=r2; qg[tail]=g2; qb[tail]=b2; tail++;
                grew = true;
              }
            }
          }
          while (head < tail) {
            var px2=qx[head], py2=qy[head], pr2=qr[head], pg2=qg[head], pb2=qb[head]; head++;
            tryEnqueue(px2-1, py2, pr2,pg2,pb2, pGlobal, pLocal);
            tryEnqueue(px2+1, py2, pr2,pg2,pb2, pGlobal, pLocal);
            tryEnqueue(px2, py2-1, pr2,pg2,pb2, pGlobal, pLocal);
            tryEnqueue(px2, py2+1, pr2,pg2,pb2, pGlobal, pLocal);
          }
          if (!grew) break;
        }

        /* STEP 3 — apply mask to alpha */
        for (var p = 0; p < n; p++) { if (mask[p]) d[p*4+3] = 0; }

        /* STEP 4 — optional edge feathering: small alpha-only box blur
           restricted to the boundary band, for anti-aliased cut edges. */
        if (feather) {
          var alpha = new Uint8ClampedArray(n);
          for (var a = 0; a < n; a++) alpha[a] = d[a*4+3];
          var boundary = new Uint8Array(n);
          for (var by = 0; by < h; by++) {
            for (var bx = 0; bx < w; bx++) {
              var bi = by*w+bx, av = alpha[bi], edge = false;
              if (bx>0   && alpha[bi-1] !== av) edge = true;
              if (bx<w-1 && alpha[bi+1] !== av) edge = true;
              if (by>0   && alpha[bi-w] !== av) edge = true;
              if (by<h-1 && alpha[bi+w] !== av) edge = true;
              if (edge) boundary[bi] = 1;
            }
          }
          for (var fy = 0; fy < h; fy++) {
            for (var fx = 0; fx < w; fx++) {
              var fi = fy*w+fx;
              if (!boundary[fi]) continue;
              var sum = 0, cnt = 0;
              for (var oy = -1; oy <= 1; oy++) {
                for (var ox = -1; ox <= 1; ox++) {
                  var nx = fx+ox, ny = fy+oy;
                  if (nx<0||ny<0||nx>=w||ny>=h) continue;
                  sum += alpha[ny*w+nx]; cnt++;
                }
              }
              d[fi*4+3] = Math.round(sum / cnt);
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        opts.style.display = 'block';
        finalizeResult(file);

      } catch(e) {
        setStatus(st, 'Error: ' + (e.message || e), true);
        drop.style.display = '';
      }
    }, 20);
  }

  /* ── EDGE DECONTAMINATION ───────────────────────────────────────
     Neural masks leave a thin rim of semi-transparent pixels that still
     carry the ORIGINAL background colour (the classic white/grey "halo").
     For every partially-transparent edge pixel we replace only its RGB
     with the colour of the nearest fully-opaque neighbour — the alpha
     value is preserved (soft edges & shadows stay soft), and fully-opaque
     interior pixels (logos, badges, text) are never touched. */
  function decontaminateEdges() {
    try {
      var w = canvas.width, h = canvas.height;
      if (!w || !h || w * h > 40000000) return; /* skip huge images (memory) */
      var id = ctx.getImageData(0, 0, w, h), d = id.data;
      var OFF = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
      /* 3 passes lets object colour propagate across a multi-pixel soft rim.
         Each pass reads a stable snapshot; only RGB is copied from the
         highest-alpha neighbour, so alpha (soft edges/shadows) is preserved
         and fully-opaque interior pixels are never modified. */
      for (var pass = 0; pass < 3; pass++) {
        var src = d.slice(0);
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            var i = (y * w + x) * 4, a = src[i + 3];
            if (a === 0 || a >= 250) continue;
            var bestA = a, br = -1, bg = 0, bb = 0;
            for (var k = 0; k < 8; k++) {
              var nx = x + OFF[k][0], ny = y + OFF[k][1];
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              var j = (ny * w + nx) * 4, na = src[j + 3];
              if (na > bestA) { bestA = na; br = src[j]; bg = src[j + 1]; bb = src[j + 2]; }
            }
            if (br >= 0) { d[i] = br; d[i + 1] = bg; d[i + 2] = bb; }
          }
        }
      }
      ctx.putImageData(id, 0, 0);
    } catch (e) { /* non-fatal: fall back to the raw AI output */ }
  }

  /* ── SHARED RESULT PIPELINE — compare slider + bg replace ───── */
  function finalizeResult(file) {
    canvas.toBlob(function(blob) {
      cutBlob = blob;
      bgChoice = null;
      st.className = 'status';
      res.classList.add('show');

      if (origUrl) URL.revokeObjectURL(origUrl);
      if (outUrl)  URL.revokeObjectURL(outUrl);
      origUrl = URL.createObjectURL(file);
      outUrl  = URL.createObjectURL(blob);
      var base = file.name.replace(/\.[^.]+$/, '');

      res.innerHTML =
        '<div style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;margin-bottom:12px">' +
          '<span style="font-size:12px;font-weight:600;color:var(--text-dim)">Background:</span>' +
          '<button class="btn bgr-bg" data-bg="" style="padding:5px 12px;font-size:12px">Transparent</button>' +
          '<button class="btn bgr-bg" data-bg="#ffffff" style="padding:5px 12px;font-size:12px">White</button>' +
          '<button class="btn bgr-bg" data-bg="#000000" style="padding:5px 12px;font-size:12px">Black</button>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-dim);cursor:pointer">Custom' +
            '<input type="color" id="bgrBgPick" value="#22d3ee" style="width:28px;height:24px;border:0;background:none;cursor:pointer">' +
          '</label>' +
        '</div>' +
        '<div id="bgrCmp" style="position:relative;max-width:560px;margin:0 auto 8px;border-radius:12px;overflow:hidden;border:1px solid var(--border-2);cursor:ew-resize;touch-action:none;user-select:none;-webkit-user-select:none">' +
          '<img id="bgrOrigImg" src="' + origUrl + '" style="display:block;width:100%" draggable="false" alt="Original image">' +
          '<div id="bgrTopWrap" style="position:absolute;top:0;left:0;height:100%;width:50%;overflow:hidden;' + CHECKER + '">' +
            '<img id="bgrOutImg" src="' + outUrl + '" style="display:block" draggable="false" alt="Background removed">' +
          '</div>' +
          '<div id="bgrHandle" style="position:absolute;top:0;left:50%;width:2px;height:100%;background:var(--p1);box-shadow:0 0 10px rgba(34,211,238,.7);pointer-events:none">' +
            '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;background:var(--p1);display:flex;align-items:center;justify-content:center;color:#0b0f16;font-weight:700;font-size:13px">&#8596;</div>' +
          '</div>' +
          '<span style="position:absolute;top:8px;right:10px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.75);background:rgba(0,0,0,.45);padding:3px 8px;border-radius:100px;pointer-events:none">Original</span>' +
          '<span style="position:absolute;top:8px;left:10px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.75);background:rgba(0,0,0,.45);padding:3px 8px;border-radius:100px;pointer-events:none">Removed</span>' +
        '</div>' +
        '<p style="text-align:center;font-size:11px;color:var(--text-faint);margin-bottom:14px">Drag the divider to compare &middot; If the AI removed a logo or badge, use <strong>Touch up</strong> to paint it back.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<button class="btn btn-primary" id="bgrDl">Download PNG</button>' +
          '<button class="btn" id="bgrEdit" style="background:rgba(167,139,250,.15);color:#a78bfa">&#9998; Touch up</button>' +
          '<button class="btn" id="bgrAnother" style="background:rgba(255,255,255,.06)">Remove another</button>' +
        '</div>' +
        '<div id="bgrEditor" style="display:none;margin-top:16px">' +
          '<div style="display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:10px">' +
            '<div class="seg" role="group" aria-label="Brush mode">' +
              '<button id="bgrBrRestore" class="active" aria-pressed="true">Restore</button>' +
              '<button id="bgrBrErase" aria-pressed="false">Erase</button>' +
            '</div>' +
            '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600">Brush <input type="range" id="bgrBrSize" min="6" max="120" value="34" style="width:110px"> <span id="bgrBrSizeV" style="min-width:34px;font-variant-numeric:tabular-nums">34px</span></label>' +
            '<button class="btn btn-ghost" id="bgrUndo" style="padding:6px 14px;font-size:12.5px" disabled>&#8630; Undo</button>' +
          '</div>' +
          '<p style="text-align:center;font-size:11.5px;color:var(--text-faint);margin-bottom:10px"><strong>Restore</strong> paints original pixels back (logos, badges, cut-off hair). <strong>Erase</strong> removes leftover background.</p>' +
          '<div id="bgrEditStage" style="position:relative;max-width:560px;margin:0 auto 12px;border-radius:12px;overflow:hidden;border:1px solid var(--border-2);touch-action:none;cursor:crosshair;' + CHECKER + '"></div>' +
          '<div style="display:flex;gap:10px;justify-content:center">' +
            '<button class="btn btn-primary" id="bgrEditApply">Apply changes</button>' +
            '<button class="btn btn-ghost" id="bgrEditCancel">Cancel</button>' +
          '</div>' +
        '</div>';

      var cmp     = $('#bgrCmp',     res),
          topWrap = $('#bgrTopWrap', res),
          handle  = $('#bgrHandle',  res),
          outImg  = $('#bgrOutImg',  res),
          origImg = $('#bgrOrigImg', res);

      /* The overlay img must be sized to the CONTAINER's pixel width so
         the two layers align 1:1; re-sync on load and window resize. */
      function syncWidths() {
        if (!document.body.contains(cmp)) return;
        outImg.style.width = cmp.clientWidth + 'px';
      }
      origImg.onload = syncWidths;
      outImg.onload  = syncWidths;
      syncWidths();
      window.addEventListener('resize', syncWidths);

      function setSplit(clientX) {
        var rect = cmp.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        topWrap.style.width = (pct * 100) + '%';
        handle.style.left   = (pct * 100) + '%';
      }
      var dragging = false;
      cmp.addEventListener('pointerdown', function(e) { dragging = true; cmp.setPointerCapture(e.pointerId); setSplit(e.clientX); });
      cmp.addEventListener('pointermove', function(e) { if (dragging) setSplit(e.clientX); });
      cmp.addEventListener('pointerup',   function()  { dragging = false; });
      cmp.addEventListener('pointercancel', function() { dragging = false; });

      /* Background replacement: preview is instant (wrap background swaps
         behind the SAME transparent PNG — zero recompositing lag); the
         composited file is only built at download time, at full res. */
      var bgBtns = res.querySelectorAll('.bgr-bg');
      function paintBgBtns() {
        for (var i = 0; i < bgBtns.length; i++) {
          var active = (bgBtns[i].getAttribute('data-bg') || null) === bgChoice ||
                       (bgBtns[i].getAttribute('data-bg') === '' && bgChoice === null);
          bgBtns[i].style.background = active ? 'rgba(34,211,238,.15)' : 'rgba(255,255,255,.05)';
          bgBtns[i].style.color = active ? 'var(--p1)' : 'var(--text-dim)';
        }
      }
      function applyBgPreview() {
        topWrap.style.cssText = topWrap.style.cssText.replace(/background[^;]*;?/g, '');
        topWrap.style.position = 'absolute'; topWrap.style.top = '0'; topWrap.style.left = '0';
        topWrap.style.height = '100%'; topWrap.style.overflow = 'hidden';
        if (topWrap.style.width === '') topWrap.style.width = '50%';
        if (bgChoice === null) {
          topWrap.style.background = 'repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0/18px 18px';
        } else {
          topWrap.style.background = bgChoice;
        }
        paintBgBtns();
      }
      for (var b = 0; b < bgBtns.length; b++) {
        bgBtns[b].onclick = (function(btn) { return function() {
          var v = btn.getAttribute('data-bg');
          bgChoice = v === '' ? null : v;
          applyBgPreview();
        };})(bgBtns[b]);
      }
      $('#bgrBgPick', res).oninput = function() { bgChoice = this.value; applyBgPreview(); };
      paintBgBtns();

      /* ── TOUCH-UP: Restore / Erase brush ─────────────────────────
         The AI does salient-subject segmentation, so floating graphics
         (badges, stickers, watermark logos) can be misread as background.
         No automatic pass can safely fix that — solidifying every
         semi-transparent region would destroy real soft edges like hair.
         So, like Remove.bg's own editor, we give a brush:
           · Restore — paints ORIGINAL pixels back at full alpha
           · Erase   — clears leftover background to transparent
         Works with mouse and touch (pointer events). */
      var editor    = $('#bgrEditor',     res),
          editStage = $('#bgrEditStage',  res),
          brSizeEl  = $('#bgrBrSize',     res),
          brSizeV   = $('#bgrBrSizeV',    res),
          brRestore = $('#bgrBrRestore',  res),
          brErase   = $('#bgrBrErase',    res),
          undoBtn   = $('#bgrUndo',       res);
      var brushMode = 'restore', editCv = null, editCx = null, srcCv = null;
      var undoStack = [], UNDO_MAX = (canvas.width * canvas.height > 6000000) ? 1 : 4;

      brSizeEl.oninput = function() { brSizeV.textContent = brSizeEl.value + 'px'; };
      function paintBrushBtns() {
        brRestore.classList.toggle('active', brushMode === 'restore');
        brErase.classList.toggle('active', brushMode === 'erase');
        brRestore.setAttribute('aria-pressed', brushMode === 'restore' ? 'true' : 'false');
        brErase.setAttribute('aria-pressed', brushMode === 'erase' ? 'true' : 'false');
      }
      brRestore.onclick = function() { brushMode = 'restore'; paintBrushBtns(); };
      brErase.onclick   = function() { brushMode = 'erase';   paintBrushBtns(); };

      $('#bgrEdit', res).onclick = function() {
        function openEditor() {
          /* Full-res source canvas with the ORIGINAL image (restore source) */
          srcCv = document.createElement('canvas');
          srcCv.width = canvas.width; srcCv.height = canvas.height;
          srcCv.getContext('2d').drawImage(currentImg, 0, 0, canvas.width, canvas.height);
          /* Full-res edit canvas seeded with the current result */
          editCv = document.createElement('canvas');
          editCv.width = canvas.width; editCv.height = canvas.height;
          editCx = editCv.getContext('2d');
          editCx.drawImage(canvas, 0, 0);
          editCv.style.cssText = 'display:block;width:100%;height:auto';
          editStage.innerHTML = ''; editStage.appendChild(editCv);
          undoStack = []; undoBtn.disabled = true;
          cmp.style.display = 'none'; editor.style.display = '';
        }
        if (currentImg) openEditor();
        else ensureImgThen(openEditor);
      };

      function pushUndo() {
        try {
          undoStack.push(editCx.getImageData(0, 0, editCv.width, editCv.height));
          if (undoStack.length > UNDO_MAX) undoStack.shift();
          undoBtn.disabled = false;
        } catch (e) { /* memory-constrained device: stroke still works, just no undo */ }
      }
      undoBtn.onclick = function() {
        var snap = undoStack.pop();
        if (snap) editCx.putImageData(snap, 0, 0);
        undoBtn.disabled = !undoStack.length;
      };

      /* Map a pointer event to full-res canvas pixels */
      function toPx(e) {
        var r = editCv.getBoundingClientRect();
        return {
          x: (e.clientX - r.left) * (editCv.width  / r.width),
          y: (e.clientY - r.top)  * (editCv.height / r.height)
        };
      }
      function dab(x, y, rad) {
        if (brushMode === 'erase') {
          editCx.save();
          editCx.globalCompositeOperation = 'destination-out';
          editCx.beginPath(); editCx.arc(x, y, rad, 0, Math.PI * 2); editCx.fill();
          editCx.restore();
        } else {
          /* Restore: clip to the brush circle and stamp original pixels */
          editCx.save();
          editCx.beginPath(); editCx.arc(x, y, rad, 0, Math.PI * 2); editCx.clip();
          editCx.clearRect(x - rad, y - rad, rad * 2, rad * 2);
          editCx.drawImage(srcCv, 0, 0);
          editCx.restore();
        }
      }
      var painting = false, lastPt = null;
      editStage.addEventListener('pointerdown', function(e) {
        if (!editCv) return;
        e.preventDefault();
        editStage.setPointerCapture(e.pointerId);
        painting = true; pushUndo();
        var p = toPx(e), rad = parseInt(brSizeEl.value, 10) * (editCv.width / editCv.getBoundingClientRect().width) / 2;
        dab(p.x, p.y, rad); lastPt = p;
      });
      editStage.addEventListener('pointermove', function(e) {
        if (!painting || !editCv) return;
        var p = toPx(e), rad = parseInt(brSizeEl.value, 10) * (editCv.width / editCv.getBoundingClientRect().width) / 2;
        /* Interpolate between events so fast strokes don't leave gaps */
        if (lastPt) {
          var dx = p.x - lastPt.x, dy = p.y - lastPt.y, dist = Math.sqrt(dx * dx + dy * dy);
          var steps = Math.max(1, Math.ceil(dist / (rad * 0.4)));
          for (var s = 1; s <= steps; s++) dab(lastPt.x + dx * s / steps, lastPt.y + dy * s / steps, rad);
        } else dab(p.x, p.y, rad);
        lastPt = p;
      });
      function endStroke() { painting = false; lastPt = null; }
      editStage.addEventListener('pointerup', endStroke);
      editStage.addEventListener('pointercancel', endStroke);

      $('#bgrEditApply', res).onclick = function() {
        if (!editCv) return;
        /* Write edits back to the shared full-res canvas and rebuild the
           result stage (blob, compare slider, download) from it. */
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(editCv, 0, 0);
        editCv = srcCv = editCx = null; undoStack = [];
        window.removeEventListener('resize', syncWidths);
        finalizeResult(file);
      };
      $('#bgrEditCancel', res).onclick = function() {
        editCv = srcCv = editCx = null; undoStack = [];
        editor.style.display = 'none'; cmp.style.display = '';
      };

      $('#bgrDl', res).onclick = function() {
        if (bgChoice === null) { download(cutBlob, base + '-no-bg.png'); return; }
        /* Composite at full resolution on demand */
        var out = document.createElement('canvas');
        out.width = canvas.width; out.height = canvas.height;
        var octx = out.getContext('2d');
        octx.fillStyle = bgChoice;
        octx.fillRect(0, 0, out.width, out.height);
        octx.drawImage(canvas, 0, 0);
        out.toBlob(function(b2) { download(b2, base + '-bg.png'); }, 'image/png');
      };

      $('#bgrAnother', res).onclick = function() {
        currentImg = null; currentFile = null; autoTolSet = false;
        cutBlob = null; bgChoice = null;
        if (origUrl) { URL.revokeObjectURL(origUrl); origUrl = null; }
        if (outUrl)  { URL.revokeObjectURL(outUrl);  outUrl  = null; }
        res.innerHTML = ''; res.classList.remove('show');
        opts.style.display = 'none'; st.className = 'status';
        drop.style.display = ''; inp.value = '';
        window.removeEventListener('resize', syncWidths);
      };
    }, 'image/png');
  }
};

INIT['ocr-image-to-text'] = function(panel) {

  var CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.2/dist/tesseract.min.js';

  panel.innerHTML =
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">' +
      '<label for="ocrLang" style="font-size:13px;font-weight:600">Language:</label>' +
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
        '<label for="h2jFmt" style="font-size:13px;font-weight:600">Output:</label>' +
        '<select id="h2jFmt" style="background:var(--bg-2);color:var(--text);border:1px solid var(--border-2);border-radius:8px;padding:6px 10px;font-size:13px">' +
          '<option value="image/jpeg">JPG (smaller)</option>' +
          '<option value="image/png">PNG (lossless)</option>' +
        '</select>' +
      '</div>' +
      '<div id="h2jQwrap" style="display:flex;align-items:center;gap:8px">' +
        '<label for="h2jQ" style="font-size:13px;font-weight:600">Quality: <span id="h2jQv">90%</span></label>' +
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

  var cancelled = false;

  /* Fast path: some browsers (Safari, and Chrome/Edge on macOS/iOS) can decode
     HEIC natively. If they can, we skip the ~1.5 MB heic2any/libheif download
     entirely — instant and higher fidelity. Returns a canvas or null. */
  function nativeDecode(file) {
    if (!('createImageBitmap' in window)) return Promise.resolve(null);
    return createImageBitmap(file).then(function(bmp) {
      var c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      if (bmp.close) bmp.close();
      return c;
    }).catch(function() { return null; });
  }

  function convert(files) {
    var heicFiles = files.filter(function(f) {
      return /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type);
    });
    var toProcess = heicFiles.length ? heicFiles : files;
    if (!toProcess.length) { setStatus(st, 'No HEIC/HEIF files selected.', true); return; }

    cancelled = false;
    drop.style.display = 'none';
    res.innerHTML = ''; res.classList.add('show');

    var outFmt = fmt.value,
        q      = parseInt(qual.value, 10) / 100,
        ext    = (outFmt === 'image/jpeg') ? 'jpg' : 'png',
        done   = 0, ok = 0, fail = 0,
        libFn  = null, triedLib = false;

    /* Cancel control */
    var bar = document.createElement('div');
    bar.style.cssText = 'text-align:center;margin:8px 0';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function(){ cancelled = true; cancelBtn.disabled = true; };
    bar.appendChild(cancelBtn);
    res.parentNode.insertBefore(bar, res);

    function finish() {
      bar.remove();
      setStatus(st, 'Done — ' + ok + ' converted' + (fail ? ', ' + fail + ' failed' : '') + '.');
      if (ok === 0) drop.style.display = '';
    }

    function encodeCanvas(canvas, f) {
      return new Promise(function(resolve, reject){
        if (outFmt === 'image/jpeg') { var g = canvas.getContext('2d'); /* flatten alpha onto white for JPG */
          var flat = document.createElement('canvas'); flat.width = canvas.width; flat.height = canvas.height;
          var fx = flat.getContext('2d'); fx.fillStyle = '#fff'; fx.fillRect(0,0,flat.width,flat.height); fx.drawImage(canvas,0,0); canvas = flat;
        }
        canvas.toBlob(function(b){ b ? resolve(b) : reject(new Error('encode failed')); }, outFmt, q);
      });
    }

    function emit(blob, f) {
      var base = f.name.replace(/\.(heic|heif)$/i, '').replace(/\.[^.]+$/, '') || 'image';
      var url = URL.createObjectURL(blob);
      row(res, url, base + '.' + ext, fmtBytes(blob.size) + ' \u00B7 ' + ext.toUpperCase(), function(){ download(blob, base + '.' + ext); });
      ok++;
    }

    function ensureLib() {
      if (libFn) return Promise.resolve(libFn);
      if (triedLib) return Promise.reject(new Error('converter unavailable'));
      triedLib = true;
      setStatus(st, '\u23F3 Loading HEIC decoder (one-time)\u2026');
      return _loadScript(CDN, 'heic2any').then(function(lib){
        libFn = (typeof lib === 'function') ? lib : window.heic2any;
        if (typeof libFn !== 'function') throw new Error('decoder failed to load');
        return libFn;
      });
    }

    function next() {
      if (cancelled) { finish(); return; }
      if (done >= toProcess.length) { finish(); return; }
      var f = toProcess[done];
      setStatus(st, 'Converting ' + f.name + ' (' + (done + 1) + '/' + toProcess.length + ')');

      nativeDecode(f).then(function(canvas){
        if (canvas) return encodeCanvas(canvas, f).then(function(b){ emit(b, f); });
        /* Fall back to heic2any */
        return ensureLib().then(function(fn){
          return fn({ blob: f, toType: outFmt, quality: q }).then(function(result){
            var blob = Array.isArray(result) ? result[0] : result;
            if (!blob) throw new Error('empty result');
            emit(blob, f);
          });
        });
      }).catch(function(e){
        fail++;
        row(res, '', f.name, 'Could not convert \u2014 ' + (e && e.message || 'unsupported/corrupt HEIC'), function(){});
      }).then(function(){ done++; next(); });
    }
    next();
  }
};
