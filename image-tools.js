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

/* ===== AI Image Upscaler ============================================
   Provider-abstracted engine lives in /upscaler-engine.js and is loaded
   lazily on first run (code-splitting: zero payload for other pages).
   Browser AI is the default engine with an always-available high-quality
   resampling fallback; remote providers are pre-wired but off. The UI
   always states honestly which engine produced the result. */
INIT['ai-image-upscaler']=function(panel){
  var CHK='background:repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0/18px 18px;';
  var MAX_IN_PX=25000000;      /* 25MP input guard */
  var MAX_OUT_PX=64000000;     /* 64MP output guard (memory) */
  var u=dz(panel,{accept:'image/jpeg,image/png,image/webp,image/avif',formats:['JPG','PNG','WEBP','AVIF'],title:'Drop an image, click to browse, or paste (Ctrl+V)',sub:'Enlarge photos 2\u00d7 or 4\u00d7 with AI \u2014 processed on your device, nothing uploads.'});
  var srcCanvas=null,outCanvas=null,srcName='image',running=null,zoom=1;

  /* ── Controls ─────────────────────────────────────────────────── */
  u.controls.className='controls';
  u.controls.innerHTML=
    '<div class="seg" role="group" aria-label="Upscale factor">'+
      '<button id="upx2" class="active" aria-pressed="true">2\u00d7</button>'+
      '<button id="upx4" aria-pressed="false">4\u00d7</button>'+
      '<button id="upauto" aria-pressed="false">Auto</button>'+
    '</div>'+
    '<div class="ctrl"><label for="upfmt">Output</label><select id="upfmt" aria-label="Output format"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WEBP</option></select></div>'+
    '<div class="ctrl-spacer"></div>'+
    '<button class="btn btn-primary" id="uprun" disabled>Upscale</button>';
  var scaleMode='2';
  function paintSeg(){['upx2','upx4','upauto'].forEach(function(id){var b=$('#'+id,panel);var on=(id==='upx2'&&scaleMode==='2')||(id==='upx4'&&scaleMode==='4')||(id==='upauto'&&scaleMode==='auto');b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');});}
  $('#upx2',panel).onclick=function(){scaleMode='2';paintSeg();};
  $('#upx4',panel).onclick=function(){scaleMode='4';paintSeg();};
  $('#upauto',panel).onclick=function(){scaleMode='auto';paintSeg();};

  /* ── Input: drop / click / paste ──────────────────────────────── */
  function accept(f){
    if(!f)return;
    var okType=/^image\/(jpeg|png|webp|avif)$/.test(f.type)||/\.(jpe?g|png|webp|avif)$/i.test(f.name||'');
    if(!okType){setStatus(u.status,'That file type isn\u2019t supported \u2014 use JPG, PNG, WEBP or AVIF.',1);return;}
    if(f.size>80*1024*1024){setStatus(u.status,'File too large (over 80 MB).',1);return;}
    u.results.classList.add('show');
    u.results.innerHTML=
      '<div class="tp-progress-wrap" role="status" aria-live="polite">'+
        '<div class="tp-progress-stage" id="upUpStage">Uploading image\u2026</div>'+
        '<div class="tp-progress-track"><div class="tp-progress-fill" id="upUpBar" style="width:12%"></div></div>'+
        '<div class="tp-progress-pct" id="upUpPct">'+fmtBytes(f.size)+'</div>'+
      '</div>';
    readImg(f).then(function(img){
      var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
      if(!w||!h){setStatus(u.status,'This image appears to be corrupted or empty.',1);return;}
      if(w*h>MAX_IN_PX){setStatus(u.status,'Image is too large ('+Math.round(w*h/1e6)+' MP). Maximum input is 25 MP \u2014 resize it first with the Image Resizer.',1);return;}
      var bar=$('#upUpBar',panel),stage=$('#upUpStage',panel),pct=$('#upUpPct',panel);
      if(bar){bar.style.width='55%';stage.textContent='Reading image data\u2026';pct.textContent=w+'\u00d7'+h+' px';}
      srcCanvas=document.createElement('canvas');srcCanvas.width=w;srcCanvas.height=h;
      srcCanvas.getContext('2d').drawImage(img,0,0);
      /* A fully-transparent input has nothing to upscale. The most common
         way this happens in practice: re-uploading a failed (blank) download
         from an earlier run. Catch it here, say so plainly, don't proceed. */
      if(isBlank(srcCanvas)){
        srcCanvas=null;
        $('#uprun',panel).disabled=true;
        u.results.classList.remove('show');u.results.innerHTML='';
        setStatus(u.status,'This image is completely transparent (empty) \u2014 there\u2019s nothing to upscale. If this file was downloaded from this tool earlier, that was a failed result: please upload your original photo instead.',1);
        return;
      }
      srcName=(f.name||'image').replace(/\.[^.]+$/,'');
      $('#uprun',panel).disabled=false;
      /* Preview from a downsized copy — a full-res data URL of a 25MP
         image is tens of MB of string; the preview never needs that. */
      var pv=srcCanvas;
      if(w>900||h>900){var s=900/Math.max(w,h);pv=document.createElement('canvas');pv.width=Math.round(w*s);pv.height=Math.round(h*s);var px=pv.getContext('2d');px.imageSmoothingQuality='high';px.drawImage(srcCanvas,0,0,pv.width,pv.height);}
      if(bar){bar.style.width='100%';}
      var mp=(w*h/1e6).toFixed(1);
      /* No time estimate shown here anymore: the previous formula
         (~2s for this exact image) was off by roughly 135x against a
         real, confirmed run (270s, severe enough to trigger Chrome's
         own "Page Unresponsive" warning) — actual time depends heavily
         on which engine ends up running and real device performance,
         neither knowable in advance. A confidently wrong number is
         worse than no number; large-image handling is a live area of
         work, said plainly instead of guessed at. */
      var sizeNote=mp>8?' \u2014 large photos may take a while to process; you can Cancel at any time.':'';
      u.results.innerHTML='<p style="text-align:center;font-size:13px;color:var(--text-dim);margin:8px 0 4px">'+w+' \u00d7 '+h+' px \u00b7 '+mp+' MP \u00b7 '+fmtBytes(f.size)+'</p>'+
        '<p style="text-align:center;font-size:11px;color:var(--text-faint);margin:0 0 12px">Ready'+sizeNote+' \u2014 choose a factor and press <strong>Upscale</strong>.</p>'+
        '<div style="max-width:420px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid var(--border-2);'+CHK+'"><img src="'+pv.toDataURL('image/png')+'" style="display:block;width:100%" alt="Preview of uploaded image"></div>';
      setStatus(u.status,'');
    }).catch(function(){setStatus(u.status,'Could not read this image \u2014 the file may be corrupted, or your browser can\u2019t decode this format.',1);});
  }
  dropzone(u.drop,u.file,function(fs){accept([].slice.call(fs)[0]);});
  function onPaste(e){
    if(!document.body.contains(panel))return document.removeEventListener('paste',onPaste);
    var items=(e.clipboardData&&e.clipboardData.items)||[];
    for(var i=0;i<items.length;i++){if(items[i].kind==='file'){var f=items[i].getAsFile();if(f){accept(f);e.preventDefault();return;}}}
  }
  document.addEventListener('paste',onPaste);

  /* Preflight: can THIS browser actually hold a canvas of the target size?
     Safari caps canvas area around 16.7MP and silently renders blank beyond
     it (no exception) — the classic "checkerboard result" failure. Draw one
     red pixel at the far corner and read it back: if it doesn't survive,
     the size is unusable here. */
  function canvasSupports(w,h){
    try{
      var t=document.createElement('canvas');t.width=w;t.height=h;
      var x=t.getContext('2d');if(!x)return false;
      x.fillStyle='#f00';x.fillRect(w-1,h-1,1,1);
      var p=x.getImageData(w-1,h-1,1,1).data;
      t.width=1;t.height=1; /* release memory promptly */
      return p[0]>200&&p[3]>200;
    }catch(e){return false;}
  }
  /* Post-check: a non-blank source must never produce an all-transparent
     result. Sample the output downscaled to 8x8 — cheap at any size. */
  function isBlank(c){
    try{
      var t=document.createElement('canvas');t.width=8;t.height=8;
      var x=t.getContext('2d');x.drawImage(c,0,0,8,8);
      var d=x.getImageData(0,0,8,8).data;
      for(var i=3;i<d.length;i+=4)if(d[i]>0)return false;
      return true;
    }catch(e){return false;}
  }

  /* ── Run ──────────────────────────────────────────────────────── */
  $('#uprun',panel).onclick=function(){
    if(!srcCanvas||running)return;
    if(isBlank(srcCanvas)){setStatus(u.status,'This image is completely transparent \u2014 nothing to upscale. Please upload your original photo.',1);return;}
    var factor=scaleMode==='auto'?(Math.max(srcCanvas.width,srcCanvas.height)<1100?4:2):parseInt(scaleMode,10);
    var outW=srcCanvas.width*factor,outH=srcCanvas.height*factor;
    if(outW*outH>MAX_OUT_PX){
      setStatus(u.status,'Result would exceed 64 MP \u2014 choose 2\u00d7 for this image.',1);return;
    }
    /* Large targets: verify the browser can hold them BEFORE spending time */
    if(outW*outH>15000000&&!canvasSupports(outW,outH)){
      setStatus(u.status,'Your browser can\u2019t create a '+outW+'\u00d7'+outH+' px image ('+Math.round(outW*outH/1e6)+' MP) \u2014 this is a browser memory limit, common in Safari. Try 2\u00d7 instead.',1);return;
    }
    var signal={cancelled:false};running=signal;
    if(window.trackEvent)window.trackEvent('tool_process_started',{scale:factor+'x'});
    var _t0=performance.now();
    $('#uprun',panel).disabled=true;
    /* Step checklist: mapped to REAL progress ranges the engine actually
       reports (see upscaler-engine.js's onProgress calls), not a fixed
       fake timer — the step lights up when live progress enters its
       range, and is marked done once progress moves past it. */
    var STEPS=[
      {upto:0.05,label:'Analyzing image'},
      {upto:0.20,label:'Cleaning noise & artifacts'},
      {upto:0.55,label:'Reconstructing resolution'},
      {upto:0.75,label:'Recovering local detail'},
      {upto:0.98,label:'Enhancing edges'},
      {upto:1.00,label:'Finalizing'}
    ];
    u.results.innerHTML=
      '<div class="tp-progress-wrap" style="max-width:460px">'+
        '<div class="tp-progress-stage" id="upphase" role="status" aria-live="polite">Preparing\u2026</div>'+
        '<div class="tp-progress-track"><div class="tp-progress-fill" id="upbar"></div></div>'+
        '<div class="tp-progress-pct" id="uppct">0%</div>'+
        '<ul id="upsteps" style="list-style:none;padding:0;margin:14px 0 0;text-align:left;display:inline-block" aria-hidden="true">'+
          STEPS.map(function(s,i){return '<li id="upstep'+i+'" style="font-size:12px;color:var(--text-faint);padding:3px 0;transition:color .3s ease"><span style="display:inline-block;width:16px">\u25CB</span>'+s.label+'</li>';}).join('')+
        '</ul>'+
        '<button class="btn btn-ghost" id="upcancel" style="margin-top:14px">Cancel</button>'+
      '</div>';
    $('#upcancel',panel).onclick=function(){signal.cancelled=true;};
    var phase=$('#upphase',panel),bar=$('#upbar',panel),pctEl=$('#uppct',panel);
    var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function paintSteps(p){
      STEPS.forEach(function(s,i){
        var el=$('#upstep'+i,panel);if(!el)return;
        var mark=el.querySelector('span');
        if(p>=s.upto){el.style.color='var(--p1,#22d3ee)';if(mark)mark.textContent='\u2713';}
        else if(i===0||p>=STEPS[i-1].upto){el.style.color='var(--text)';if(mark)mark.textContent='\u25CF';}
        else{el.style.color='var(--text-faint)';if(mark)mark.textContent='\u25CB';}
      });
    }

    /* Version-pinned URL, not just a fallback retry: the previous version
       only added a cache-busting query string AFTER a failed load — but a
       stale CDN/browser cache serving old-but-valid content returns a
       normal 200, which _loadScript treats as success, so that retry path
       never fires. A version in the URL itself means the URL changes
       whenever the engine changes, so a cache can't serve last version's
       file under this version's request — it's a genuinely different URL.
       Bump ENGINE_V here whenever upscaler-engine.js's own version bumps. */
    var ENGINE_V='4.1';
    _loadScript('/upscaler-engine.js?v='+ENGINE_V,'UpscaleEngine').catch(function(){
      /* Still-rare fallback: a timestamp buster for the case even the
         versioned URL is somehow blocked (e.g. an overzealous proxy
         rule), not the primary defense anymore. */
      return _loadScript('/upscaler-engine.js?v='+ENGINE_V+'&r='+Date.now(),'UpscaleEngine');
    }).then(function(){
      return window.UpscaleEngine.run({
        canvas:srcCanvas,scale:factor,signal:signal,
        onEngine:function(label){phase.textContent=label;},
        onProgress:function(p,msg){
          var pct=Math.max(2,Math.round(p*100));
          bar.style.width=pct+'%';pctEl.textContent=pct+'%';
          if(msg)phase.textContent=msg;
          if(!reduceMotion)paintSteps(p);
        }
      });
    }).then(function(res){
      running=null;
      if(signal.cancelled){reset(false);setStatus(u.status,'Cancelled.');return;}
      /* Never present a silently-blank result: if the source had pixels but
         the output is fully transparent, the browser dropped the canvas
         (memory/area limit) somewhere mid-pipeline. Say so honestly. */
      if(isBlank(res.canvas)&&!isBlank(srcCanvas)){
        reset(false);
        setStatus(u.status,'The result came back empty \u2014 your browser ran out of canvas memory at this size. Try 2\u00d7, or a smaller source image.',1);
        return;
      }
      outCanvas=res.canvas;
      var elapsed=Math.round((performance.now()-_t0)/100)/10;
      showResult(res.engine,factor,elapsed);
      if(window.trackEvent){
        window.trackEvent('tool_process_completed',{scale:factor+'x',engine:res.engine,processing_time:elapsed});
        window.trackEvent('ai_upscale_completed',{scale:factor+'x',engine:res.engine,processing_time:elapsed});
      }
    }).catch(function(e){
      running=null;
      if(e&&e.message==='cancelled'){reset(false);setStatus(u.status,'Cancelled.');return;}
      reset(false);
      var msg;
      if(e&&/Failed to load|Timeout/.test(e.message||'')){
        msg='The upscaler couldn\u2019t load just now \u2014 please refresh the page and try again. If this keeps happening, the site may be updating.';
      }else if(e&&/memory|allocation/i.test(e.message||'')){
        msg='Ran out of memory \u2014 try 2\u00d7, or a smaller image.';
      }else{
        msg='Processing failed: '+(e&&e.message||'unknown error');
      }
      setStatus(u.status,msg,1);
    });
  };

  /* ── Result: before/after slider + zoom + downloads ───────────── */
  var _urls=[],_resizeH=null;
  function freeUrls(){_urls.forEach(function(u){try{URL.revokeObjectURL(u);}catch(e){}});_urls=[];}
  var curCompareMode='split'; /* remembered for the rest of this session */
  function showResult(engineLabel,factor,elapsedSec){
    /* Preview at display resolution: encoding + decoding a 25MP+ PNG just
       to LOOK at it costs seconds of frozen UI. The compare view gets
       scaled-down copies (still far beyond screen size at Fit); the
       download always uses the untouched full-resolution outCanvas.

       BUG THIS REPLACES: previewOf() used to be called independently on
       each image — outCanvas capped to a 2400px edge, srcCanvas left at
       its full original size. For a 2x result those aren't independent:
       capping the (larger) after-image on its own can leave it with
       FEWER raw pixels than the uncapped original, so when both are
       stretched to the same on-screen width for comparison, the
       "enhanced" image needed MORE upscaling than the original —
       backwards, and enough on its own to make a real improvement look
       like nothing happened regardless of zoom controls or the
       algorithm. Fix: compute ONE scale factor from the larger (after)
       image, apply it to BOTH, so the true 2x/4x relationship survives
       into the preview pair, not just the full-resolution download. */
    setStatus(u.status,'Preparing preview\u2026');
    var MAX_PREVIEW_EDGE=2400;
    var previewScale=Math.min(1,MAX_PREVIEW_EDGE/Math.max(outCanvas.width,outCanvas.height));
    function scaledCopy(c,s){
      if(s>=1)return c;
      var p=document.createElement('canvas');
      p.width=Math.max(1,Math.round(c.width*s));p.height=Math.max(1,Math.round(c.height*s));
      var px=p.getContext('2d');px.imageSmoothingQuality='high';
      px.drawImage(c,0,0,p.width,p.height);
      return p;
    }
    var outPrev=scaledCopy(outCanvas,previewScale);
    var befPrev=scaledCopy(srcCanvas,previewScale);
    var prevCapped=outPrev!==outCanvas;
    /* Real badges: derived from what actually ran (engine id + the size
       relationship), not a fixed decorative list — a neural pass and a
       classical pass earn different badges. */
    var isNeural=/ESRGAN|neural/i.test(engineLabel);
    var badges=isNeural
      ? ['AI Detail Recovery','Sharper Details','Improved Edges']
      : ['Cleaner Noise','Better Texture','Sharper Details','Improved Edges'];
    /* Object URLs, never data URLs: a 64MP PNG data URL is a 100MB+
       string held in the DOM — toBlob keeps the pixels in native
       memory and the DOM only holds a short blob: reference. */
    Promise.all([
      new Promise(function(r){befPrev.toBlob(function(b){r(b);},'image/png');}),
      new Promise(function(r){outPrev.toBlob(function(b){r(b);},'image/png');})
    ]).then(function(blobs){
      if(!blobs[0]||!blobs[1]){setStatus(u.status,'Preview failed \u2014 you can still download the result.',1);}
      freeUrls();
      var beforeUrl=blobs[0]?URL.createObjectURL(blobs[0]):'';
      var afterUrl=blobs[1]?URL.createObjectURL(blobs[1]):'';
      _urls.push(beforeUrl,afterUrl);
      zoom=1;
      var estBytes=Math.round(outCanvas.width*outCanvas.height*($('#upfmt',panel).value==='image/png'?2.2:0.35));
      u.results.innerHTML=
      /* Enhancement summary card */
      '<div style="max-width:620px;margin:0 auto 12px;padding:14px 16px;border:1px solid var(--border-2);border-radius:14px;background:var(--bg-2)">'+
        '<div style="text-align:center;margin-bottom:10px"><span style="display:inline-block;font-size:11.5px;font-weight:700;padding:5px 12px;border-radius:99px;'+(isNeural?'background:rgba(34,211,238,.14);color:var(--p1);border:1px solid rgba(34,211,238,.3)':'background:rgba(167,139,250,.14);color:#a78bfa;border:1px solid rgba(167,139,250,.3)')+'">'+(isNeural?'\u26A1 Neural AI Engine':'\u2699 '+engineLabel+' (non-neural)')+'</span></div>'+
        '<div style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;text-align:center;margin-bottom:10px">'+
          '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--text-faint)">Original</div><div style="font-size:14px;font-weight:700">'+srcCanvas.width+'\u00d7'+srcCanvas.height+'</div></div>'+
          '<div style="color:var(--p1);font-size:18px" aria-hidden="true">\u2192</div>'+
          '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--p1)">AI Enhanced</div><div style="font-size:14px;font-weight:700">'+outCanvas.width+'\u00d7'+outCanvas.height+'</div></div>'+
          '<div style="padding:4px 10px;border-radius:99px;background:rgba(34,211,238,.12);color:var(--p1);font-size:12px;font-weight:700">'+factor+'\u00d7 Resolution</div>'+
        '</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:10px" id="upBadges">'+
          badges.map(function(b,i){return '<span class="tp-badge-fade" style="animation-delay:'+(i*80)+'ms;font-size:11px;color:var(--p1);background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.22);border-radius:99px;padding:4px 10px">\u2713 '+b+'</span>';}).join('')+
        '</div>'+
        '<div style="font-size:11px;color:var(--text-faint);text-align:center;border-top:1px solid var(--border);padding-top:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:4px 10px">'+
          '<div><b style="color:var(--text-dim)">Engine</b><br>'+engineLabel+'</div>'+
          (elapsedSec!=null?'<div><b style="color:var(--text-dim)">Processing time</b><br>'+elapsedSec+'s</div>':'')+
          '<div><b style="color:var(--text-dim)">Version</b><br>v'+(window.UpscaleEngine&&window.UpscaleEngine.version||'?')+'</div>'+
        '</div>'+
      '</div>'+
      (prevCapped?'<p style="text-align:center;font-size:11px;color:var(--text-faint);margin-bottom:10px">Preview shown at reduced resolution \u2014 the download contains the full '+outCanvas.width+'\u00d7'+outCanvas.height+' px detail.</p>':'')+
      '<div style="display:flex;justify-content:center;margin-bottom:10px"><div class="seg" role="group" aria-label="Comparison mode">'+
        '<button data-m="split" aria-pressed="false">Split</button>'+
        '<button data-m="side" aria-pressed="false">Side by side</button>'+
      '</div></div>'+
      '<div id="upViewportArea"></div>'+
      '<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">'+
        '<button class="btn btn-primary" id="updl">Download '+outCanvas.width+'\u00d7'+outCanvas.height+' '+$('#upfmt',panel).value.split('/')[1].toUpperCase()+' (~'+fmtBytes(estBytes)+')</button>'+
        '<button class="btn btn-ghost" id="upreset">Start over</button>'+
      '</div>'+
      '<p style="text-align:center;font-size:11px;color:var(--text-faint);margin:14px 0 4px">\u2728 Continue editing</p>'+
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
        '<a class="btn btn-ghost tp-continue-edit" style="font-size:12px;padding:5px 11px" href="/ai-photo-enhancer">AI Photo Enhancer</a>'+
        '<a class="btn btn-ghost tp-continue-edit" style="font-size:12px;padding:5px 11px" href="/background-remover">Background Remover</a>'+
        '<a class="btn btn-ghost tp-continue-edit" style="font-size:12px;padding:5px 11px" href="/ai-object-remover">AI Object Remover</a>'+
        '<a class="btn btn-ghost tp-continue-edit" style="font-size:12px;padding:5px 11px" href="/image-compressor">Image Compressor</a>'+
      '</div>';

      var modeBtns=$$('.seg[aria-label="Comparison mode"] button',panel);
      function paintMode(){modeBtns.forEach(function(b){var on=b.dataset.m===curCompareMode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}
      modeBtns.forEach(function(b){b.onclick=function(){
        curCompareMode=b.dataset.m;paintMode();renderViewport();
        if(window.trackEvent)window.trackEvent('comparison_mode_used',{mode:curCompareMode,tool:'ai-image-upscaler'});
      };});
      paintMode();

      function renderViewport(){
        var area=$('#upViewportArea',panel);
        var ZOOM_STOPS=[{k:'fit',label:'Fit'},{k:'100',label:'100%'},{k:'200',label:'200%'},{k:'400',label:'400%'}];
        var zoomCtrl='<div style="max-width:620px;margin:10px auto 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">'+
            '<div class="seg" role="group" aria-label="Zoom level">'+ZOOM_STOPS.map(function(z){return '<button data-z="'+z.k+'" aria-pressed="'+(z.k==='100')+'">'+z.label+'</button>';}).join('')+'<button data-z="reset" aria-label="Reset zoom">Reset</button></div>'+
          '</div>'+
          '<p style="text-align:center;font-size:11px;color:var(--text-faint);max-width:480px;margin:8px auto 0">At <b>Fit</b>, both images are shown scaled to the same small size, so extra resolution isn\u2019t visible \u2014 that\u2019s true of any upscaler, not just this one. Use <b>100%\u2013400%</b> (or Ctrl+scroll) to see real pixel detail.</p>';
        if(curCompareMode==='side'){
          area.innerHTML=
            '<div id="upzoomwrap" style="max-width:900px;margin:0 auto;max-height:66vh;overflow:auto;border:1px solid var(--border-2);border-radius:14px;'+CHK+'" tabindex="0" aria-label="Side by side comparison">'+
              '<div id="upcmp" style="display:flex;gap:2px;width:100%;align-items:flex-start;transform-origin:top left">'+
                '<div id="upSidePanelBef" style="flex:1;position:relative"><img src="'+beforeUrl+'" style="display:block;width:100%" alt="Original" draggable="false"><span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:99px">ORIGINAL</span></div>'+
                '<div id="upSidePanelAft" style="flex:1;position:relative"><img src="'+afterUrl+'" style="display:block;width:100%" alt="AI upscaled" draggable="false"><span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">'+factor+'\u00d7 UPSCALED</span></div>'+
              '</div>'+
            '</div>'+zoomCtrl+
            '<p style="text-align:center;font-size:11px;color:var(--text-faint);max-width:480px;margin:6px auto 0" id="upSideHint">At 100%\u2013400%, the AI panel is shown genuinely wider than Original \u2014 it has more real pixels, not just a bigger frame.</p>';
          wireZoom(ZOOM_STOPS);return;
        }
        area.innerHTML=
          '<div id="upzoomwrap" style="max-width:620px;margin:0 auto;max-height:66vh;overflow:auto;border:1px solid var(--border-2);border-radius:14px;'+CHK+'" tabindex="0" aria-label="Before and after slider comparison">'+
            '<div id="upcmp" style="position:relative;width:100%;transform-origin:top left">'+
              '<img src="'+afterUrl+'" style="display:block;width:100%" alt="AI upscaled result" draggable="false">'+
              '<div id="upbefwrap" style="position:absolute;top:0;left:0;height:100%;width:50%;overflow:hidden">'+
                '<img id="upbef" src="'+beforeUrl+'" style="display:block;height:100%;image-rendering:pixelated" alt="Original for comparison" draggable="false">'+
              '</div>'+
              '<div id="uphandle" style="position:absolute;top:0;left:50%;width:2px;height:100%;background:#22d3ee;box-shadow:0 0 8px rgba(34,211,238,.8);transition:box-shadow .2s ease"></div>'+
              '<span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;letter-spacing:.5px;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:99px">ORIGINAL</span>'+
              '<span style="position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;letter-spacing:.5px;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">'+factor+'\u00d7 UPSCALED</span>'+
            '</div>'+
          '</div>'+
          '<div style="max-width:620px;margin:10px auto 0"><input type="range" id="upslide" min="0" max="100" value="50" style="width:100%" aria-label="Before / after comparison position"></div>'+
          zoomCtrl;
        var cmp=$('#upcmp',panel),befw=$('#upbefwrap',panel),bef=$('#upbef',panel),hand=$('#uphandle',panel);
        function syncBef(){bef.style.width=cmp.clientWidth+'px';}
        syncBef();
        if(_resizeH)window.removeEventListener('resize',_resizeH);
        _resizeH=syncBef;window.addEventListener('resize',_resizeH);
        var slide=$('#upslide',panel);
        /* Live difference highlight: a subtle glow on the divider while
           actively dragging — draws the eye to the comparison line
           itself without exaggerating or faking a pixel-diff overlay. */
        slide.oninput=function(){befw.style.width=this.value+'%';hand.style.left=this.value+'%';};
        slide.addEventListener('pointerdown',function(){hand.style.boxShadow='0 0 16px 2px rgba(34,211,238,.95)';});
        slide.addEventListener('pointerup',function(){hand.style.boxShadow='0 0 8px rgba(34,211,238,.8)';});
        wireZoom(ZOOM_STOPS);
      }
      function wireZoom(ZOOM_STOPS){
        var cmp=$('#upcmp',panel),wrap=$('#upzoomwrap',panel);
        if(!cmp||!wrap)return;
        var isSide=curCompareMode==='side';
        var befPanel=isSide?$('#upSidePanelBef',panel):null;
        var aftPanel=isSide?$('#upSidePanelAft',panel):null;
        /* Zoom is an ABSOLUTE scale against the real output pixel width,
           not a percentage of the ~620px display container — that was
           the original bug: "Fit" and "100%" used to compute to the
           exact same value. A SECOND, separate bug lived only in
           side-by-side mode: both panels used flex:1 (equal share)
           unconditionally, so zooming just made both panels bigger
           TOGETHER while staying equal width to each other at every
           zoom level — meaning side-by-side could never show that the
           AI panel has genuinely more pixels, no matter how the
           underlying algorithm performed. Fix: away from "Fit", the two
           panels get real, DIFFERENT pixel widths (befPrev.width*zoom
           vs outPrev.width*zoom) — the AI panel becomes visibly wider,
           which is an honest, immediate signal of "more real detail",
           not just a bigger frame around the same information. Fit
           keeps the original equal-flex layout, which is the right
           default for a quick overview. */
        function setZoom(z,stopKey){
          zoom=Math.max(.25,Math.min(4,z));
          if(isSide){
            if(stopKey==='fit'){
              cmp.style.width='100%';
              befPanel.style.cssText='flex:1;position:relative';
              aftPanel.style.cssText='flex:1;position:relative';
            }else{
              cmp.style.width='auto';
              befPanel.style.cssText='flex:none;width:'+Math.round(befPrev.width*zoom)+'px;position:relative';
              aftPanel.style.cssText='flex:none;width:'+Math.round(outPrev.width*zoom)+'px;position:relative';
            }
          }else{
            /* outPrev, not outCanvas: the image actually shown is the
               (now correctly, consistently) scaled preview — sizing
               zoom math against the true full-resolution canvas that
               isn't what's on screen would stretch the preview bitmap
               via CSS to fake a size it doesn't have, softening exactly
               the detail zoom is supposed to reveal. */
            cmp.style.width=Math.round(outPrev.width*zoom)+'px';
            var bef=$('#upbef',panel);if(bef)bef.style.width=cmp.clientWidth+'px';
          }
          $$('.seg[aria-label="Zoom level"] button[data-z]',panel).forEach(function(b){if(b.dataset.z!=='reset')b.setAttribute('aria-pressed',String(b.dataset.z===stopKey));});
          if(window.trackEvent)window.trackEvent('zoom_usage',{zoom:Math.round(zoom*100)+'%',mode:curCompareMode,tool:'ai-image-upscaler'});
        }
        function fitZoom(){
          if(isSide)return 1; /* 'fit' is a distinct equal-flex layout in side mode, not a computed scale */
          return Math.min(1,wrap.clientWidth/outPrev.width);
        }
        $$('.seg[aria-label="Zoom level"] button',panel).forEach(function(b){
          b.onclick=function(){
            if(b.dataset.z==='reset'){setZoom(1,'100');return;}
            if(b.dataset.z==='fit'){setZoom(fitZoom(),'fit');return;}
            var mul={'100':1,'200':2,'400':4}[b.dataset.z]||1;
            setZoom(mul,b.dataset.z);
          };
        });
        /* Both images zoom together by construction — they're one DOM
           subtree (#upcmp) being scaled as a unit in split mode, and two
           siblings inside the same scaled flex row in side-by-side mode,
           so panning (the shared scroll container) and zoom are
           inherently synchronized, never two separate transforms to
           keep in sync by hand. */
        wrap.addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom*(e.deltaY<0?1.15:1/1.15),'');}},{passive:false});
        /* Default to real 100% (actual output pixels), not Fit — at Fit,
           any upscaler looks like it did nothing, because the extra
           resolution is scaled back out to match the display container
           (in split mode) or an equal-width flex column (in side mode).
           Showing true pixels/true relative sizing by default is what
           actually answers "did this improve anything?" without an
           extra click first. Centered via rAF (after layout settles)
           rather than left at the top-left corner, which for a typical
           photo is background, not the subject. */
        setZoom(1,'100');
        requestAnimationFrame(function(){
          wrap.scrollLeft=Math.max(0,(cmp.scrollWidth-wrap.clientWidth)/2);
          wrap.scrollTop=Math.max(0,(cmp.scrollHeight-wrap.clientHeight)/2);
        });
      }
      renderViewport();
      $('#updl',panel).onclick=function(){
        if(window.trackEvent)window.trackEvent('download_clicked',{scale:factor+'x',engine:engineLabel});
        var fmt=$('#upfmt',panel).value,ext=fmt==='image/png'?'png':fmt==='image/webp'?'webp':'jpg';
        var c=outCanvas;
        if(fmt==='image/jpeg'){var f2=document.createElement('canvas');f2.width=c.width;f2.height=c.height;var fx=f2.getContext('2d');fx.fillStyle='#fff';fx.fillRect(0,0,f2.width,f2.height);fx.drawImage(c,0,0);c=f2;}
        c.toBlob(function(b){
          if(!b){setStatus(u.status,'Export failed \u2014 try PNG.',1);return;}
          var nm=srcName+'-upscaled-'+factor+'x.'+ext;
          download(b,nm);
        },fmt,fmt==='image/png'?undefined:.92);
      };
      $('#upreset',panel).onclick=function(){reset(true);};
      /* Re-enable so the same image can be re-run at a different factor */
      $('#uprun',panel).disabled=false;
      setStatus(u.status,'Done \u2014 drag the slider to compare, Ctrl+scroll to zoom.');
    });
  }
  function reset(full){
    if(running)running.cancelled=true;running=null;
    freeUrls();
    if(_resizeH){window.removeEventListener('resize',_resizeH);_resizeH=null;}
    outCanvas=null;$('#uprun',panel).disabled=!srcCanvas;
    if(full){srcCanvas=null;$('#uprun',panel).disabled=true;u.results.innerHTML='';u.results.classList.remove('show');u.drop.style.display='';}
    else{u.results.innerHTML='';}
  }
};


/* ═══════════════ AI PHOTO ENHANCER ═══════════════════════════════════
   Auto-analysis + full correction pipeline via /enhancer-engine.js
   (provider-abstracted; loaded lazily on first Enhance). Live preview
   runs the pipeline on a ≤1200px proxy for instant slider feedback;
   Download re-runs the same settings on the untouched full-res canvas. */
INIT['ai-photo-enhancer']=function(panel){
  var SLIDERS=[
    ['sharpness','Sharpness',0,100],['noise','Noise Reduction',0,100],
    ['brightness','Brightness',-100,100],['contrast','Contrast',-100,100],
    ['highlights','Highlights',-100,100],['shadows','Shadows',-100,100],
    ['whites','Whites',-100,100],['blacks','Blacks',-100,100],
    ['temperature','Temperature',-100,100],['tint','Tint',-100,100],
    ['vibrance','Vibrance',-100,100],['saturation','Saturation',-100,100],
    ['clarity','Clarity',0,100],['texture','Texture',0,100]
  ];
  var PRESETS={
    auto:null, /* filled from analysis */
    portrait:{noise:12,vibrance:14,sharpness:26,clarity:14,shadows:12,skinSmooth:22},
    landscape:{clarity:30,vibrance:30,sharpness:32,contrast:16},
    night:{shadows:35,noise:26,brightness:15,temperature:-5,sharpness:18,clarity:10},
    document:{contrast:35,clarity:25,sharpness:50,noise:5},
    product:{sharpness:40,clarity:26,contrast:16,vibrance:12,noise:10},
    oldphoto:{contrast:26,vibrance:24,saturation:10,noise:32,temperature:6,sharpness:24},
    anime:{saturation:26,sharpness:36,noise:10,contrast:12,clarity:14},
    custom:{}
  };
  var MAX_INPUT_PX=25000000, PROXY_EDGE=1200;
  var srcCanvas=null,proxySrc=null,proxyOut=null,fullOut=null,srcName='image';
  var settings={},analysis=null,running=null,_urls=[],liveTimer=null;

  var u=dz(panel,{accept:'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif',multiple:false,
    formats:['JPG','PNG','WEBP','AVIF'],
    title:'Drop a photo, click to browse, or paste (Ctrl+V)',
    sub:'Auto-fix exposure, color, noise and sharpness \u2014 processed on your device, nothing uploads.'});

  u.controls.className='controls';
  u.controls.innerHTML=
    '<div class="ctrl"><label>Preset</label><div class="seg" id="enPresets" role="group" aria-label="Enhancement preset" style="flex-wrap:wrap">'+
      '<button data-p="auto" class="active" aria-pressed="true">Auto</button>'+
      '<button data-p="portrait" aria-pressed="false">Portrait</button>'+
      '<button data-p="landscape" aria-pressed="false">Landscape</button>'+
      '<button data-p="night" aria-pressed="false">Night</button>'+
      '<button data-p="document" aria-pressed="false">Document</button>'+
      '<button data-p="product" aria-pressed="false">Product</button>'+
      '<button data-p="oldphoto" aria-pressed="false">Old Photo</button>'+
      '<button data-p="anime" aria-pressed="false">Anime</button>'+
      '<button data-p="custom" aria-pressed="false">Custom</button>'+
    '</div></div>'+
    '<div class="ctrl"><label>Strength</label><div class="seg" id="enStrength" role="group" aria-label="Enhancement strength">'+
      '<button data-s="subtle" aria-pressed="false">Subtle</button>'+
      '<button data-s="balanced" class="active" aria-pressed="true">Balanced</button>'+
      '<button data-s="strong" aria-pressed="false">Strong</button>'+
      '<button data-s="maximum" aria-pressed="false">Maximum</button>'+
    '</div></div>'+
    '<div class="ctrl"><label for="enFmt">Output</label><select id="enFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WEBP</option></select></div>'+
    '<div class="ctrl-spacer"></div>'+
    '<button class="btn btn-primary" id="enRun" disabled>Enhance</button>';
  var curStrength='balanced';
  $('#enStrength',panel).addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    curStrength=b.dataset.s;
    $$('#enStrength button',panel).forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
    schedulePreview();
  });

  /* Collapsible slider drawer */
  var drawer=document.createElement('div');
  drawer.id='enDrawer';
  drawer.style.cssText='display:none;margin-top:12px;padding:14px;border:1px solid var(--border-2);border-radius:12px;background:var(--bg-2)';
  var grid='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px 18px">';
  SLIDERS.forEach(function(sl){
    grid+='<label style="display:block;font-size:12px;font-weight:600;color:var(--text-dim)">'+sl[1]+
      ' <span class="val" id="enV_'+sl[0]+'" style="float:right;font-variant-numeric:tabular-nums">0</span>'+
      '<input type="range" id="enS_'+sl[0]+'" min="'+sl[2]+'" max="'+sl[3]+'" value="0" style="width:100%" aria-label="'+sl[1]+'"></label>';
  });
  drawer.innerHTML=grid+'</div><p style="font-size:11px;color:var(--text-faint);margin:10px 0 0">Adjusting any slider switches to the Custom preset. Changes preview live.</p>';
  u.controls.parentNode.insertBefore(drawer,u.controls.nextSibling);
  var toggle=document.createElement('button');
  toggle.className='btn btn-ghost';toggle.id='enToggle';
  toggle.style.cssText='margin-top:8px;font-size:12.5px;padding:6px 14px';
  toggle.textContent='\u2699 Fine-tune sliders';
  toggle.setAttribute('aria-expanded','false');
  toggle.onclick=function(){var open=drawer.style.display!=='none';drawer.style.display=open?'none':'';toggle.setAttribute('aria-expanded',String(!open));};
  u.controls.parentNode.insertBefore(toggle,drawer);

  function readSliders(){var s={};SLIDERS.forEach(function(sl){var v=parseInt($('#enS_'+sl[0],panel).value,10);if(v)s[sl[0]]=v;});return s;}
  function writeSliders(s){SLIDERS.forEach(function(sl){var v=(s&&s[sl[0]])||0;$('#enS_'+sl[0],panel).value=v;$('#enV_'+sl[0],panel).textContent=v;});}
  function paintPresets(active){$$('#enPresets button',panel).forEach(function(b){var on=b.dataset.p===active;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}

  var curPreset='auto';
  $('#enPresets',panel).addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    curPreset=b.dataset.p;paintPresets(curPreset);
    if(window.trackEvent)window.trackEvent('preset_selected',{preset:curPreset});
    settings=curPreset==='auto'?(analysis?Object.assign({},analysis.settings):{}):Object.assign({},PRESETS[curPreset]||{});
    writeSliders(settings);schedulePreview();
  });
  SLIDERS.forEach(function(sl){
    $('#enS_'+sl[0],panel).addEventListener('input',function(){
      $('#enV_'+sl[0],panel).textContent=this.value;
      if(curPreset!=='custom'){curPreset='custom';paintPresets('custom');}
      settings=readSliders();schedulePreview();
    });
  });

  function isBlank(c){try{var t=document.createElement('canvas');t.width=8;t.height=8;var x=t.getContext('2d');x.drawImage(c,0,0,8,8);var d2=x.getImageData(0,0,8,8).data;for(var i=3;i<d2.length;i+=4)if(d2[i]>0)return false;return true;}catch(e){return false;}}
  function freeUrls(){_urls.forEach(function(uu){try{URL.revokeObjectURL(uu);}catch(e){}});_urls=[];}

  function accept(f){
    if(!f)return;
    if(!/^image\//.test(f.type||'')&&!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(f.name||'')){setStatus(u.status,'That doesn\u2019t look like an image \u2014 JPG, PNG, WEBP or AVIF please.',1);return;}
    if(f.size>80*1024*1024){setStatus(u.status,'File is over 80 MB \u2014 too large for browser processing.',1);return;}
    setStatus(u.status,'Reading image\u2026');
    readImg(f).then(function(img){
      var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
      if(!w||!h)throw new Error('could not decode');
      if(w*h>MAX_INPUT_PX){setStatus(u.status,'Image is '+Math.round(w*h/1e6)+' MP \u2014 the maximum is 25 MP. Resize it first with the Image Resizer.',1);return;}
      srcCanvas=document.createElement('canvas');srcCanvas.width=w;srcCanvas.height=h;
      srcCanvas.getContext('2d').drawImage(img,0,0);
      if(isBlank(srcCanvas)){srcCanvas=null;$('#enRun',panel).disabled=true;setStatus(u.status,'This image is completely transparent (empty) \u2014 nothing to enhance. Please upload your original photo.',1);return;}
      /* proxy for live preview */
      var s=Math.min(1,PROXY_EDGE/Math.max(w,h));
      proxySrc=document.createElement('canvas');
      proxySrc.width=Math.max(1,Math.round(w*s));proxySrc.height=Math.max(1,Math.round(h*s));
      var px=proxySrc.getContext('2d');px.imageSmoothingQuality='high';px.drawImage(srcCanvas,0,0,proxySrc.width,proxySrc.height);
      srcName=(f.name||'photo').replace(/\.[^.]+$/,'');
      fullOut=null;
      /* metadata + analysis */
      setStatus(u.status,'Analyzing image\u2026');
      loadEngine().then(function(){
        analysis=window.EnhanceEngine.analyze(srcCanvas);
        settings=Object.assign({},analysis.settings);
        curPreset='auto';paintPresets('auto');writeSliders(settings);
        $('#enRun',panel).disabled=false;
        u.results.classList.add('show');
        u.results.innerHTML='<p style="text-align:center;font-size:13px;color:var(--text-dim);margin:8px 0 4px">'+w+' \u00d7 '+h+' px \u00b7 '+fmtBytes(f.size)+' \u00b7 '+(f.type||'image')+'</p>'+
          '<p style="text-align:center;font-size:12.5px;margin:0 0 10px"><span style="color:var(--p1,#22d3ee)">Detected:</span> '+analysis.findings.join(' \u00b7 ')+'</p>';
        setStatus(u.status,'Ready \u2014 press Enhance, or fine-tune first.');
        if(window.trackEvent)window.trackEvent('image_uploaded',{file_type:(f.type||'').split('/')[1]||'unknown',width:w,height:h});
      }).catch(function(e){setStatus(u.status,'Could not load the enhancement engine: '+(e.message||e)+'. Refresh and try again.',1);});
    }).catch(function(){setStatus(u.status,'Could not decode this image \u2014 it may be corrupted, or an unsupported HEIC. Convert it with the HEIC to JPG tool first.',1);});
  }
  dropzone(u.drop,u.file,function(fs){accept([].slice.call(fs)[0]);});
  function onPaste(e){
    if(!panel.isConnected){document.removeEventListener('paste',onPaste);return;}
    var items=(e.clipboardData||{}).items||[];
    for(var i=0;i<items.length;i++){if(items[i].kind==='file'&&/^image\//.test(items[i].type)){accept(items[i].getAsFile());e.preventDefault();return;}}
  }
  document.addEventListener('paste',onPaste);

  function loadEngine(){
    return _loadScript('/enhancer-engine.js','EnhanceEngine').catch(function(){
      return _loadScript('/enhancer-engine.js?r='+Date.now(),'EnhanceEngine');
    });
  }

  /* ── Live preview scheduling (proxy-res, debounced) ─────────────── */
  function schedulePreview(){
    if(!proxySrc||!window.EnhanceEngine)return;
    clearTimeout(liveTimer);
    liveTimer=setTimeout(runPreview,180);
  }
  var previewRun=null;
  function runPreview(){
    if(!proxySrc)return;
    if(previewRun)previewRun.cancelled=true;
    var signal={cancelled:false};previewRun=signal;
    proxyOut=document.createElement('canvas');
    proxyOut.width=proxySrc.width;proxyOut.height=proxySrc.height;
    proxyOut.getContext('2d').drawImage(proxySrc,0,0);
    var scaled=window.EnhanceEngine.scaleSettings(settings,curStrength);
    var stageEl=$('#enPvStage',panel),barEl=$('#enPvBar',panel),pctEl=$('#enPvPct',panel);
    window.EnhanceEngine.run({canvas:proxyOut,settings:scaled,signal:signal,
      onProgress:function(p,stage){
        if(!stageEl)return; /* first run: progress elements not in DOM yet, that's fine */
        stageEl.textContent=stage||'Enhancing\u2026';
        barEl.style.width=Math.round(p*100)+'%';
        pctEl.textContent=Math.round(p*100)+'%';
      }})
      .then(function(res){if(signal.cancelled)return;showCompare(res.canvas,res.engine,null);})
      .catch(function(){});
  }

  $('#enRun',panel).onclick=function(){
    if(!srcCanvas||running)return;
    u.results.classList.add('show');
    u.results.innerHTML=
      '<div class="tp-progress-wrap" role="status" aria-live="polite">'+
        '<div class="tp-progress-stage" id="enPvStage">Applying AI enhancement\u2026</div>'+
        '<div class="tp-progress-track"><div class="tp-progress-fill" id="enPvBar"></div></div>'+
        '<div class="tp-progress-pct" id="enPvPct">0%</div>'+
      '</div>';
    runPreview();
  };

  /* ── Compare stage (4 modes + zoom + pan + fullscreen + keys) ────── */
  var stageBuilt=false,zoom=1,_resizeH=null;
  var curCompareMode='split'; /* remembered for the rest of this session */
  function summaryChecklist(s,find){
    var LABELS={brightness:'Exposure corrected',contrast:'Contrast improved',shadows:'Shadows recovered',
      highlights:'Highlights recovered',temperature:'White balance corrected',tint:'Color cast corrected',
      vibrance:'Colors balanced',saturation:'Saturation enhanced',noise:'Noise reduced',
      clarity:'Local contrast boosted',sharpness:'Sharpness increased',texture:'Texture recovered',
      skinSmooth:'Skin tones optimized'};
    var items=[];
    Object.keys(LABELS).forEach(function(k){if(s[k])items.push(LABELS[k]);});
    return items.length?items:(find||[]);
  }
  function showCompare(outCv,engineLabel,elapsedSec){
    freeUrls();
    Promise.all([
      new Promise(function(r){proxySrc.toBlob(function(b){r(b);},'image/png');}),
      new Promise(function(r){outCv.toBlob(function(b){r(b);},'image/png');})
    ]).then(function(blobs){
      if(!blobs[0]||!blobs[1])return;
      var befU=URL.createObjectURL(blobs[0]),aftU=URL.createObjectURL(blobs[1]);
      _urls.push(befU,aftU);
      var scaled=window.EnhanceEngine.scaleSettings(settings,curStrength);
      var presetLabel=$('#enPresets .active',panel)?$('#enPresets .active',panel).textContent:'Auto';
      var strengthLabel=$('#enStrength .active',panel)?$('#enStrength .active',panel).textContent:'Balanced';
      var fmtLabel=$('#enFmt',panel).value.split('/')[1].toUpperCase();
      var checklist=summaryChecklist(scaled,analysis&&analysis.findings);
      var meta=
        '<div style="max-width:640px;margin:0 auto 10px;padding:12px 14px;border:1px solid var(--border-2);border-radius:12px;background:var(--bg-2);font-size:12px;color:var(--text-dim);display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px 14px">'+
          '<div><b style="color:var(--text)">Engine</b><br>'+engineLabel+' \u00b7 v'+(window.EnhanceEngine&&window.EnhanceEngine.version||'?')+'</div>'+
          '<div><b style="color:var(--text)">Preset</b><br>'+presetLabel+' \u00b7 '+strengthLabel+'</div>'+
          '<div><b style="color:var(--text)">Resolution</b><br>'+srcCanvas.width+'\u00d7'+srcCanvas.height+'</div>'+
          (elapsedSec!=null?'<div><b style="color:var(--text)">Processing time</b><br>'+elapsedSec.toFixed(1)+'s</div>':'<div><b style="color:var(--text)">Output</b><br>'+fmtLabel+'</div>')+
        '</div>'+
        '<p style="text-align:center;font-size:11px;color:var(--text-faint);margin-bottom:10px">Live preview at reduced resolution \u2014 Download processes the full '+srcCanvas.width+'\u00d7'+srcCanvas.height+' px image.</p>'+
        (checklist.length?'<div style="max-width:640px;margin:0 auto 12px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">'+
          checklist.map(function(c){return '<span style="font-size:11px;color:var(--p1);background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.22);border-radius:99px;padding:4px 10px">\u2713 '+c+'</span>';}).join('')+
        '</div>':'');
      u.results.innerHTML=meta+
        '<div style="display:flex;justify-content:center;margin-bottom:10px"><div class="seg" role="group" aria-label="Comparison mode">'+
          '<button data-m="split" aria-pressed="false">Split</button>'+
          '<button data-m="side" aria-pressed="false">Side by side</button>'+
          '<button data-m="toggle" aria-pressed="false">Before/After</button>'+
          '<button data-m="swipe" aria-pressed="false">Swipe</button>'+
        '</div></div>'+
        '<div id="enViewportArea"></div>'+
        '<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">'+
          '<button class="btn btn-primary" id="enDl">Download full resolution</button>'+
          '<button class="btn btn-ghost" id="enReset">Start over</button>'+
        '</div>'+
        '<div class="status" id="enDlSt" role="status" aria-live="polite"></div>';

      var modeBtns=$$('.seg[aria-label="Comparison mode"] button',panel);
      function paintMode(){modeBtns.forEach(function(b){var on=b.dataset.m===curCompareMode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}
      modeBtns.forEach(function(b){b.onclick=function(){
        curCompareMode=b.dataset.m;paintMode();renderViewport();
        if(window.trackEvent)window.trackEvent('comparison_mode_used',{mode:curCompareMode});
      };});
      paintMode();

      var ZOOM_STOPS=[{k:'fit',v:1,label:'Fit'},{k:'100',v:1,label:'100%'},{k:'200',v:2,label:'200%'},{k:'400',v:4,label:'400%'},{k:'800',v:8,label:'800%'}];
      function renderViewport(){
        var area=$('#enViewportArea',panel);
        var zoomCtrl='<div style="max-width:640px;margin:10px auto 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">'+
            '<div class="seg" role="group" aria-label="Zoom level">'+ZOOM_STOPS.map(function(z){return '<button data-z="'+z.k+'" aria-pressed="'+(z.k==='fit')+'">'+z.label+'</button>';}).join('')+'</div>'+
            '<button class="btn btn-ghost" id="enFS" aria-label="Fullscreen" style="padding:6px 12px">\u26F6</button>'+
          '</div>';
        if(curCompareMode==='toggle'){
          area.innerHTML=
            '<div style="max-width:640px;margin:0 auto"><div id="enWrap" style="position:relative;border:1px solid var(--border-2);border-radius:14px;overflow:hidden;background:#000">'+
              '<img id="enToggleA" src="'+aftU+'" style="display:block;width:100%" alt="Enhanced photo" draggable="false">'+
              '<img id="enToggleB" src="'+befU+'" style="display:block;width:100%;position:absolute;inset:0;opacity:0;transition:opacity 120ms ease" alt="Original photo" draggable="false">'+
              '<span id="enTag" style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">AFTER</span>'+
            '</div><button class="btn btn-ghost" id="enHoldBtn" style="display:block;margin:10px auto 0" aria-label="Press and hold to see the original photo">Hold to see original</button></div>';
          var hb=$('#enHoldBtn',panel),hB=$('#enToggleB',panel),hTag=$('#enTag',panel);
          function showB(on){hB.style.opacity=on?'1':'0';hTag.textContent=on?'BEFORE':'AFTER';hTag.style.background=on?'rgba(0,0,0,.6)':'rgba(34,211,238,.85)';hTag.style.color=on?'#fff':'#04222a';}
          hb.onpointerdown=function(e){e.preventDefault();showB(true);};
          hb.onpointerup=hb.onpointerleave=hb.onpointercancel=function(){showB(false);};
          hb.onkeydown=function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();showB(true);}};
          hb.onkeyup=function(e){if(e.key===' '||e.key==='Enter'){showB(false);}};
          return; /* zoom/pan doesn't apply to a single swapped image */
        }
        if(curCompareMode==='side'){
          area.innerHTML=
            '<div id="enWrap" style="max-width:900px;margin:0 auto;max-height:70vh;overflow:auto;border:1px solid var(--border-2);border-radius:14px;background:#000" tabindex="0" aria-label="Side by side comparison. Keys: plus and minus to zoom, zero to fit, F for fullscreen">'+
              '<div id="enCmp" style="display:flex;gap:2px;width:100%">'+
                '<div style="flex:1;position:relative"><img src="'+befU+'" style="display:block;width:100%" alt="Original photo" draggable="false"><span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:99px">BEFORE</span></div>'+
                '<div style="flex:1;position:relative"><img src="'+aftU+'" style="display:block;width:100%" alt="Enhanced photo" draggable="false"><span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">AFTER</span></div>'+
              '</div>'+
            '</div>'+zoomCtrl;
          wireZoomPan();return;
        }
        /* split & swipe share the same overlay-divider DOM; swipe adds
           drag-anywhere-on-the-image in addition to the slider, split
           relies on the slider (or the handle) alone \u2014 genuinely
           different primary interaction, same visual result either way. */
        area.innerHTML=
          '<div id="enWrap" style="max-width:640px;margin:0 auto;max-height:70vh;overflow:auto;border:1px solid var(--border-2);border-radius:14px;background:#000" tabindex="0" aria-label="Before and after comparison. Keys: plus and minus to zoom, zero to fit, F for fullscreen">'+
            '<div id="enCmp" style="position:relative;width:100%">'+
              '<img src="'+aftU+'" style="display:block;width:100%" alt="Enhanced photo" draggable="false">'+
              '<div id="enBefW" style="position:absolute;top:0;left:0;height:100%;width:50%;overflow:hidden"><img id="enBef" src="'+befU+'" style="display:block;height:100%" alt="Original photo" draggable="false"></div>'+
              '<div id="enHand" style="position:absolute;top:0;left:50%;width:2px;height:100%;background:#22d3ee;box-shadow:0 0 8px rgba(34,211,238,.8);cursor:ew-resize"></div>'+
              '<span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:99px">BEFORE</span>'+
              '<span style="position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">AFTER</span>'+
            '</div>'+
          '</div>'+
          '<div style="max-width:640px;margin:10px auto 0"><input type="range" id="enSlide" min="0" max="100" value="50" style="width:100%" aria-label="Comparison divider position"></div>'+
          zoomCtrl;
        var cmp=$('#enCmp',panel),befW=$('#enBefW',panel),bef=$('#enBef',panel),hand=$('#enHand',panel);
        function syncBef(){bef.style.width=cmp.clientWidth+'px';}
        syncBef();
        if(_resizeH)window.removeEventListener('resize',_resizeH);
        _resizeH=syncBef;window.addEventListener('resize',_resizeH);
        function setDivider(pct){pct=Math.max(0,Math.min(100,pct));befW.style.width=pct+'%';hand.style.left=pct+'%';$('#enSlide',panel).value=pct;}
        $('#enSlide',panel).oninput=function(){setDivider(this.value);};
        if(curCompareMode==='swipe'){
          var dragging=false;
          function pctFromEvent(e){var r=cmp.getBoundingClientRect();return (e.clientX-r.left)/r.width*100;}
          cmp.addEventListener('pointerdown',function(e){dragging=true;setDivider(pctFromEvent(e));});
          window.addEventListener('pointermove',function(e){if(dragging)setDivider(pctFromEvent(e));});
          window.addEventListener('pointerup',function(){dragging=false;});
        }
        wireZoomPan();
      }
      function wireZoomPan(){
        var cmp=$('#enCmp',panel),wrap=$('#enWrap',panel);
        if(!cmp||!wrap)return;
        function setZoom(z,stopKey){
          zoom=Math.max(.5,Math.min(8,z));cmp.style.width=(zoom*100)+'%';
          var bef=$('#enBef',panel);if(bef)bef.style.width=cmp.clientWidth+'px';
          $$('.seg[aria-label="Zoom level"] button',panel).forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.z===stopKey));});
          if(window.trackEvent)window.trackEvent('zoom_usage',{zoom:Math.round(zoom*100)+'%',mode:curCompareMode});
        }
        $$('.seg[aria-label="Zoom level"] button',panel).forEach(function(b){
          b.onclick=function(){var stop=ZOOM_STOPS.filter(function(z){return z.k===b.dataset.z;})[0];setZoom(stop.v,stop.k);};
        });
        var fs=$('#enFS',panel);
        if(fs)fs.onclick=function(){if(document.fullscreenElement){document.exitFullscreen();}else if(wrap.requestFullscreen){wrap.requestFullscreen();}};
        wrap.addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom*(e.deltaY<0?1.15:1/1.15),'');}},{passive:false});
        wrap.addEventListener('keydown',function(e){
          if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom*1.4,'');}
          else if(e.key==='-'){e.preventDefault();setZoom(zoom/1.4,'');}
          else if(e.key==='0'){e.preventDefault();setZoom(1,'fit');}
          else if(e.key==='f'||e.key==='F'){e.preventDefault();if(fs)fs.click();}
        });
      }
      renderViewport();
      $('#enDl',panel).onclick=downloadFull;
      $('#enReset',panel).onclick=function(){resetAll();};
      setStatus(u.status,'Enhanced preview ready \u2014 fine-tune with sliders, then Download for full resolution.');
    });
  }

  /* ── Full-resolution processing on Download ─────────────────────── */
  function downloadFull(){
    if(!srcCanvas||running)return;
    if(window.trackEvent)window.trackEvent('download_clicked',{preset:curPreset,strength:curStrength});
    var st=$('#enDlSt',panel)||u.status;
    var signal={cancelled:false};running=signal;
    var btn=$('#enDl',panel);btn.disabled=true;
    st.className='status show';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
    st.innerHTML=
      '<div class="tp-progress-wrap">'+
        '<div class="tp-progress-stage" id="enFullStage">Preparing full resolution\u2026</div>'+
        '<div class="tp-progress-track"><div class="tp-progress-fill" id="enFullBar"></div></div>'+
        '<div class="tp-progress-pct" id="enFullPct">0%</div>'+
      '</div>'+
      '<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost" id="enCancel" style="padding:4px 12px;font-size:12px">Cancel</button></div>';
    if(window.trackEvent)window.trackEvent('tool_process_started',{preset:curPreset,strength:curStrength});
    var _t0=performance.now();
    $('#enCancel',panel).onclick=function(){signal.cancelled=true;};
    fullOut=document.createElement('canvas');
    fullOut.width=srcCanvas.width;fullOut.height=srcCanvas.height;
    fullOut.getContext('2d').drawImage(srcCanvas,0,0);
    var scaled=window.EnhanceEngine.scaleSettings(settings,curStrength);
    window.EnhanceEngine.run({
      canvas:fullOut,settings:scaled,signal:signal,
      onProgress:function(p,msg){
        var bar=$('#enFullBar',panel),pct=$('#enFullPct',panel),stage=$('#enFullStage',panel);
        if(bar)bar.style.width=Math.round(p*100)+'%';
        if(pct)pct.textContent=Math.round(p*100)+'%';
        if(stage&&msg)stage.textContent=msg;
      }
    }).then(function(res){
      running=null;
      if(signal.cancelled){setStatus(st,'Cancelled \u2014 your photo is still here, adjust and try again.');btn.disabled=false;return;}
      var fmt=$('#enFmt',panel).value,ext=fmt==='image/png'?'png':fmt==='image/webp'?'webp':'jpg';
      var c=res.canvas;
      if(fmt==='image/jpeg'){var f2=document.createElement('canvas');f2.width=c.width;f2.height=c.height;var fx=f2.getContext('2d');fx.fillStyle='#fff';fx.fillRect(0,0,f2.width,f2.height);fx.drawImage(c,0,0);c=f2;}
      c.toBlob(function(b){
        btn.disabled=false;
        if(!b){setStatus(st,'Export failed \u2014 try PNG instead.',1);return;}
        var nm=srcName+'-enhanced.'+ext;
        download(b,nm);
        var elapsed=Math.round((performance.now()-_t0)/100)/10;
        st.innerHTML='<p style="margin:0 0 10px">Saved '+nm+' \u2014 '+c.width+'\u00d7'+c.height+' \u00b7 '+fmtBytes(b.size)+' \u00b7 '+ext.toUpperCase()+' \u00b7 '+elapsed+'s</p>'+
          '<p style="font-size:12px;color:var(--text-faint);margin:0 0 10px">\u2728 Continue editing</p>'+
          '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
            '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/ai-image-upscaler">AI Image Upscaler</a>'+
            '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/background-remover">Background Remover</a>'+
            '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/ai-object-remover">AI Object Remover</a>'+
            '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/image-compressor">Image Compressor</a>'+
          '</div>';
        if(window.trackEvent){
          window.trackEvent('tool_process_completed',{preset:curPreset,strength:curStrength,engine:res.engine,processing_time:elapsed});
          window.trackEvent('ai_enhance_completed',{preset:curPreset,strength:curStrength,engine:res.engine,processing_time:elapsed});
        }
      },fmt,fmt==='image/png'?undefined:.92);
    }).catch(function(e){
      running=null;btn.disabled=false;
      if(e&&e.message==='cancelled'){setStatus(st,'Cancelled \u2014 your photo is still here, adjust and try again.');return;}
      /* Preserve the image and offer Retry rather than resetting the
         session \u2014 srcCanvas/settings are untouched above, so Retry just
         calls downloadFull() again with everything still in place. */
      st.className='status show err';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
      st.innerHTML='<p style="margin:0 0 8px">Processing failed: '+(e&&e.message||e)+'</p>'+
        '<button class="btn btn-primary" id="enRetry" style="padding:6px 14px;font-size:12.5px">Retry</button>';
      $('#enRetry',panel).onclick=downloadFull;
      if(window.trackEvent)window.trackEvent('tool_error',{error_message:String((e&&e.message)||e).slice(0,150)});
    });
  }

  function resetAll(){
    if(running)running.cancelled=true;running=null;
    if(previewRun)previewRun.cancelled=true;previewRun=null;
    clearTimeout(liveTimer);freeUrls();
    if(_resizeH){window.removeEventListener('resize',_resizeH);_resizeH=null;}
    srcCanvas=proxySrc=proxyOut=fullOut=null;analysis=null;settings={};
    curPreset='auto';paintPresets('auto');writeSliders({});
    curStrength='balanced';$$('#enStrength button',panel).forEach(function(b){var on=b.dataset.s==='balanced';b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    $('#enRun',panel).disabled=true;
    u.results.innerHTML='';u.results.classList.remove('show');
    u.drop.style.display='';setStatus(u.status,'');
  }
};

/* ═══════════════ AI OBJECT REMOVER ═══════════════════════════════════
   Brush/rectangle mask editing over the photo, then content-aware fill
   via /objectremover-engine.js (provider-abstracted, lazy-loaded).
   Undo/redo uses alpha-only mask snapshots (memory-capped). */
INIT['ai-object-remover']=function(panel){
  var MAX_PX=16000000;
  var imgCv=null,maskCv=null,outCv=null,srcName='photo';
  var running=null,_urls=[],undoStack=[],redoStack=[],view='split';
  var brush={size:36,soft:60,erase:false,mode:'brush'};
  var zoom=1,_resizeH=null;

  var u=dz(panel,{accept:'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif',multiple:false,
    formats:['JPG','PNG','WEBP','AVIF'],
    title:'Drop a photo, click to browse, or paste (Ctrl+V)',
    sub:'Paint over anything \u2014 people, wires, trash, text \u2014 and it\u2019s rebuilt from the surroundings, on your device.'});

  u.controls.className='controls';
  u.controls.innerHTML=
    '<div class="ctrl"><label>Tool</label><div class="seg" id="orTool" role="group" aria-label="Selection tool">'+
      '<button data-t="brush" class="active" aria-pressed="true">Brush</button>'+
      '<button data-t="rect" aria-pressed="false">Rectangle</button>'+
      '<button data-t="erase" aria-pressed="false">Eraser</button>'+
    '</div></div>'+
    '<div class="ctrl"><label for="orSize">Brush \u00b7 <span class="val" id="orSizeV">36px</span></label><input type="range" id="orSize" min="6" max="140" value="36" style="width:110px" aria-label="Brush size"></div>'+
    '<div class="ctrl"><label for="orSoft">Softness \u00b7 <span class="val" id="orSoftV">60%</span></label><input type="range" id="orSoft" min="0" max="100" value="60" style="width:90px" aria-label="Brush softness"></div>'+
    '<div class="ctrl"><label>Quality</label><div class="seg" id="orQual" role="group" aria-label="Fill quality">'+
      '<button data-q="fast" aria-pressed="false">Fast</button>'+
      '<button data-q="balanced" class="active" aria-pressed="true">Balanced</button>'+
      '<button data-q="best" aria-pressed="false">Best</button>'+
    '</div></div>'+
    '<div class="ctrl-spacer"></div>'+
    '<button class="btn btn-ghost" id="orUndo" disabled aria-label="Undo (Ctrl+Z)">&#8630;</button>'+
    '<button class="btn btn-ghost" id="orRedo" disabled aria-label="Redo (Ctrl+Y)">&#8631;</button>'+
    '<button class="btn btn-primary" id="orRun" disabled>Remove</button>';
  var quality='balanced';
  $('#orQual',panel).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;quality=b.dataset.q;
    $$('#orQual button',panel).forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});});
  $('#orTool',panel).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    brush.mode=b.dataset.t==='rect'?'rect':'brush';brush.erase=b.dataset.t==='erase';
    $$('#orTool button',panel).forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});});
  $('#orSize',panel).oninput=function(){brush.size=+this.value;$('#orSizeV',panel).textContent=this.value+'px';};
  $('#orSoft',panel).oninput=function(){brush.soft=+this.value;$('#orSoftV',panel).textContent=this.value+'%';};

  function isBlank(c){try{var t=document.createElement('canvas');t.width=8;t.height=8;var x=t.getContext('2d');x.drawImage(c,0,0,8,8);var d2=x.getImageData(0,0,8,8).data;for(var i=3;i<d2.length;i+=4)if(d2[i]>0)return false;return true;}catch(e){return false;}}
  function freeUrls(){_urls.forEach(function(uu){try{URL.revokeObjectURL(uu);}catch(e){}});_urls=[];}

  /* ── mask snapshots: alpha channel only, memory-capped ───────────── */
  function snapCap(){var mp=imgCv?imgCv.width*imgCv.height/1e6:0;return mp>6?3:8;}
  function maskAlpha(){var d=maskCv.getContext('2d').getImageData(0,0,maskCv.width,maskCv.height).data;var a=new Uint8Array(d.length/4);for(var i=0;i<a.length;i++)a[i]=d[i*4+3];return a;}
  function restoreAlpha(a){var ctx=maskCv.getContext('2d');var id=ctx.getImageData(0,0,maskCv.width,maskCv.height);for(var i=0;i<a.length;i++){id.data[i*4]=255;id.data[i*4+1]=40;id.data[i*4+2]=70;id.data[i*4+3]=a[i];}ctx.putImageData(id,0,0);}
  function pushUndo(){try{undoStack.push(maskAlpha());if(undoStack.length>snapCap())undoStack.shift();redoStack=[];paintHistory();}catch(e){}}
  function paintHistory(){$('#orUndo',panel).disabled=!undoStack.length;$('#orRedo',panel).disabled=!redoStack.length;}
  $('#orUndo',panel).onclick=function(){if(!undoStack.length)return;redoStack.push(maskAlpha());restoreAlpha(undoStack.pop());paintHistory();};
  $('#orRedo',panel).onclick=function(){if(!redoStack.length)return;undoStack.push(maskAlpha());restoreAlpha(redoStack.pop());paintHistory();};

  function accept(f){
    if(!f)return;
    if(!/^image\//.test(f.type||'')&&!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(f.name||'')){setStatus(u.status,'That doesn\u2019t look like an image \u2014 JPG, PNG, WEBP or AVIF please.',1);return;}
    if(f.size>80*1024*1024){setStatus(u.status,'File is over 80 MB \u2014 too large for browser processing.',1);return;}
    setStatus(u.status,'Reading image\u2026');
    readImg(f).then(function(img){
      var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
      if(!w||!h)throw new Error('decode');
      if(w*h>MAX_PX){setStatus(u.status,'Image is '+Math.round(w*h/1e6)+' MP \u2014 the maximum for object removal is 16 MP. Resize it first with the Image Resizer.',1);return;}
      imgCv=document.createElement('canvas');imgCv.width=w;imgCv.height=h;
      imgCv.getContext('2d').drawImage(img,0,0);
      if(isBlank(imgCv)){imgCv=null;setStatus(u.status,'This image is completely transparent (empty). Please upload your original photo.',1);return;}
      maskCv=document.createElement('canvas');maskCv.width=w;maskCv.height=h;
      srcName=(f.name||'photo').replace(/\.[^.]+$/,'');
      outCv=null;undoStack=[];redoStack=[];paintHistory();
      buildEditor();
      $('#orRun',panel).disabled=false;
      setStatus(u.status,'Paint over what you want removed, then press Remove. [ and ] change brush size.');
    }).catch(function(){setStatus(u.status,'Could not decode this image \u2014 it may be corrupted, or an unsupported HEIC. Convert it with the HEIC to JPG tool first.',1);});
  }
  dropzone(u.drop,u.file,function(fs){accept([].slice.call(fs)[0]);});
  function onPaste(e){
    if(!panel.isConnected){document.removeEventListener('paste',onPaste);return;}
    var items=(e.clipboardData||{}).items||[];
    for(var i=0;i<items.length;i++){if(items[i].kind==='file'&&/^image\//.test(items[i].type)){accept(items[i].getAsFile());e.preventDefault();return;}}
  }
  document.addEventListener('paste',onPaste);

  /* ── editor stage: image + mask overlay, paint with pointer ──────── */
  function buildEditor(){
    freeUrls();
    u.drop.style.display='none';
    u.results.classList.add('show');
    u.results.innerHTML=
      '<p style="text-align:center;font-size:12px;color:var(--text-faint);margin-bottom:8px">'+imgCv.width+'\u00d7'+imgCv.height+' px \u00b7 red = will be removed</p>'+
      '<div id="orWrap" style="max-width:680px;margin:0 auto;max-height:70vh;overflow:auto;border:1px solid var(--border-2);border-radius:14px;background:#000" tabindex="0" aria-label="Mask editor. Paint over objects to remove. Keys: bracket keys change brush size, E eraser, Ctrl+Z undo, F fullscreen">'+
        '<div id="orStage" style="position:relative;width:100%;touch-action:none;cursor:crosshair"></div>'+
      '</div>'+
      '<div style="max-width:680px;margin:10px auto 0;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
        '<button class="btn btn-ghost" id="orClear" style="font-size:12.5px;padding:6px 14px">Clear selection</button>'+
        '<div class="seg" role="group" aria-label="Zoom"><button id="orZO" aria-label="Zoom out">\u2212</button><button id="orZF" aria-pressed="true">Fit</button><button id="orZI" aria-label="Zoom in">+</button></div>'+
        '<button class="btn btn-ghost" id="orFS" aria-label="Fullscreen (F)" style="padding:6px 12px">\u26F6</button>'+
      '</div>'+
      '<div class="status" id="orSt" role="status" aria-live="polite"></div>';
    var stage=$('#orStage',panel),wrap=$('#orWrap',panel);
    imgCv.style.cssText='display:block;width:100%';
    maskCv.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;opacity:.5;pointer-events:none';
    stage.appendChild(imgCv);stage.appendChild(maskCv);

    function toPx(e){var r=imgCv.getBoundingClientRect();return{x:(e.clientX-r.left)*(imgCv.width/r.width),y:(e.clientY-r.top)*(imgCv.height/r.height),scale:imgCv.width/r.width};}
    function dab(x,y,scale){
      var ctx=maskCv.getContext('2d');
      var rad=brush.size*scale/2;
      ctx.save();
      if(brush.erase)ctx.globalCompositeOperation='destination-out';
      var soft=brush.soft/100;
      var grad=ctx.createRadialGradient(x,y,rad*(1-soft),x,y,rad);
      grad.addColorStop(0,'rgba(255,40,70,1)');grad.addColorStop(1,'rgba(255,40,70,'+(soft?0:1)+')');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    var painting=false,last=null,rectStart=null,rectEl=null;
    stage.addEventListener('pointerdown',function(e){
      if(!imgCv)return;e.preventDefault();stage.setPointerCapture(e.pointerId);
      var p=toPx(e);pushUndo();
      if(brush.mode==='rect'){rectStart=p;
        rectEl=document.createElement('div');
        rectEl.style.cssText='position:absolute;border:2px dashed #ff2846;background:rgba(255,40,70,.2);pointer-events:none';
        stage.appendChild(rectEl);return;}
      painting=true;dab(p.x,p.y,p.scale);last=p;
    });
    stage.addEventListener('pointermove',function(e){
      if(rectStart&&rectEl){var p2=toPx(e);var r=imgCv.getBoundingClientRect();
        var x0=Math.min(rectStart.x,p2.x)/imgCv.width*100,y0=Math.min(rectStart.y,p2.y)/imgCv.height*100;
        var x1=Math.max(rectStart.x,p2.x)/imgCv.width*100,y1=Math.max(rectStart.y,p2.y)/imgCv.height*100;
        rectEl.style.left=x0+'%';rectEl.style.top=y0+'%';rectEl.style.width=(x1-x0)+'%';rectEl.style.height=(y1-y0)+'%';return;}
      if(!painting)return;
      var p=toPx(e);
      if(last){var dx=p.x-last.x,dy=p.y-last.y,dist=Math.sqrt(dx*dx+dy*dy);var rad=brush.size*p.scale/2;
        var steps=Math.max(1,Math.ceil(dist/(rad*0.35)));
        for(var s=1;s<=steps;s++)dab(last.x+dx*s/steps,last.y+dy*s/steps,p.scale);}
      last=p;
    });
    function endStroke(e){
      if(rectStart&&rectEl){var p=toPx(e);var ctx=maskCv.getContext('2d');
        ctx.fillStyle='rgba(255,40,70,1)';
        if(brush.erase)ctx.globalCompositeOperation='destination-out';
        ctx.fillRect(Math.min(rectStart.x,p.x),Math.min(rectStart.y,p.y),Math.abs(p.x-rectStart.x),Math.abs(p.y-rectStart.y));
        ctx.globalCompositeOperation='source-over';
        rectEl.remove();rectEl=null;rectStart=null;}
      painting=false;last=null;
    }
    stage.addEventListener('pointerup',endStroke);
    stage.addEventListener('pointercancel',endStroke);

    $('#orClear',panel).onclick=function(){pushUndo();maskCv.getContext('2d').clearRect(0,0,maskCv.width,maskCv.height);};
    function setZoom(z){zoom=Math.max(.5,Math.min(6,z));stage.style.width=(zoom*100)+'%';}
    $('#orZI',panel).onclick=function(){setZoom(zoom*1.4);};
    $('#orZO',panel).onclick=function(){setZoom(zoom/1.4);};
    $('#orZF',panel).onclick=function(){setZoom(1);};
    $('#orFS',panel).onclick=function(){if(document.fullscreenElement){document.exitFullscreen();}else if(wrap.requestFullscreen){wrap.requestFullscreen();}};
    wrap.addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom*(e.deltaY<0?1.15:1/1.15));}},{passive:false});
    wrap.addEventListener('keydown',function(e){
      if(e.key===']'){e.preventDefault();brush.size=Math.min(140,brush.size+6);$('#orSize',panel).value=brush.size;$('#orSizeV',panel).textContent=brush.size+'px';}
      else if(e.key==='['){e.preventDefault();brush.size=Math.max(6,brush.size-6);$('#orSize',panel).value=brush.size;$('#orSizeV',panel).textContent=brush.size+'px';}
      else if(e.key==='e'||e.key==='E'){e.preventDefault();$$('#orTool button',panel)[brush.erase?0:2].click();}
      else if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();$('#orUndo',panel).click();}
      else if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();$('#orRedo',panel).click();}
      else if(e.key==='f'||e.key==='F'){e.preventDefault();$('#orFS',panel).click();}
      else if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom*1.4);}
      else if(e.key==='-'){e.preventDefault();setZoom(zoom/1.4);}
      else if(e.key==='0'){e.preventDefault();setZoom(1);}
    });
  }

  function loadEngine(){
    return _loadScript('/objectremover-engine.js','ObjectRemoveEngine').catch(function(){
      return _loadScript('/objectremover-engine.js?r='+Date.now(),'ObjectRemoveEngine');
    });
  }

  $('#orRun',panel).onclick=function(){
    if(!imgCv||running)return;
    var st=$('#orSt',panel)||u.status;
    var signal={cancelled:false};running=signal;
    var btn=$('#orRun',panel);btn.disabled=true;
    st.className='status show';
    st.innerHTML='Removing\u2026 <span id="orPct">0%</span> <button class="btn btn-ghost" id="orCancel" style="padding:2px 10px;font-size:12px;margin-left:8px">Cancel</button>';
    $('#orCancel',panel).onclick=function(){signal.cancelled=true;};
    if(window.trackEvent)window.trackEvent('tool_process_started',{quality:quality});
    outCv=document.createElement('canvas');outCv.width=imgCv.width;outCv.height=imgCv.height;
    outCv.getContext('2d').drawImage(imgCv,0,0);
    var _t0=performance.now();
    loadEngine().then(function(){
      return window.ObjectRemoveEngine.run({
        canvas:outCv,mask:maskCv,quality:quality,signal:signal,
        onProgress:function(p,msg){var el=$('#orPct',panel);if(el)el.textContent=Math.round(p*100)+'%'+(msg?' \u00b7 '+msg:'');}
      });
    }).then(function(res){
      running=null;btn.disabled=false;
      if(signal.cancelled){st.textContent='Cancelled.';return;}
      var elapsed=(performance.now()-_t0)/1000;
      showResult(res.engine,elapsed);
      if(window.trackEvent){
        window.trackEvent('tool_process_completed',{quality:quality,engine:res.engine,processing_time:Math.round(elapsed*10)/10});
        window.trackEvent('ai_object_remove_completed',{quality:quality,engine:res.engine,processing_time:Math.round(elapsed*10)/10});
      }
    }).catch(function(e){
      running=null;btn.disabled=false;
      if(e&&e.message==='cancelled'){st.textContent='Cancelled.';return;}
      var msg=(e&&/selection/.test(e.message||''))?e.message:'Removal failed: '+(e&&e.message||e);
      st.textContent=msg;
      if(window.trackEvent)window.trackEvent('tool_error',{error_message:String(msg).slice(0,150)});
    });
  };

  /* ── result: split slider / side-by-side / hold-to-compare ────────── */
  function showResult(engineLabel,elapsedSec){
    freeUrls();
    Promise.all([
      new Promise(function(r){imgCv.toBlob(function(b){r(b);},'image/png');}),
      new Promise(function(r){outCv.toBlob(function(b){r(b);},'image/png');})
    ]).then(function(blobs){
      if(!blobs[0]||!blobs[1])return;
      var befU=URL.createObjectURL(blobs[0]),aftU=URL.createObjectURL(blobs[1]);
      _urls.push(befU,aftU);
      var qLabel={fast:'Fast',balanced:'Balanced',best:'Best'}[quality]||quality;
      var meta=[
        (elapsedSec!=null?elapsedSec.toFixed(1)+'s':null),
        imgCv.width+'\u00d7'+imgCv.height,
        qLabel+' quality',
        'Processed entirely in your browser'
      ].filter(Boolean).join(' \u00b7 ');
      u.results.innerHTML=
        '<p style="text-align:center;font-size:12.5px;color:var(--text-dim);margin-bottom:10px">'+meta+'</p>'+
        '<div style="display:flex;justify-content:center;margin-bottom:10px"><div class="seg" role="group" aria-label="View mode">'+
          '<button id="orVSplit" class="active" aria-pressed="true">Split</button>'+
          '<button id="orVSide" aria-pressed="false">Side by side</button>'+
          '<button id="orVHold" aria-pressed="false">Hold to compare</button>'+
        '</div></div>'+
        '<div id="orResView"></div>'+
        '<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">'+
          '<div class="ctrl"><label for="orFmt">Format</label><select id="orFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WEBP</option></select></div>'+
          '<button class="btn btn-primary" id="orDl">Download</button>'+
          '<button class="btn btn-ghost" id="orMore">\u270e Remove more</button>'+
          '<button class="btn btn-ghost" id="orReset">Start over</button>'+
        '</div><div class="status" id="orSt2" role="status" aria-live="polite"></div>'+
        '<p style="text-align:center;font-size:12px;color:var(--text-faint);margin:16px 0 6px">\u2728 Continue editing</p>'+
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
          '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/ai-photo-enhancer">AI Photo Enhancer</a>'+
          '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/ai-image-upscaler">AI Image Upscaler</a>'+
          '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/background-remover">Background Remover</a>'+
          '<a class="btn btn-ghost tp-continue-edit" style="font-size:12.5px;padding:6px 12px" href="/image-compressor">Image Compressor</a>'+
        '</div>';
      function renderView(){
        var rv=$('#orResView',panel);
        if(view==='side'){
          rv.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:840px;margin:0 auto">'+
            '<figure style="margin:0"><img src="'+befU+'" style="display:block;width:100%;border-radius:10px" alt="Original"><figcaption style="text-align:center;font-size:11px;color:var(--text-faint);margin-top:4px">ORIGINAL</figcaption></figure>'+
            '<figure style="margin:0"><img src="'+aftU+'" style="display:block;width:100%;border-radius:10px" alt="Object removed"><figcaption style="text-align:center;font-size:11px;color:var(--text-faint);margin-top:4px">REMOVED</figcaption></figure></div>';
        }else if(view==='hold'){
          /* Before/After toggle: press-and-hold (mouse, touch or keyboard)
             shows the ORIGINAL; release shows the result. The fastest way
             to spot any leftover artifact. */
          rv.innerHTML='<div style="max-width:640px;margin:0 auto">'+
            '<div id="orHoldW" style="position:relative;border:1px solid var(--border-2);border-radius:14px;overflow:hidden">'+
              '<img id="orHoldA" src="'+aftU+'" style="display:block;width:100%" alt="Result with object removed" draggable="false">'+
              '<img id="orHoldB" src="'+befU+'" style="display:block;width:100%;position:absolute;inset:0;opacity:0;transition:opacity 120ms ease" alt="Original" draggable="false">'+
              '<span id="orHoldTag" style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">REMOVED</span>'+
            '</div>'+
            '<button class="btn btn-ghost" id="orHoldBtn" style="display:block;margin:10px auto 0" aria-label="Press and hold to show the original image">Hold to see original</button>'+
          '</div>';
          var hb=$('#orHoldBtn',panel),hB=$('#orHoldB',panel),hTag=$('#orHoldTag',panel);
          function showB(on){hB.style.opacity=on?'1':'0';hTag.textContent=on?'ORIGINAL':'REMOVED';hTag.style.background=on?'rgba(0,0,0,.55)':'rgba(34,211,238,.85)';hTag.style.color=on?'#fff':'#04222a';}
          hb.onpointerdown=function(e){e.preventDefault();showB(true);};
          hb.onpointerup=hb.onpointerleave=hb.onpointercancel=function(){showB(false);};
          hb.onkeydown=function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();showB(true);}};
          hb.onkeyup=function(e){if(e.key===' '||e.key==='Enter'){showB(false);}};
        }else{
          rv.innerHTML='<div style="max-width:640px;margin:0 auto;border:1px solid var(--border-2);border-radius:14px;overflow:hidden">'+
            '<div id="orCmp" style="position:relative;width:100%">'+
              '<img src="'+aftU+'" style="display:block;width:100%" alt="Result with object removed" draggable="false">'+
              '<div id="orBefW" style="position:absolute;top:0;left:0;height:100%;width:50%;overflow:hidden"><img id="orBef" src="'+befU+'" style="display:block;height:100%" alt="Original" draggable="false"></div>'+
              '<div style="position:absolute;top:0;left:50%;width:2px;height:100%;background:#22d3ee;box-shadow:0 0 8px rgba(34,211,238,.8)" id="orHand"></div>'+
              '<span style="position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:99px">ORIGINAL</span>'+
              '<span style="position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;background:rgba(34,211,238,.85);color:#04222a;padding:3px 8px;border-radius:99px">REMOVED</span>'+
            '</div></div>'+
            '<div style="max-width:640px;margin:8px auto 0"><input type="range" id="orSlide" min="0" max="100" value="50" style="width:100%" aria-label="Comparison divider position"></div>';
          var cmp=$('#orCmp',panel),bef=$('#orBef',panel),befW=$('#orBefW',panel),hand=$('#orHand',panel);
          function syncBef(){bef.style.width=cmp.clientWidth+'px';}
          syncBef();
          if(_resizeH)window.removeEventListener('resize',_resizeH);
          _resizeH=syncBef;window.addEventListener('resize',_resizeH);
          $('#orSlide',panel).oninput=function(){befW.style.width=this.value+'%';hand.style.left=this.value+'%';};
        }
      }
      renderView();
      /* The outer u.status line (distinct from the now-destroyed #orSt
         that lived inside the old editor markup) was never updated on
         success — it silently kept showing "Paint over what you want
         removed..." from before processing started, straight through a
         fully completed removal. That's actively misleading: it reads
         as "still waiting for input" even once a real result exists,
         which is exactly the kind of thing that makes a working result
         look like nothing happened. */
      setStatus(u.status,'Done \u2014 compare the result below, or paint another area with Remove more.');
      var viewBtns={split:'#orVSplit',side:'#orVSide',hold:'#orVHold'};
      Object.keys(viewBtns).forEach(function(mode){
        var el=$(viewBtns[mode],panel);if(!el)return;
        el.onclick=function(){
          view=mode;
          Object.keys(viewBtns).forEach(function(m2){
            var b2=$(viewBtns[m2],panel);if(!b2)return;
            var on=m2===mode;b2.classList.toggle('active',on);b2.setAttribute('aria-pressed',String(on));
          });
          renderView();
        };
      });
      $('#orDl',panel).onclick=function(){
        var fmt=$('#orFmt',panel).value,ext=fmt==='image/png'?'png':fmt==='image/webp'?'webp':'jpg';
        var c=outCv;
        if(fmt==='image/jpeg'){var f2=document.createElement('canvas');f2.width=c.width;f2.height=c.height;var fx=f2.getContext('2d');fx.fillStyle='#fff';fx.fillRect(0,0,f2.width,f2.height);fx.drawImage(c,0,0);c=f2;}
        c.toBlob(function(b){
          var st2=$('#orSt2',panel);
          if(!b){st2.className='status show';st2.textContent='Export failed \u2014 try PNG.';return;}
          var nm=srcName+'-removed.'+ext;
          download(b,nm);
          st2.className='status show';st2.textContent='Saved '+nm+' ('+fmtBytes(b.size)+').';
        },fmt,fmt==='image/png'?undefined:.92);
      };
      $('#orMore',panel).onclick=function(){
        /* continue editing on the RESULT: it becomes the new source */
        imgCv=document.createElement('canvas');imgCv.width=outCv.width;imgCv.height=outCv.height;
        imgCv.getContext('2d').drawImage(outCv,0,0);
        maskCv=document.createElement('canvas');maskCv.width=imgCv.width;maskCv.height=imgCv.height;
        undoStack=[];redoStack=[];paintHistory();buildEditor();
        setStatus(u.status,'Paint over the next object, then press Remove.');
      };
      $('#orReset',panel).onclick=resetAll;
    });
  }

  function resetAll(){
    if(running)running.cancelled=true;running=null;
    freeUrls();
    if(_resizeH){window.removeEventListener('resize',_resizeH);_resizeH=null;}
    imgCv=maskCv=outCv=null;undoStack=[];redoStack=[];
    $('#orRun',panel).disabled=true;paintHistory();
    u.results.innerHTML='';u.results.classList.remove('show');
    u.drop.style.display='';setStatus(u.status,'');
  }
};

