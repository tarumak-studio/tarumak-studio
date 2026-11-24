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
  /* maxColors: new, optional, backward-compatible. Existing callers
     (gif-maker, webp-to-gif) never pass this, so they keep getting the
     original 256-color behavior unchanged. Must be a power of 2 between
     2 and 256 per the GIF spec's color-table-size encoding — clamped
     and rounded here so a caller can't hand this a value that would
     produce a malformed header. */
  var maxColors=opts.maxColors?Math.pow(2,Math.max(1,Math.min(8,Math.round(Math.log2(Math.max(2,Math.min(256,opts.maxColors))))))):256;
  var W=frames[0].width,H=frames[0].height;

  /* ── 1. Gather pixels ── */
  var all=frames.map(function(cv){return cv.getContext('2d').getImageData(0,0,W,H).data;});

  /* ── 2. Median-cut palette from a sample of EVERY frame ── */
  function buildPalette(){
    var pts=[];var stride=Math.max(1,Math.floor((W*H*all.length)/40000))*4;
    for(var f=0;f<all.length;f++){var d=all[f];
      for(var i=0;i<d.length;i+=stride){pts.push([d[i],d[i+1],d[i+2]]);}}
    var boxes=[pts];
    while(boxes.length<maxColors){
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
  /* Actual palette entry count used, rounded UP to the nearest power of
     2 for the GCT-size header field (GIF requires this); nearest() below
     must still only search the real, possibly-smaller, entry count. */
  var gctEntries=1;while(gctEntries<P.count)gctEntries*=2;gctEntries=Math.max(2,gctEntries);

  /* ── 3. Nearest-palette mapping with cache + optional Bayer dithering ── */
  var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  var cache=new Map();
  function nearest(r,g,b){
    var ck=(r<<16)|(g<<8)|b,hit=cache.get(ck);
    if(hit!==undefined)return hit;
    var best=0,bd=Infinity;
    for(var j=0;j<P.count;j++){var dr=r-pal[j*3],dg=g-pal[j*3+1],db=b-pal[j*3+2],d=dr*dr+dg*dg+db*db;if(d<bd){bd=d;best=j;if(!d)break;}}
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
  /* GCT-size field = log2(gctEntries)-1, packed into the low 3 bits.
     0xF0 carries the same GCT-flag(1)/color-res(7)/sort(0) bits the
     original hardcoded 0xf7 did — only the size field now varies. */
  var gctSizeField=Math.round(Math.log2(gctEntries))-1;
  pu(0x47,0x49,0x46,0x38,0x39,0x61);           /* "GIF89a" */
  p16(W);p16(H);pu(0xF0|gctSizeField,0x00,0x00); /* GCT: gctEntries entries */
  for(var i=0;i<gctEntries*3;i++)by.push(pal[i]);
  if(frames.length>1){                          /* NETSCAPE loop ext only when animated */
    pu(0x21,0xff,0x0b);
    "NETSCAPE2.0".split("").forEach(function(ch){by.push(ch.charCodeAt(0));});
    pu(0x03,0x01,0x00,0x00,0x00);
  }
  var dcs=Math.max(2,Math.round(delayMs/10));   /* <2cs is ignored/clamped by browsers */
  /* LZW min code size must cover every index the encoder can emit
     (0..gctEntries-1), and per spec can never be below 2 even for a
     2-color palette. Using the smallest size the actual palette needs
     — not always 8 — is what makes a smaller "Reduce Colors" setting
     translate into real LZW code-width savings, not just banding. */
  var lzwMinCodeSize=Math.max(2,Math.ceil(Math.log2(gctEntries)));
  for(var fi=0;fi<frames.length;fi++){
    var idx=mapFrame(all[fi]);
    pu(0x21,0xf9,0x04,0x04);p16(dcs);pu(0x00,0x00); /* GCE: disposal=1 (keep), no transparency */
    pu(0x2c);p16(0);p16(0);p16(W);p16(H);pu(0x00);
    pu(lzwMinCodeSize);                           /* LZW min code size */
    var stream=lzwEncode(idx,lzwMinCodeSize);
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
  /* The PDF's built-in font covers Western European text only. Anything else
     (Hindi, Urdu, Arabic, CJK, Cyrillic, the rupee sign, emoji…) is drawn by
     the browser, which has the fonts and joins letters correctly, and placed
     in the PDF as page images. */
  const PDF_FONT=/^[\n\x20-\x7e\xa0-\xff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]*$/;
  const RTL=/[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;
  function tokens(line){ /* places a line may break */
    if(typeof Intl!=='undefined'&&Intl.Segmenter)return Array.from(new Intl.Segmenter(undefined,{granularity:'word'}).segment(line),s=>s.segment);
    return line.split(/(\s+)/).filter(Boolean);
  }
  function wrap(x,line,W){
    const out=[];let cur='';
    tokens(line).forEach(t=>{
      if(!cur||x.measureText(cur+t).width<=W){cur+=t;}
      else{out.push(cur.replace(/\s+$/,''));cur=t.replace(/^\s+/,'');}
      while(x.measureText(cur).width>W&&cur.length>1){ /* one unbroken run longer than the line */
        const g=Array.from(cur);let n=g.length-1;while(n>1&&x.measureText(g.slice(0,n).join('')).width>W)n--;
        out.push(g.slice(0,n).join(''));cur=g.slice(n).join('');}
    });
    out.push(cur);return out;
  }
  $('#run',panel).onclick=async()=>{
    const txt=ta.value.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/[​﻿]/g,'');
    if(!txt.trim()){setStatus(st,'Enter some text first.',1);return;}
    setStatus(st,'Creating PDF…');
    try{
      const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'pt',format:$('#pg',panel).value});
      const PW=doc.internal.pageSize.getWidth(),PH=doc.internal.pageSize.getHeight(),M=48,W=PW-M*2,LH=16;
      if(PDF_FONT.test(txt)){
        doc.setFont('helvetica');doc.setFontSize(12);let y=M;
        doc.splitTextToSize(txt,W).forEach(ln=>{if(y>PH-M){doc.addPage();y=M;}doc.text(ln,M,y);y+=LH;});
        doc.save('document.pdf');setStatus(st,'PDF created.');return;
      }
      const S=2,LN=19,FS=12;
      const c=document.createElement('canvas');c.width=Math.round(PW*S);c.height=Math.round(PH*S);const x=c.getContext('2d');
      const font=FS+'px "Noto Sans","Nirmala UI","Segoe UI",Arial,"Noto Sans CJK SC","Microsoft YaHei",sans-serif';
      const fresh=()=>{x.setTransform(1,0,0,1,0,0);x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.setTransform(S,0,0,S,0,0);x.fillStyle='#000';x.font=font;x.textBaseline='alphabetic';};
      let y=M,pages=0;fresh();
      const flush=()=>{if(pages)doc.addPage();doc.addImage(c.toDataURL('image/png'),'PNG',0,0,PW,PH,'','FAST');pages++;fresh();y=M;};
      for(const line of txt.split('\n')){
        const strong=line.match(/\p{L}/u),rtl=!!(strong&&RTL.test(strong[0]));
        x.direction=rtl?'rtl':'ltr';x.textAlign=rtl?'right':'left';
        for(const ln of wrap(x,line,W)){
          if(y>PH-M){flush();x.direction=rtl?'rtl':'ltr';x.textAlign=rtl?'right':'left';await new Promise(r=>setTimeout(r));}
          x.fillText(ln,rtl?PW-M:M,y+4);y+=LN;}
      }
      flush();
      doc.save('document.pdf');
      setStatus(st,'PDF created ('+pages+' page'+(pages>1?'s':'')+'). Your text has characters the PDF font doesn’t include, so pages are images: they look right, but the text can’t be selected.');
    }catch(e){setStatus(st,'Could not create the PDF: '+(e.message||e),1);}
  };
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

/* Content-aware page-break selection: given a sorted list of "safe" Y
   positions (the top/bottom edge of every paragraph, heading, list item,
   table row, etc. in the rendered document) and an ideal page height, pick
   actual page-break points that fall ON one of those edges — never through
   the middle of an element. Falls back to the naive ideal cut only when no
   safe edge exists nearby (e.g. one huge image), and always guarantees
   forward progress so it can never stall. Pure function — no DOM — so it's
   unit-testable on its own before ever touching real rendered content. */
function _choosePageBreaks(safeBreaks, totalHeight, idealPageHeight) {
  var pages = [];
  var cursor = 0;
  var sorted = safeBreaks.slice().sort(function (a, b) { return a - b; });
  while (cursor < totalHeight - 0.5) {
    var idealEnd = cursor + idealPageHeight;
    var candidates = sorted.filter(function (y) { return y > cursor + 1 && y <= idealEnd; });
    var end = candidates.length ? candidates[candidates.length - 1] : Math.min(idealEnd, totalHeight);
    if (end <= cursor) end = Math.min(idealEnd, totalHeight);
    pages.push({ start: cursor, end: end });
    cursor = end;
  }
  return pages;
}

/* Belt-and-braces on top of _sanitizeColors: some Chrome versions now
   resolve certain BROWSER-INTERNAL defaults (::selection highlight,
   :focus-visible outline, some form-control UA styling) through oklch/
   color-mix internally — independent of anything this site's own CSS
   ever wrote (confirmed: no file in this project uses oklch at all).
   Those live on pseudo-elements and UA defaults, which a real-DOM walk
   like _sanitizeColors structurally cannot reach (querySelectorAll never
   returns ::selection). A blanket, maximum-specificity override in the
   CLONED document's own <head> forces safe plain-rgb fallbacks for
   exactly the properties html2canvas is known to choke on, without
   touching the live page's actual appearance for real users. */
function _injectSafeColorOverrides(doc){
  var style=doc.createElement('style');
  style.textContent=
    '*,*::before,*::after{outline-color:rgb(0,0,0)!important;text-decoration-color:rgb(0,0,0)!important;caret-color:rgb(0,0,0)!important;-webkit-text-fill-color:unset!important;accent-color:rgb(34,110,220)!important}'+
    '::selection{background:rgb(179,215,255)!important;color:rgb(0,0,0)!important}';
  doc.head.appendChild(style);
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
    if(typeof html2canvas!=='function'||typeof DOMPurify==='undefined'){setStatus(st,'Renderer still loading — try again in a moment.',1);return;}
    setStatus(st,'Rendering\u2026');
    if(window.trackEvent)window.trackEvent('tool_process_started',{});
    const _t0=performance.now();
    const size=SIZES[$('#pg',panel).value]||SIZES.a4;
    const orient=$('#or',panel).value;
    /* CSS px width of the render box = paper width in px at 96dpi (pt/72*96) */
    const paperWpt=(orient==='l')?size[1]:size[0];
    const boxW=Math.round(paperWpt/72*96);
    const box=document.createElement('div');
    box.id='htp-render-box';
    box.style.cssText='position:fixed;left:-99999px;top:0;width:'+boxW+'px;padding:40px;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box';
    /* Pasted HTML must not run code here: scripts and event handlers are removed, styles are kept. */
    box.innerHTML=DOMPurify.sanitize(html,{ADD_TAGS:['style'],FORCE_BODY:true});document.body.appendChild(box);
    /* let fonts/images settle a tick before measuring */
    await new Promise(r=>setTimeout(r,30));
    try{
      _sanitizeColors(box); /* ← the oklch fix */
      const canvas=await html2canvas(box,{
        scale:Math.min(2,(window.devicePixelRatio||1)*2),
        backgroundColor:'#fff',
        useCORS:true,
        logging:false,
        onclone:function(doc){_injectSafeColorOverrides(doc);_sanitizeColors(doc.documentElement);var c=doc.getElementById('htp-render-box')||doc.body.lastElementChild;if(c)_sanitizeColors(c);}
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
      if(window.trackEvent){
        window.trackEvent('tool_process_completed',{processing_time:Math.round((performance.now()-_t0)/100)/10});
        window.trackEvent('tool_download',{file_type:'pdf'});
      }
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



/* ===== SVG rasterizer factory ===== */

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
  const u=dz(panel,{accept:'image/*',formats:['ICO','PNG'],sub:'Drop your logo. A square image works best; others are fitted without stretching.'});
  u.controls.innerHTML='<div class="ctrl"><label for="ft">If the image isn’t square</label><select id="ft"><option value="fit">Fit all of it (transparent edges)</option><option value="crop">Crop to the centre</option></select></div>';
  const ft=$('#ft',panel);let img=null;
  async function build(){
    if(!img)return;
    const iw=img.naturalWidth||512,ih=img.naturalHeight||512,sizes=[16,32,48,64,128,180,192,512],cv={};
    u.results.innerHTML='';u.results.classList.add('show');u.actions.innerHTML='';
    for(const s of sizes){const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.imageSmoothingQuality='high';
      const k=(ft.value==='crop'?Math.max:Math.min)(s/iw,s/ih),w=iw*k,h=ih*k;x.drawImage(img,(s-w)/2,(s-h)/2,w,h);cv[s]=c;
      const b=await new Promise(r=>c.toBlob(r,'image/png')),nm='favicon-'+s+'x'+s+'.png';
      row(u.results,c.toDataURL(),nm,s+'×'+s+' PNG',()=>download(b,nm));}
    const ico=buildIco([cv[16],cv[32],cv[48]]);u.actions.className='actions show';
    const html='<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">\n<link rel="apple-touch-icon" href="/favicon-180x180.png">';
    const mk=(t,cls,fn)=>{const b=document.createElement('button');b.className='btn '+cls;b.textContent=t;b.onclick=fn;u.actions.appendChild(b);};
    mk('Download favicon.ico','btn-primary',()=>download(ico,'favicon.ico'));
    mk('Copy HTML tags','btn-ghost',()=>navigator.clipboard.writeText(html).then(()=>toast('HTML copied','ok')).catch(()=>toast('Copy failed','err')));
    const pre=document.createElement('pre');pre.textContent=html;pre.style.cssText='width:100%;overflow:auto;font-size:12px;text-align:left;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text-dim)';u.actions.appendChild(pre);
    setStatus(u.status,iw===ih?'Done — upload the files to your site root and paste the HTML into <head>.':'Your image is '+iw+'×'+ih+', not square, so it was '+(ft.value==='crop'?'cropped to the centre.':'fitted with transparent edges.'));
  }
  ft.onchange=build;
  dropzone(u.drop,u.file,fs=>{const f=[...fs].find(x=>x.type.startsWith('image/'));if(!f){setStatus(u.status,'Drop an image file.',1);return;}readImg(f).then(im=>{img=im;return build();}).catch(()=>setStatus(u.status,'Could not read this image.',1));});
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
  /* Closed outline → path. Split at two far points so simplifying can't collapse the loop. */
  function outline(loop,tol,smooth){
    var a=0,b=0,best=-1;
    for(var i=1;i<loop.length;i++){var d=Math.pow(loop[i][0]-loop[0][0],2)+Math.pow(loop[i][1]-loop[0][1],2);if(d>best){best=d;a=i;}}
    best=-1;
    for(i=0;i<loop.length;i++){d=Math.pow(loop[i][0]-loop[a][0],2)+Math.pow(loop[i][1]-loop[a][1],2);if(d>best){best=d;b=i;}}
    if(a>b){var t=a;a=b;b=t;}
    var one=simplify(loop.slice(a,b+1),tol),two=simplify(loop.slice(b).concat(loop.slice(0,a+1)),tol);
    var pts=one.slice(0,-1).concat(two.slice(0,-1));
    if(pts.length<3)pts=loop;
    function f(v){return Math.round(v*10)/10;}
    if(!smooth)return'M'+pts.map(function(p){return f(p[0])+' '+f(p[1]);}).join('L')+'Z';
    /* Round gentle turns only; real corners stay sharp */
    var n=pts.length,s='';
    for(i=0;i<n;i++){
      var P=pts[i],A=pts[(i+n-1)%n],B=pts[(i+1)%n];
      var ax=A[0]-P[0],ay=A[1]-P[1],bx=B[0]-P[0],by=B[1]-P[1],la=Math.hypot(ax,ay),lb=Math.hypot(bx,by);
      var cos=(ax*bx+ay*by)/(la*lb||1),c=s?'L':'M';
      if(cos<-0.5){ /* turn under 60 degrees */
        var m=Math.min(la,lb)/2;
        s+=c+f(P[0]+ax/la*m)+' '+f(P[1]+ay/la*m)+'Q'+f(P[0])+' '+f(P[1])+' '+f(P[0]+bx/lb*m)+' '+f(P[1]+by/lb*m);
      }else s+=c+f(P[0])+' '+f(P[1]);
    }
    return s+'Z';
  }


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
      var picked=pickPalette(rgba,K);
      if(!picked.length){setStatus(u.status,'The image is fully transparent — nothing to trace.',1);return;}
      var pal=picked.map(function(p){return p.rgb;});
      /* label map: -1 transparent */
      var lab=new Int16Array(W*H);
      for(var p=0,q=0;p<rgba.length;p+=4,q++){
        if(rgba[p+3]<128){lab[q]=-1;continue;}
        var r=rgba[p],g=rgba[p+1],b=rgba[p+2],best=0,bd=1e9;
        for(var j=0;j<pal.length;j++){var dr=r-pal[j][0],dg=g-pal[j][1],db=b-pal[j][2],dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;best=j;}}
        lab[q]=best;}
      /* Per colour: follow the pixel edges into closed outlines, holes
         included. Drawn with the even-odd rule, so layer order can't hide
         shapes and rings keep their centre. */
      var tol=[1.6,1,0.75][detail-1];
      var groups=[];
      for(var col=0;col<pal.length;col++){
        var next={},starts=[];
        function edge(x1,y1,x2,y2){var k=y1*(W+1)+x1;if(next[k])next[k].push([x2,y2]);else{next[k]=[[x2,y2]];starts.push(k);}}
        var on=function(xx,yy){return xx>=0&&yy>=0&&xx<W&&yy<H&&lab[yy*W+xx]===col;};
        for(var yy=0;yy<H;yy++)for(var xx=0;xx<W;xx++){
          if(!on(xx,yy))continue;
          if(!on(xx,yy-1))edge(xx,yy,xx+1,yy);
          if(!on(xx+1,yy))edge(xx+1,yy,xx+1,yy+1);
          if(!on(xx,yy+1))edge(xx+1,yy+1,xx,yy+1);
          if(!on(xx-1,yy))edge(xx,yy+1,xx,yy);
        }
        var paths=[];
        starts.forEach(function(k0){
          while(next[k0]&&next[k0].length){
            var sx=k0%(W+1),sy=(k0/(W+1))|0,cx=sx,cy=sy,loop=[],area=0,pd='';
            do{
              var opts=next[cy*(W+1)+cx],pick=0;
              if(opts.length>1&&pd){ /* where two corners touch, turn right so diagonal shapes stay separate */
                var dxy=pd.split(',').map(Number),rx=-dxy[1],ry=dxy[0];
                opts.forEach(function(o,i){if(o[0]-cx===rx&&o[1]-cy===ry)pick=i;});
              }
              var to=opts.splice(pick,1)[0],nd=(to[0]-cx)+','+(to[1]-cy);
              if(nd!==pd)loop.push([cx,cy]);
              area+=cx*to[1]-to[0]*cy;cx=to[0];cy=to[1];pd=nd;
            }while(cx!==sx||cy!==sy);
            if(Math.abs(area)/2<4||loop.length<3)continue; /* speck removal */
            paths.push(outline(loop,tol,smooth));
          }
        });
        if(paths.length)groups.push({color:pal[col],d:paths.join('')});
      }
      if(!groups.length){setStatus(u.status,'No traceable shapes found \u2014 try more colors or higher detail.',1);return;}
      var hex=function(carr){return '#'+carr.map(function(v){return v.toString(16).padStart(2,'0');}).join('');};
      var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+img.naturalWidth+'" height="'+img.naturalHeight+'">'
        +groups.map(function(g){var h=hex(g.color);return '<path fill="'+h+'" stroke="'+h+'" stroke-width=".4" stroke-linejoin="round" fill-rule="evenodd" d="'+g.d+'"/>';}).join('')+'</svg>';
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
  var HTML2CANVAS_CDN='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  var JSPDF_CDN='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
  var SIZES={a4:[595.28,841.89],letter:[612,792]};

  var u=dz(panel,{accept:'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',multiple:false,formats:['DOCX\u2192PDF'],sub:'Upload a .docx Word document \u2014 converts to a real PDF and downloads automatically. No print dialog.'});

  u.controls.className='controls';
  u.controls.innerHTML='<div class="ctrl"><label for="w2pPaper">Paper size</label><select id="w2pPaper"><option value="a4">A4</option><option value="letter">Letter</option></select></div>'+
    '<div class="ctrl-spacer"></div><button class="btn btn-primary" id="w2pRun" disabled>Convert to PDF</button>';

  var file=null,running=false;

  dropzone(u.drop,u.file,function(files){
    var f=[].slice.call(files).find(function(x){
      return /\.docx$/i.test(x.name)||x.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });
    if(!f){setStatus(u.status,'That is not a .docx file. Legacy .doc files are not supported \u2014 re-save as .docx in Word first.',1);return;}
    file=f;$('#w2pRun',panel).disabled=false;
    setStatus(u.status,'Ready \u2014 '+f.name+' ('+fmtBytes(f.size)+').');
  });

  function loadLib(cdn,glob){return _loadScript(cdn,glob).catch(function(){return _loadScript(cdn+'?r='+Date.now(),glob);});}

  $('#w2pRun',panel).onclick=async function(){
    if(!file||running)return;
    running=true;
    var runBtn=$('#w2pRun',panel);runBtn.disabled=true;
    var st=u.status;st.className='status show';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
    if(window.trackEvent)window.trackEvent('tool_process_started',{});
    var _t0=performance.now();

    /* ── STAGE 1: Uploading ── (local read \u2014 framed to match the
       requested UX stages; nothing actually leaves the browser) */
    setStatus(st,'Uploading\u2026');
    var buf;
    try{buf=await file.arrayBuffer();}
    catch(e){setStatus(st,'Could not read this file.',1);running=false;runBtn.disabled=false;return;}

    /* ── STAGE 2: Reading DOCX ── */
    setStatus(st,'Reading DOCX\u2026');
    if(typeof mammoth==='undefined'){setStatus(st,'The document reader has not finished loading \u2014 check your connection and try again.',1);running=false;runBtn.disabled=false;return;}

    var html,warnCount=0;
    try{
      /* Explicit style map: mammoth's own defaults already catch standard
         "Heading 1"-"Heading 4", but Title/Subtitle/Quote and character
         styles (Strong/Emphasis) aren't mapped by default and otherwise
         fall through as plain, unstyled paragraphs \u2014 a real fidelity
         loss on real-world Word documents that use named styles. */
      var styleMap=[
        "p[style-name='Title'] => h1.doc-title:fresh",
        "p[style-name='Subtitle'] => h2.doc-subtitle:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em"
      ];
      var result=await mammoth.convertToHtml({arrayBuffer:buf},{styleMap:styleMap});
      html=DOMPurify.sanitize(result.value);
      warnCount=(result.messages||[]).filter(function(m){return m.type==='warning';}).length;
    }catch(e){
      setStatus(st,'Could not read this document: '+(e&&e.message?e.message:'it may be corrupted or password-protected.'),1);
      running=false;runBtn.disabled=false;return;
    }
    if(!html||!html.trim()){setStatus(st,'The document appears to be empty or has no readable content.',1);running=false;runBtn.disabled=false;return;}

    try{
      await Promise.all([
        typeof html2canvas==='function'?Promise.resolve():loadLib(HTML2CANVAS_CDN,'html2canvas'),
        window.jspdf?Promise.resolve():loadLib(JSPDF_CDN,'jspdf')
      ]);
    }catch(e){
      setStatus(st,'The PDF engine could not be loaded \u2014 check your connection and try again.',1);
      running=false;runBtn.disabled=false;return;
    }

    /* ── STAGE 3: Generating PDF ── */
    setStatus(st,'Generating PDF\u2026 0%');
    var paperKey=($('#w2pPaper',panel).value)||'a4';
    var size=SIZES[paperKey];
    var boxW=Math.round(size[0]/72*96);
    var box=document.createElement('div');
    box.id='w2p-render-box';
    box.style.cssText='position:fixed;left:-99999px;top:0;width:'+boxW+'px;padding:56px 50px;background:#fff;color:#111;font-family:Calibri,Arial,Helvetica,sans-serif;font-size:12pt;line-height:1.55;box-sizing:border-box';
    box.innerHTML=
      '<style>'+
        '.doc-title{font-size:26pt;font-weight:700;margin:0 0 4pt;font-family:Georgia,serif}'+
        '.doc-subtitle{font-size:14pt;font-weight:400;color:#555;margin:0 0 18pt}'+
        'h1{font-size:18pt;font-weight:700;margin:16pt 0 8pt}'+
        'h2{font-size:15pt;font-weight:700;margin:14pt 0 6pt}'+
        'h3{font-size:13pt;font-weight:700;margin:12pt 0 6pt}'+
        'h4{font-size:12pt;font-weight:700;font-style:italic;margin:10pt 0 4pt}'+
        'p{margin:0 0 8pt}'+
        'ul,ol{margin:0 0 8pt;padding-left:22pt}'+
        'li{margin:0 0 4pt}'+
        'table{border-collapse:collapse;width:100%;margin:0 0 12pt}'+
        'td,th{border:1px solid #999;padding:5pt 8pt;text-align:left;vertical-align:top}'+
        'th{background:#f0f0f0;font-weight:700}'+
        'blockquote{border-left:3px solid #999;margin:0 0 8pt;padding:2pt 0 2pt 12pt;color:#444}'+
        'blockquote.intense{border-left-color:#666;font-style:italic}'+
        'img{max-width:100%;height:auto}'+
        'strong,b{font-weight:700}em,i{font-style:italic}'+
      '</style>'+html;
    document.body.appendChild(box);
    await new Promise(function(r){setTimeout(r,60);}); /* let fonts/images settle */

    try{
      _sanitizeColors(box);

      /* Content-aware safe page-break points: the top/bottom edge of every
         paragraph, heading, list item, table row, quote and image \u2014
         see _choosePageBreaks()'s own comment for why this matters. */
      var blockEls=box.querySelectorAll('p,h1,h2,h3,h4,li,tr,blockquote,img');
      var boxRectBefore=box.getBoundingClientRect();
      var safeBreaks=[0,boxRectBefore.height];
      blockEls.forEach(function(el){
        var r=el.getBoundingClientRect();
        safeBreaks.push(r.top-boxRectBefore.top);
        safeBreaks.push(r.bottom-boxRectBefore.top);
      });
      var totalHeightPx=boxRectBefore.height;

      var canvas=await html2canvas(box,{
        scale:Math.min(2,(window.devicePixelRatio||1)*2),
        backgroundColor:'#fff',
        useCORS:true,
        logging:false,
        onclone:function(doc){_injectSafeColorOverrides(doc);_sanitizeColors(doc.documentElement);var c=doc.getElementById('w2p-render-box')||doc.body.lastElementChild;if(c)_sanitizeColors(c);}
      });
      setStatus(st,'Generating PDF\u2026 60%');

      var {jsPDF}=window.jspdf;
      var doc=new jsPDF({unit:'pt',format:paperKey});
      var pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
      var pxToPt=72/96;
      var idealPageHeightPx=ph/pxToPt;
      var pages=_choosePageBreaks(safeBreaks,totalHeightPx,idealPageHeightPx);
      var scaleFactor=canvas.width/boxW; /* canvas px per CSS px, from html2canvas's own scale option */

      pages.forEach(function(pg,idx){
        var sliceHeightPx=pg.end-pg.start;
        if(sliceHeightPx<=0)return;
        var sliceCanvas=document.createElement('canvas');
        sliceCanvas.width=canvas.width;
        sliceCanvas.height=Math.max(1,Math.round(sliceHeightPx*scaleFactor));
        var sctx=sliceCanvas.getContext('2d');
        sctx.fillStyle='#fff';sctx.fillRect(0,0,sliceCanvas.width,sliceCanvas.height);
        sctx.drawImage(canvas,0,Math.round(pg.start*scaleFactor),canvas.width,sliceCanvas.height,0,0,canvas.width,sliceCanvas.height);
        var imgData=sliceCanvas.toDataURL('image/jpeg',.95);
        if(idx>0)doc.addPage();
        var imgHpt=sliceHeightPx*pxToPt;
        doc.addImage(imgData,'JPEG',0,0,pw,imgHpt,'','FAST');
      });

      setStatus(st,'Downloading\u2026');
      var outName=(file.name||'document').replace(/\.docx$/i,'')+'.pdf';
      doc.save(outName);
      if(window.trackEvent){
        var elapsed=Math.round((performance.now()-_t0)/100)/10;
        window.trackEvent('tool_process_completed',{pages:pages.length,processing_time:elapsed});
        /* Explicit fire: jsPDF's doc.save() triggers the browser download
           directly, bypassing utils.js's download() helper entirely — the
           one case in this file where tool_download can't be picked up
           automatically and needs its own call. */
        window.trackEvent('tool_download',{file_type:'pdf'});
      }
      setStatus(st,'Done \u2014 saved '+outName+' ('+pages.length+' page'+(pages.length===1?'':'s')+').'+(warnCount?' ('+warnCount+' formatting note'+(warnCount>1?'s':'')+' \u2014 unusual layouts may simplify.)':''));
    }catch(e){
      console.error('[word-to-pdf]',e);
      setStatus(st,'Conversion failed: '+(e&&e.message?e.message:'the PDF could not be generated.'),1);
    }finally{
      box.remove();running=false;runBtn.disabled=false;
    }
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
    if(typeof marked==='undefined'||typeof DOMPurify==='undefined'){document.getElementById('md-preview').textContent='Loading renderer...';return;}
    var html=marked.parse(md||'');
    document.getElementById('md-preview').innerHTML=DOMPurify.sanitize(html);   /* pasted Markdown can contain scripts */
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

/* ===== GIF Compressor ===== */
INIT['gif-compressor']=function(panel){
  const u=dz(panel,{accept:'image/gif',formats:['GIF'],title:'Drop a GIF here or click to browse',sub:'Compress animated GIFs \u2014 reduce file size while keeping the animation intact.'});
  var engine=null,gifData=null,originalFile=null,levelKey='balanced',lossyOverride=null,colorOverride=null,running=null;
  var CHECK_DEFAULTS={dedupe:true,merge:true,optTransparency:true,optTiming:true,trimUnused:true};

  var GCE_V='686f5e6ceb';
  function loadEngine(){return _loadScript('/gifcompressor-engine.js?v='+GCE_V,'GifCompressorEngine').catch(function(){return _loadScript('/gifcompressor-engine.js?v='+GCE_V+'&r='+Date.now(),'GifCompressorEngine');});}

  dropzone(u.drop,u.file,handleFiles);
  panel.addEventListener('paste',function(e){
    var items=(e.clipboardData||{}).items||[];
    for(var i=0;i<items.length;i++){if(items[i].type==='image/gif'){var f=items[i].getAsFile();if(f)handleFiles([f]);break;}}
  });

  async function handleFiles(fs){
    var f=[...fs].find(function(x){return x.type==='image/gif'||/\.gif$/i.test(x.name);});
    if(!f){setStatus(u.status,'That doesn\u2019t look like a GIF \u2014 this tool only compresses animated/static GIF files.',1);return;}
    if(f.size>60*1024*1024){setStatus(u.status,'This file is '+fmtBytes(f.size)+' \u2014 the browser-based limit is 60MB for reliable in-memory processing.',1);return;}
    originalFile=f;
    setStatus(u.status,'Reading GIF\u2026');
    try{
      engine=await loadEngine();
      var buf=await f.arrayBuffer();
      gifData=engine.decodeGif(buf);
      if(!gifData.frames.length)throw new Error('no frames found');
      showAnalysis();
    }catch(e){
      setStatus(u.status,'Could not read this GIF \u2014 it may be corrupted or use an unsupported variant. ('+(e&&e.message||e)+')',1);
    }
  }

  function totalDurationMs(){return gifData.frames.reduce(function(s,f){return s+f.delay;},0);}

  function showAnalysis(){
    u.drop.style.display='none';
    var dur=totalDurationMs();
    u.controls.className='controls show';
    u.controls.innerHTML=
      '<div class="tp-panel">'+
        '<div class="tp-panel-row tp-panel-full">'+
          infoCard('Frames',gifData.frames.length)+
          infoCard('Dimensions',gifData.width+'\u00d7'+gifData.height)+
          infoCard('Duration',(dur/1000).toFixed(1)+'s')+
          infoCard('Loop',gifData.loopCount===null?'Once':gifData.loopCount===0?'Infinite':gifData.loopCount+'x')+
        '</div>'+
        '<div class="ctrl tp-panel-full"><label>Compression level</label><div class="seg" id="gcLevel" role="group" aria-label="Compression level">'+
          '<button data-l="light" aria-pressed="false">Light</button>'+
          '<button data-l="balanced" class="active" aria-pressed="true">Balanced</button>'+
          '<button data-l="strong" aria-pressed="false">Strong</button>'+
          '<button data-l="maximum" aria-pressed="false">Maximum</button>'+
        '</div></div>'+
        '<div class="tp-panel-split">'+
          '<div style="display:flex;flex-direction:column;gap:18px">'+
            '<div class="ctrl"><label for="gcColors">Reduce colors</label><div class="seg" id="gcColors" role="group" aria-label="Color count">'+
              [256,128,64,32,16].map(function(c){return '<button data-c="'+c+'" aria-pressed="false">'+c+'</button>';}).join('')+
            '</div></div>'+
            '<div class="ctrl"><label for="gcLossy">Lossy compression \u00b7 <span class="val" id="gcLossyV">\u2014</span></label><input type="range" id="gcLossy" min="0" max="200" step="5" style="width:100%"><p class="note">Higher values reduce file size but may introduce visible artifacts.</p></div>'+
          '</div>'+
          '<div style="display:flex;flex-direction:column;gap:16px">'+
            '<div class="ctrl"><label>Frame optimization</label><div class="tp-check-list">'+
              checkboxRow('gcDedupe','Remove duplicate frames',CHECK_DEFAULTS.dedupe)+
              checkboxRow('gcMerge','Merge similar frames',CHECK_DEFAULTS.merge)+
              checkboxRow('gcTransp','Optimize transparency',CHECK_DEFAULTS.optTransparency)+
              checkboxRow('gcTiming','Optimize frame timing',CHECK_DEFAULTS.optTiming)+
              checkboxRow('gcTrim','Remove unused pixels',CHECK_DEFAULTS.trimUnused)+
            '</div></div>'+
            '<div class="ctrl"><div class="tp-check-list">'+checkboxRow('gcMeta','Remove metadata',true)+'</div><p class="note">The re-encoded file never carries the source GIF\u2019s comment/metadata blocks \u2014 this is structural, not a toggle that can fail silently.</p></div>'+
          '</div>'+
        '</div>'+
        '<div id="gcStatsPanel" class="tp-panel-full"></div>'+
        '<div class="tp-panel-full" style="display:flex;justify-content:flex-end">'+
          '<button class="btn btn-primary" id="gcRun">Compress GIF</button>'+
        '</div>'+
      '</div>';

    applyPreset(levelKey,true);
    $$('#gcLevel button',panel).forEach(function(b){b.onclick=function(){
      levelKey=b.dataset.l;lossyOverride=null;colorOverride=null;
      $$('#gcLevel button',panel).forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
      applyPreset(levelKey,true);
    };});
    $$('#gcColors button',panel).forEach(function(b){b.onclick=function(){
      colorOverride=+b.dataset.c;
      $$('#gcColors button',panel).forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
      updateStats();
    };});
    $('#gcLossy',panel).addEventListener('input',function(){lossyOverride=+this.value;$('#gcLossyV',panel).textContent=this.value;updateStats();});
    ['gcDedupe','gcMerge','gcTransp','gcTiming','gcTrim','gcMeta'].forEach(function(id){$('#'+id,panel).addEventListener('change',updateStats);});

    updateStats();
    setStatus(u.status,'Analyzed \u2014 adjust settings below, then compress.');
    $('#gcRun',panel).onclick=runCompression;
  }

  function infoCard(label,value){return '<div class="tp-stat-mini"><div class="n">'+value+'</div><div class="l">'+label+'</div></div>';}
  function checkboxRow(id,label,checked){return '<label><input type="checkbox" id="'+id+'"'+(checked?' checked':'')+'> '+label+'</label>';}

  function activeColorCount(){
    if(colorOverride)return colorOverride;
    return engine.PRESETS[levelKey].maxColors;
  }
  function activeMaxColors(){
    var base=activeColorCount();
    if(lossyOverride==null)return base;
    return engine.lossySliderToMaxColors(lossyOverride,base);
  }
  function applyPreset(key,resetLossySlider){
    var preset=engine.PRESETS[key];
    $$('#gcColors button',panel).forEach(function(b){var on=+b.dataset.c===preset.maxColors;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    if(resetLossySlider){
      var slider=$('#gcLossy',panel);slider.value=0;$('#gcLossyV',panel).textContent='0';
    }
    updateStats();
  }

  function currentDedupeThreshold(){
    var preset=engine.PRESETS[levelKey];
    return $('#gcDedupe',panel).checked||$('#gcMerge',panel).checked?preset.dedupeThreshold:0;
  }

  function updateStats(){
    if(!gifData)return;
    var maxColors=activeMaxColors();
    var willDedupe=$('#gcDedupe',panel).checked||$('#gcMerge',panel).checked;
    var previewDedupe=willDedupe?engine.removeDuplicateFrames(gifData.frames,currentDedupeThreshold()):{frames:gifData.frames,removedCount:0};
    var estimate=engine.estimateCompressedSize(originalFile.size,256,maxColors,gifData.frames.length,previewDedupe.frames.length);
    var pct=Math.round((1-estimate/originalFile.size)*100);
    $('#gcStatsPanel',panel).innerHTML=
      '<div style="margin-top:4px;padding:14px 16px;border:1px solid var(--border-2);border-radius:14px;background:var(--bg-2)">'+
        '<div style="font-size:11px;color:var(--text-faint);margin-bottom:8px">Estimated \u2014 the real result may differ once actually compressed</div>'+
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px">'+
          infoCard('Original',fmtBytes(originalFile.size))+
          infoCard('Estimated',fmtBytes(estimate))+
          infoCard('Reduction',pct+'%')+
          infoCard('Frames',previewDedupe.frames.length+(previewDedupe.removedCount?' (\u2212'+previewDedupe.removedCount+')':''))+
          infoCard('Colors',maxColors)+
        '</div>'+
      '</div>';
  }

  function encodeAttempt(canvases,avgDelay,maxColors,dither){
    var bytes=gifMakeBlob(canvases,avgDelay,{maxColors:maxColors,dither:dither});
    return new Blob([bytes],{type:'image/gif'});
  }

  async function verifyGifBlob(blob){
    var url=URL.createObjectURL(blob),probe=new Image();
    await new Promise(function(resolve,reject){
      probe.onload=function(){if(!probe.naturalWidth){reject(new Error('encoded GIF failed verification'));return;}resolve();};
      probe.onerror=function(){reject(new Error('encoded GIF failed decode verification'));};
      probe.src=url;
    });
    return url;
  }

  async function runCompression(){
    var runBtn=$('#gcRun',panel);runBtn.disabled=true;
    var signal={cancelled:false};running=signal;
    setStatus(u.status,'Compressing\u2026');
    var t0=performance.now();
    try{
      var willDedupe=$('#gcDedupe',panel).checked||$('#gcMerge',panel).checked;
      var frameSet=willDedupe?engine.removeDuplicateFrames(gifData.frames,currentDedupeThreshold()):{frames:gifData.frames,removedCount:0};
      if(signal.cancelled)return;

      var canvases=frameSet.frames.map(function(f){
        var c=document.createElement('canvas');c.width=f.width;c.height=f.height;
        c.getContext('2d',{willReadFrequently:true}).putImageData(new ImageData(new Uint8ClampedArray(f.data),f.width,f.height),0,0);
        return c;
      });
      var avgDelay=frameSet.frames.reduce(function(s,f){return s+f.delay;},0)/frameSet.frames.length;

      /* Dithering is OFF by default now, not tied to the compression
         level. Found via a real user report: Bayer dithering trades
         smoother color gradients for LZW-hostile, high-frequency pixel
         noise — a real, understood mechanism, not a guess — which can
         make flat-color graphic/text GIFs (a marketing banner, in the
         case that surfaced this) compress WORSE than the unmodified
         original. Compression is this tool's entire purpose, so the
         safe default has to favor it; dithering trades away exactly
         that for content it doesn't help. */
      var startColors=activeMaxColors();
      var attempts=[{colors:startColors,dither:false}];
      /* Progressively more aggressive fallbacks, only used if the first
         attempt doesn't actually beat the original — this is the real
         safety net: never silently ship a "compressed" file that's
         larger than what the user uploaded. */
      [Math.max(2,Math.round(startColors/2)),Math.max(2,Math.round(startColors/4))].forEach(function(c){
        if(c<startColors && attempts.every(function(a){return a.colors!==c;})) attempts.push({colors:c,dither:false});
      });

      var best=null,bestUrl=null;
      for(var i=0;i<attempts.length;i++){
        if(signal.cancelled)return;
        var blob=encodeAttempt(canvases,avgDelay,attempts[i].colors,attempts[i].dither);
        if(!best||blob.size<best.size){
          if(bestUrl)URL.revokeObjectURL(bestUrl);
          best=blob;
          bestUrl=await verifyGifBlob(blob);
        }
        if(best.size<originalFile.size)break; /* genuinely smaller — stop, no need to try harder */
      }
      if(signal.cancelled){if(bestUrl)URL.revokeObjectURL(bestUrl);return;}

      var elapsed=(performance.now()-t0)/1000;
      var actuallySmaller=best.size<originalFile.size;
      showResults(best,bestUrl,frameSet,elapsed,actuallySmaller);
      if(window.trackEvent)window.trackEvent('tool_process_completed',{original_size:originalFile.size,compressed_size:best.size,frames:frameSet.frames.length,attempts:attempts.length,beat_original:actuallySmaller,processing_time:elapsed});
    }catch(e){
      setStatus(u.status,'Compression failed: '+(e&&e.message||e),1);
    }finally{
      runBtn.disabled=false;running=null;
    }
  }

  function showResults(blob,compressedUrl,frameSet,elapsed,actuallySmaller){
    var origUrl=URL.createObjectURL(originalFile);
    var pct=Math.round((1-blob.size/originalFile.size)*100);
    u.results.classList.add('show');
    var warningHTML=actuallySmaller?'':
      '<div style="max-width:460px;margin:0 auto 14px;padding:14px 16px;border:1px solid rgba(255,180,80,.35);border-radius:14px;background:rgba(255,180,80,.08)">'+
        '<div style="font-weight:700;color:var(--text);margin-bottom:6px">This GIF didn\u2019t compress smaller here</div>'+
        '<p style="font-size:13px;color:var(--text-dim);line-height:1.6;margin:0">Tried several color-count settings and none beat the original\u2019s '+fmtBytes(originalFile.size)+' \u2014 this can happen when a GIF is already efficiently encoded, or when its content (flat colors, sharp text, simple graphics) doesn\u2019t benefit from further palette reduction the way photographic content does. Your original file is the better choice here \u2014 no need to download the result below.</p>'+
      '</div>';
    u.results.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">'+
        '<div style="text-align:center"><p style="font-size:12px;color:var(--text-faint);margin-bottom:6px">Original \u2014 '+fmtBytes(originalFile.size)+'</p><img src="'+origUrl+'" style="max-width:100%;border-radius:12px;border:1px solid var(--border)" alt="Original GIF"></div>'+
        '<div style="text-align:center"><p style="font-size:12px;color:var(--text-faint);margin-bottom:6px">'+(actuallySmaller?'Compressed':'Attempted')+' \u2014 '+fmtBytes(blob.size)+'</p><img src="'+compressedUrl+'" style="max-width:100%;border-radius:12px;border:1px solid var(--border)" alt="Compressed GIF"></div>'+
      '</div>'+
      warningHTML+
      '<div style="max-width:460px;margin:0 auto 14px;padding:14px 16px;border:1px solid var(--border-2);border-radius:14px;background:var(--bg-2)">'+
        '<div style="font-weight:700;color:var(--text);margin-bottom:8px">'+(actuallySmaller?'Compression result':'Result')+'</div>'+
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px">'+
          infoCard('Original size',fmtBytes(originalFile.size))+
          infoCard(actuallySmaller?'Compressed':'Result size',fmtBytes(blob.size))+
          infoCard(actuallySmaller?'Saved':'Difference',(pct>=0?pct:'+'+Math.abs(pct))+'%')+
          infoCard('Frames',frameSet.frames.length+(frameSet.removedCount?' (\u2212'+frameSet.removedCount+')':''))+
          infoCard('Processing time',elapsed.toFixed(1)+'s')+
          infoCard('Animation','Preserved')+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
        '<button class="btn '+(actuallySmaller?'btn-primary':'btn-ghost')+'" id="gcDl">Download '+(actuallySmaller?'compressed GIF':'anyway')+'</button>'+
        '<button class="btn btn-ghost" id="gcReset">Compress another</button>'+
      '</div>';
    $('#gcDl',panel).onclick=function(){download(blob,(originalFile.name||'animation').replace(/\.gif$/i,'')+'-compressed.gif');setStatus(u.status,'Saved.');};
    $('#gcReset',panel).onclick=function(){
      URL.revokeObjectURL(origUrl);URL.revokeObjectURL(compressedUrl);
      gifData=null;originalFile=null;u.results.innerHTML='';u.results.classList.remove('show');
      u.controls.innerHTML='';u.controls.classList.remove('show');
      u.drop.style.display='';setStatus(u.status,'');
    };
    setStatus(u.status,'Done \u2014 '+pct+'% smaller, animation preserved.');
  }
};

/* ════ Universal Image Converter ══════════════════════════════════════
   UI only. Decoding and encoding happen in imgconvert-engine.js. */
var XCV_V='31bd5bd065';
var xcvStop=null;
INIT['image-converter']=function(panel){
  if(xcvStop)xcvStop();
  var MAX_FILE=80*1048576,MAX_FILES=100;
  var OUT={'image/jpeg':['JPG','jpg',90],'image/png':['PNG','png',100],'image/webp':['WebP','webp',85],'image/avif':['AVIF','avif',60]};
  var JSZIP=['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG'];
  var u=dz(panel,{accept:'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.gif,.bmp',multiple:true,title:'Drop images here or click to browse',formats:['JPG','PNG','WEBP','AVIF','HEIC','GIF','BMP'],sub:'Add up to 100 images, 80 MB each. Convert them to JPG, PNG, WebP or AVIF.'});
  u.controls.className='controls xcv-controls';
  u.controls.innerHTML=
    '<div class="xcv-step"><span class="xcv-n">1</span><div><b id="xvFl">Convert to</b><div class="seg" id="xvF" role="group" aria-labelledby="xvFl">'+Object.keys(OUT).map(function(t){return'<button type="button" data-t="'+t+'">'+OUT[t][0]+'</button>';}).join('')+'</div><p class="xcv-note" id="xvNote"></p></div></div>'+
    '<div class="xcv-step"><span class="xcv-n">2</span><div><b>Quality and size</b><div class="xcv-grid">'+
      '<div class="ctrl" id="xvQw"><label for="xvQ">Quality · <span class="val" id="xvQv">90%</span></label><input type="range" id="xvQ" min="10" max="100" value="90"></div>'+
      '<div class="ctrl"><label for="xvW">Width, px (optional)</label><input type="number" id="xvW" inputmode="numeric" min="1" max="16384" step="1" placeholder="Original"></div>'+
      '<div class="ctrl"><label for="xvH">Height, px (optional)</label><input type="number" id="xvH" inputmode="numeric" min="1" max="16384" step="1" placeholder="Original"></div>'+
      '<label class="xcv-check"><input type="checkbox" id="xvK" checked> <span>Keep proportions</span></label>'+
      '<label class="xcv-check" id="xvTw"><input type="checkbox" id="xvT" checked> <span>Keep transparency</span></label>'+
      '<div class="ctrl" id="xvBw"><label for="xvB">Background colour</label><input type="color" id="xvB" value="#ffffff"></div>'+
      '<div class="ctrl"><label for="xvP">File names</label><input type="text" id="xvP" value="{name}" spellcheck="false" aria-describedby="xvPh"><small id="xvPh">{name} is the original name, {n} a number</small></div>'+
    '</div></div></div>'+
    '<div class="xcv-step"><span class="xcv-n">3</span><div class="xcv-go"><button class="btn btn-primary" id="xvGo" disabled>Convert</button><button class="btn btn-ghost" id="xvStop" hidden>Cancel</button></div></div>';
  u.controls.after(u.status);
  u.status.setAttribute('role','status');u.status.setAttribute('aria-live','polite');
  var bar=document.createElement('div');bar.className='xcv-bar';bar.hidden=true;
  bar.innerHTML='<label class="xcv-check"><input type="checkbox" id="xvAll" checked> <span id="xvCount"></span></label><div class="ctrl-spacer"></div><button class="btn btn-ghost" id="xvAdd">Add more</button><button class="btn btn-ghost" id="xvRm">Remove selected</button><button class="btn btn-ghost" id="xvClear">Clear all</button>';
  u.status.after(bar);
  var dlg=document.createElement('dialog');dlg.className='xcv-dlg';dlg.setAttribute('aria-label','Image preview');panel.appendChild(dlg);
  var g=function(id){return $('#'+id,panel);};
  var items=[],type='image/jpeg',busy=false,runId=0,nextId=1,workers=[],thumbQ=Promise.resolve();

  /* ── helpers ── */
  function xvFree(url){if(url)setTimeout(function(){URL.revokeObjectURL(url);},2000);}
  function xvClean(s){return String(s).replace(/[\\\/:*?"<>|\u0000-\u001f]/g,'-').replace(/^[.\s]+|[.\s]+$/g,'').slice(0,120);}
  function xvBase(f){return xvClean(f.name.replace(/\.[^.]+$/,''))||'image';}
  function num(id){var v=g(id).value.trim();return v?+v:0;}
  function pct(a,b){var p=Math.round((1-b/a)*1000)/10;return p>=0?p+'% smaller':(-p)+'% larger';}
  function selected(){return items.filter(function(i){return i.sel;});}
  function xvDone(){return items.filter(function(i){return i.out;});}

  /* ── settings ── */
  function xvNote(){
    var t={'image/jpeg':'JPG opens everywhere. It cannot store transparency, so see-through areas get the background colour.','image/png':'PNG is lossless and keeps transparency, so there is no quality setting. Photos become large files.','image/webp':'WebP is small and keeps transparency. It works in every current browser.','image/avif':'AVIF makes the smallest files and keeps transparency. Encoding takes a few seconds per image, and the first one downloads the encoder (about 3.5 MB).'}[type];
    g('xvNote').textContent=t;
    $$('#xvF button',panel).forEach(function(b){var on=b.dataset.t===type;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});
    g('xvQw').style.display=type==='image/png'?'none':'';
    g('xvTw').style.display=type==='image/jpeg'?'none':'';
    g('xvBw').style.display=(type==='image/jpeg'||!g('xvT').checked)?'':'none';
  }
  function stale(){if(!busy&&xvDone().length)setStatus(u.status,'Settings changed. Press Convert to update the results.');}
  $$('#xvF button',panel).forEach(function(b){b.onclick=function(){if(busy)return;type=b.dataset.t;g('xvQ').value=OUT[type][2];g('xvQv').textContent=OUT[type][2]+'%';xvNote();stale();items.forEach(paintName);};});
  g('xvQ').addEventListener('input',function(){g('xvQv').textContent=g('xvQ').value+'%';});
  ['xvQ','xvW','xvH','xvK','xvT','xvB'].forEach(function(id){g(id).addEventListener('change',function(){xvNote();stale();});});
  g('xvP').addEventListener('input',function(){items.forEach(function(it,i){if(!it.named){it.name=pattern(it,i);paintName(it);}});});
  function pattern(it,i){var p=g('xvP').value.trim()||'{name}';return xvClean(p.replace(/\{name\}/g,xvBase(it.file)).replace(/\{n\}/g,String(i+1).padStart(Math.max(2,String(items.length).length),'0')))||'image';}
  xvNote();

  /* ── list ── */
  function xvAdd(fs){
    var list=[...fs],bad=[],dup=0,big=0,over=0;
    u.file.value='';
    list.forEach(function(f){
      if(!/\.(jpe?g|png|webp|avif|heic|heif|gif|bmp)$/i.test(f.name)&&!/^image\/(jpeg|png|webp|avif|heic|heif|gif|bmp|x-ms-bmp)$/.test(f.type)){bad.push(f.name);return;}
      if(!f.size){bad.push(f.name+' (empty)');return;}
      if(f.size>MAX_FILE){big++;return;}
      if(items.length>=MAX_FILES){over++;return;}
      if(items.some(function(i){return i.file.name===f.name&&i.file.size===f.size&&i.file.lastModified===f.lastModified;})){dup++;return;}
      var it={id:nextId++,file:f,sel:true,name:'',named:false,out:null,state:'wait'};
      items.push(it);it.name=pattern(it,items.length-1);makeRow(it);xvThumb(it);
    });
    var m=[];
    if(bad.length)m.push('Skipped, not supported: '+bad.slice(0,3).join(', ')+(bad.length>3?' and '+(bad.length-3)+' more':'')+'. Use JPG, PNG, WebP, AVIF, HEIC, GIF or BMP');
    if(big)m.push(big+' skipped for being over 80 MB');
    if(over)m.push(over+' skipped: the limit is '+MAX_FILES+' images at a time');
    if(dup)m.push(dup+' already in the list');
    if(m.length)setStatus(u.status,m.join('. ')+'.',bad.length||big||over?1:0);
    else if(items.length)setStatus(u.status,'Ready. Choose a format and press Convert.');
    refresh();
  }
  dropzone(u.drop,u.file,xvAdd);
  ['dragover','drop'].forEach(function(ev){[bar,u.results].forEach(function(el){el.addEventListener(ev,function(e){e.preventDefault();if(ev==='drop'&&!busy)xvAdd(e.dataTransfer.files);});});});

  function makeRow(it){
    var d=document.createElement('div');d.className='xcv-row';it.el=d;
    d.innerHTML='<input type="checkbox" class="xcv-sel" checked><button type="button" class="xcv-thumb" disabled><span></span></button>'+
      '<div class="xcv-main"><div class="xcv-name"><input type="text" spellcheck="false" maxlength="120"><span class="xcv-ext"></span></div><div class="xcv-meta"></div><div class="xcv-prog" hidden><i></i></div></div>'+
      '<div class="xcv-act"><button type="button" class="btn btn-primary xcv-dl" hidden>Download</button><button type="button" class="xcv-x" aria-label="Remove">&#10005;</button></div>';
    var q=function(s){return d.querySelector(s);};
    q('.xcv-sel').setAttribute('aria-label','Select '+it.file.name);
    q('.xcv-thumb span').textContent=(it.file.name.split('.').pop()||'').slice(0,4).toUpperCase();
    q('.xcv-thumb').setAttribute('aria-label','Preview '+it.file.name);
    q('.xcv-x').setAttribute('aria-label','Remove '+it.file.name);
    q('.xcv-name input').setAttribute('aria-label','Output name for '+it.file.name);
    q('.xcv-sel').onchange=function(){it.sel=this.checked;refresh();};
    q('.xcv-x').onclick=function(){if(busy)return;xvDrop(it);refresh();};
    q('.xcv-dl').onclick=function(){if(it.out)download(it.out.blob,fileName(it));};
    q('.xcv-thumb').onclick=function(){xvPreview(it);};
    var inp=q('.xcv-name input');
    inp.oninput=function(){it.named=true;it.name=inp.value;};
    inp.onblur=function(){var v=xvClean(inp.value);if(!v){it.named=false;v=pattern(it,items.indexOf(it));}it.name=v;inp.value=v;};
    u.results.appendChild(d);paintName(it);paintMeta(it);
  }
  function ext(it){return it.out?OUT[it.out.type][1]:OUT[type][1];}
  function fileName(it){return (xvClean(it.name)||xvBase(it.file))+'.'+ext(it);}
  function paintName(it){if(!it.el)return;it.el.querySelector('.xcv-name input').value=it.name;it.el.querySelector('.xcv-ext').textContent='.'+ext(it);}
  function paintMeta(it){
    var m=it.el.querySelector('.xcv-meta'),p=it.el.querySelector('.xcv-prog'),r=it.out,t='';
    it.el.classList.toggle('err',it.state==='err');it.el.classList.toggle('ok',it.state==='done');
    p.hidden=!(it.state==='queue'||it.state==='work');
    p.firstChild.style.width=(it.pct||0)+'%';
    if(it.state==='wait')t='Original: '+fmtBytes(it.file.size);
    else if(it.state==='queue')t='Waiting · '+fmtBytes(it.file.size);
    else if(it.state==='work')t=(it.stage||'Starting')+'… · '+fmtBytes(it.file.size);
    else if(it.state==='err')t=it.error;
    else if(r){
      t=r.inName+' '+fmtBytes(it.file.size)+' → '+OUT[r.type][0]+' '+fmtBytes(r.blob.size)+' · '+pct(it.file.size,r.blob.size)+' · '+(r.w===r.ow&&r.h===r.oh?r.w+' × '+r.h+' px':r.ow+' × '+r.oh+' → '+r.w+' × '+r.h+' px');
      if(r.animated)t+=' · animated: first frame only';
      if(r.flattened)t+=' · transparency filled';
    }
    m.textContent=t;
    it.el.querySelector('.xcv-dl').hidden=!r||busy;
    it.el.querySelector('.xcv-thumb').disabled=!it.thumbUrl;
    it.el.querySelector('.xcv-x').disabled=busy;
  }
  function setThumb(it,url){xvFree(it.thumbUrl);it.thumbUrl=url;var b=it.el.querySelector('.xcv-thumb');b.innerHTML='';var im=document.createElement('img');im.alt='';im.src=url;b.appendChild(im);b.disabled=false;}
  /* Small thumbnails, one at a time, so 100 photos don't fill memory */
  async function smallUrl(blob){
    var bmp=await createImageBitmap(blob,{resizeHeight:120,resizeQuality:'medium'});
    var c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;c.getContext('2d').drawImage(bmp,0,0);if(bmp.close)bmp.close();
    return URL.createObjectURL(await new Promise(function(r){c.toBlob(r,'image/png');}));
  }
  function xvThumb(it){thumbQ=thumbQ.then(async function(){if(items.indexOf(it)<0||it.thumbUrl)return;try{setThumb(it,await smallUrl(it.file));it.native=true;}catch(e){/* HEIC in most browsers: shown after conversion */}});}
  function xvDrop(it){items=items.filter(function(x){return x!==it;});xvFree(it.thumbUrl);xvFree(it.outUrl);it.el.remove();}
  function refresh(){
    var n=items.length,s=selected().length;
    u.drop.style.display=n?'none':'';bar.hidden=!n;u.results.className='results'+(n?' show':'');
    g('xvCount').textContent=s+' of '+n+' selected';
    var a=g('xvAll');a.checked=n>0&&s===n;a.indeterminate=s>0&&s<n;
    g('xvRm').disabled=busy||!s;g('xvClear').disabled=busy;g('xvAdd').disabled=busy;
    g('xvGo').disabled=busy||!s;g('xvGo').textContent=s>1?'Convert '+s+' images':'Convert';
    paintActions();
  }
  g('xvAll').onchange=function(){var on=this.checked;items.forEach(function(i){i.sel=on;i.el.querySelector('.xcv-sel').checked=on;});refresh();};
  g('xvAdd').onclick=function(){u.file.click();};
  g('xvRm').onclick=function(){selected().forEach(xvDrop);refresh();};
  g('xvClear').onclick=function(){items.slice().forEach(xvDrop);u.status.className='status';refresh();u.drop.focus();};

  /* ── preview ── */
  function xvPreview(it){
    var r=it.out;if(r&&!it.outUrl)it.outUrl=URL.createObjectURL(r.blob);
    var src=it.native?URL.createObjectURL(it.file):'';
    dlg.innerHTML='<div class="xcv-dh"><b></b><button type="button" class="xcv-x" aria-label="Close preview">&#10005;</button></div><div class="xcv-pair"></div>';
    dlg.querySelector('b').textContent=r?fileName(it):it.file.name;
    var pair=dlg.querySelector('.xcv-pair');
    function fig(title,url,info){var f=document.createElement('figure'),c=document.createElement('figcaption');c.textContent=title+' · '+info;var b=document.createElement('div');b.className='xcv-pic';
      if(url){var im=document.createElement('img');im.src=url;im.alt=title;b.appendChild(im);}else{b.textContent='This browser cannot display the original '+(r?r.inName:'')+' file.';}
      f.appendChild(c);f.appendChild(b);pair.appendChild(f);}
    fig('Original',src,fmtBytes(it.file.size));
    if(r)fig('Converted',it.outUrl,OUT[r.type][0]+', '+fmtBytes(r.blob.size));
    pair.classList.toggle('one',!r);
    dlg.querySelector('.xcv-x').onclick=function(){dlg.close();};
    dlg.onclose=function(){xvFree(src);dlg.innerHTML='';};
    dlg.onclick=function(e){if(e.target===dlg)dlg.close();};
    if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
  }

  /* ── conversion ── */
  function killWorkers(){workers.forEach(function(w){w.terminate();});workers=[];}
  xcvStop=function(){runId++;killWorkers();};
  function setBusy(on){
    busy=on;g('xvStop').hidden=!on;panel.setAttribute('aria-busy',on);
    $$('#xvF button,.xcv-grid input,.xcv-sel,.xcv-name input',panel).forEach(function(e){e.disabled=on;});g('xvAll').disabled=on;
    items.forEach(paintMeta);refresh();
  }
  function loadOnPage(){return _loadScript('/imgconvert-engine.js?v='+XCV_V,'ImgConvert');}
  function startWorker(){
    return new Promise(function(res){
      var w,t=setTimeout(function(){w&&w.terminate();res(null);},15000);
      try{w=new Worker('/imgconvert-engine.js?v='+XCV_V);}catch(e){clearTimeout(t);res(null);return;}
      w.onmessage=function(e){clearTimeout(t);if(e.data.ready){workers.push(w);res(w);}else{w.terminate();res(null);}};
      w.onerror=function(e){if(e.preventDefault)e.preventDefault();clearTimeout(t);w.terminate();res(null);};
    });
  }
  function inWorker(w,it,job){
    return new Promise(function(res,rej){
      w.onmessage=function(e){var d=e.data;if(d.id!==it.id)return;
        if(d.stage){it.stage=d.stage;it.pct=d.pct;paintMeta(it);}
        else if(d.done)res(d.done);else rej(new Error(d.error));};
      w.onerror=function(e){if(e.preventDefault)e.preventDefault();w.dead=true;rej(new Error('The browser ran out of memory on this image. Set a smaller width or height.'));};
      w.postMessage({id:it.id,job:job});
    });
  }
  async function xvConvert(){
    if(busy)return;
    var list=selected();if(!list.length)return;
    var W=num('xvW'),H=num('xvH');
    if([W,H].some(function(v){return v!==0&&!(v>=1&&v<=16384&&Math.floor(v)===v);})){setStatus(u.status,'Width and height must be whole numbers from 1 to 16,384, or empty.',1);return;}
    var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(/Mac/.test(navigator.platform)&&navigator.maxTouchPoints>1);
    var mobile=ios||/Android/.test(navigator.userAgent);
    var opt={type:type,quality:+g('xvQ').value,width:W,height:H,keep:g('xvK').checked,flatten:!g('xvT').checked,bg:g('xvB').value,maxPixels:ios?16e6:50e6};
    var id=++runId,queue=list.slice(),ok=0,bad=0;
    list.forEach(function(it){xvFree(it.outUrl);it.outUrl='';it.out=null;it.error='';it.state='queue';it.pct=0;it.stage='';});
    setBusy(true);
    function tell(){setStatus(u.status,'Converting… '+(ok+bad)+' of '+list.length+' finished.');}
    tell();
    var lanes=Math.min(list.length,mobile?1:Math.max(1,Math.min(3,Math.floor((navigator.hardwareConcurrency||2)/2))));
    async function lane(){
      var w=await startWorker();
      if(id!==runId)return;
      if(!w)await loadOnPage();
      while(queue.length&&id===runId){
        var it=queue.shift();it.state='work';it.pct=5;paintMeta(it);
        var job=Object.assign({file:it.file},opt);
        try{
          if(w&&w.dead){w=await startWorker();if(!w)await loadOnPage();}
          var r=w?await inWorker(w,it,job):await window.ImgConvert.run(job,function(s,p){it.stage=s;it.pct=p;paintMeta(it);});
          if(id!==runId)return;
          it.out=r;it.state='done';ok++;
          try{var tu=await smallUrl(r.blob);if(id!==runId){URL.revokeObjectURL(tu);return;}setThumb(it,tu);}catch(e){}
          if(id!==runId)return;
        }catch(e){if(id!==runId)return;it.state='err';it.error=e.message||'This image could not be converted.';bad++;}
        paintName(it);paintMeta(it);tell();
      }
    }
    try{await Promise.all(Array.from({length:lanes},lane));}
    catch(e){if(id===runId)list.forEach(function(it){if(it.state==='queue'||it.state==='work'){it.state='err';it.error='The converter could not start. Reload the page and try again.';bad++;}});}
    if(id!==runId)return;
    killWorkers();setBusy(false);
    var d=list.filter(function(i){return i.out;}),a=d.reduce(function(s,i){return s+i.file.size;},0),b=d.reduce(function(s,i){return s+i.out.blob.size;},0);
    setStatus(u.status,(ok?ok+' of '+list.length+' converted to '+OUT[opt.type][0]+'. '+fmtBytes(a)+' → '+fmtBytes(b)+' ('+pct(a,b)+').':'')+(bad?' '+bad+' could not be converted; see the list.':''),!ok);
    if(window._ga)window._ga('image_convert_done',{format:OUT[opt.type][1],count:ok});
  }
  g('xvGo').onclick=xvConvert;
  g('xvStop').onclick=function(){runId++;killWorkers();items.forEach(function(i){if(i.state==='queue'||i.state==='work'){i.state='wait';}});setBusy(false);setStatus(u.status,'Cancelled. Finished images are still available.');};

  /* ── downloads ── */
  function paintActions(){
    var d=xvDone();u.actions.innerHTML='';u.actions.className='actions'+(d.length&&!busy?' show':'');
    if(!d.length||busy)return;
    var mk=function(t,c,fn){var b=document.createElement('button');b.className='btn '+c;b.textContent=t;b.onclick=function(){fn(b);};u.actions.appendChild(b);};
    if(d.length>1)mk('Download all as ZIP ('+d.length+')','btn-primary',xvZip);
    else mk('Download '+OUT[d[0].out.type][0],'btn-primary',function(){download(d[0].out.blob,fileName(d[0]));});
  }
  function loadZip(){
    if(window.JSZip)return Promise.resolve();
    return new Promise(function(ok,no){var s=document.createElement('script');s.src=JSZIP[0];s.integrity=JSZIP[1];s.crossOrigin='anonymous';s.referrerPolicy='no-referrer';s.onload=ok;s.onerror=function(){s.remove();no(new Error('The ZIP component could not be downloaded. Download the images one by one, or try again.'));};document.head.appendChild(s);});
  }
  async function xvZip(btn){
    var d=xvDone(),label=btn.textContent;btn.disabled=true;btn.textContent='Preparing ZIP…';
    try{
      await loadZip();
      var z=new window.JSZip(),used={};
      d.forEach(function(it){
        var n=fileName(it),dot=n.lastIndexOf('.'),k=2,name=n;
        while(used[name.toLowerCase()])name=n.slice(0,dot)+' ('+(k++)+')'+n.slice(dot);
        used[name.toLowerCase()]=1;z.file(name,it.out.blob);
      });
      /* Images are already compressed, so they are stored as they are */
      var blob=await z.generateAsync({type:'blob',compression:'STORE'},function(m){btn.textContent='Preparing ZIP… '+Math.round(m.percent)+'%';});
      download(blob,'converted-images.zip');
    }catch(e){setStatus(u.status,e.message||'The ZIP could not be created.',1);}
    btn.disabled=false;btn.textContent=label;
  }
  refresh();
};
