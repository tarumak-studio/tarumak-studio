/* ============================================================
   TARUMAK STUDIO — Marketing Tool INIT Functions
   Requires: utils.js and data.js loaded first.
   ============================================================ */
/* Build the homepage marketing cards */
(function(){
  function buildMkCards(){
    var g=document.getElementById('mk-home-cards');if(!g)return;
    var mk=TOOLS.filter(function(t){return t[2]==='marketing';});
    g.innerHTML=mk.map(function(t){
      return '<div class="mk-card" onclick="go(\'t/'+t[0]+'\')">'
        +'<div class="mico">'+ICON.marketing+'</div>'
        +'<div><h4>'+t[1]+'</h4><p>'+t[3].substring(0,60)+'...</p></div></div>';
    }).join('');
  }
  var _sh=showHome;
  showHome=function(cat){_sh(cat);buildMkCards();};
  buildMkCards();
})();


INIT['social-image-resizer']=function(panel){
  var PRESETS=[
    {id:'ig-sq',   n:'Instagram Post',    w:1080,h:1080},
    {id:'ig-prt',  n:'Instagram Portrait',w:1080,h:1350},
    {id:'ig-st',   n:'Story / Reel',      w:1080,h:1920},
    {id:'fb-post', n:'Facebook Post',     w:1200,h:630},
    {id:'fb-cov',  n:'Facebook Cover',    w:820, h:312},
    {id:'tw-post', n:'Twitter Post',      w:1200,h:675},
    {id:'tw-head', n:'Twitter Header',    w:1500,h:500},
    {id:'li-post', n:'LinkedIn Post',     w:1200,h:628},
    {id:'li-ban',  n:'LinkedIn Banner',   w:1584,h:396},
    {id:'yt',      n:'YouTube Thumbnail', w:1280,h:720},
    {id:'wa',      n:'WhatsApp Profile',  w:800, h:800},
    {id:'pin',     n:'Pinterest Pin',     w:1000,h:1500},
  ];
  var img=null,sel=PRESETS[0],mode='fill',ox=0,oy=0;
  panel.innerHTML='<div class="pf-grid" id="pf-grid"></div>'
    +'<div class="controls" style="margin-bottom:14px"><label style="font-size:13px;color:var(--text-dim)">Mode: <select id="pf-mode" style="margin-left:6px"><option value="fill">Fill &amp; crop</option><option value="fit">Fit (letterbox)</option><option value="stretch">Stretch</option></select></label><button class="btn" id="pf-reset" style="margin-left:10px">Reset pan</button></div>'
    +'<div class="drop" id="pf-drop" style="min-height:160px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg><p>Drop an image here or click to upload</p><input type="file" id="pf-file" accept="image/*" style="display:none"></div>'
    +'<div id="pf-wrap" style="display:none"><canvas id="pf-canvas" style="max-width:100%;border-radius:12px;display:block;margin:0 auto;cursor:move;border:1px solid var(--border)"></canvas><div class="controls" style="margin-top:12px"><span id="pf-info" style="font-size:12px;color:var(--text-faint);flex:1"></span><button class="btn btn-primary" id="pf-dl">Download PNG</button></div></div>';
  var g=document.getElementById('pf-grid');
  PRESETS.forEach(function(p){
    var b=document.createElement('button');b.className='pf-btn'+(p===sel?' active':'');
    b.innerHTML='<strong>'+p.n+'</strong><small>'+p.w+'\u00d7'+p.h+'</small>';
    b.onclick=function(){sel=p;ox=0;oy=0;g.querySelectorAll('.pf-btn').forEach(function(x){x.classList.remove('active');});b.classList.add('active');draw();};
    g.appendChild(b);
  });
  var cv=document.getElementById('pf-canvas'),ctx=cv.getContext('2d');
  function draw(){
    if(!img)return;
    var W=Math.min(560,panel.offsetWidth-32||560),H=Math.round(W*sel.h/sel.w);
    cv.width=W;cv.height=H;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    if(mode==='fill'){var sc=Math.max(W/img.width,H/img.height);ctx.drawImage(img,(W-img.width*sc)/2+ox,(H-img.height*sc)/2+oy,img.width*sc,img.height*sc);}
    else if(mode==='fit'){var sc=Math.min(W/img.width,H/img.height);ctx.drawImage(img,(W-img.width*sc)/2,(H-img.height*sc)/2,img.width*sc,img.height*sc);}
    else{ctx.drawImage(img,0,0,W,H);}
    document.getElementById('pf-info').textContent='Output: '+sel.w+'\u00d7'+sel.h+' px \u2014 drag to reposition';
    document.getElementById('pf-wrap').style.display='';document.getElementById('pf-drop').style.display='none';
  }
  function loadF(file){var r=new FileReader();r.onload=function(e){var i=new Image();i.onload=function(){img=i;ox=0;oy=0;draw();};i.src=e.target.result;};r.readAsDataURL(file);}
  var dp=document.getElementById('pf-drop');
  dp.addEventListener('dragover',function(e){e.preventDefault();dp.classList.add('drag-over');});
  dp.addEventListener('dragleave',function(){dp.classList.remove('drag-over');});
  dp.addEventListener('drop',function(e){e.preventDefault();dp.classList.remove('drag-over');var f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))loadF(f);});
  dp.addEventListener('click',function(){document.getElementById('pf-file').click();});
  document.getElementById('pf-file').addEventListener('change',function(e){if(e.target.files[0])loadF(e.target.files[0]);});
  document.getElementById('pf-mode').addEventListener('change',function(){mode=this.value;ox=0;oy=0;draw();});
  document.getElementById('pf-reset').addEventListener('click',function(){ox=0;oy=0;draw();});
  var dr=false,sx=0,sy=0,sox=0,soy=0;
  cv.addEventListener('mousedown',function(e){if(mode!=='fill')return;dr=true;sx=e.clientX;sy=e.clientY;sox=ox;soy=oy;});
  cv.addEventListener('touchstart',function(e){if(mode!=='fill')return;dr=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY;sox=ox;soy=oy;e.preventDefault();},{passive:false});
  document.addEventListener('mousemove',function(e){if(!dr)return;ox=sox+(e.clientX-sx);oy=soy+(e.clientY-sy);draw();});
  cv.addEventListener('touchmove',function(e){if(!dr)return;ox=sox+(e.touches[0].clientX-sx);oy=soy+(e.touches[0].clientY-sy);draw();e.preventDefault();},{passive:false});
  document.addEventListener('mouseup',function(){dr=false;});cv.addEventListener('touchend',function(){dr=false;});
  document.getElementById('pf-dl').addEventListener('click',function(){
    if(!img)return;var fc=document.createElement('canvas');fc.width=sel.w;fc.height=sel.h;var c2=fc.getContext('2d');
    c2.fillStyle='#fff';c2.fillRect(0,0,sel.w,sel.h);
    var W=cv.width,H=cv.height,sr=sel.w/W;
    if(mode==='fill'){var sc=Math.max(W/img.width,H/img.height);c2.drawImage(img,((W-img.width*sc)/2+ox)*sr,((H-img.height*sc)/2+oy)*sr,img.width*sc*sr,img.height*sc*sr);}
    else if(mode==='fit'){var sc=Math.min(sel.w/img.width,sel.h/img.height);c2.drawImage(img,(sel.w-img.width*sc)/2,(sel.h-img.height*sc)/2,img.width*sc,img.height*sc);}
    else{c2.drawImage(img,0,0,sel.w,sel.h);}
    fc.toBlob(function(b){download(b,'social-'+sel.id+'.png');});
  });
};

/* 2 ─ Color Palette Generator */
INIT['color-palette-gen']=function(panel){
  function h2r(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
  function r2h(r,g,b){return '#'+(r.toString(16).padStart(2,'0'))+(g.toString(16).padStart(2,'0'))+(b.toString(16).padStart(2,'0'));}
  function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;
    if(max===min){h=s=0;}else{var d=max-min;s=l>.5?d/(2-max-min):d/(max+min);
      h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
    return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
  function hsl2hex(h,s,l){h/=360;s/=100;l/=100;
    var r,g,b;if(s===0){r=g=b=l;}else{
      var q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
      function hh(p,q,t){if(t<0)t++;if(t>1)t--;if(t<1/6)return p+(q-p)*6*t;if(t<.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
      r=hh(p,q,h+1/3);g=hh(p,q,h);b=hh(p,q,h-1/3);}
    return r2h(Math.round(r*255),Math.round(g*255),Math.round(b*255));}
  function extract(rgba,n){
    var bk={};
    for(var i=0;i<rgba.length;i+=16){if(rgba[i+3]<120)continue;var k=(rgba[i]>>3)+','+(rgba[i+1]>>3)+','+(rgba[i+2]>>3);bk[k]=(bk[k]||0)+1;}
    var sorted=Object.entries(bk).sort(function(a,b){return b[1]-a[1];});
    var res=[];
    for(var i=0;i<sorted.length&&res.length<n;i++){
      var p=sorted[i][0].split(',');var R=p[0]<<3,G=p[1]<<3,B=p[2]<<3;
      var ok=true;for(var j=0;j<res.length;j++){var dr=R-res[j][0],dg=G-res[j][1],db=B-res[j][2];if(Math.sqrt(dr*dr+dg*dg+db*db)<38){ok=false;break;}}
      if(ok)res.push([R,G,B]);
    }
    return res.map(function(c){return r2h(c[0],c[1],c[2]);});
  }
  function renderColors(colors,out){
    out.innerHTML='<div style="display:flex;border-radius:12px;overflow:hidden;height:52px;margin-bottom:14px">'
      +colors.map(function(c){return '<div style="flex:1;background:'+c+';cursor:pointer;transition:.15s" title="'+c+'" onclick="navigator.clipboard.writeText(\''+c+'\').then(function(){toast(\''+c+' copied\',\'ok\',2000);})" onmouseover="this.style.flex=2" onmouseout="this.style.flex=1"></div>';}).join('')+'</div>'
      +colors.map(function(c){var rgb=h2r(c),hsl=rgb2hsl(rgb[0],rgb[1],rgb[2]);
        return '<div class="swatch-card" onclick="navigator.clipboard.writeText(\''+c+'\').then(function(){toast(\''+c+' copied\',\'ok\',2000);})">'
          +'<div class="sc-box" style="background:'+c+'"></div>'
          +'<div><div class="sc-hex">'+c.toUpperCase()+'</div>'
          +'<div class="sc-meta">RGB('+rgb.join(', ')+') &bull; HSL('+hsl[0]+'\u00b0,'+hsl[1]+'%,'+hsl[2]+'%)</div></div>'
          +'<span style="margin-left:auto;font-size:11px;color:var(--text-faint)">copy</span></div>';
      }).join('');
  }
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:16px" id="cp-tabs">'
    +'<button class="btn active" id="cp-t1">From Image</button>'
    +'<button class="btn" id="cp-t2">From Color</button></div>'
    +'<div id="cp-img"><div class="drop" id="cp-drop" style="min-height:140px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="34" height="34"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg><p>Drop image to extract palette</p><input type="file" id="cp-file" accept="image/*" style="display:none"></div><div id="cp-out"></div></div>'
    +'<div id="cp-col" style="display:none"><div class="controls"><label style="font-size:13px;color:var(--text-dim)">Base color: </label><input type="color" id="cp-base" value="#6366f1" style="margin:0 8px;width:44px;height:36px;border-radius:8px;border:1px solid var(--border);background:none;cursor:pointer"><button class="btn btn-primary" id="cp-gen">Generate palettes</button></div><div id="cp-pal-out" style="margin-top:16px"></div></div>';
  document.getElementById('cp-t1').onclick=function(){document.getElementById('cp-img').style.display='';document.getElementById('cp-col').style.display='none';this.classList.add('active');document.getElementById('cp-t2').classList.remove('active');};
  document.getElementById('cp-t2').onclick=function(){document.getElementById('cp-col').style.display='';document.getElementById('cp-img').style.display='none';this.classList.add('active');document.getElementById('cp-t1').classList.remove('active');};
  var dp=document.getElementById('cp-drop'),cpf=document.getElementById('cp-file'),cpout=document.getElementById('cp-out');
  dp.addEventListener('dragover',function(e){e.preventDefault();dp.classList.add('drag-over');});
  dp.addEventListener('dragleave',function(){dp.classList.remove('drag-over');});
  dp.addEventListener('drop',function(e){e.preventDefault();dp.classList.remove('drag-over');var f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))loadImg(f);});
  dp.addEventListener('click',function(){cpf.click();});cpf.addEventListener('change',function(e){if(e.target.files[0])loadImg(e.target.files[0]);});
  function loadImg(file){var r=new FileReader();r.onload=function(e){var i=new Image();i.onload=function(){
    var c=document.createElement('canvas');c.width=Math.min(i.width,200);c.height=Math.round(i.height*c.width/i.width);
    c.getContext('2d').drawImage(i,0,0,c.width,c.height);
    var cols=extract(c.getContext('2d').getImageData(0,0,c.width,c.height).data,8);
    renderColors(cols,cpout);toast('Palette extracted — click any color to copy','info');};i.src=e.target.result;};r.readAsDataURL(file);}
  document.getElementById('cp-gen').onclick=function(){
    var h=document.getElementById('cp-base').value;var hsl=rgb2hsl(...h2r(h));
    var H=hsl[0],S=hsl[1],L=hsl[2];
    var types=[
      {name:'Complementary',cols:[h,hsl2hex((H+180)%360,S,L)]},
      {name:'Analogous',cols:[hsl2hex((H-30+360)%360,S,L),h,hsl2hex((H+30)%360,S,L)]},
      {name:'Triadic',cols:[h,hsl2hex((H+120)%360,S,L),hsl2hex((H+240)%360,S,L)]},
      {name:'Split Complementary',cols:[h,hsl2hex((H+150)%360,S,L),hsl2hex((H+210)%360,S,L)]},
      {name:'Tints & Shades',cols:[hsl2hex(H,S,90),hsl2hex(H,S,75),hsl2hex(H,S,60),h,hsl2hex(H,S,35),hsl2hex(H,S,20)]},
    ];
    var po=document.getElementById('cp-pal-out');
    po.innerHTML=types.map(function(t){
      return '<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-bottom:8px">'+t.name+'</div>'
        +'<div style="display:flex;border-radius:10px;overflow:hidden;height:44px">'
        +t.cols.map(function(c){return '<div style="flex:1;background:'+c+';cursor:pointer" onclick="navigator.clipboard.writeText(\''+c+'\').then(function(){toast(\''+c+' copied\',\'ok\',2000);})" title="'+c+'"></div>';}).join('')+'</div>'
        +'<div style="display:flex;gap:6px;margin-top:6px">'+t.cols.map(function(c){return '<div style="flex:1;text-align:center;font-family:var(--fm);font-size:10px;color:var(--text-faint);cursor:pointer" onclick="navigator.clipboard.writeText(\''+c+'\').then(function(){toast(\''+c+' copied\',\'ok\',2000);})">'+c+'</div>';}).join('')+'</div></div>';
    }).join('');
  };
};

/* 3 ─ Ad Copy Generator */
INIT['ad-copy-gen']=function(panel){
  var HEADLINES={professional:['Elevate your {product} — Professional results, every time.','The smart choice for {benefit}: introducing {product}.','Trusted by thousands. Now available to you. Try {product}.','Finally: {benefit} without the complexity.','Results-driven {product} for serious professionals.'],
    friendly:['You\'re going to love what {product} does for {benefit}!','Hey {audience} — we made {product} just for you.','Meet {product}: your new favourite for {benefit}.','No fuss, just results. That\'s {product}.','Good news: {benefit} just got so much easier.'],
    urgent:['Last chance: Get {product} before prices rise.','{benefit} NOW — don\'t wait another day.','Act fast: {product} is changing how {audience} work.','Your competitors are already using {product}. Are you?','Limited time: unlock {benefit} with {product} today.'],
    playful:['{product}: because {benefit} shouldn\'t be boring.','Who said {benefit} can\'t be fun? {product} did.','Plot twist: {benefit} is actually easy now. Thanks, {product}!','Zero stress. All results. Very {product}.','Be the {audience} everyone else is jealous of.']};
  var BODY={professional:['Designed for {audience} who demand results, {product} delivers {benefit} with precision and reliability. Trusted by professionals worldwide.','With {product}, {audience} can achieve {benefit} faster than ever before — backed by industry-leading technology and expert support.'],
    friendly:['Struggling with {benefit}? {product} makes it simple and enjoyable for {audience} of all skill levels. Get started in minutes, not hours!','Join thousands of happy {audience} who\'ve transformed their approach to {benefit} using {product}. Friendly, fast and fantastic.'],
    urgent:['Stop losing time on {benefit}. {product} gives {audience} the edge they need — right now. Don\'t let competitors get ahead.','Every day without {product} is a missed opportunity for {benefit}. {audience}, it\'s time to take action.'],
    playful:['Why struggle with {benefit} when {product} makes it ridiculously easy? {audience}, life\'s too short for boring tools.','{audience} approved. Chaos disapproved. {product} brings you {benefit} with a side of pure joy.']};
  var CTAS=['Try {product} Free','Get Started Now','Claim Your {benefit}','Start for Free','See It in Action','Unlock {benefit}','Get {product} Today','Try It — It\'s Free'];
  function fill(tpl,vals){return tpl.replace(/\{(\w+)\}/g,function(_,k){return vals[k]||'{'+k+'}';});}
  panel.innerHTML='<div class="row" style="grid-template-columns:1fr 1fr;margin-bottom:0">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Product / Service</label><input id="ag-prod" type="text" placeholder="e.g. TARUMAK Tools" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Key Benefit</label><input id="ag-ben" type="text" placeholder="e.g. save 2 hours a day" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Target Audience</label><input id="ag-aud" type="text" placeholder="e.g. designers" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Tone</label><select id="ag-tone" style="width:100%;margin-top:4px"><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="urgent">Urgent</option><option value="playful">Playful</option></select></div></div>'
    +'<button class="btn btn-primary" id="ag-gen" style="margin:16px 0;width:100%">Generate Ad Copy</button>'
    +'<div id="ag-out"></div>';
  document.getElementById('ag-gen').onclick=function(){
    var vals={product:document.getElementById('ag-prod').value||'Your Product',benefit:document.getElementById('ag-ben').value||'amazing results',audience:document.getElementById('ag-aud').value||'users'};
    var tone=document.getElementById('ag-tone').value;
    var h=HEADLINES[tone],b=BODY[tone];
    var out=document.getElementById('ag-out');
    function block(title,icon,items){return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px"><div style="font-size:12px;font-weight:600;color:var(--text-faint);letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">'+icon+' '+title+'</div>'+items.map(function(s,i){return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-top:'+(i>0?'1px solid var(--border)':'none')+'"><span style="font-size:13px;flex:1;line-height:1.5;color:var(--text)">'+s+'</span><button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent.trim()).then(function(){toast(\'Copied!\',\'ok\',1800);})" style="border:none;background:none;cursor:pointer;color:var(--text-faint);font-size:12px;flex-shrink:0;padding:0">copy</button></div>';}).join('')+'</div>';}
    out.innerHTML=block('Headlines','\ud83d\udcf0',h.map(function(t){return fill(t,vals);}))
      +block('Primary Text','\u270d\ufe0f',b.map(function(t){return fill(t,vals);}))
      +block('CTA Options','\ud83c\udfaf',CTAS.map(function(t){return fill(t,vals);}));
  };
};

/* 4 ─ CTA Button Generator */
INIT['cta-button-gen']=function(panel){
  panel.innerHTML='<div class="row" style="grid-template-columns:1fr 1fr">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Button Text</label><input id="cb-txt" type="text" value="Get Started Free" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Font Size</label><input id="cb-fs" type="range" min="12" max="24" value="16" style="width:100%;margin-top:12px"><span id="cb-fs-v" style="font-size:12px;color:var(--text-faint)">16px</span></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Background</label><input id="cb-bg" type="color" value="#6366f1" style="width:100%;height:36px;border-radius:8px;border:1px solid var(--border);cursor:pointer;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Text Color</label><input id="cb-tc" type="color" value="#ffffff" style="width:100%;height:36px;border-radius:8px;border:1px solid var(--border);cursor:pointer;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Border Radius</label><input id="cb-br" type="range" min="0" max="50" value="10" style="width:100%;margin-top:12px"><span id="cb-br-v" style="font-size:12px;color:var(--text-faint)">10px</span></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Padding H</label><input id="cb-ph" type="range" min="8" max="48" value="24" style="width:100%;margin-top:12px"><span id="cb-ph-v" style="font-size:12px;color:var(--text-faint)">24px</span></div></div>'
    +'<div class="cta-pw"><button id="cb-preview" style="cursor:default">Get Started Free</button></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;font-family:var(--fm);font-size:12.5px;line-height:1.8" id="cb-css"></div>'
    +'<div class="controls" style="margin-top:12px"><button class="btn" id="cb-copy">Copy CSS</button><button class="btn btn-primary" id="cb-dl">Download PNG</button></div>';
  function upd(){
    var txt=document.getElementById('cb-txt').value||'Button',bg=document.getElementById('cb-bg').value,tc=document.getElementById('cb-tc').value;
    var fs=document.getElementById('cb-fs').value,br=document.getElementById('cb-br').value,ph=document.getElementById('cb-ph').value;
    document.getElementById('cb-fs-v').textContent=fs+'px';document.getElementById('cb-br-v').textContent=br+'px';document.getElementById('cb-ph-v').textContent=ph+'px';
    var btn=document.getElementById('cb-preview');
    btn.textContent=txt;btn.style.cssText='background:'+bg+';color:'+tc+';font-size:'+fs+'px;border-radius:'+br+'px;padding:'+(Math.round(fs*.6))+'px '+ph+'px;border:none;font-weight:600;letter-spacing:.3px;cursor:pointer;font-family:inherit';
    document.getElementById('cb-css').innerHTML='<span style="color:var(--p1)">.cta-button</span> {<br>'
      +'&nbsp;&nbsp;background: '+bg+';<br>'+'&nbsp;&nbsp;color: '+tc+';<br>'+'&nbsp;&nbsp;font-size: '+fs+'px;<br>'
      +'&nbsp;&nbsp;border-radius: '+br+'px;<br>'+'&nbsp;&nbsp;padding: '+Math.round(fs*.6)+'px '+ph+'px;<br>'
      +'&nbsp;&nbsp;border: none;<br>'+'&nbsp;&nbsp;font-weight: 600;<br>'+'&nbsp;&nbsp;cursor: pointer;<br>}';
  }
  ['cb-txt','cb-fs','cb-bg','cb-tc','cb-br','cb-ph'].forEach(function(id){document.getElementById(id).addEventListener('input',upd);});
  upd();
  document.getElementById('cb-copy').onclick=function(){
    var css='.cta-button{background:'+document.getElementById('cb-bg').value+';color:'+document.getElementById('cb-tc').value+';font-size:'+document.getElementById('cb-fs').value+'px;border-radius:'+document.getElementById('cb-br').value+'px;padding:'+Math.round(document.getElementById('cb-fs').value*.6)+'px '+document.getElementById('cb-ph').value+'px;border:none;font-weight:600;cursor:pointer;}';
    navigator.clipboard.writeText(css).then(function(){toast('CSS copied!','ok');});};
  document.getElementById('cb-dl').onclick=function(){
    var btn=document.getElementById('cb-preview'),r=btn.getBoundingClientRect(),pw=r.width+40,ph=r.height+40;
    var c=document.createElement('canvas');c.width=pw*2;c.height=ph*2;var cx=c.getContext('2d');cx.scale(2,2);
    cx.fillStyle='#ffffff';cx.fillRect(0,0,pw,ph);
    var br=+document.getElementById('cb-br').value,bg=document.getElementById('cb-bg').value,tc=document.getElementById('cb-tc').value,fs=+document.getElementById('cb-fs').value,p=Math.round(fs*.6),ph2=+document.getElementById('cb-ph').value;
    var bw=r.width,bh=r.height,bx=(pw-bw)/2,by=(ph-bh)/2;
    cx.beginPath();cx.moveTo(bx+br,by);cx.lineTo(bx+bw-br,by);cx.arcTo(bx+bw,by,bx+bw,by+br,br);cx.lineTo(bx+bw,by+bh-br);cx.arcTo(bx+bw,by+bh,bx+bw-br,by+bh,br);cx.lineTo(bx+br,by+bh);cx.arcTo(bx,by+bh,bx,by+bh-br,br);cx.lineTo(bx,by+br);cx.arcTo(bx,by,bx+br,by,br);cx.closePath();cx.fillStyle=bg;cx.fill();
    cx.fillStyle=tc;cx.font='600 '+fs+'px Inter,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(document.getElementById('cb-txt').value||'Button',pw/2,ph/2);
    c.toBlob(function(b){download(b,'cta-button.png');});};
};

/* 5 ─ UTM Link Builder */
INIT['utm-builder']=function(panel){
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:16px"><button class="btn active" id="ut-t1">Build URL</button><button class="btn" id="ut-t2">Decode URL</button></div>'
    +'<div id="ut-build"><div class="row" style="grid-template-columns:1fr">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Website URL *</label><input id="ut-url" type="url" placeholder="https://yourwebsite.com/page" style="width:100%;margin-top:4px"></div></div>'
    +'<div class="row" style="grid-template-columns:1fr 1fr;margin-top:12px">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Source * <span style="opacity:.6">(google, newsletter)</span></label><input id="ut-src" type="text" placeholder="google" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Medium * <span style="opacity:.6">(cpc, email)</span></label><input id="ut-med" type="text" placeholder="cpc" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Campaign * <span style="opacity:.6">(summer_sale)</span></label><input id="ut-cam" type="text" placeholder="campaign_name" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Term <span style="opacity:.6">optional</span></label><input id="ut-term" type="text" placeholder="keyword" style="width:100%;margin-top:4px"></div>'
    +'<div style="grid-column:1/-1"><label style="font-size:12px;color:var(--text-dim)">Content <span style="opacity:.6">optional — for A/B testing</span></label><input id="ut-con" type="text" placeholder="header-link" style="width:100%;margin-top:4px"></div></div>'
    +'<div class="utm-out" id="ut-out"><span style="color:var(--text-faint)">Your UTM URL will appear here...</span></div>'
    +'<div class="controls"><button class="btn btn-primary" id="ut-build-btn">Build URL</button><button class="btn" id="ut-copy" style="display:none">Copy URL</button></div></div>'
    +'<div id="ut-decode" style="display:none"><label style="font-size:12px;color:var(--text-dim)">Paste a UTM URL to decode it</label>'
    +'<textarea id="ut-paste" rows="3" placeholder="https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring" style="width:100%;margin:8px 0;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<button class="btn btn-primary" id="ut-dec-btn">Decode</button><div id="ut-dec-out"></div></div>';
  document.getElementById('ut-t1').onclick=function(){document.getElementById('ut-build').style.display='';document.getElementById('ut-decode').style.display='none';this.classList.add('active');document.getElementById('ut-t2').classList.remove('active');};
  document.getElementById('ut-t2').onclick=function(){document.getElementById('ut-decode').style.display='';document.getElementById('ut-build').style.display='none';this.classList.add('active');document.getElementById('ut-t1').classList.remove('active');};
  document.getElementById('ut-build-btn').onclick=function(){
    var base=document.getElementById('ut-url').value.trim();
    var src=document.getElementById('ut-src').value.trim(),med=document.getElementById('ut-med').value.trim(),cam=document.getElementById('ut-cam').value.trim();
    if(!base||!src||!med||!cam){toast('Please fill in URL, Source, Medium and Campaign','err');return;}
    var params=[['utm_source',src],['utm_medium',med],['utm_campaign',cam],['utm_term',document.getElementById('ut-term').value.trim()],['utm_content',document.getElementById('ut-con').value.trim()]].filter(function(p){return p[1];});
    var sep=base.includes('?')?'&':'?';
    var full=base+sep+params.map(function(p){return encodeURIComponent(p[0])+'='+encodeURIComponent(p[1]);}).join('&');
    var display=base+'<span class="utm-param">'+sep+params.map(function(p){return p[0]+'='+encodeURIComponent(p[1]);}).join('&amp;')+'</span>';
    document.getElementById('ut-out').innerHTML=display;
    document.getElementById('ut-copy').style.display='';
    document.getElementById('ut-copy').onclick=function(){navigator.clipboard.writeText(full).then(function(){toast('UTM URL copied!','ok');});};};
  document.getElementById('ut-dec-btn').onclick=function(){
    try{var u=new URL(document.getElementById('ut-paste').value.trim());
      var p=['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
      var found=p.filter(function(k){return u.searchParams.get(k);});
      if(!found.length){document.getElementById('ut-dec-out').innerHTML='<p style="color:var(--text-faint);margin-top:12px">No UTM parameters found.</p>';return;}
      document.getElementById('ut-dec-out').innerHTML='<div style="margin-top:14px">'
        +p.map(function(k){var v=u.searchParams.get(k);if(!v)return '';
          return '<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);align-items:center"><span style="font-family:var(--fm);font-size:12px;color:var(--text-faint);min-width:130px">'+k+'</span><span style="font-size:13px;color:var(--text);flex:1">'+v+'</span></div>';}).join('')+'</div>';
    }catch(e){toast('Invalid URL — please include https://','err');}};
};

/* 6 ─ Open Graph Image Generator */
INIT['og-image-gen']=function(panel){
  var OW=1200,OH=630;
  panel.innerHTML='<div class="row" style="grid-template-columns:1fr 1fr">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Title</label><input id="og-title" type="text" value="Your Page Title" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Subtitle</label><input id="og-sub" type="text" value="tarumak.com" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Background Color</label><input id="og-bg" type="color" value="#0f172a" style="width:100%;height:36px;border-radius:8px;border:1px solid var(--border);margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Accent Color</label><input id="og-ac" type="color" value="#6366f1" style="width:100%;height:36px;border-radius:8px;border:1px solid var(--border);margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Text Color</label><input id="og-tc" type="color" value="#ffffff" style="width:100%;height:36px;border-radius:8px;border:1px solid var(--border);margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Logo Text (optional)</label><input id="og-logo" type="text" value="TARUMAK" style="width:100%;margin-top:4px"></div></div>'
    +'<canvas id="og-canvas" style="max-width:100%;border-radius:12px;display:block;margin:14px auto;border:1px solid var(--border)"></canvas>'
    +'<div class="controls"><span style="font-size:12px;color:var(--text-faint);flex:1">1200 \u00d7 630 px (OG standard)</span><button class="btn btn-primary" id="og-dl">Download PNG</button></div>';
  var cv=document.getElementById('og-canvas'),ctx=cv.getContext('2d');
  var DW=Math.min(600,panel.offsetWidth-32||600),DH=Math.round(DW*OH/OW);
  cv.width=DW;cv.height=DH;
  function draw(){
    var bg=document.getElementById('og-bg').value,ac=document.getElementById('og-ac').value,tc=document.getElementById('og-tc').value;
    var title=document.getElementById('og-title').value||'Your Title',sub=document.getElementById('og-sub').value,logo=document.getElementById('og-logo').value;
    var scale=DW/OW;
    ctx.fillStyle=bg;ctx.fillRect(0,0,DW,DH);
    // Accent bar left
    ctx.fillStyle=ac;ctx.fillRect(0,0,Math.round(8*scale),DH);
    // Gradient overlay
    var grad=ctx.createLinearGradient(DW*.5,0,DW,DH);grad.addColorStop(0,'transparent');grad.addColorStop(1,ac+'22');ctx.fillStyle=grad;ctx.fillRect(0,0,DW,DH);
    // Logo
    if(logo){ctx.fillStyle=ac;ctx.font='700 '+Math.round(16*scale)+'px Inter,sans-serif';ctx.fillText(logo,Math.round(60*scale),Math.round(70*scale));}
    // Title (word wrap)
    ctx.fillStyle=tc;var fs=Math.round(52*scale);ctx.font='700 '+fs+'px Inter,sans-serif';
    var words=title.split(' '),line='',lines=[],maxW=DW-Math.round(120*scale);
    words.forEach(function(w){var t=line+(line?' ':'')+w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else{line=t;}});lines.push(line);
    var ty=Math.round(DH/2-(lines.length-1)*fs*0.65);
    lines.forEach(function(l,i){ctx.fillText(l,Math.round(60*scale),ty+i*Math.round(fs*1.25));});
    // Subtitle
    if(sub){ctx.fillStyle=tc+'aa';ctx.font='400 '+Math.round(22*scale)+'px Inter,sans-serif';ctx.fillText(sub,Math.round(60*scale),DH-Math.round(40*scale));}
    // Decorative circles
    ctx.beginPath();ctx.arc(DW+Math.round(50*scale),Math.round(-30*scale),Math.round(200*scale),0,2*Math.PI);ctx.fillStyle=ac+'18';ctx.fill();
    ctx.beginPath();ctx.arc(DW-Math.round(80*scale),DH+Math.round(30*scale),Math.round(150*scale),0,2*Math.PI);ctx.fillStyle=ac+'12';ctx.fill();
  }
  ['og-title','og-sub','og-bg','og-ac','og-tc','og-logo'].forEach(function(id){document.getElementById(id).addEventListener('input',draw);});
  draw();
  document.getElementById('og-dl').onclick=function(){
    var fc=document.createElement('canvas');fc.width=OW;fc.height=OH;var c2=fc.getContext('2d');
    var prev={w:DW,h:DH};cv.width=OW;cv.height=OH;draw();fc.width=OW;fc.height=OH;c2.drawImage(cv,0,0);cv.width=prev.w;cv.height=prev.h;draw();
    fc.toBlob(function(b){download(b,'og-image-1200x630.png');});};
};

/* 7 ─ PDF Lead Magnet Creator */
INIT['pdf-lead-magnet']=function(panel){
  panel.innerHTML='<div class="row" style="grid-template-columns:1fr 1fr">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Template</label><select id="lm-tpl" style="width:100%;margin-top:4px"><option value="checklist">Checklist</option><option value="guide">Step-by-Step Guide</option><option value="cheatsheet">Cheatsheet</option><option value="resources">Resource List</option></select></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Accent Color</label><input id="lm-col" type="color" value="#6366f1" style="width:100%;height:36px;border-radius:8px;border:1px solid var(--border);margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Document Title</label><input id="lm-title" type="text" placeholder="10 Ways to Compress Images" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Your Brand / Name</label><input id="lm-brand" type="text" placeholder="TARUMAK Tools" style="width:100%;margin-top:4px"></div></div>'
    +'<div style="margin:14px 0"><label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:8px">Items (one per line)</label>'
    +'<textarea id="lm-items" rows="8" style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical;line-height:1.6" placeholder="Compress images before uploading\nUse WebP format for web images\nRemove EXIF data for privacy\nResize to actual display dimensions"></textarea></div>'
    +'<button class="btn btn-primary" id="lm-gen" style="width:100%">Generate PDF Lead Magnet</button>';
  document.getElementById('lm-gen').onclick=function(){
    var title=document.getElementById('lm-title').value||'Your Guide',brand=document.getElementById('lm-brand').value||'Your Brand';
    var col=document.getElementById('lm-col').value,tpl=document.getElementById('lm-tpl').value;
    var items=document.getElementById('lm-items').value.trim().split('\n').filter(function(l){return l.trim();});
    if(!items.length){toast('Please add at least one item','err');return;}
    var {jsPDF}=window.jspdf;var doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    var W=210,H=297,m=20,cr=[parseInt(col.slice(1,3),16),parseInt(col.slice(3,5),16),parseInt(col.slice(5,7),16)];
    // Header band
    doc.setFillColor(cr[0],cr[1],cr[2]);doc.rect(0,0,W,52,'F');
    // Left accent
    doc.setFillColor(255,255,255,0.3);
    // Title
    doc.setTextColor(255,255,255);doc.setFontSize(22);doc.setFont('helvetica','bold');
    doc.text(title,m,28,{maxWidth:W-m*2});
    // Tpl type badge
    var badgeLabels={checklist:'Checklist',guide:'Step-by-Step Guide',cheatsheet:'Cheatsheet',resources:'Resource List'};
    doc.setFontSize(10);doc.setFont('helvetica','normal');
    doc.text(badgeLabels[tpl].toUpperCase()+' \u2022 '+brand,m,44);
    // Items
    doc.setTextColor(30,30,30);var y=70;var symbols={checklist:'\u25a1',guide:'',cheatsheet:'\u2022',resources:'\u2192'};
    items.forEach(function(item,i){
      if(y>H-30){doc.addPage();doc.setFillColor(cr[0],cr[1],cr[2]);doc.rect(0,0,W,10,'F');y=25;}
      if(tpl==='guide'){
        doc.setFillColor(cr[0],cr[1],cr[2]);doc.circle(m+4,y-1,4,'F');
        doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(String(i+1),m+4,y+1,{align:'center'});
        doc.setTextColor(30,30,30);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.text(item,m+12,y+2,{maxWidth:W-m-20});
      }else{
        doc.setFillColor(cr[0],cr[1],cr[2]);if(tpl==='checklist'){doc.rect(m,y-5,5,5,'S');}
        doc.setTextColor(30,30,30);doc.setFontSize(12);doc.setFont('helvetica','normal');
        doc.text((tpl!=='checklist'?symbols[tpl]+' ':' ')+item,m+(tpl==='checklist'?8:0),y,{maxWidth:W-m*2-8});
      }
      y+=14;if(tpl==='guide')y+=4;
    });
    // Footer
    var pages=doc.getNumberOfPages();
    for(var p=1;p<=pages;p++){doc.setPage(p);doc.setFillColor(cr[0],cr[1],cr[2]);doc.rect(0,H-12,W,12,'F');doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(brand+' \u2022 tarumak.com',m,H-4);doc.text('Page '+p+' of '+pages,W-m,H-4,{align:'right'});}
    doc.save(title.toLowerCase().replace(/\s+/g,'-')+'.pdf');
    toast('PDF downloaded!','ok');
  };
};

/* 8 ─ Brand Color Extractor */
INIT['brand-color-extract']=function(panel){
  function r2h(r,g,b){return'#'+(r.toString(16).padStart(2,'0'))+(g.toString(16).padStart(2,'0'))+(b.toString(16).padStart(2,'0'));}
  function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;if(max===min){h=s=0;}else{var d=max-min;s=l>.5?d/(2-max-min):d/(max+min);h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
  panel.innerHTML='<div class="drop" id="bc-drop" style="min-height:160px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="36" height="36"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><p>Upload your logo or brand image</p><small style="color:var(--text-faint);font-size:12px;margin-top:4px;display:block">PNG with transparent background works best</small><input type="file" id="bc-file" accept="image/*" style="display:none"></div>'
    +'<div id="bc-out" style="display:none"><div id="bc-swatches"></div>'
    +'<div style="margin-top:16px"><label style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:6px">Export as CSS Variables</label><div class="utm-out" id="bc-css"></div></div>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="bc-copy">Copy CSS</button><button class="btn btn-primary" id="bc-png">Download Palette PNG</button></div></div>';
  var drop=document.getElementById('bc-drop');
  drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('drag-over');});drop.addEventListener('dragleave',function(){drop.classList.remove('drag-over');});
  drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('drag-over');var f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))loadF(f);});
  drop.addEventListener('click',function(){document.getElementById('bc-file').click();});document.getElementById('bc-file').addEventListener('change',function(e){if(e.target.files[0])loadF(e.target.files[0]);});
  var colors=[];
  function loadF(file){var r=new FileReader();r.onload=function(e){var img=new Image();img.onload=function(){
    var c=document.createElement('canvas');c.width=Math.min(img.width,300);c.height=Math.round(img.height*c.width/img.width);
    var cx=c.getContext('2d');cx.drawImage(img,0,0,c.width,c.height);
    var data=cx.getImageData(0,0,c.width,c.height).data,bk={};
    for(var i=0;i<data.length;i+=12){if(data[i+3]<120)continue;var k=(data[i]>>2)+','+(data[i+1]>>2)+','+(data[i+2]>>2);bk[k]=(bk[k]||0)+1;}
    var sorted=Object.entries(bk).sort(function(a,b){return b[1]-a[1];});
    colors=[];
    for(var i=0;i<sorted.length&&colors.length<8;i++){
      var p=sorted[i][0].split(',');var R=p[0]<<2,G=p[1]<<2,B=p[2]<<2;
      var ok=true;for(var j=0;j<colors.length;j++){var dr=R-colors[j][0],dg=G-colors[j][1],db=B-colors[j][2];if(Math.sqrt(dr*dr+dg*dg+db*db)<32){ok=false;break;}}
      if(ok)colors.push([R,G,B]);
    }
    var hexes=colors.map(function(c){return r2h(c[0],c[1],c[2]);});
    var sw=document.getElementById('bc-swatches');
    sw.innerHTML=hexes.map(function(h,i){
      var rgb=colors[i],hsl=rgb2hsl(rgb[0],rgb[1],rgb[2]);
      return '<div class="swatch-card" onclick="navigator.clipboard.writeText(\''+h+'\').then(function(){toast(\''+h+' copied\',\'ok\',2000);})">'
        +'<div class="sc-box" style="background:'+h+'"></div>'
        +'<div style="flex:1"><div class="sc-hex">'+h.toUpperCase()+'</div><div class="sc-meta">RGB('+rgb.join(', ')+') &bull; HSL('+hsl.join('\u00b0,')+') </div></div>'
        +'<span style="font-size:11px;color:var(--text-faint)">copy</span></div>';
    }).join('');
    var css=hexes.map(function(h,i){return '--brand-'+(i===0?'primary':i===1?'secondary':'color-'+(i+1))+': '+h+';';}).join('\n');
    document.getElementById('bc-css').textContent=css;
    document.getElementById('bc-out').style.display='';drop.style.display='none';
    document.getElementById('bc-copy').onclick=function(){navigator.clipboard.writeText(':root {\n'+css+'\n}').then(function(){toast('CSS variables copied!','ok');});};
    document.getElementById('bc-png').onclick=function(){
      var pw=440,ph=60+hexes.length*64;var c2=document.createElement('canvas');c2.width=pw*2;c2.height=ph*2;var ctx=c2.getContext('2d');ctx.scale(2,2);
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,pw,ph);
      hexes.forEach(function(h,i){ctx.fillStyle=h;ctx.fillRect(20,20+i*64,60,52);ctx.fillStyle='#111';ctx.font='600 14px monospace';ctx.fillText(h.toUpperCase(),94,52+i*64);ctx.font='12px monospace';ctx.fillStyle='#666';ctx.fillText('RGB('+colors[i].join(', ')+')',94,70+i*64);});
      c2.toBlob(function(b){download(b,'brand-colors.png');});};
    toast(''+hexes.length+' brand colors extracted','ok');};img.src=e.target.result;};r.readAsDataURL(file);}
};