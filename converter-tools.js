/* TARUMAK STUDIO — converter-tools.js  (8 converter tools) */

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
  u.controls.innerHTML='<div class="ctrl"><label for="d">Frame delay · <span class="val" id="dv">300ms</span></label><input type="range" id="d" min="80" max="1000" step="20" value="300"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Make GIF</button>';
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
  u.controls.innerHTML='<div class="ctrl"><label for="cols">Columns</label><select id="cols"><option>2</option><option selected>3</option><option>4</option></select></div><div class="ctrl"><label for="gap">Gap · <span class="val" id="gv">10px</span></label><input type="range" id="gap" min="0" max="40" value="10"></div><div class="ctrl"><label for="cell">Cell</label><select id="cell"><option value="220">Medium</option><option value="160">Small</option><option value="320">Large</option></select></div><div class="ctrl"><label>Background</label><div class="color-field"><input type="color" id="bg" value="#ffffff"><span id="bgh">#ffffff</span></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Build collage</button>';
  let files=[];const gap=$('#gap',panel);gap.oninput=()=>$('#gv',panel).textContent=gap.value+'px';$('#bg',panel).oninput=e=>$('#bgh',panel).textContent=e.target.value;
  dropzone(u.drop,u.file,fs=>{files=files.concat([...fs].filter(f=>f.type.startsWith('image/')));if(files.length)setStatus(u.status,files.length+' photo(s) ready.');});
  $('#run',panel).onclick=async()=>{if(!files.length){setStatus(u.status,'Add some photos first.',1);return;}const imgs=await Promise.all(files.map(readImg));const cols=+$('#cols',panel).value,g=+gap.value,cell=+$('#cell',panel).value,bg=$('#bg',panel).value;const rows=Math.ceil(imgs.length/cols);const W=cols*cell+(cols+1)*g,H=rows*cell+(rows+1)*g;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,W,H);
    imgs.forEach((im,i)=>{const cx=i%cols,cy=(i/cols)|0,dx=g+cx*(cell+g),dy=g+cy*(cell+g),s=Math.max(cell/im.naturalWidth,cell/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;x.save();x.beginPath();x.rect(dx,dy,cell,cell);x.clip();x.drawImage(im,dx+(cell-w)/2,dy+(cell-h)/2,w,h);x.restore();});
    u.results.innerHTML='';u.results.classList.add('show');const wp=document.createElement('div');wp.className='preview show';wp.appendChild(c);u.results.appendChild(wp);c.toBlob(b=>{u.actions.className='actions show';u.actions.innerHTML='';const db=document.createElement('button');db.className='btn btn-primary';db.textContent='Download collage';db.onclick=()=>download(b,'collage.png');u.actions.appendChild(db);},'image/png');};
};

/* ===== Favicon Generator ===== */
INIT['favicon-generator']=function(panel){
  const u=dz(panel,{accept:'image/*',formats:['ICO','PNG'],sub:'Drop a square image — a logo works best.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f)return;const img=await readImg(f);const sizes=[16,32,48,64,128,180,192,512];u.results.innerHTML='';u.results.classList.add('show');const cv={};
    sizes.forEach(s=>{const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(img,0,0,s,s);cv[s]=c;c.toBlob(b=>row(u.results,c.toDataURL(),'favicon-'+s+'.png',s+'×'+s+' PNG',()=>download(b,'favicon-'+s+'x'+s+'.png')),'image/png');});
    setTimeout(()=>{try{const ico=buildIco([cv[16],cv[32],cv[48]]);u.actions.className='actions show';u.actions.innerHTML='';const b=document.createElement('button');b.className='btn btn-primary';b.textContent='Download favicon.ico';b.onclick=()=>download(ico,'favicon.ico');u.actions.appendChild(b);}catch(e){}},250);});
};

/* ===== TXT to PDF ===== */

function buildIco(canvases){const imgs=canvases.map(c=>{const bin=atob(c.toDataURL('image/png').split(',')[1]);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return{size:c.width,data:arr};});
  const count=imgs.length,header=6+count*16,total=header+imgs.reduce((a,b)=>a+b.data.length,0);const buf=new ArrayBuffer(total),dv=new DataView(buf),u8=new Uint8Array(buf);
  dv.setUint16(0,0,true);dv.setUint16(2,1,true);dv.setUint16(4,count,true);let off=header;
  imgs.forEach((im,i)=>{const e=6+i*16;u8[e]=im.size>=256?0:im.size;u8[e+1]=im.size>=256?0:im.size;dv.setUint16(e+4,1,true);dv.setUint16(e+6,32,true);dv.setUint32(e+8,im.data.length,true);dv.setUint32(e+12,off,true);u8.set(im.data,off);off+=im.data.length;});
  return new Blob([buf],{type:'image/x-icon'});}



INIT['txt-to-pdf']=function(panel){
  panel.innerHTML='<div class="ctrl"><label for="ta">Paste text, or load a .txt file</label><textarea id="ta" placeholder="Type or paste your text here…"></textarea></div><div class="controls"><label class="btn btn-ghost" style="cursor:pointer">Load .txt<input type="file" id="f" accept=".txt,text/plain" hidden></label><div class="ctrl"><label for="pg">Page</label><select id="pg"><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Create PDF</button></div><div class="status" id="st"></div>';
  const ta=$('#ta',panel),st=$('#st',panel);
  $('#f',panel).onchange=e=>{const f=e.target.files[0];if(f)f.text().then(t=>ta.value=t);};
  $('#run',panel).onclick=()=>{const txt=ta.value;if(!txt.trim()){setStatus(st,'Enter some text first.',1);return;}const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'pt',format:$('#pg',panel).value});const M=48,W=doc.internal.pageSize.getWidth()-M*2,PH=doc.internal.pageSize.getHeight()-M;doc.setFont('helvetica');doc.setFontSize(12);const lines=doc.splitTextToSize(txt,W);let y=M;lines.forEach(ln=>{if(y>PH){doc.addPage();y=M;}doc.text(ln,M,y);y+=16;});doc.save('document.pdf');setStatus(st,'PDF created.');};
};

INIT['html-to-pdf']=function(panel){
  panel.innerHTML='<div class="ctrl"><label for="ta">Paste HTML</label><textarea id="ta" placeholder="&lt;h1&gt;Hello&lt;/h1&gt;&lt;p&gt;Your HTML here…&lt;/p&gt;"></textarea></div><div class="controls"><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Render to PDF</button></div><div class="note">Renders your HTML visually and places it into an A4 PDF. External images must allow cross-origin access to appear.</div><div class="status" id="st"></div>';
  const ta=$('#ta',panel),st=$('#st',panel);
  $('#run',panel).onclick=async()=>{const html=ta.value;if(!html.trim()){setStatus(st,'Paste some HTML first.',1);return;}setStatus(st,'Rendering…');
    const box=document.createElement('div');box.style.cssText='position:fixed;left:-9999px;top:0;width:794px;padding:40px;background:#fff;color:#000;font-family:Arial,sans-serif';box.innerHTML=html;document.body.appendChild(box);
    try{const canvas=await html2canvas(box,{scale:2,backgroundColor:'#fff'});const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'pt',format:'a4'});const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();const iw=pw,ih=canvas.height*pw/canvas.width;const img=canvas.toDataURL('image/jpeg',.92);doc.addImage(img,'JPEG',0,0,iw,ih);let left=ih-ph,pos=0;while(left>0){doc.addPage();pos-=ph;doc.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;}doc.save('document.pdf');setStatus(st,'PDF created.');}catch(e){setStatus(st,'Failed: '+(e.message||e),1);}finally{box.remove();}};
};

INIT['gif-maker']=function(panel){
  const u=dz(panel,{accept:'image/*',multiple:true,formats:['IMG&#8594;GIF'],sub:'Add images in order; they become animation frames.'});
  u.controls.innerHTML='<div class="ctrl"><label for="d">Frame delay · <span class="val" id="dv">300ms</span></label><input type="range" id="d" min="80" max="1000" step="20" value="300"></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Make GIF</button>';
  let files=[];const d=$('#d',panel);d.oninput=()=>$('#dv',panel).textContent=d.value+'ms';
  dropzone(u.drop,u.file,fs=>{files=files.concat([...fs].filter(f=>f.type.startsWith('image/')));if(files.length)setStatus(u.status,files.length+' frame(s) ready.');});
  $('#run',panel).onclick=async()=>{if(files.length<1){setStatus(u.status,'Add at least one image.',1);return;}setStatus(u.status,'Building GIF…');
    const imgs=await Promise.all(files.map(readImg));const W=imgs[0].naturalWidth,H=imgs[0].naturalHeight;
    const frames=imgs.map(im=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);const s=Math.min(W/im.naturalWidth,H/im.naturalHeight);const w=im.naturalWidth*s,h=im.naturalHeight*s;x.drawImage(im,(W-w)/2,(H-h)/2,w,h);return c;});
    gifFromFrames(frames,+d.value,blob=>{u.results.innerHTML='';row(u.results,frames[0].toDataURL('image/png'),'animation.gif',imgs.length+' frames · '+fmtBytes(blob.size),()=>download(blob,'animation.gif'));setStatus(u.status,'Done.');},e=>setStatus(u.status,'Failed: '+e,1));};
};

INIT['gif-to-webp']=imgConv('image/webp','webp',{accept:'image/gif',formats:['WEBP']});
FAQ['exif-remover']=[['How does it remove metadata?','Re-drawing the photo onto a fresh canvas discards EXIF data like GPS location and camera model, then re-exports a clean JPG.'],['Are my files uploaded?','No — it all happens in your browser.']];
FAQ['gif-to-webp']=[['Does it keep animation?','This converts the first frame to a still WebP image. Animated-WebP encoding isn\'t supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== SVG rasterizer factory ===== */
function svgConv(outType,ext,bg){return function(panel){
  const u=dz(panel,{accept:'.svg,image/svg+xml',multiple:true,formats:[ext.toUpperCase()],sub:'Vector SVG rendered to '+ext.toUpperCase()+' at your chosen size.'});
  u.controls.innerHTML='<div class="ctrl"><label for="sc">Output width</label><select id="sc"><option value="512">512 px</option><option value="1024">1024 px</option><option value="256">256 px</option><option value="2048">2048 px</option></select></div>';
  dropzone(u.drop,u.file,async fs=>{const list=[...fs].filter(f=>/svg/i.test(f.type)||/\.svg$/i.test(f.name));if(!list.length)return;u.results.innerHTML='';u.results.classList.add('show');const W=+$('#sc',panel).value;
    for(const f of list){const txt=await f.text();const url=URL.createObjectURL(new Blob([txt],{type:'image/svg+xml'}));
      await new Promise(res=>{const im=new Image();im.onload=()=>{const ar=(im.naturalWidth&&im.naturalHeight)?im.naturalHeight/im.naturalWidth:1;const c=document.createElement('canvas');c.width=W;c.height=Math.round(W*ar)||W;const x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>{row(u.results,c.toDataURL(),f.name,c.width+'×'+c.height+' · '+ext.toUpperCase(),()=>download(b,f.name.replace(/\.svg$/i,'')+'.'+ext));res();},outType,.95);};im.onerror=()=>{setStatus(u.status,'Could not render '+f.name,1);res();};im.src=url;});}
  });
};}

INIT['webp-to-gif']=function(panel){
  const u=dz(panel,{accept:'image/*',formats:['GIF'],sub:'Convert a WebP image to GIF.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f)return;const img=await readImg(f);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);setStatus(u.status,'Encoding GIF…');
    gifFromFrames([c],200,blob=>{u.results.innerHTML='';row(u.results,c.toDataURL('image/png'),f.name,fmtBytes(blob.size)+' · GIF',()=>download(blob,f.name.replace(/\.[^.]+$/,'')+'.gif'));setStatus(u.status,'Done.');},e=>setStatus(u.status,'Failed: '+e,1));});
};

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

INIT['image-collage']=function(panel){
  const u=dz(panel,{accept:'image/*',multiple:true,formats:['JPG','PNG'],sub:'Add photos; they tile into a grid.'});
  u.controls.innerHTML='<div class="ctrl"><label for="cols">Columns</label><select id="cols"><option>2</option><option selected>3</option><option>4</option></select></div><div class="ctrl"><label for="gap">Gap · <span class="val" id="gv">10px</span></label><input type="range" id="gap" min="0" max="40" value="10"></div><div class="ctrl"><label for="cell">Cell</label><select id="cell"><option value="220">Medium</option><option value="160">Small</option><option value="320">Large</option></select></div><div class="ctrl"><label>Background</label><div class="color-field"><input type="color" id="bg" value="#ffffff"><span id="bgh">#ffffff</span></div></div><div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Build collage</button>';
  let files=[];const gap=$('#gap',panel);gap.oninput=()=>$('#gv',panel).textContent=gap.value+'px';$('#bg',panel).oninput=e=>$('#bgh',panel).textContent=e.target.value;
  dropzone(u.drop,u.file,fs=>{files=files.concat([...fs].filter(f=>f.type.startsWith('image/')));if(files.length)setStatus(u.status,files.length+' photo(s) ready.');});
  $('#run',panel).onclick=async()=>{if(!files.length){setStatus(u.status,'Add some photos first.',1);return;}const imgs=await Promise.all(files.map(readImg));const cols=+$('#cols',panel).value,g=+gap.value,cell=+$('#cell',panel).value,bg=$('#bg',panel).value;const rows=Math.ceil(imgs.length/cols);const W=cols*cell+(cols+1)*g,H=rows*cell+(rows+1)*g;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,W,H);
    imgs.forEach((im,i)=>{const cx=i%cols,cy=(i/cols)|0,dx=g+cx*(cell+g),dy=g+cy*(cell+g),s=Math.max(cell/im.naturalWidth,cell/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;x.save();x.beginPath();x.rect(dx,dy,cell,cell);x.clip();x.drawImage(im,dx+(cell-w)/2,dy+(cell-h)/2,w,h);x.restore();});
    u.results.innerHTML='';u.results.classList.add('show');const wp=document.createElement('div');wp.className='preview show';wp.appendChild(c);u.results.appendChild(wp);c.toBlob(b=>{u.actions.className='actions show';u.actions.innerHTML='';const db=document.createElement('button');db.className='btn btn-primary';db.textContent='Download collage';db.onclick=()=>download(b,'collage.png');u.actions.appendChild(db);},'image/png');};
};

INIT['favicon-generator']=function(panel){
  const u=dz(panel,{accept:'image/*',formats:['ICO','PNG'],sub:'Drop a square image — a logo works best.'});
  dropzone(u.drop,u.file,async fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f)return;const img=await readImg(f);const sizes=[16,32,48,64,128,180,192,512];u.results.innerHTML='';u.results.classList.add('show');const cv={};
    sizes.forEach(s=>{const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(img,0,0,s,s);cv[s]=c;c.toBlob(b=>row(u.results,c.toDataURL(),'favicon-'+s+'.png',s+'×'+s+' PNG',()=>download(b,'favicon-'+s+'x'+s+'.png')),'image/png');});
    setTimeout(()=>{try{const ico=buildIco([cv[16],cv[32],cv[48]]);u.actions.className='actions show';u.actions.innerHTML='';const b=document.createElement('button');b.className='btn btn-primary';b.textContent='Download favicon.ico';b.onclick=()=>download(ico,'favicon.ico');u.actions.appendChild(b);}catch(e){}},250);});
};


/* ════════════════════════════════════════════════════════════
   NEW CONVERTER TOOLS
   ════════════════════════════════════════════════════════════ */

/* 1 ── Word to PDF */
INIT['word-to-pdf']=function(panel){
  var u=dz(panel,{accept:'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',multiple:false,formats:['DOCX\u2192PDF'],sub:'Upload a .docx Word document to convert to PDF in your browser.'});
  u.onFiles=function(files){
    if(!files.length)return;
    var file=files[0];
    if(!file.name.match(/\.docx$/i)){setStatus(u.status,'Please upload a .docx file','err');return;}
    if(typeof mammoth==='undefined'){setStatus(u.status,'mammoth.js not loaded yet — please wait a moment and try again','err');return;}
    setStatus(u.status,'Converting...','busy');
    var reader=new FileReader();
    reader.onload=function(e){
      mammoth.convertToHtml({arrayBuffer:e.target.result}).then(function(result){
        var html=result.value;
        var warnings=result.messages.filter(function(m){return m.type==='warning';});
        var title=file.name.replace(/\.docx$/i,'');
        var win=window.open('','_blank','width=900,height=700');
        if(!win){setStatus(u.status,'Popup blocked — please allow popups and try again','err');return;}
        win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title>'
          +'<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;font-size:13pt;color:#111}'
          +'h1,h2,h3,h4{color:#0a0a0a;margin-top:1.5em}p{margin:0.8em 0}'
          +'table{border-collapse:collapse;width:100%;margin:1em 0}'
          +'td,th{border:1px solid #ccc;padding:6px 10px;text-align:left}'
          +'img{max-width:100%}'
          +'@media print{body{margin:0;padding:20px}}'
          +'</style></head><body>'
          +'<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:11pt;font-family:sans-serif;color:#0369a1">'
          +'&#8505; Press <strong>Ctrl+P</strong> (or Cmd+P on Mac) and choose <strong>Save as PDF</strong> to download the PDF.'
          +(warnings.length?' <br>⚠ '+warnings.length+' formatting note(s) detected.':'')
          +'</div>'+html+'</body></html>');
        win.document.close();
        win.focus();
        setStatus(u.status,'Print window opened — use Ctrl+P → Save as PDF','ok');
      }).catch(function(err){
        setStatus(u.status,'Conversion failed: '+err.message,'err');
      });
    };
    reader.readAsArrayBuffer(file);
  };
};

/* 2 ── Markdown to HTML */
INIT['markdown-to-html']=function(panel){
  panel.innerHTML=''
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">'
    +'<div><label for="md-in" style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:6px;font-weight:600">MARKDOWN INPUT</label>'
    +'<textarea id="md-in" rows="16" placeholder="# Hello\n\nType your **Markdown** here...\n\n- Item 1\n- Item 2" style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-family:var(--fm);font-size:13px;resize:vertical;line-height:1.55;box-sizing:border-box"></textarea></div>'
    +'<div id="md-tabs-wrap"><label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:6px;font-weight:600">OUTPUT</label>'
    +'<div style="display:flex;gap:6px;margin-bottom:8px">'
    +'<button class="btn active" id="md-preview-btn" style="font-size:12px;padding:5px 12px">Preview</button>'
    +'<button class="btn" id="md-html-btn" style="font-size:12px;padding:5px 12px">HTML Code</button>'
    +'</div>'
    +'<div id="md-preview" style="min-height:200px;padding:12px 14px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-size:13.5px;line-height:1.7;overflow:auto"></div>'
    +'<textarea id="md-html-out" rows="16" readonly style="display:none;width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-family:monospace;font-size:12px;resize:vertical;line-height:1.55;box-sizing:border-box"></textarea>'
    +'</div></div>'
    +'<div class="controls"><button class="btn btn-primary" id="md-copy">Copy HTML</button><button class="btn" id="md-dl">Download .html</button><button class="btn" id="md-clear">Clear</button></div>'
    +'<style>#md-preview h1,#md-preview h2,#md-preview h3{margin:1em 0 .4em;font-family:var(--fd)}#md-preview p{margin:.6em 0}#md-preview code{background:rgba(255,255,255,.07);padding:2px 6px;border-radius:4px;font-family:monospace}#md-preview pre code{display:block;padding:10px;overflow:auto;border-radius:8px}#md-preview ul,#md-preview ol{padding-left:20px;margin:.5em 0}#md-preview blockquote{border-left:3px solid var(--p1);margin:0;padding-left:14px;color:var(--text-dim)}#md-preview table{border-collapse:collapse;width:100%}#md-preview td,#md-preview th{border:1px solid var(--border);padding:6px 10px}#md-preview a{color:var(--p1)}</style>';

  var isPreview=true;
  function render(){
    var md=document.getElementById('md-in').value;
    if(typeof marked==='undefined'){document.getElementById('md-preview').textContent='Loading renderer...';return;}
    var html=marked.parse(md||'');
    document.getElementById('md-preview').innerHTML=html;
    document.getElementById('md-html-out').value=html;
  }
  document.getElementById('md-in').addEventListener('input',render);
  document.getElementById('md-preview-btn').onclick=function(){
    isPreview=true;
    document.getElementById('md-preview').style.display='block';
    document.getElementById('md-html-out').style.display='none';
    this.classList.add('active');
    document.getElementById('md-html-btn').classList.remove('active');
  };
  document.getElementById('md-html-btn').onclick=function(){
    isPreview=false;
    document.getElementById('md-preview').style.display='none';
    document.getElementById('md-html-out').style.display='block';
    this.classList.add('active');
    document.getElementById('md-preview-btn').classList.remove('active');
  };
  document.getElementById('md-copy').onclick=function(){
    var html=document.getElementById('md-html-out').value;
    navigator.clipboard.writeText(html).then(function(){toast('HTML copied!','ok');});
  };
  document.getElementById('md-dl').onclick=function(){
    var html=document.getElementById('md-html-out').value;
    var full='<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document</title></head>\n<body>\n'+html+'\n</body>\n</html>';
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([full],{type:'text/html'}));
    a.download='document.html';a.click();
  };
  document.getElementById('md-clear').onclick=function(){
    document.getElementById('md-in').value='';
    document.getElementById('md-preview').innerHTML='';
    document.getElementById('md-html-out').value='';
  };
  render();
};
