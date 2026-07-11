/* TARUMAK STUDIO — converter-tools.js  (8 converter tools) */

/* ===== Inline GIF89a encoder — no Worker, no dependency, works everywhere.
   REWRITTEN: the previous encoder emitted an LZW stream real decoders
   reject (reproduced: PIL "broken data stream"; user reports: Windows
   "Unsupported file type"). Root cause was the LZW code-size/clear
   handling; rather than patch a subtly-wrong bit packer this is a clean
   spec-correct implementation, verified against strict decoders.
   Quality upgrades over the old one:
   - palette built from ALL frames (was: first frame only) via median-cut
     (was: 6-bit posterise + frequency top-256 — visible banding)
   - ordered (Bayer 4x4) dithering option for smooth gradients
   - identical public surface: gifMakeBlob(frames, delayMs) -> Uint8Array */
function gifMakeBlob(frames,delayMs,opts){
  opts=opts||{};var dither=opts.dither!==false;
  var W=frames[0].width,H=frames[0].height;

  /* ── 1. Gather pixels ── */
  var all=frames.map(function(cv){return cv.getContext('2d').getImageData(0,0,W,H).data;});

  /* ── 2. Median-cut palette from a sample of EVERY frame ── */
  function buildPalette(){
    var pts=[];var stride=Math.max(1,Math.floor((W*H*all.length)/40000))*4;
    for(var f=0;f<all.length;f++){var d=all[f];
      for(var i=0;i<d.length;i+=stride){pts.push([d[i],d[i+1],d[i+2]]);}}
    var boxes=[pts];
    while(boxes.length<256){
      boxes.sort(function(a,b){return spread(b)-spread(a);});
      var box=boxes.shift();if(!box||box.length<2){if(box)boxes.push(box);break;}
      var ch=widestChannel(box);
      box.sort(function(a,b){return a[ch]-b[ch];});
      var mid=box.length>>1;
      boxes.push(box.slice(0,mid),box.slice(mid));
    }
    var pal=new Uint8Array(768);
    boxes.forEach(function(box,i){
      var r=0,g=0,b=0,n=box.length||1;
      box.forEach(function(p){r+=p[0];g+=p[1];b+=p[2];});
      pal[i*3]=r/n|0;pal[i*3+1]=g/n|0;pal[i*3+2]=b/n|0;
    });
    return {pal:pal,count:Math.max(2,boxes.length)};
    function spread(box){if(box.length<2)return 0;var mn=[255,255,255],mx=[0,0,0];box.forEach(function(p){for(var c=0;c<3;c++){if(p[c]<mn[c])mn[c]=p[c];if(p[c]>mx[c])mx[c]=p[c];}});return (mx[0]-mn[0])+(mx[1]-mn[1])+(mx[2]-mn[2]);}
    function widestChannel(box){var mn=[255,255,255],mx=[0,0,0];box.forEach(function(p){for(var c=0;c<3;c++){if(p[c]<mn[c])mn[c]=p[c];if(p[c]>mx[c])mx[c]=p[c];}});var d=[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]];return d[0]>=d[1]&&d[0]>=d[2]?0:(d[1]>=d[2]?1:2);}
  }
  var P=buildPalette(),pal=P.pal;

  /* ── 3. Nearest-palette mapping with cache + optional Bayer dithering ── */
  var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  var cache=new Map();
  function nearest(r,g,b){
    var ck=(r<<16)|(g<<8)|b,hit=cache.get(ck);
    if(hit!==undefined)return hit;
    var best=0,bd=Infinity;
    for(var j=0;j<256;j++){var dr=r-pal[j*3],dg=g-pal[j*3+1],db=b-pal[j*3+2],d=dr*dr+dg*dg+db*db;if(d<bd){bd=d;best=j;if(!d)break;}}
    cache.set(ck,best);return best;
  }
  function mapFrame(rgba){
    var n=W*H,out=new Uint8Array(n);
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){
      var i=(y*W+x),o=i*4,r=rgba[o],g=rgba[o+1],b=rgba[o+2];
      if(dither){var t=(BAYER[(y&3)*4+(x&3)]/16-0.5)*14;
        r=Math.max(0,Math.min(255,r+t))|0;g=Math.max(0,Math.min(255,g+t))|0;b=Math.max(0,Math.min(255,b+t))|0;}
      out[i]=nearest(r,g,b);
    }
    return out;
  }

  /* ── 4. Spec-correct GIF LZW (variable code size, deferred clear) ── */
  function lzwEncode(indices,minCodeSize){
    var CLEAR=1<<minCodeSize,EOI=CLEAR+1;
    var out=[],acc=0,nbits=0;
    var codeSize,dict,next;
    function put(code){
      acc|=code<<nbits;nbits+=codeSize;
      while(nbits>=8){out.push(acc&255);acc>>=8;nbits-=8;}
    }
    function reset(){dict=Object.create(null);next=EOI+1;codeSize=minCodeSize+1;}
    reset();put(CLEAR);
    var prev=String(indices[0]);
    for(var i=1;i<indices.length;i++){
      var c=indices[i],key=prev+","+c;
      if(dict[key]!==undefined){prev=key;continue;}
      /* emit code for prev (root index or dict entry) */
      put(prev.indexOf(",")<0?+prev:dict[prev]);
      if(next<4096){
        dict[key]=next++;
        if(next-1===(1<<codeSize)&&codeSize<12)codeSize++;
      }else{
        put(CLEAR);reset();
      }
      prev=String(c);
    }
    put(prev.indexOf(",")<0?+prev:dict[prev]);
    put(EOI);
    if(nbits>0)out.push(acc&255);
    return out;
  }

  /* ── 5. Assemble the file ── */
  var by=[];
  function pu(){for(var i=0;i<arguments.length;i++)by.push(arguments[i]);}
  function p16(v){by.push(v&255,(v>>8)&255);}
  pu(0x47,0x49,0x46,0x38,0x39,0x61);           /* "GIF89a" */
  p16(W);p16(H);pu(0xf7,0x00,0x00);            /* GCT: 256 entries */
  for(var i=0;i<768;i++)by.push(pal[i]);
  if(frames.length>1){                          /* NETSCAPE loop ext only when animated */
    pu(0x21,0xff,0x0b);
    "NETSCAPE2.0".split("").forEach(function(ch){by.push(ch.charCodeAt(0));});
    pu(0x03,0x01,0x00,0x00,0x00);
  }
  var dcs=Math.max(2,Math.round(delayMs/10));   /* <2cs is ignored/clamped by browsers */
  for(var fi=0;fi<frames.length;fi++){
    var idx=mapFrame(all[fi]);
    pu(0x21,0xf9,0x04,0x04);p16(dcs);pu(0x00,0x00); /* GCE: disposal=1 (keep), no transparency */
    pu(0x2c);p16(0);p16(0);p16(W);p16(H);pu(0x00);
    pu(0x08);                                     /* LZW min code size */
    var stream=lzwEncode(idx,8);
    for(var s=0;s<stream.length;s+=255){
      var len=Math.min(255,stream.length-s);
      by.push(len);
      for(var k=0;k<len;k++)by.push(stream[s+k]);
    }
    pu(0x00);
  }
  pu(0x3b);
  return new Uint8Array(by);
}
function gifFromFrames(frames,delayMs,cb,errCb){
  /* Encode, then VERIFY: the blob must decode as a real image in this
     browser before any download is offered. A corrupted GIF can never
     reach the user's disk. */
  var blob;
  try{blob=new Blob([gifMakeBlob(frames,delayMs)],{type:'image/gif'});}
  catch(e){errCb&&errCb(e);return;}
  var url=URL.createObjectURL(blob),probe=new Image();
  probe.onload=function(){URL.revokeObjectURL(url);
    if(!probe.naturalWidth){errCb&&errCb(new Error('encoded GIF failed verification'));return;}
    cb(blob);};
  probe.onerror=function(){URL.revokeObjectURL(url);errCb&&errCb(new Error('encoded GIF failed decode verification \u2014 download blocked'));};
  probe.src=url;
}

/* ===== GIF Maker ===== */
/* ===== WebP to GIF ===== */
FAQ['webp-to-gif']=[['Does it keep animation?','This converts a still WebP into a single-frame GIF. Decoding animated WebP frames is not supported by browsers.'],['Are my files uploaded?','No — conversion is fully local.']];

/* ===== Color Picker ===== */
/* ===== Image Collage ===== */
/* ===== Favicon Generator ===== */
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

/* Convert any modern CSS colour function html2canvas 1.4.1 can't parse
   (oklch / oklab / lab / lch / color() / color-mix) into a plain rgb()
   string, by letting the browser itself resolve it. This is the root-cause
   fix for "Attempting to parse an unsupported color function oklch". */
function _cssColorToRgb(val){
  if(!val)return val;
  if(!/oklch|oklab|\blab\(|\blch\(|color\(|color-mix/i.test(val))return val;
  try{
    var probe=document.createElement('span');
    probe.style.color='rgb(0,0,0)';probe.style.color=val; /* invalid → stays black; valid modern → set */
    probe.style.position='fixed';probe.style.left='-99999px';
    document.body.appendChild(probe);
    var out=getComputedStyle(probe).color; /* browsers serialise to rgb()/rgba() */
    document.body.removeChild(probe);
    return /oklch|oklab|lab|lch|color/i.test(out)?'rgb(0,0,0)':out;
  }catch(e){return 'rgb(0,0,0)';}
}
/* Walk the live render box and inline every colour-bearing property as a
   resolved rgb value, so html2canvas never meets an oklch token — whether it
   came from the pasted HTML or from inherited page CSS variables. */
function _sanitizeColors(root){
  var PROPS=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','textDecorationColor','columnRuleColor','caretColor','fill','stroke'];
  var els=[root].concat([].slice.call(root.querySelectorAll('*')));
  els.forEach(function(el){
    if(el.nodeType!==1)return;
    var cs=getComputedStyle(el);
    PROPS.forEach(function(p){
      var v=cs[p];
      if(v&&/oklch|oklab|\blab\(|\blch\(|color\(|color-mix/i.test(v)){
        try{el.style[p]=_cssColorToRgb(v);}catch(e){}
      }else if(v){
        /* already rgb — but pin it inline so inherited-var resolution can't
           re-introduce a modern function inside html2canvas's own walker */
        try{el.style[p]=v;}catch(e){}
      }
    });
    /* box-shadow / background gradients can also carry modern colours */
    var sh=cs.boxShadow;
    if(sh&&/oklch|oklab|\blab\(|\blch\(|color\(|color-mix/i.test(sh))el.style.boxShadow='none';
    var bg=cs.backgroundImage;
    if(bg&&bg!=='none'&&/oklch|oklab|\blab\(|\blch\(|color\(|color-mix/i.test(bg))el.style.backgroundImage='none';
  });
}

INIT['html-to-pdf']=function(panel){
  var SIZES={a4:[595.28,841.89],letter:[612,792],legal:[612,1008]};
  panel.innerHTML='<div class="ctrl"><label for="ta">Paste HTML</label><textarea id="ta" placeholder="&lt;h1&gt;Hello&lt;/h1&gt;&lt;p&gt;Your HTML here…&lt;/p&gt;"></textarea></div>'+
    '<div class="controls">'+
      '<div class="ctrl"><label for="pg">Paper</label><select id="pg"><option value="a4">A4</option><option value="letter">Letter</option><option value="legal">Legal</option></select></div>'+
      '<div class="ctrl"><label for="or">Orientation</label><select id="or"><option value="p">Portrait</option><option value="l">Landscape</option></select></div>'+
      '<div class="ctrl-spacer"></div><button class="btn btn-primary" id="run">Render to PDF</button>'+
    '</div>'+
    '<div class="note">Renders your HTML visually into a PDF. Modern CSS colours (oklch, lab, lch, color-mix) are converted automatically. External images must allow cross-origin access to appear.</div>'+
    '<div class="status" id="st"></div>';
  const ta=$('#ta',panel),st=$('#st',panel);
  $('#run',panel).onclick=async()=>{
    const html=ta.value;if(!html.trim()){setStatus(st,'Paste some HTML first.',1);return;}
    if(typeof html2canvas!=='function'){setStatus(st,'Renderer still loading — try again in a moment.',1);return;}
    setStatus(st,'Rendering\u2026');
    const size=SIZES[$('#pg',panel).value]||SIZES.a4;
    const orient=$('#or',panel).value;
    /* CSS px width of the render box = paper width in px at 96dpi (pt/72*96) */
    const paperWpt=(orient==='l')?size[1]:size[0];
    const boxW=Math.round(paperWpt/72*96);
    const box=document.createElement('div');
    box.style.cssText='position:fixed;left:-99999px;top:0;width:'+boxW+'px;padding:40px;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box';
    box.innerHTML=html;document.body.appendChild(box);
    /* let fonts/images settle a tick before measuring */
    await new Promise(r=>setTimeout(r,30));
    try{
      _sanitizeColors(box); /* ← the oklch fix */
      const canvas=await html2canvas(box,{
        scale:Math.min(2,(window.devicePixelRatio||1)*2),
        backgroundColor:'#fff',
        useCORS:true,
        logging:false,
        onclone:function(doc){var c=doc.body.querySelector('div');if(c)_sanitizeColors(c);}
      });
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({unit:'pt',format:$('#pg',panel).value,orientation:orient});
      const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
      const iw=pw,ih=canvas.height*pw/canvas.width;
      const img=canvas.toDataURL('image/jpeg',.95);
      doc.addImage(img,'JPEG',0,0,iw,ih,'','FAST');
      let left=ih-ph,pos=0;
      while(left>0.5){doc.addPage();pos-=ph;doc.addImage(img,'JPEG',0,pos,iw,ih,'','FAST');left-=ph;}
      doc.save('document.pdf');
      setStatus(st,'PDF created.');
    }catch(e){
      console.error('[html-to-pdf]',e);
      setStatus(st,'Failed: '+(e&&e.message||e),1);
    }finally{box.remove();}
  };
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

/* ===== PNG → SVG — intelligent vector tracing, fully client-side =====
   Pipeline: median-cut color quantization → per-color connected regions
   → Moore boundary tracing → Douglas-Peucker simplification → optional
   Chaikin smoothing → grouped, editable SVG paths. No libraries. */
INIT['png-to-svg']=function(panel){
  var u=dz(panel,{accept:'image/png,image/webp,image/jpeg',formats:['PNG\u2192SVG'],sub:'Best for logos, icons, signatures and flat-color graphics \u2014 not photographs.'});
  u.controls.innerHTML=
    '<div class="ctrl"><label for="p2s-c">Colors \u00b7 <span class="val" id="p2s-cv">6</span></label><input type="range" id="p2s-c" min="2" max="16" step="1" value="6"></div>'
   +'<div class="ctrl"><label for="p2s-d">Detail \u00b7 <span class="val" id="p2s-dv">Balanced</span></label><input type="range" id="p2s-d" min="1" max="3" step="1" value="2"></div>'
   +'<div class="ctrl" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="p2s-s" checked style="width:16px;height:16px;accent-color:var(--p1)"><label for="p2s-s" style="margin:0">Smooth curves</label></div>'
   +'<div class="ctrl-spacer"></div><button class="btn btn-primary" id="p2s-run" disabled>Trace to SVG</button>';
  var DLBL={1:'Simple',2:'Balanced',3:'Detailed'};
  var cS=$('#p2s-c',panel),dS=$('#p2s-d',panel);
  cS.oninput=function(){$('#p2s-cv',panel).textContent=cS.value;};
  dS.oninput=function(){$('#p2s-dv',panel).textContent=DLBL[dS.value];};
  var img=null,fname='image';
  dropzone(u.drop,u.file,function(fs){
    var f=[].slice.call(fs).find(function(x){return x.type.indexOf('image/')===0;});
    if(!f){setStatus(u.status,'Please drop an image file.',1);return;}
    fname=f.name.replace(/\.[^.]+$/,'');
    readImg(f).then(function(im){img=im;$('#p2s-run',panel).disabled=false;
      setStatus(u.status,im.naturalWidth+'\u00d7'+im.naturalHeight+' loaded \u2014 choose options and trace.');});
  });

  function dist2seg(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay;var L=dx*dx+dy*dy;var t=L?((px-ax)*dx+(py-ay)*dy)/L:0;t=Math.max(0,Math.min(1,t));var qx=ax+t*dx,qy=ay+t*dy;return (px-qx)*(px-qx)+(py-qy)*(py-qy);}
  function simplify(pts,tol){ /* Douglas-Peucker, iterative */
    if(pts.length<4)return pts;var t2=tol*tol,keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;var stack=[[0,pts.length-1]];
    while(stack.length){var seg=stack.pop(),a=seg[0],b=seg[1];var mx=0,mi=-1;
      for(var i=a+1;i<b;i++){var d=dist2seg(pts[i][0],pts[i][1],pts[a][0],pts[a][1],pts[b][0],pts[b][1]);if(d>mx){mx=d;mi=i;}}
      if(mx>t2&&mi>0){keep[mi]=1;stack.push([a,mi],[mi,b]);}}
    var out=[];for(var j=0;j<pts.length;j++)if(keep[j])out.push(pts[j]);return out;}
  function chaikin(pts){var out=[];for(var i=0;i<pts.length;i++){var a=pts[i],b=pts[(i+1)%pts.length];
    out.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]);}return out;}

  $('#p2s-run',panel).onclick=function(){
    if(!img)return;
    setStatus(u.status,'Tracing\u2026');
    setTimeout(function(){try{
      var K=+cS.value,detail=+dS.value,smooth=$('#p2s-s',panel).checked;
      var MAX=[220,340,520][detail-1];
      var sc=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
      var W=Math.max(2,Math.round(img.naturalWidth*sc)),H=Math.max(2,Math.round(img.naturalHeight*sc));
      var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
      x.imageSmoothingQuality='high';x.drawImage(img,0,0,W,H);
      var rgba=x.getImageData(0,0,W,H).data;
      /* median-cut over opaque pixels */
      var pts=[];for(var i=0;i<rgba.length;i+=4)if(rgba[i+3]>=128)pts.push([rgba[i],rgba[i+1],rgba[i+2]]);
      if(!pts.length){setStatus(u.status,'The image is fully transparent \u2014 nothing to trace.',1);return;}
      var boxes=[pts];
      function ext(box){var mn=[255,255,255],mx=[0,0,0];for(var i=0;i<box.length;i++)for(var ch=0;ch<3;ch++){var v=box[i][ch];if(v<mn[ch])mn[ch]=v;if(v>mx[ch])mx[ch]=v;}return[mn,mx];}
      while(boxes.length<K){boxes.sort(function(a,b){var ea=ext(a),eb=ext(b);return((eb[1][0]-eb[0][0])+(eb[1][1]-eb[0][1])+(eb[1][2]-eb[0][2]))-((ea[1][0]-ea[0][0])+(ea[1][1]-ea[0][1])+(ea[1][2]-ea[0][2]));});
        var bx=boxes.shift();if(!bx||bx.length<2){if(bx)boxes.push(bx);break;}
        var e=ext(bx),d=[e[1][0]-e[0][0],e[1][1]-e[0][1],e[1][2]-e[0][2]];var ch=d[0]>=d[1]&&d[0]>=d[2]?0:(d[1]>=d[2]?1:2);
        bx.sort(function(a,b){return a[ch]-b[ch];});var mid=bx.length>>1;boxes.push(bx.slice(0,mid),bx.slice(mid));}
      var pal=boxes.map(function(b){var r=0,g=0,bl=0,n=b.length||1;for(var i=0;i<b.length;i++){r+=b[i][0];g+=b[i][1];bl+=b[i][2];}return[r/n|0,g/n|0,bl/n|0];});
      /* label map: -1 transparent */
      var lab=new Int16Array(W*H);
      for(var p=0,q=0;p<rgba.length;p+=4,q++){
        if(rgba[p+3]<128){lab[q]=-1;continue;}
        var r=rgba[p],g=rgba[p+1],b=rgba[p+2],best=0,bd=1e9;
        for(var j=0;j<pal.length;j++){var dr=r-pal[j][0],dg=g-pal[j][1],db=b-pal[j][2],dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;best=j;}}
        lab[q]=best;}
      /* per color: connected components (4-neigh flood) then Moore boundary trace */
      var tol=[2.2,1.3,0.7][detail-1];
      var groups=[];
      for(var col=0;col<pal.length;col++){
        var mask=new Uint8Array(W*H);var any=false;
        for(var q2=0;q2<lab.length;q2++)if(lab[q2]===col){mask[q2]=1;any=true;}
        if(!any)continue;
        var seen=new Uint8Array(W*H),paths=[];
        function at(xx,yy){return xx>=0&&yy>=0&&xx<W&&yy<H&&mask[yy*W+xx]===1;}
        for(var yy=0;yy<H;yy++)for(var xx=0;xx<W;xx++){
          var id=yy*W+xx;
          if(mask[id]!==1||seen[id])continue;
          /* flood-fill mark component + find its top-left boundary start */
          var stack=[id],comp=[];seen[id]=1;
          while(stack.length){var cur=stack.pop();comp.push(cur);var cx=cur%W,cy=(cur/W)|0;
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(dv){var nx=cx+dv[0],ny=cy+dv[1];if(nx>=0&&ny>=0&&nx<W&&ny<H){var nid=ny*W+nx;if(mask[nid]===1&&!seen[nid]){seen[nid]=1;stack.push(nid);}}});}
          if(comp.length<4)continue; /* speck removal */
          /* Moore boundary from the component's top-left pixel */
          var s=comp[0];comp.forEach(function(cc){if(((cc/W)|0)<((s/W)|0)||(((cc/W)|0)===((s/W)|0)&&cc%W<s%W))s=cc;});
          var sx=s%W,sy=(s/W)|0;
          var DIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
          var bpts=[[sx,sy]],px2=sx,py2=sy,dir=6,guard=comp.length*8+64;
          while(guard-->0){
            var found=false;
            for(var k2=0;k2<8;k2++){var nd=(dir+6+k2)%8;var nx2=px2+DIRS[nd][0],ny2=py2+DIRS[nd][1];
              if(at(nx2,ny2)){px2=nx2;py2=ny2;dir=nd;found=true;break;}}
            if(!found)break;
            if(px2===sx&&py2===sy)break;
            bpts.push([px2,py2]);}
          if(bpts.length<3)continue;
          var sp=simplify(bpts,tol);
          if(smooth&&sp.length>3)sp=simplify(chaikin(sp),tol*0.6);
          if(sp.length<3)continue;
          var dstr='M'+sp.map(function(pt){return (Math.round(pt[0]*10)/10)+' '+(Math.round(pt[1]*10)/10);}).join('L')+'Z';
          paths.push(dstr);
        }
        if(paths.length)groups.push({color:pal[col],d:paths.join('')});
      }
      if(!groups.length){setStatus(u.status,'No traceable shapes found \u2014 try more colors or higher detail.',1);return;}
      var hex=function(carr){return '#'+carr.map(function(v){return v.toString(16).padStart(2,'0');}).join('');};
      var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+img.naturalWidth+'" height="'+img.naturalHeight+'">'
        +groups.map(function(g){return '<path fill="'+hex(g.color)+'" d="'+g.d+'"/>';}).join('')+'</svg>';
      var blob=new Blob([svg],{type:'image/svg+xml'});
      u.results.innerHTML='';u.results.classList.add('show');
      var wrap=document.createElement('div');wrap.className='preview show';
      wrap.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center';
      var left=document.createElement('img');left.src=c.toDataURL();left.alt='Original';left.style.cssText='max-width:100%;border-radius:8px';
      var right=document.createElement('img');right.src=URL.createObjectURL(blob);right.alt='Traced SVG preview';right.style.cssText='max-width:100%;border-radius:8px;background:repeating-conic-gradient(rgba(255,255,255,.06) 0 25%,transparent 0 50%) 0 0/16px 16px';
      wrap.appendChild(left);wrap.appendChild(right);u.results.appendChild(wrap);
      row(u.results,null,fname+'.svg',groups.length+' color layer'+(groups.length>1?'s':'')+' \u00b7 '+fmtBytes(blob.size),function(){download(blob,fname+'.svg');});
      setStatus(u.status,'Done \u2014 '+groups.length+' editable color layer'+(groups.length>1?'s':'')+'.');
    }catch(e){setStatus(u.status,'Tracing failed: '+e.message,1);}},30);
  };
};

/* 1 ── Word to PDF
   ROOT-CAUSE FIX: the previous version assigned `u.onFiles = fn` — a
   callback property that nothing in the codebase ever reads. File
   delivery only happens through dropzone(u.drop, u.file, cb), which was
   never called, so the tool accepted nothing (clicking the drop area
   didn't even open the picker). Also fixed: setStatus's third argument
   is a boolean error flag; passing 'ok'/'busy' strings styled every
   message as an error. And the popup-window print flow is replaced with
   a hidden same-origin iframe — immune to popup blockers. */
INIT['word-to-pdf']=function(panel){
  var u=dz(panel,{accept:'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',multiple:false,formats:['DOCX\u2192PDF'],sub:'Upload a .docx Word document — converted to PDF entirely in your browser.'});
  dropzone(u.drop,u.file,function(files){
    var file=[].slice.call(files).find(function(f){
      return /\.docx$/i.test(f.name)||f.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });
    if(!file){setStatus(u.status,'That is not a .docx file. Legacy .doc files are not supported \u2014 re-save as .docx in Word first.',1);return;}
    if(typeof mammoth==='undefined'){setStatus(u.status,'The converter library has not finished loading \u2014 check your connection and try again in a moment.',1);return;}
    setStatus(u.status,'Reading document\u2026');
    file.arrayBuffer().then(function(buf){
      return mammoth.convertToHtml({arrayBuffer:buf});
    }).then(function(result){
      var html=result.value;
      if(!html||!html.trim()){setStatus(u.status,'The document appears to be empty or could not be read.',1);return;}
      var warnings=result.messages.filter(function(m){return m.type==='warning';}).length;
      var title=file.name.replace(/\.docx$/i,'');
      /* Hidden same-origin iframe: no popups, no blockers. */
      var old=document.getElementById('w2p-frame');if(old)old.remove();
      var fr=document.createElement('iframe');
      fr.id='w2p-frame';fr.style.cssText='position:fixed;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(fr);
      var doc=fr.contentDocument;
      doc.open();
      doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title.replace(/</g,'&lt;')+'</title>'
        +'<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;font-size:12.5pt;color:#111}'
        +'h1,h2,h3,h4{margin-top:1.4em}p{margin:.7em 0}table{border-collapse:collapse;width:100%;margin:1em 0}'
        +'td,th{border:1px solid #bbb;padding:6px 10px;text-align:left}img{max-width:100%}'
        +'@media print{body{margin:0;padding:16px}}</style></head><body>'+html+'</body></html>');
      doc.close();
      setStatus(u.status,'Ready \u2014 choose \u201cSave as PDF\u201d in the print dialog.'+(warnings?' ('+warnings+' formatting note'+(warnings>1?'s':'')+' \u2014 complex layouts may simplify.)':''));
      setTimeout(function(){
        try{fr.contentWindow.focus();fr.contentWindow.print();}
        catch(e){setStatus(u.status,'Could not open the print dialog: '+e.message,1);}
      },150);
    }).catch(function(err){
      setStatus(u.status,'Conversion failed: '+(err&&err.message?err.message:'the file could not be parsed as a Word document.'),1);
    });
  });
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
