/* ================================================================
   TARUMAK STUDIO — developer-tools.js
   10 Developer & SEO tool INIT functions.
   Requires: utils.js, data.js loaded first.
   ================================================================ */

/* 1 — Word & Character Counter */
INIT['word-counter']=function(panel){
  panel.innerHTML='<textarea id="wc-txt" rows="10" placeholder="Paste or type your text here..." style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;resize:vertical;line-height:1.6"></textarea>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:14px" id="wc-stats">'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center"><div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--p1)" id="wc-words">0</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Words</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center"><div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--p1)" id="wc-chars">0</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Characters</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center"><div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--p1)" id="wc-chars-no">0</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Chars (no spaces)</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center"><div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--p1)" id="wc-sents">0</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Sentences</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center"><div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--p1)" id="wc-paras">0</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Paragraphs</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center"><div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--p1)" id="wc-time">0</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Min read</div></div>'
    +'</div>';
  function update(){
    var t=document.getElementById('wc-txt').value;
    var words=t.trim()===''?0:t.trim().split(/\s+/).length;
    document.getElementById('wc-words').textContent=words;
    document.getElementById('wc-chars').textContent=t.length;
    document.getElementById('wc-chars-no').textContent=t.replace(/\s/g,'').length;
    document.getElementById('wc-sents').textContent=t.trim()===''?0:(t.match(/[.!?]+/g)||[]).length;
    document.getElementById('wc-paras').textContent=t.trim()===''?0:t.trim().split(/\n\s*\n/).length;
    document.getElementById('wc-time').textContent=Math.max(1,Math.round(words/200));
  }
  document.getElementById('wc-txt').addEventListener('input',update);
};

/* 2 — Password Generator */
INIT['password-generator']=function(panel){
  panel.innerHTML='<div class="controls">'
    +'<label style="font-size:13px;color:var(--text-dim)">Length: <span id="pg-len-v">16</span></label>'
    +'<input type="range" id="pg-len" min="8" max="64" value="16" style="width:100%;margin:8px 0">'
    +'</div>'
    +'<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0">'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px"><input type="checkbox" id="pg-up" checked> Uppercase (A-Z)</label>'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px"><input type="checkbox" id="pg-num" checked> Numbers (0-9)</label>'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px"><input type="checkbox" id="pg-sym" checked> Symbols (!@#$)</label>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin:14px 0 6px">'
    +'<div id="pg-out" style="flex:1;font-family:var(--fm);font-size:16px;padding:14px;background:var(--surface-2);border:1px solid var(--border-2);border-radius:10px;letter-spacing:2px;word-break:break-all;color:var(--text)">Click Generate</div>'
    +'</div>'
    +'<div class="controls" style="margin-top:10px"><button class="btn btn-primary" id="pg-gen">Generate Password</button><button class="btn" id="pg-copy">Copy</button></div>'
    +'<div id="pg-strength" style="margin-top:12px;font-size:13px;color:var(--text-dim)"></div>';
  function gen(){
    var len=+document.getElementById('pg-len').value;
    var chars='abcdefghijklmnopqrstuvwxyz';
    if(document.getElementById('pg-up').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(document.getElementById('pg-num').checked)chars+='0123456789';
    if(document.getElementById('pg-sym').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
    var pwd='';var arr=new Uint32Array(len);crypto.getRandomValues(arr);
    for(var i=0;i<len;i++)pwd+=chars[arr[i]%chars.length];
    document.getElementById('pg-out').textContent=pwd;
    var s=len<12?'Weak':len<16?'Medium':len<24?'Strong':'Very Strong';
    var colors={'Weak':'#ef4444','Medium':'#f59e0b','Strong':'#22c55e','Very Strong':'#22d3ee'};
    document.getElementById('pg-strength').innerHTML='Strength: <strong style="color:'+colors[s]+'">'+s+'</strong>';
  }
  document.getElementById('pg-len').oninput=function(){document.getElementById('pg-len-v').textContent=this.value;};
  document.getElementById('pg-gen').onclick=gen;
  document.getElementById('pg-copy').onclick=function(){var t=document.getElementById('pg-out').textContent;if(t&&t!=='Click Generate')navigator.clipboard.writeText(t).then(function(){toast('Password copied!','ok');});};
  gen();
};

/* 3 — CSS Gradient Generator */
INIT['css-gradient-gen']=function(panel){
  panel.innerHTML='<div class="controls" style="grid-template-columns:1fr 1fr">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Color 1</label><input type="color" id="cg-c1" value="#22d3ee" style="width:100%;height:40px;border-radius:8px;border:1px solid var(--border);cursor:pointer;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Color 2</label><input type="color" id="cg-c2" value="#6366f1" style="width:100%;height:40px;border-radius:8px;border:1px solid var(--border);cursor:pointer;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Type</label><select id="cg-type" style="width:100%;margin-top:4px"><option value="linear">Linear</option><option value="radial">Radial</option></select></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Angle (linear)</label><input type="range" id="cg-angle" min="0" max="360" value="135" style="width:100%;margin-top:12px"><span id="cg-angle-v" style="font-size:12px;color:var(--text-faint)">135°</span></div>'
    +'</div>'
    +'<div id="cg-preview" style="height:160px;border-radius:14px;margin:16px 0;border:1px solid var(--border)"></div>'
    +'<div id="cg-css" style="background:var(--surface-2);border:1px solid var(--border-2);border-radius:10px;padding:14px;font-family:var(--fm);font-size:13px;color:var(--text)"></div>'
    +'<div class="controls" style="margin-top:10px"><button class="btn btn-primary" id="cg-copy">Copy CSS</button></div>';
  function update(){
    var c1=document.getElementById('cg-c1').value;
    var c2=document.getElementById('cg-c2').value;
    var type=document.getElementById('cg-type').value;
    var angle=document.getElementById('cg-angle').value;
    document.getElementById('cg-angle-v').textContent=angle+'°';
    var css=type==='linear'?'linear-gradient('+angle+'deg, '+c1+', '+c2+')':'radial-gradient(circle, '+c1+', '+c2+')';
    document.getElementById('cg-preview').style.background=css;
    var fullcss='background: '+css+';';
    document.getElementById('cg-css').textContent=fullcss;
  }
  ['cg-c1','cg-c2','cg-type','cg-angle'].forEach(function(id){document.getElementById(id).addEventListener('input',update);});
  document.getElementById('cg-copy').onclick=function(){
    navigator.clipboard.writeText(document.getElementById('cg-css').textContent).then(function(){toast('CSS copied!','ok');});
  };
  update();
};

/* 4 — Base64 Encoder/Decoder */
INIT['base64-encoder']=function(panel){
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn active" id="b64-enc-btn">Encode</button><button class="btn" id="b64-dec-btn">Decode</button></div>'
    +'<label style="font-size:12px;color:var(--text-dim)" id="b64-in-label">Text to encode</label>'
    +'<textarea id="b64-in" rows="6" placeholder="Enter text to encode..." style="width:100%;margin:6px 0 10px;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<button class="btn btn-primary" id="b64-go" style="margin-bottom:10px">Encode →</button>'
    +'<label style="font-size:12px;color:var(--text-dim)">Result</label>'
    +'<textarea id="b64-out" rows="6" readonly style="width:100%;margin-top:6px;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="b64-copy">Copy result</button><button class="btn" id="b64-swap">↑↓ Swap</button></div>';
  var mode='encode';
  document.getElementById('b64-enc-btn').onclick=function(){mode='encode';this.classList.add('active');document.getElementById('b64-dec-btn').classList.remove('active');document.getElementById('b64-in-label').textContent='Text to encode';document.getElementById('b64-go').textContent='Encode →';};
  document.getElementById('b64-dec-btn').onclick=function(){mode='decode';this.classList.add('active');document.getElementById('b64-enc-btn').classList.remove('active');document.getElementById('b64-in-label').textContent='Base64 to decode';document.getElementById('b64-go').textContent='Decode →';};
  document.getElementById('b64-go').onclick=function(){
    var inp=document.getElementById('b64-in').value;
    try{document.getElementById('b64-out').value=mode==='encode'?btoa(unescape(encodeURIComponent(inp))):decodeURIComponent(escape(atob(inp)));}
    catch(e){document.getElementById('b64-out').value='Error: '+e.message;}
  };
  document.getElementById('b64-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('b64-out').value).then(function(){toast('Copied!','ok');});};
  document.getElementById('b64-swap').onclick=function(){var t=document.getElementById('b64-out').value;document.getElementById('b64-in').value=t;document.getElementById('b64-out').value='';};
};

/* 5 — JSON Formatter */
INIT['json-formatter']=function(panel){
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn btn-primary" id="jf-fmt">Format</button><button class="btn" id="jf-min">Minify</button><button class="btn" id="jf-clear">Clear</button></div>'
    +'<textarea id="jf-in" rows="12" placeholder="Paste JSON here..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-family:var(--fm);font-size:13px;resize:vertical;line-height:1.6"></textarea>'
    +'<div id="jf-status" style="font-size:13px;margin:8px 0;min-height:20px"></div>'
    +'<div class="controls"><button class="btn" id="jf-copy">Copy</button></div>';
  function validate(){
    var t=document.getElementById('jf-in').value.trim();
    if(!t){document.getElementById('jf-status').innerHTML='';return false;}
    try{JSON.parse(t);document.getElementById('jf-status').innerHTML='<span style="color:#22c55e">✓ Valid JSON</span>';return true;}
    catch(e){document.getElementById('jf-status').innerHTML='<span style="color:#ef4444">✗ '+e.message+'</span>';return false;}
  }
  document.getElementById('jf-in').addEventListener('input',validate);
  document.getElementById('jf-fmt').onclick=function(){if(validate()){try{document.getElementById('jf-in').value=JSON.stringify(JSON.parse(document.getElementById('jf-in').value),null,2);}catch(e){}}};
  document.getElementById('jf-min').onclick=function(){if(validate()){try{document.getElementById('jf-in').value=JSON.stringify(JSON.parse(document.getElementById('jf-in').value));}catch(e){}}};
  document.getElementById('jf-clear').onclick=function(){document.getElementById('jf-in').value='';document.getElementById('jf-status').innerHTML='';};
  document.getElementById('jf-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('jf-in').value).then(function(){toast('Copied!','ok');});};
};

/* 6 — Meta Tag Generator */
INIT['meta-tag-gen']=function(panel){
  panel.innerHTML='<div class="row" style="grid-template-columns:1fr;gap:10px">'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Page Title (50-60 chars) <span id="mt-title-c" style="color:var(--p1)">0</span></label><input id="mt-title" type="text" placeholder="Free Image Compressor Online — No Uploads" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Meta Description (120-160 chars) <span id="mt-desc-c" style="color:var(--p1)">0</span></label><textarea id="mt-desc" rows="3" placeholder="Compress JPG, PNG and WebP images online for free..." style="width:100%;margin-top:4px;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:none"></textarea></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">Page URL</label><input id="mt-url" type="url" placeholder="https://yoursite.com/page" style="width:100%;margin-top:4px"></div>'
    +'<div><label style="font-size:12px;color:var(--text-dim)">OG Image URL</label><input id="mt-img" type="url" placeholder="https://yoursite.com/og-image.png" style="width:100%;margin-top:4px"></div>'
    +'</div>'
    +'<button class="btn btn-primary" id="mt-gen" style="margin:14px 0 10px;width:100%">Generate Meta Tags</button>'
    +'<textarea id="mt-out" rows="12" readonly style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-family:var(--fm);font-size:12px;resize:vertical;display:none"></textarea>'
    +'<button class="btn" id="mt-copy" style="display:none;margin-top:8px">Copy HTML</button>';
  document.getElementById('mt-title').oninput=function(){document.getElementById('mt-title-c').textContent=this.value.length;};
  document.getElementById('mt-desc').oninput=function(){document.getElementById('mt-desc-c').textContent=this.value.length;};
  document.getElementById('mt-gen').onclick=function(){
    var t=document.getElementById('mt-title').value,d=document.getElementById('mt-desc').value,u=document.getElementById('mt-url').value,i=document.getElementById('mt-img').value;
    var html='<!-- Primary Meta Tags -->\n<title>'+t+'</title>\n<meta name="title" content="'+t+'">\n<meta name="description" content="'+d+'">\n\n<!-- Open Graph -->\n<meta property="og:type" content="website">\n<meta property="og:url" content="'+u+'">\n<meta property="og:title" content="'+t+'">\n<meta property="og:description" content="'+d+'">\n'+(i?'<meta property="og:image" content="'+i+'">\n':'')+'<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n\n<!-- Twitter Card -->\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:url" content="'+u+'">\n<meta name="twitter:title" content="'+t+'">\n<meta name="twitter:description" content="'+d+'">\n'+(i?'<meta name="twitter:image" content="'+i+'">\n':'');
    document.getElementById('mt-out').value=html;
    document.getElementById('mt-out').style.display='block';
    document.getElementById('mt-copy').style.display='inline-block';
  };
  document.getElementById('mt-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('mt-out').value).then(function(){toast('Meta tags copied!','ok');});};
};

/* 7 — Hashtag Generator */
INIT['hashtag-gen']=function(panel){
  var HASHTAGS={design:['#GraphicDesign','#DesignInspiration','#UIDesign','#UXDesign','#CreativeDesign','#DigitalDesign','#BrandDesign','#LogoDesign','#WebDesign','#DesignCommunity','#Dribbble','#Behance','#DesignerLife','#FreelanceDesigner','#VisualDesign'],marketing:['#DigitalMarketing','#ContentMarketing','#SocialMediaMarketing','#OnlineMarketing','#MarketingStrategy','#EmailMarketing','#SEO','#GrowthHacking','#MarketingTips','#BrandMarketing','#Influencer','#ContentCreator','#MarketingDigital','#BusinessGrowth','#Entrepreneur'],photography:['#Photography','#PhotoOfTheDay','#Nature','#Portrait','#Landscape','#Travel','#InstaPhoto','#Photographer','#PhotoEdit','#StreetPhotography','#MinimalPhotography','#AmateurPhotography','#WildlifePhotography','#BlackAndWhite','#GoldenHour'],business:['#Business','#Entrepreneur','#Startup','#SmallBusiness','#Success','#Motivation','#Leadership','#BusinessOwner','#CEO','#Hustle','#WorkFromHome','#Freelance','#BusinessTips','#Marketing','#Innovation'],technology:['#Technology','#Tech','#AI','#MachineLearning','#Coding','#Programming','#Developer','#WebDevelopment','#JavaScript','#Python','#UX','#Innovation','#Fintech','#AppDevelopment','#SoftwareDevelopment']};
  panel.innerHTML='<div class="controls" style="margin-bottom:12px">'
    +'<select id="hg-cat" style="flex:1"><option value="">Choose a category...</option>'
    +Object.keys(HASHTAGS).map(function(k){return '<option value="'+k+'">'+k.charAt(0).toUpperCase()+k.slice(1)+'</option>';}).join('')
    +'</select>'
    +'<input id="hg-count" type="number" min="5" max="30" value="15" style="width:70px" placeholder="#">'
    +'<button class="btn btn-primary" id="hg-gen">Generate</button>'
    +'</div>'
    +'<div id="hg-out" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;min-height:80px;font-size:14px;line-height:2;color:var(--p1)"></div>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="hg-copy">Copy Hashtags</button></div>';
  document.getElementById('hg-gen').onclick=function(){
    var cat=document.getElementById('hg-cat').value;
    var n=Math.min(+document.getElementById('hg-count').value,30);
    if(!cat){toast('Please select a category','err');return;}
    var tags=[].concat(HASHTAGS[cat]);
    for(var i=tags.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=tags[i];tags[i]=tags[j];tags[j]=tmp;}
    document.getElementById('hg-out').textContent=tags.slice(0,n).join(' ');
  };
  document.getElementById('hg-copy').onclick=function(){var t=document.getElementById('hg-out').textContent;if(t)navigator.clipboard.writeText(t).then(function(){toast('Hashtags copied!','ok');});};
};

/* 8 — Lorem Ipsum Generator */
INIT['lorem-ipsum']=function(panel){
  var PARAS=['Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.','Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.','Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae.','At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.','Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.'];
  panel.innerHTML='<div class="controls" style="margin-bottom:12px">'
    +'<select id="li-type"><option value="para">Paragraphs</option><option value="sent">Sentences</option><option value="word">Words</option></select>'
    +'<input id="li-count" type="number" min="1" max="20" value="3" style="width:70px">'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px"><input type="checkbox" id="li-start" checked> Start with Lorem ipsum</label>'
    +'<button class="btn btn-primary" id="li-gen">Generate</button>'
    +'</div>'
    +'<textarea id="li-out" rows="10" readonly style="width:100%;padding:12px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-size:13.5px;resize:vertical;line-height:1.7"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="li-copy">Copy Text</button></div>';
  document.getElementById('li-gen').onclick=function(){
    var type=document.getElementById('li-type').value;
    var n=Math.min(+document.getElementById('li-count').value,20);
    var start=document.getElementById('li-start').checked;
    var result='';
    if(type==='para'){var ps=[];for(var i=0;i<n;i++)ps.push(PARAS[i%PARAS.length]);if(start)ps[0]='Lorem ipsum dolor sit amet. '+ps[0];result=ps.join('\n\n');}
    else if(type==='sent'){var all=PARAS.join(' ').split('. ').filter(Boolean);var sents=[];for(var i=0;i<n;i++)sents.push(all[i%all.length]+'.');if(start)sents[0]='Lorem ipsum dolor sit amet.';result=sents.join(' ');}
    else{var words='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt labore dolore magna aliqua enim minim veniam quis nostrud exercitation'.split(' ');var ws=[];for(var i=0;i<n;i++)ws.push(words[i%words.length]);if(start){ws[0]='Lorem';if(ws[1])ws[1]='ipsum';}result=ws.join(' ')+'.';}
    document.getElementById('li-out').value=result;
  };
  document.getElementById('li-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('li-out').value).then(function(){toast('Text copied!','ok');});};
};

/* 9 — Color Converter */
INIT['color-converter']=function(panel){
  function hexToRgb(hex){var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return{r,g,b};}
  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;if(max===min){h=s=0;}else{var d=max-min;s=l>.5?d/(2-max-min):d/(max+min);h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return{h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};}
  panel.innerHTML='<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px"><input type="color" id="cc-pick" value="#6366f1" style="width:60px;height:48px;border-radius:10px;border:1px solid var(--border);cursor:pointer"><label style="font-size:13px;color:var(--text-dim)">Pick any color →</label></div>'
    +'<div id="cc-vals" style="display:grid;grid-template-columns:1fr;gap:8px"></div>';
  function update(){
    var hex=document.getElementById('cc-pick').value;
    var rgb=hexToRgb(hex);var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
    var formats=[
      {label:'HEX',value:hex.toUpperCase()},
      {label:'RGB',value:'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')'},
      {label:'HSL',value:'hsl('+hsl.h+'deg, '+hsl.s+'%, '+hsl.l+'%)'},
      {label:'CSS Variable',value:'--color: '+hex.toUpperCase()+';'},
    ];
    document.getElementById('cc-vals').innerHTML=formats.map(function(f){
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;cursor:pointer" onclick="navigator.clipboard.writeText(\''+f.value+'\').then(function(){toast(\''+f.label+' copied!\',\'ok\');})"><div style="width:32px;height:32px;border-radius:6px;background:'+hex+';border:1px solid rgba(0,0,0,.1);flex-shrink:0"></div><div><div style="font-size:11px;color:var(--text-faint);font-family:var(--fm);text-transform:uppercase;letter-spacing:.5px">'+f.label+'</div><div style="font-family:var(--fm);font-size:14px;font-weight:600;color:var(--text);margin-top:2px">'+f.value+'</div></div><span style="margin-left:auto;font-size:11px;color:var(--text-faint)">copy</span></div>';
    }).join('');
  }
  document.getElementById('cc-pick').oninput=update;
  update();
};

/* 10 — URL Encoder/Decoder */
INIT['url-encoder']=function(panel){
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn active" id="ue-enc-btn">Encode</button><button class="btn" id="ue-dec-btn">Decode</button></div>'
    +'<textarea id="ue-in" rows="6" placeholder="Enter text or URL to encode..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<div class="controls" style="margin:10px 0"><button class="btn btn-primary" id="ue-go">Encode →</button></div>'
    +'<textarea id="ue-out" rows="6" readonly style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-family:var(--fm);font-size:13px;resize:vertical"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="ue-copy">Copy result</button></div>';
  var mode='encode';
  document.getElementById('ue-enc-btn').onclick=function(){mode='encode';this.classList.add('active');document.getElementById('ue-dec-btn').classList.remove('active');document.getElementById('ue-go').textContent='Encode →';};
  document.getElementById('ue-dec-btn').onclick=function(){mode='decode';this.classList.add('active');document.getElementById('ue-enc-btn').classList.remove('active');document.getElementById('ue-go').textContent='Decode →';};
  document.getElementById('ue-go').onclick=function(){
    var inp=document.getElementById('ue-in').value;
    try{document.getElementById('ue-out').value=mode==='encode'?encodeURIComponent(inp):decodeURIComponent(inp);}
    catch(e){document.getElementById('ue-out').value='Error: '+e.message;}
  };
  document.getElementById('ue-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('ue-out').value).then(function(){toast('Copied!','ok');});};
};
