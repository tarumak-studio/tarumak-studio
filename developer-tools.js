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
  var ABBR=/(?:^|[\s(])(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|no|fig|approx|dept|inc|ltd|co|e\.g|i\.e|[a-z])\.\s*$/i;
  var NOSPACE=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
  function seg(kind,s){return Array.from(new Intl.Segmenter(undefined,{granularity:kind}).segment(s));}
  var HAS_SEG=typeof Intl!=='undefined'&&!!Intl.Segmenter;
  /* Words: split on spaces; scripts written without spaces use the browser's word segmenter. */
  function countWords(t){
    var n=0;
    t.trim().split(/\s+/).forEach(function(w){
      if(!w)return;
      if(HAS_SEG&&NOSPACE.test(w))n+=seg('word',w).filter(function(x){return x.isWordLike;}).length;
      else n++;
    });
    return n;
  }
  /* Characters as people see them: an emoji with a skin tone is 1, not 4. */
  function countChars(t){
    if(/^[\x00-\x7f]*$/.test(t))return t.length;
    if(HAS_SEG&&t.length<=100000)return seg('grapheme',t).length;
    return Array.from(t).length;
  }
  function countSentences(t){
    /* a line break before a lowercase letter is a wrapped line, not a new sentence */
    t=t.replace(/\n(?=\p{Ll})/gu,' ');
    var parts=HAS_SEG?seg('sentence',t).map(function(x){return x.segment;}):t.split(/(?<=[.!?。؟।]["')\]]*)\s+|\n+/);
    var n=0,carry='';
    parts.forEach(function(p){
      var s=carry+p;
      if(ABBR.test(p)&&!/\n/.test(p)){carry=s;return;}
      carry='';
      if(/[\p{L}\p{N}]/u.test(s))n++;
    });
    if(/[\p{L}\p{N}]/u.test(carry))n++;
    return n;
  }
  function update(){
    var t=document.getElementById('wc-txt').value,blank=t.trim()==='';
    var words=blank?0:countWords(t);
    document.getElementById('wc-words').textContent=words;
    document.getElementById('wc-chars').textContent=countChars(t);
    document.getElementById('wc-chars-no').textContent=countChars(t.replace(/\s/g,''));
    document.getElementById('wc-sents').textContent=blank?0:countSentences(t);
    document.getElementById('wc-paras').textContent=blank?0:t.trim().split(/\n\s*\n/).length;
    document.getElementById('wc-time').textContent=words?Math.max(1,Math.round(words/200)):0;
  }
  document.getElementById('wc-txt').addEventListener('input',update);
};

/* 2 — Password Generator */
INIT['password-generator']=function(panel){
  panel.innerHTML='<div class="controls">'
    +'<label for="pg-len" style="font-size:13px;color:var(--text-dim)">Length: <span id="pg-len-v">16</span></label>'
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
  /* Unbiased random index: discard values that would favour early characters. */
  function randIndex(n){
    var limit=Math.floor(4294967296/n)*n,a=new Uint32Array(1);
    do{crypto.getRandomValues(a);}while(a[0]>=limit);
    return a[0]%n;
  }
  function gen(){
    var len=+document.getElementById('pg-len').value;
    var sets=['abcdefghijklmnopqrstuvwxyz'];
    if(document.getElementById('pg-up').checked)sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if(document.getElementById('pg-num').checked)sets.push('0123456789');
    if(document.getElementById('pg-sym').checked)sets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
    var chars=sets.join(''),pwd;
    /* Every selected type must appear. Redrawing the whole password keeps
       all valid passwords equally likely (placing one of each would not). */
    do{pwd='';for(var i=0;i<len;i++)pwd+=chars[randIndex(chars.length)];}
    while(!sets.every(function(s){return Array.prototype.some.call(pwd,function(c){return s.indexOf(c)>-1;});}));
    document.getElementById('pg-out').textContent=pwd;
    var bits=Math.floor(len*Math.log2(chars.length));
    var s=bits<50?'Weak':bits<75?'Medium':bits<110?'Strong':'Very Strong';
    var colors={'Weak':'#ef4444','Medium':'#f59e0b','Strong':'#22c55e','Very Strong':'#22d3ee'};
    document.getElementById('pg-strength').innerHTML='Strength: <strong style="color:'+colors[s]+'">'+s+'</strong> · about '+bits+' bits of entropy';
  }
  document.getElementById('pg-len').oninput=function(){document.getElementById('pg-len-v').textContent=this.value;gen();};
  ['pg-up','pg-num','pg-sym'].forEach(function(id){document.getElementById(id).onchange=gen;});
  document.getElementById('pg-gen').onclick=gen;
  document.getElementById('pg-copy').onclick=function(){var t=document.getElementById('pg-out').textContent;if(t&&t!=='Click Generate')navigator.clipboard.writeText(t).then(function(){toast('Password copied!','ok');});};
  gen();
};

/* 3 — CSS Gradient Generator */
INIT['css-gradient-gen']=function(panel){
  var stops=[{c:'#22d3ee',p:0},{c:'#6366f1',p:100}];
  panel.innerHTML='<div class="controls">'
    +'<div class="ctrl"><label for="cg-type">Type</label><select id="cg-type"><option value="linear">Linear</option><option value="radial">Radial</option><option value="conic">Conic</option></select></div>'
    +'<div class="ctrl" id="cg-angle-w"><label for="cg-angle">Angle · <span class="val" id="cg-angle-v">135°</span></label><input type="range" id="cg-angle" min="0" max="360" value="135"></div>'
    +'<div class="ctrl"><label><input type="checkbox" id="cg-rep"> Repeat</label></div></div>'
    +'<div id="cg-stops" style="margin:14px 0 8px"></div>'
    +'<button class="btn" id="cg-add">Add color</button>'
    +'<div id="cg-preview" style="height:160px;border-radius:14px;margin:16px 0;border:1px solid var(--border)"></div>'
    +'<div id="cg-css" style="background:var(--surface-2);border:1px solid var(--border-2);border-radius:10px;padding:14px;font-family:var(--fm);font-size:13px;color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere"></div>'
    +'<div class="controls" style="margin-top:10px"><button class="btn btn-primary" id="cg-copy">Copy CSS</button></div>';
  var g=function(id){return document.getElementById(id);};
  function css(){
    var t=g('cg-type').value,a=g('cg-angle').value,rep=g('cg-rep').checked?'repeating-':'';
    var s=stops.slice().sort(function(x,y){return x.p-y.p;}).map(function(x){return x.c+' '+x.p+'%';}).join(', ');
    if(t==='radial')return[rep+'radial-gradient(circle, '+s+')','-webkit-'+rep+'radial-gradient(circle, '+s+')'];
    if(t==='conic')return[rep+'conic-gradient(from '+a+'deg, '+s+')',null];
    /* the old prefixed syntax counts angles anticlockwise from the right */
    return[rep+'linear-gradient('+a+'deg, '+s+')','-webkit-'+rep+'linear-gradient('+((450-a)%360)+'deg, '+s+')'];
  }
  function update(){
    g('cg-angle-v').textContent=g('cg-angle').value+'°';
    g('cg-angle-w').style.display=g('cg-type').value==='radial'?'none':'';
    var c=css();g('cg-preview').style.background=c[0];
    g('cg-css').textContent=(c[1]?'background: '+c[1]+';\n':'')+'background: '+c[0]+';';
  }
  function draw(){
    g('cg-stops').innerHTML='';
    stops.forEach(function(s,i){
      var r=document.createElement('div');r.style.cssText='display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px';
      r.innerHTML='<input type="color" aria-label="Color '+(i+1)+'" style="width:52px;height:36px;border-radius:8px;border:1px solid var(--border);cursor:pointer"><input type="range" min="0" max="100" aria-label="Position of color '+(i+1)+'" style="flex:1;min-width:120px"><span style="font-family:var(--fm);font-size:12px;color:var(--text-dim);width:40px"></span><button class="btn" aria-label="Remove color '+(i+1)+'">Remove</button>';
      var q=r.children;q[0].value=s.c;q[1].value=s.p;q[2].textContent=s.p+'%';q[3].disabled=stops.length<3;
      q[0].oninput=function(){s.c=q[0].value;update();};
      q[1].oninput=function(){s.p=+q[1].value;q[2].textContent=s.p+'%';update();};
      q[3].onclick=function(){stops.splice(i,1);draw();};
      g('cg-stops').appendChild(r);
    });
    update();
  }
  g('cg-add').onclick=function(){
    /* put it in the middle of the widest gap */
    var o=stops.slice().sort(function(x,y){return x.p-y.p;}),at=50,w=-1;
    for(var i=1;i<o.length;i++)if(o[i].p-o[i-1].p>w){w=o[i].p-o[i-1].p;at=Math.round((o[i].p+o[i-1].p)/2);}
    var C=['#f5b042','#ec4899','#22c55e','#f97316','#a855f7'];
    stops.push({c:C[(stops.length-2)%C.length],p:at});stops.sort(function(x,y){return x.p-y.p;});draw();
  };
  ['cg-type','cg-angle','cg-rep'].forEach(function(id){g(id).addEventListener('input',update);});
  g('cg-copy').onclick=function(){navigator.clipboard.writeText(g('cg-css').textContent).then(function(){toast('CSS copied!','ok');}).catch(function(){toast('Copy failed','err');});};
  draw();
};

/* 4 — Base64 Encoder/Decoder */
INIT['base64-encoder']=function(panel){
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn active" id="b64-enc-btn">Encode</button><button class="btn" id="b64-dec-btn">Decode</button></div>'
    +'<label for="b64-in" style="font-size:12px;color:var(--text-dim)" id="b64-in-label">Text to encode</label>'
    +'<textarea id="b64-in" rows="6" placeholder="Enter text to encode..." style="width:100%;margin:6px 0 10px;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<button class="btn btn-primary" id="b64-go" style="margin-bottom:10px">Encode →</button>'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px;margin-bottom:8px" id="b64-url-l"><input type="checkbox" id="b64-url"> URL-safe output (- and _ instead of + and /, no padding)</label><div id="b64-msg" role="alert" style="font-size:13px;color:#ef4444;min-height:18px;margin-bottom:6px"></div>'
    +'<label for="b64-out" style="font-size:12px;color:var(--text-dim)">Result</label>'
    +'<textarea id="b64-out" rows="6" readonly style="width:100%;margin-top:6px;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="b64-copy">Copy result</button><button class="btn" id="b64-swap">↑↓ Swap</button></div>';
  var mode='encode';
  document.getElementById('b64-enc-btn').onclick=function(){mode='encode';this.classList.add('active');document.getElementById('b64-dec-btn').classList.remove('active');document.getElementById('b64-in-label').textContent='Text to encode';document.getElementById('b64-go').textContent='Encode →';document.getElementById('b64-url-l').style.display='flex';};
  document.getElementById('b64-dec-btn').onclick=function(){mode='decode';this.classList.add('active');document.getElementById('b64-enc-btn').classList.remove('active');document.getElementById('b64-in-label').textContent='Base64 to decode';document.getElementById('b64-go').textContent='Decode →';document.getElementById('b64-url-l').style.display='none';};
  document.getElementById('b64-go').onclick=function(){
    var inp=document.getElementById('b64-in').value,out=document.getElementById('b64-out'),msg=document.getElementById('b64-msg');
    out.value='';msg.textContent='';
    if(!inp){msg.textContent=mode==='encode'?'Enter some text to encode.':'Paste some Base64 to decode.';return;}
    if(mode==='encode'){
      var bytes=new TextEncoder().encode(inp),bin='';
      for(var i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
      var b=btoa(bin);
      out.value=document.getElementById('b64-url').checked?b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''):b;
      return;
    }
    /* Accept standard and URL-safe alphabets, line breaks, missing padding and data: URLs */
    var s=inp.trim().replace(/^data:[^,]*;base64,/i,'').replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');
    var bad=s.match(/[^A-Za-z0-9+\/=]/);
    if(bad){msg.textContent='This isn’t valid Base64: it contains “'+bad[0]+'”.';return;}
    var core=s.replace(/=+$/,'');
    if(!core||core.indexOf('=')>-1||core.length%4===1){msg.textContent='This isn’t valid Base64: it looks cut off or has = in the wrong place.';return;}
    var raw;
    try{raw=atob(core+'==='.slice(0,(4-core.length%4)%4));}catch(e){msg.textContent='This isn’t valid Base64.';return;}
    try{out.value=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(Uint8Array.from(raw,function(c){return c.charCodeAt(0);}));}
    catch(e){msg.textContent='This is valid Base64, but the content isn’t text (it may be an image or another file), so it can’t be shown here.';}
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
    catch(e){document.getElementById('jf-status').textContent='';const _espan=document.createElement('span');_espan.style.color='#ef4444';_espan.textContent='✗ '+e.message;document.getElementById('jf-status').appendChild(_espan);return false;}
  }
  /* Lossless re-indent. JSON.parse turns 12345678901234567890 into
     12345678901234567000 (doubles hold ~15-17 digits), so formatting via
     parse+stringify silently corrupted IDs and precise decimals. Instead,
     validate with JSON.parse, then re-emit the ORIGINAL tokens with new
     whitespace: numbers and string escapes stay exactly as written. */
  function reformat(src,indent){
    var out='',depth=0,i=0,n=src.length;
    function nl(){return indent?'\n'+indent.repeat(depth):'';}
    while(i<n){
      var c=src[i];
      if(c===' '||c==='\n'||c==='\r'||c==='\t'){i++;continue;}
      if(c==='"'){var j=i+1;while(j<n&&src[j]!=='"'){if(src[j]==='\\')j++;j++;}out+=src.slice(i,j+1);i=j+1;continue;}
      if(c==='{'||c==='['){
        var k=i+1;while(k<n&&/[ \n\r\t]/.test(src[k]))k++;
        var close=c==='{'?'}':']';
        if(src[k]===close){out+=c+close;i=k+1;continue;}
        depth++;out+=c+nl();i++;continue;}
      if(c==='}'||c===']'){depth--;out+=nl()+c;i++;continue;}
      if(c===','){out+=','+nl();i++;continue;}
      if(c===':'){out+=indent?': ':':';i++;continue;}
      var e=i;while(e<n&&!/[ \n\r\t,\]\}:]/.test(src[e]))e++;
      out+=src.slice(i,e);i=e;
    }
    return out;
  }
  function apply(indent){
    var el=document.getElementById('jf-in');
    if(!el.value.trim()){document.getElementById('jf-status').innerHTML='<span style="color:var(--text-dim)">Paste some JSON first.</span>';return;}
    if(validate())el.value=reformat(el.value.trim(),indent);
  }
  document.getElementById('jf-in').addEventListener('input',validate);
  document.getElementById('jf-fmt').onclick=function(){apply('  ');};
  document.getElementById('jf-min').onclick=function(){apply('');};
  document.getElementById('jf-clear').onclick=function(){document.getElementById('jf-in').value='';document.getElementById('jf-status').innerHTML='';};
  document.getElementById('jf-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('jf-in').value).then(function(){toast('Copied!','ok');});};
};

/* 6 — Meta Tag Generator */
INIT['meta-tag-gen']=function(panel){
  panel.innerHTML='<div class="row" style="grid-template-columns:1fr;gap:10px">'
    +'<div><label for="mt-title" style="font-size:12px;color:var(--text-dim)">Page Title (50-60 chars) <span id="mt-title-c" style="color:var(--p1)">0</span></label><input id="mt-title" type="text" placeholder="Free Image Compressor Online — No Uploads" style="width:100%;margin-top:4px"></div>'
    +'<div><label for="mt-desc" style="font-size:12px;color:var(--text-dim)">Meta Description (120-160 chars) <span id="mt-desc-c" style="color:var(--p1)">0</span></label><textarea id="mt-desc" rows="3" placeholder="Compress JPG, PNG and WebP images online for free..." style="width:100%;margin-top:4px;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:none"></textarea></div>'
    +'<div><label for="mt-url" style="font-size:12px;color:var(--text-dim)">Page URL</label><input id="mt-url" type="url" placeholder="https://yoursite.com/page" style="width:100%;margin-top:4px"></div>'
    +'<div><label for="mt-img" style="font-size:12px;color:var(--text-dim)">OG Image URL</label><input id="mt-img" type="url" placeholder="https://yoursite.com/og-image.png" style="width:100%;margin-top:4px"></div>'
    +'</div>'
    +'<button class="btn btn-primary" id="mt-gen" style="margin:14px 0 10px;width:100%">Generate Meta Tags</button>'
    +'<textarea id="mt-out" rows="12" readonly style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-family:var(--fm);font-size:12px;resize:vertical;display:none"></textarea>'
    +'<button class="btn" id="mt-copy" style="display:none;margin-top:8px">Copy HTML</button>';
  document.getElementById('mt-title').oninput=function(){document.getElementById('mt-title-c').textContent=this.value.length;};
  document.getElementById('mt-desc').oninput=function(){document.getElementById('mt-desc-c').textContent=this.value.length;};
  /* Every value is HTML-escaped: a title like  Tom's "Best" Tools
     used to produce content="Tom's "Best" Tools", which is broken HTML. */
  function escA(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  document.getElementById('mt-gen').onclick=function(){
    var g=function(id){return document.getElementById(id).value.trim();};
    var t=g('mt-title'),d=g('mt-desc'),u=g('mt-url'),i=g('mt-img');
    var out=document.getElementById('mt-out'),copy=document.getElementById('mt-copy');
    if(!t||!d){
      out.style.display='none';copy.style.display='none';
      toast(!t&&!d?'Enter a page title and a meta description':(!t?'Enter a page title':'Enter a meta description'),'err');
      document.getElementById(!t?'mt-title':'mt-desc').focus();return;}
    var T=escA(t),D=escA(d),U=escA(u),I=escA(i);
    var lines=['<!-- Primary Meta Tags -->','<title>'+T+'</title>','<meta name="description" content="'+D+'">'];
    if(u)lines.push('<link rel="canonical" href="'+U+'">');
    lines.push('','<!-- Open Graph -->','<meta property="og:type" content="website">');
    if(u)lines.push('<meta property="og:url" content="'+U+'">');
    lines.push('<meta property="og:title" content="'+T+'">','<meta property="og:description" content="'+D+'">');
    if(i)lines.push('<meta property="og:image" content="'+I+'">','<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">');
    lines.push('','<!-- Twitter / X Card -->','<meta name="twitter:card" content="'+(i?'summary_large_image':'summary')+'">');
    lines.push('<meta name="twitter:title" content="'+T+'">','<meta name="twitter:description" content="'+D+'">');
    if(i)lines.push('<meta name="twitter:image" content="'+I+'">');
    out.value=lines.join('\n')+'\n';
    out.style.display='block';
    copy.style.display='inline-block';
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
  var OPEN='lorem ipsum dolor sit amet consectetur adipiscing elit';
  var WORDS=('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum perspiciatis unde omnis iste natus error accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis quasi architecto beatae vitae dicta explicabo nemo ipsam quia voluptas aspernatur aut odit fugit').split(' ');
  var LIMIT={para:100,sent:500,word:10000};
  panel.innerHTML='<div class="controls" style="margin-bottom:12px">'
    +'<select id="li-type" aria-label="Type"><option value="para">Paragraphs</option><option value="sent">Sentences</option><option value="word">Words</option></select>'
    +'<input id="li-count" type="number" min="1" max="100" value="3" aria-label="How many" style="width:90px">'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px"><input type="checkbox" id="li-start" checked> Start with Lorem ipsum</label>'
    +'<button class="btn btn-primary" id="li-gen">Generate</button>'
    +'</div>'
    +'<textarea id="li-out" rows="10" readonly aria-label="Generated text" style="width:100%;padding:12px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-size:13.5px;resize:vertical;line-height:1.7"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="li-copy">Copy Text</button></div><div class="status" id="li-st"></div>';
  var g=function(id){return document.getElementById(id);};
  function rnd(a,b){return a+Math.floor(Math.random()*(b-a+1));}
  function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
  function words(n,open){
    var out=open?OPEN.split(' ').slice(0,n):[];
    while(out.length<n){var w=WORDS[rnd(0,WORDS.length-1)];if(w!==out[out.length-1])out.push(w);}
    return out;
  }
  function sentence(open){
    var n=rnd(8,16),w=words(n,open);
    var c=open?7:rnd(3,n-3);if(n>9&&c<n-1)w[c]+=',';
    return cap(w.join(' '))+'.';
  }
  function para(open){var s=[];for(var i=0,n=rnd(4,7);i<n;i++)s.push(sentence(open&&!i));return s.join(' ');}
  function make(){
    var type=g('li-type').value,start=g('li-start').checked,max=LIMIT[type],asked=Math.floor(+g('li-count').value)||1;
    var n=Math.min(Math.max(asked,1),max),out=[],i;
    g('li-count').max=max;g('li-count').value=n;
    if(type==='word')g('li-out').value=cap(words(n,start).join(' '))+'.';
    else{for(i=0;i<n;i++)out.push((type==='para'?para:sentence)(start&&!i));g('li-out').value=out.join(type==='para'?'\n\n':' ');}
    setStatus(g('li-st'),asked>max?'The most you can make at once is '+max.toLocaleString()+'.':'');
  }
  g('li-gen').onclick=make;g('li-type').onchange=make;
  g('li-copy').onclick=function(){if(!g('li-out').value)make();navigator.clipboard.writeText(g('li-out').value).then(function(){toast('Text copied!','ok');}).catch(function(){toast('Copy failed','err');});};
  make();
};

/* 9 — Color Converter */
INIT['color-converter']=function(panel){
  /* Type a colour in any CSS format (HEX, RGB/RGBA, HSL/HSLA or a named
     colour) or use the picker; every format updates. The browser's own
     CSS parser does the parsing, so anything valid in CSS works. */
  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;if(max===min){h=s=0;}else{var d=max-min;s=l>.5?d/(2-max-min):d/(max+min);h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return{h:Math.round(h*360)%360,s:Math.round(s*100),l:Math.round(l*100)};}
  function rgbToHsb(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,h=0;if(d){h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return{h:Math.round(h*360)%360,s:Math.round(max?d/max*100:0),b:Math.round(max*100)};}
  function hex2(n){return n.toString(16).padStart(2,'0');}
  function parse(str){
    str=String(str||'').trim();if(!str)return null;
    if(/^[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i.test(str))str='#'+str;
    var probe=document.createElement('span');probe.style.color='';probe.style.color=str;
    if(!probe.style.color)return null;
    document.body.appendChild(probe);var cs=getComputedStyle(probe).color;probe.remove();
    var m=cs.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/);
    if(!m)return null;
    var a=m[4]===undefined?1:(/%$/.test(m[4])?parseFloat(m[4])/100:parseFloat(m[4]));
    return{r:Math.round(+m[1]),g:Math.round(+m[2]),b:Math.round(+m[3]),a:Math.round(a*1000)/1000};
  }
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
  panel.innerHTML='<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:6px">'
    +'<input type="color" id="cc-pick" value="#6366f1" aria-label="Colour picker" style="width:60px;height:48px;border-radius:10px;border:1px solid var(--border);cursor:pointer">'
    +'<div style="flex:1;min-width:200px"><label for="cc-in" style="font-size:12px;color:var(--text-dim)">Type or paste a colour</label>'
    +'<input type="text" id="cc-in" value="#6366F1" placeholder="#6366f1, rgb(99 102 241), hsl(239 84% 67%), tomato" autocomplete="off" spellcheck="false" style="width:100%;margin-top:4px;font-family:var(--fm)"></div></div>'
    +'<div id="cc-err" role="alert" style="font-size:12px;color:#ef4444;min-height:18px;margin-bottom:8px"></div>'
    +'<div id="cc-vals" style="display:grid;grid-template-columns:1fr;gap:8px"></div>';
  var pick=document.getElementById('cc-pick'),inp=document.getElementById('cc-in'),err=document.getElementById('cc-err'),vals=document.getElementById('cc-vals');
  function render(c){
    var hex='#'+hex2(c.r)+hex2(c.g)+hex2(c.b),hsl=rgbToHsl(c.r,c.g,c.b),hsb=rgbToHsb(c.r,c.g,c.b),A=c.a<1;
    var HEX=(hex+(A?hex2(Math.round(c.a*255)):'')).toUpperCase();
    var formats=[
      {label:'HEX',value:HEX},
      {label:A?'RGBA':'RGB',value:A?'rgba('+c.r+', '+c.g+', '+c.b+', '+c.a+')':'rgb('+c.r+', '+c.g+', '+c.b+')'},
      {label:A?'HSLA':'HSL',value:A?'hsla('+hsl.h+', '+hsl.s+'%, '+hsl.l+'%, '+c.a+')':'hsl('+hsl.h+', '+hsl.s+'%, '+hsl.l+'%)'},
      {label:'HSB / HSV',value:hsb.h+'°, '+hsb.s+'%, '+hsb.b+'%'},
      {label:'CSS Variable',value:'--color: '+HEX+';'}
    ];
    pick.value=hex;
    var sw=A?'rgba('+c.r+','+c.g+','+c.b+','+c.a+')':hex;
    vals.innerHTML=formats.map(function(f){
      return '<button type="button" class="cc-row" data-v="'+esc(f.value)+'" data-l="'+esc(f.label)+'" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;cursor:pointer;text-align:left;color:inherit;font:inherit;width:100%"><span style="width:32px;height:32px;border-radius:6px;background:'+sw+';border:1px solid rgba(0,0,0,.1);flex-shrink:0"></span><span><span style="display:block;font-size:11px;color:var(--text-faint);font-family:var(--fm);text-transform:uppercase;letter-spacing:.5px">'+esc(f.label)+'</span><span style="display:block;font-family:var(--fm);font-size:14px;font-weight:600;color:var(--text);margin-top:2px">'+esc(f.value)+'</span></span><span style="margin-left:auto;font-size:11px;color:var(--text-faint)">copy</span></button>';
    }).join('');
  }
  vals.addEventListener('click',function(e){var b=e.target.closest('.cc-row');if(!b)return;
    navigator.clipboard.writeText(b.dataset.v).then(function(){toast(b.dataset.l+' copied!','ok');}).catch(function(){toast('Copy failed — select the value and copy it manually','err');});});
  inp.addEventListener('input',function(){
    var c=parse(inp.value);
    if(!inp.value.trim()){err.textContent='';return;}
    if(!c){err.textContent='Not a colour the browser recognises. Try #6366f1, rgb(99, 102, 241), hsl(239, 84%, 67%) or a name like tomato.';return;}
    err.textContent='';render(c);});
  pick.addEventListener('input',function(){inp.value=pick.value.toUpperCase();err.textContent='';render(parse(pick.value));});
  render(parse('#6366f1'));
};

/* 10 — URL Encoder/Decoder */
INIT['url-encoder']=function(panel){
  panel.innerHTML='<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn active" id="ue-enc-btn">Encode</button><button class="btn" id="ue-dec-btn">Decode</button></div>'
    +'<textarea id="ue-in" rows="6" placeholder="Enter text or URL to encode..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical"></textarea>'
    +'<div class="controls" style="margin:10px 0"><button class="btn btn-primary" id="ue-go">Encode →</button></div>'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px;margin-bottom:8px" id="ue-full-l"><input type="checkbox" id="ue-full"> Full URL: keep : / ? & = # so the link still works</label><label style="font-size:13px;color:var(--text-dim);display:none;align-items:center;gap:6px;margin-bottom:8px" id="ue-plus-l"><input type="checkbox" id="ue-plus"> Treat + as a space (form data)</label><div id="ue-msg" role="alert" style="font-size:13px;color:#ef4444;min-height:18px;margin-bottom:6px"></div>'
    +'<textarea id="ue-out" rows="6" readonly style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-family:var(--fm);font-size:13px;resize:vertical"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn" id="ue-copy">Copy result</button></div>';
  var mode='encode';
  document.getElementById('ue-enc-btn').onclick=function(){mode='encode';this.classList.add('active');document.getElementById('ue-dec-btn').classList.remove('active');document.getElementById('ue-go').textContent='Encode →';document.getElementById('ue-full-l').style.display='flex';document.getElementById('ue-plus-l').style.display='none';};
  document.getElementById('ue-dec-btn').onclick=function(){mode='decode';this.classList.add('active');document.getElementById('ue-enc-btn').classList.remove('active');document.getElementById('ue-go').textContent='Decode →';document.getElementById('ue-full-l').style.display='none';document.getElementById('ue-plus-l').style.display='flex';};
  document.getElementById('ue-go').onclick=function(){
    var inp=document.getElementById('ue-in').value,out=document.getElementById('ue-out'),msg=document.getElementById('ue-msg');
    out.value='';msg.textContent='';
    if(!inp){msg.textContent=mode==='encode'?'Enter some text or a URL to encode.':'Paste something to decode.';return;}
    try{
      if(mode==='encode')out.value=document.getElementById('ue-full').checked
        ?encodeURI(inp).replace(/%25([0-9a-f]{2})/gi,'%$1')   /* keep escapes that are already there */
        :encodeURIComponent(inp);
      else out.value=decodeURIComponent(document.getElementById('ue-plus').checked?inp.replace(/\+/g,' '):inp);
    }catch(e){
      var m=inp.match(/%(?![0-9a-f]{2})/i);
      msg.textContent=mode==='encode'?'This text contains a broken character that can’t be encoded.'
        :m?'Can’t decode: the % at position '+(m.index+1)+' isn’t followed by two hex digits. A literal percent sign is written %25.'
        :'Can’t decode: the percent codes don’t form valid UTF-8 text.';
    }
  };
  document.getElementById('ue-copy').onclick=function(){navigator.clipboard.writeText(document.getElementById('ue-out').value).then(function(){toast('Copied!','ok');});};
};


/* ════════════════════════════════════════════════════════════
   NEW DEVELOPER TOOLS
   ════════════════════════════════════════════════════════════ */

/* 1 ── Text Diff Checker */
INIT['text-diff']=function(panel){
  panel.innerHTML=''
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    +'<div><label for="diff-a" style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">ORIGINAL TEXT</label>'
    +'<textarea id="diff-a" rows="12" placeholder="Paste original text here..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical;line-height:1.6;box-sizing:border-box"></textarea></div>'
    +'<div><label for="diff-b" style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">CHANGED TEXT</label>'
    +'<textarea id="diff-b" rows="12" placeholder="Paste changed text here..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:13px;resize:vertical;line-height:1.6;box-sizing:border-box"></textarea></div>'
    +'</div>'
    +'<div class="controls" style="margin:10px 0"><button class="btn btn-primary" id="diff-go">Compare →</button><button class="btn" id="diff-clear">Clear</button></div>'
    +'<div id="diff-stats" style="font-size:13px;color:var(--text-dim);margin-bottom:8px"></div>'
    +'<div id="diff-out" style="padding:14px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);font-family:monospace;font-size:13px;white-space:pre-wrap;line-height:1.7;min-height:80px;display:none"></div>'
    +'<style>.diff-add{background:rgba(34,197,94,.18);color:#4ade80;}.diff-del{background:rgba(239,68,68,.18);color:#f87171;text-decoration:line-through}</style>';

  /* Myers diff: fast when texts are similar. Returns [type,token] pairs, or
     null when the texts differ by more than maxD edits. */
  function myers(a,b,maxD){
    var s=0,ea=a.length,eb=b.length;
    while(s<ea&&s<eb&&a[s]===b[s])s++;
    while(ea>s&&eb>s&&a[ea-1]===b[eb-1]){ea--;eb--;}
    var A=a.slice(s,ea),B=b.slice(s,eb),N=A.length,M=B.length,mid=[];
    if(!N||!M){mid=A.map(function(t){return['del',t];}).concat(B.map(function(t){return['add',t];}));}
    else{
      var max=Math.min(N+M,maxD),off=max+1,V=new Int32Array(2*max+3),trace=[],found=-1;
      for(var d=0;d<=max&&found<0;d++){
        trace.push(V.slice(off-d-1,off+d+2));
        for(var k=-d;k<=d;k+=2){
          var x=(k===-d||(k!==d&&V[off+k-1]<V[off+k+1]))?V[off+k+1]:V[off+k-1]+1,y=x-k;
          while(x<N&&y<M&&A[x]===B[y]){x++;y++;}
          V[off+k]=x;
          if(x>=N&&y>=M){found=d;break;}
        }
      }
      if(found<0)return null;
      var px=N,py=M;
      for(var e=found;e>0;e--){
        var T=trace[e],o=e+1,kk=px-py;
        var pk=(kk===-e||(kk!==e&&T[o+kk-1]<T[o+kk+1]))?kk+1:kk-1;
        var qx=T[o+pk],qy=qx-pk;
        while(px>qx&&py>qy){px--;py--;mid.push(['same',A[px]]);}
        if(pk===kk+1){py--;mid.push(['add',B[py]]);}else{px--;mid.push(['del',A[px]]);}
      }
      while(px>0&&py>0){px--;py--;mid.push(['same',A[px]]);}
      mid.reverse();
    }
    return a.slice(0,s).map(function(t){return['same',t];}).concat(mid,a.slice(ea).map(function(t){return['same',t];}));
  }
  function all(a,b){return a.map(function(t){return['del',t];}).concat(b.map(function(t){return['add',t];}));}
  /* Lines first, then words inside each changed block. */
  function compare(a,b){
    var la=a?a.replace(/\r\n?/g,'\n').split('\n'):[],lb=b?b.replace(/\r\n?/g,'\n').split('\n'):[];
    var lines=myers(la,lb,1500)||all(la,lb);
    var st={la:0,ld:0,wa:0,wd:0},rows=[],dels=[],adds=[];
    function flush(){
      if(!dels.length&&!adds.length)return;
      st.ld+=dels.length;st.la+=adds.length;
      var parts;
      if(dels.length&&adds.length){
        var wa=dels.join('\n').split(/(\s+)/).filter(Boolean),wb=adds.join('\n').split(/(\s+)/).filter(Boolean);
        parts=myers(wa,wb,1500)||all([dels.join('\n')],[adds.join('\n')]);
      }else parts=dels.length?[['del',dels.join('\n')]]:[['add',adds.join('\n')]];
      parts.forEach(function(p){var n=(p[1].match(/\S+/g)||[]).length;if(p[0]==='add')st.wa+=n;if(p[0]==='del')st.wd+=n;});
      rows.push(parts);dels=[];adds=[];
    }
    lines.forEach(function(l){
      if(l[0]==='del')dels.push(l[1]);else if(l[0]==='add')adds.push(l[1]);
      else{flush();rows.push([['same',l[1]]]);}
    });
    flush();
    return{rows:rows,st:st};
  }
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function plural(n,w){return n+' '+w+(n===1?'':'s');}
  document.getElementById('diff-go').onclick=function(){
    var a=document.getElementById('diff-a').value,b=document.getElementById('diff-b').value;
    var stats=document.getElementById('diff-stats'),out=document.getElementById('diff-out');
    out.innerHTML='';out.style.display='none';
    if(!a&&!b){stats.textContent='Enter text in both panels.';return;}
    var r=compare(a,b),s=r.st;
    if(!s.la&&!s.ld)stats.textContent='No differences: the texts are the same.';
    else stats.textContent=plural(s.la,'line')+' added, '+plural(s.ld,'line')+' removed · '+plural(s.wa,'word')+' added, '+plural(s.wd,'word')+' removed (a changed line counts as one removed and one added)';
    out.innerHTML=r.rows.map(function(parts){return parts.map(function(p){return p[0]==='same'?esc(p[1]):'<span class="diff-'+p[0]+'">'+(esc(p[1])||'⏎')+'</span>';}).join('');}).join('\n');
    out.style.display='block';
  };
  document.getElementById('diff-clear').onclick=function(){
    ['diff-a','diff-b'].forEach(function(id){document.getElementById(id).value='';});
    document.getElementById('diff-out').innerHTML='';
    document.getElementById('diff-out').style.display='none';
    document.getElementById('diff-stats').textContent='';
  };
};

/* 2 ── Regex Tester */
INIT['regex-tester']=function(panel){
  panel.innerHTML=''
    +'<div style="margin-bottom:10px">'
    +'<label style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">REGULAR EXPRESSION</label>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">'
    +'<span style="color:var(--text-dim);font-size:18px;font-family:monospace">/</span>'
    +'<input id="rx-pat" type="text" placeholder="e.g. (\\d+)-(\\w+)" style="flex:1;padding:9px 12px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-family:monospace;font-size:14px">'
    +'<span style="color:var(--text-dim);font-size:18px;font-family:monospace">/</span>'
    +'<div style="display:flex;gap:4px">'
    +'<button id="rx-g" class="btn active" title="global" style="font-family:monospace;font-size:13px;padding:6px 10px">g</button>'
    +'<button id="rx-i" class="btn" title="case-insensitive" style="font-family:monospace;font-size:13px;padding:6px 10px">i</button>'
    +'<button id="rx-m" class="btn" title="multiline" style="font-family:monospace;font-size:13px;padding:6px 10px">m</button>'
    +'</div></div>'
    +'<div id="rx-err" style="font-size:12px;color:#ef4444;min-height:16px;margin-top:4px"></div>'
    +'</div>'
    +'<label style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">TEST STRING</label>'
    +'<div id="rx-highlight" style="padding:10px 12px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);font-family:monospace;font-size:13px;white-space:pre-wrap;line-height:1.6;min-height:80px;margin-bottom:8px;word-break:break-all"></div>'
    +'<textarea id="rx-str" rows="5" placeholder="Enter test string here..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-family:monospace;font-size:13px;resize:vertical;line-height:1.6;box-sizing:border-box"></textarea>'
    +'<div id="rx-info" style="font-size:13px;color:var(--text-dim);margin:8px 0"></div>'
    +'<div id="rx-groups" style="font-size:13px;margin-top:4px"></div>'
    +'<style>.rx-match{background:rgba(34,211,238,.28);border-radius:3px;outline:2px solid rgba(34,211,238,.5)}</style>';

  var flags={g:true,i:false,m:false};
  ['g','i','m'].forEach(function(f){
    document.getElementById('rx-'+f).onclick=function(){
      flags[f]=!flags[f];
      this.classList.toggle('active',flags[f]);
      run();
    };
  });

  function run(){
    var pat=document.getElementById('rx-pat').value;
    var str=document.getElementById('rx-str').value;
    var errEl=document.getElementById('rx-err');
    var info=document.getElementById('rx-info');
    var groups=document.getElementById('rx-groups');
    var hl=document.getElementById('rx-highlight');

    if(!pat){hl.textContent=str;info.textContent='';groups.innerHTML='';errEl.textContent='';return;}
    var re;
    try{
      var fl=Object.keys(flags).filter(function(k){return flags[k];}).join('');
      re=new RegExp(pat,fl);
      errEl.textContent='';
    }catch(e){errEl.textContent='⚠ '+e.message;hl.textContent=str;info.textContent='';groups.innerHTML='';return;}

    // Highlight matches.
    // A pattern that can match an empty string (\b, a*, ^, x?) leaves
    // lastIndex where it was, so the old loop never ended and froze the
    // tab. Step past empty matches, and stop at MAX_MATCHES.
    var MAX_MATCHES=5000;
    var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
    var matches=[],m,capped=false;
    if(flags.g){
      re.lastIndex=0;
      while((m=re.exec(str))!==null){
        matches.push({index:m.index,end:m.index+m[0].length,match:m[0],groups:m.slice(1),named:m.groups||null});
        if(m[0]==='')re.lastIndex++;
        if(matches.length>=MAX_MATCHES){capped=true;break;}
      }
    } else {
      m=re.exec(str);
      if(m) matches.push({index:m.index,end:m.index+m[0].length,match:m[0],groups:m.slice(1),named:m.groups||null});
    }

    info.textContent=matches.length
      ? (capped?'Showing the first '+MAX_MATCHES+' matches':matches.length+' match'+(matches.length>1?'es':'')+' found')
      : 'No matches';

    // Build highlighted HTML (empty matches are counted but not drawn)
    var out='',last=0;
    matches.forEach(function(ma){
      if(ma.end===ma.index)return;
      out+=esc(str.slice(last,ma.index))+'<mark class="rx-match">'+esc(str.slice(ma.index,ma.end))+'</mark>';
      last=ma.end;
    });
    out+=esc(str.slice(last));
    hl.innerHTML=out||'&nbsp;';

    // Show capture groups (escaped: they come from the user's test string)
    if(matches.length&&matches[0].groups.length){
      var names={};
      if(matches[0].named){
        /* map group number -> name: walk the pattern, skipping escapes,
           character classes and non-capturing/lookaround groups */
        var gi=0;pat.replace(/\\.|\[(?:\\.|[^\]])*\]|\((\?(?:<([A-Za-z_$][\w$]*)>|[:=!]|<[=!]))?/g,function(tok,q,name){
          if(tok.charAt(0)!=='(')return tok;
          if(!q||name){gi++;if(name)names[gi]=name;}
          return tok;});
      }
      groups.innerHTML='<span style="font-size:12px;font-weight:600;color:var(--text-dim)">CAPTURE GROUPS (first match):</span><br>'
        +matches[0].groups.map(function(g,i){var label=names[i+1]?esc(names[i+1]):'$'+(i+1);return '<code style="font-size:12px;background:rgba(255,255,255,.07);padding:2px 6px;border-radius:4px;margin:2px">'+label+': '+(g===undefined?'(no match)':esc(g))+'</code>';}).join(' ');
    } else groups.innerHTML='';
  }

  document.getElementById('rx-pat').addEventListener('input',run);
  document.getElementById('rx-str').addEventListener('input',run);
};

/* 3 ── Slug Generator */
INIT['slug-generator']=function(panel){
  panel.innerHTML=''
    +'<label for="sg-in" style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">INPUT TEXT</label>'
    +'<input id="sg-in" type="text" placeholder="e.g. How to Create a QR Code for Your Business" style="width:100%;padding:11px 14px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:15px;box-sizing:border-box">'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">'
    +'<button id="sg-hyp" class="btn active" style="font-size:13px">hyphens</button>'
    +'<button id="sg-und" class="btn" style="font-size:13px">underscores</button>'
    +'</div>'
    +'<label style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">SLUG OUTPUT</label>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">'
    +'<input id="sg-out" type="text" readonly style="flex:1;padding:11px 14px;border-radius:9px;border:1px solid var(--p1);background:var(--surface);color:var(--p1);font-family:monospace;font-size:15px;font-weight:600;box-sizing:border-box">'
    +'<button class="btn btn-primary" id="sg-copy">Copy</button>'
    +'</div>'
    +'<div id="sg-info" style="font-size:12px;color:var(--text-dim);margin-top:8px"></div>';

  var sep='-';
  document.getElementById('sg-hyp').onclick=function(){sep='-';this.classList.add('active');document.getElementById('sg-und').classList.remove('active');gen();};
  document.getElementById('sg-und').onclick=function(){sep='_';this.classList.add('active');document.getElementById('sg-hyp').classList.remove('active');gen();};

  /* Letters that don't reduce to a-z by removing an accent */
  var MAP={'ß':'ss','æ':'ae','œ':'oe','ø':'o','đ':'d','ð':'d','þ':'th','ł':'l','ı':'i','ħ':'h','ŋ':'ng',
    'а':'a','б':'b','в':'v','г':'g','ґ':'g','д':'d','е':'e','ё':'yo','є':'ye','ж':'zh','з':'z','и':'i','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'α':'a','β':'v','γ':'g','δ':'d','ε':'e','ζ':'z','η':'i','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','ς':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o'};
  function latin(s){
    s=Array.from(s.toLowerCase().normalize('NFC')).map(function(c){return MAP[c]!==undefined?MAP[c]:c;}).join('');
    return Array.from(s.normalize('NFD').replace(/[̀-ͯ]/g,'')).map(function(c){return MAP[c]!==undefined?MAP[c]:c;}).join('');
  }
  function gen(){
    var base=latin(document.getElementById('sg-in').value).replace(/['’ʼ]/g,'');
    var lost=/[^\x00-\x7f]/.test(base)&&/(?=[^\x00-\x7f])[\p{L}\p{N}]/u.test(base);
    var slug=base.replace(/[^a-z0-9]+/g,sep).replace(new RegExp('^['+sep+']+|['+sep+']+$','g'),'');
    document.getElementById('sg-out').value=slug;
    document.getElementById('sg-info').textContent=(slug?slug.length+' chars':'')
      +(lost?(slug?' · ':'')+'Some letters can’t be converted to a–z and were left out.'+(slug?'':' Type an English version of the title.'):'');
  }
  document.getElementById('sg-in').addEventListener('input',gen);
  document.getElementById('sg-copy').onclick=function(){
    var v=document.getElementById('sg-out').value;
    if(!v)return;
    navigator.clipboard.writeText(v).then(function(){toast('Slug copied!','ok');});
  };
};

/* 4 ── Text Case Converter */
INIT['text-case-converter']=function(panel){
  panel.innerHTML=''
    +'<textarea id="tc-in" rows="6" placeholder="Type or paste your text here..." style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px;resize:vertical;line-height:1.6;box-sizing:border-box"></textarea>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">'
    +'<button class="btn" id="tc-up">UPPERCASE</button>'
    +'<button class="btn" id="tc-lo">lowercase</button>'
    +'<button class="btn" id="tc-ti">Title Case</button>'
    +'<button class="btn" id="tc-se">Sentence case</button>'
    +'<button class="btn" id="tc-ca">camelCase</button>'
    +'<button class="btn" id="tc-sn">snake_case</button>'
    +'<button class="btn" id="tc-ke">kebab-case</button>'
    +'<button class="btn" id="tc-pa">PascalCase</button>'
    +'</div>'
    +'<label for="tc-out" style="font-size:12px;font-weight:600;color:var(--text-dim);display:block;margin-bottom:5px">OUTPUT</label>'
    +'<textarea id="tc-out" rows="6" readonly style="width:100%;padding:10px;border-radius:9px;border:1px solid var(--border-2);background:var(--surface);color:var(--text);font-size:14px;resize:vertical;line-height:1.6;box-sizing:border-box"></textarea>'
    +'<div class="controls" style="margin-top:10px"><button class="btn btn-primary" id="tc-copy">Copy result</button><button class="btn" id="tc-swap">Use as input ↑</button></div>';

  var small=['a','an','the','and','but','or','nor','for','yet','so','at','by','in','of','on','to','up','as','is'];
  /* A word is letters/digits of any language, with apostrophes inside it (don't, McDonald's) */
  var WORD=/[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
  function cap(w){var c=Array.from(w);return c[0].toUpperCase()+c.slice(1).join('');}
  /* Words for code styles: apostrophes dropped, camelCase and acronyms split, accents kept */
  function parts(line){
    return line.normalize('NFC').replace(/['’]/g,'')
      .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu,'$1 $2').replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu,'$1 $2')
      .toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu)||[];
  }
  function eachLine(fn){return function(s){return s.split('\n').map(function(l){return fn(parts(l));}).join('\n');};}

  var fns={
    'tc-up':function(s){return s.toUpperCase();},
    'tc-lo':function(s){return s.toLowerCase();},
    'tc-ti':function(s){
      s=s.toLowerCase();
      return s.replace(WORD,function(w,i){
        var start=/(^|\n|[.!?:]["'”’)]*)[^\p{L}\p{N}]*$/u.test(s.slice(Math.max(0,i-40),i))||i===0;
        return small.includes(w)&&!start?w:cap(w);});},
    'tc-se':function(s){return s.toLowerCase().replace(/(^[^\p{L}\p{N}]*|[.!?]["'”’)]*\s+[^\p{L}\p{N}]*|\n\s*\n[^\p{L}\p{N}]*)(\p{L})/gu,function(_,p,c){return p+c.toUpperCase();});},
    'tc-ca':eachLine(function(w){return w.map(function(x,i){return i?cap(x):x;}).join('');}),
    'tc-sn':eachLine(function(w){return w.join('_');}),
    'tc-ke':eachLine(function(w){return w.join('-');}),
    'tc-pa':eachLine(function(w){return w.map(cap).join('');})
  };

  Object.keys(fns).forEach(function(id){
    document.getElementById(id).onclick=function(){
      var inp=document.getElementById('tc-in').value;
      if(!inp){document.getElementById('tc-out').value='';toast('Enter some text first','err');return;}
      document.querySelectorAll('#tc-in ~ div .btn').forEach(function(b){b.classList.remove('active');});
      this.classList.add('active');
      document.getElementById('tc-out').value=fns[id](inp);
    };
  });
  document.getElementById('tc-copy').onclick=function(){
    var v=document.getElementById('tc-out').value;
    if(!v)return;
    navigator.clipboard.writeText(v).then(function(){toast('Copied!','ok');});
  };
  document.getElementById('tc-swap').onclick=function(){
    var v=document.getElementById('tc-out').value;
    if(!v)return;
    document.getElementById('tc-in').value=v;
    document.getElementById('tc-out').value='';
    document.querySelectorAll('#tc-in ~ div .btn').forEach(function(b){b.classList.remove('active');});
  };
};

/* 5 ── Timestamp Converter */
INIT['timestamp-converter']=function(panel){
  panel.innerHTML=''
    +'<div class="row" style="display:grid;grid-template-columns:minmax(0,1fr);gap:16px">'
    +'<div style="padding:16px;border:1px solid var(--border-2);border-radius:12px;background:var(--surface)">'
    +'<div style="font-size:12px;font-weight:600;color:var(--p1);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">Current Time</div>'
    +'<div id="ts-now-unix" style="font-family:monospace;font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">—</div>'
    +'<div id="ts-now-ms" style="font-family:monospace;font-size:14px;color:var(--text-dim);margin-bottom:8px">—</div>'
    +'<div id="ts-now-human" style="font-size:14px;color:var(--text-dim)">—</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">'
    +'<button class="btn" id="ts-copy-unix" style="font-size:12px">Copy seconds</button>'
    +'<button class="btn" id="ts-copy-ms" style="font-size:12px">Copy milliseconds</button>'
    +'</div></div>'
    +'<div style="padding:16px;border:1px solid var(--border-2);border-radius:12px;background:var(--surface)">'
    +'<div style="font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">Unix → Human</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px">'
    +'<input id="ts-ux-in" type="text" placeholder="e.g. 1735689600" style="flex:1;padding:9px 12px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-family:monospace;font-size:14px">'
    +'<button class="btn btn-primary" id="ts-ux-go" style="white-space:nowrap">Convert →</button>'
    +'</div>'
    +'<div id="ts-ux-out" style="font-size:13.5px;color:var(--text);min-height:20px;font-family:monospace"></div>'
    +'</div>'
    +'<div style="padding:16px;border:1px solid var(--border-2);border-radius:12px;background:var(--surface)">'
    +'<div style="font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">Human → Unix</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px">'
    +'<input id="ts-hu-in" type="datetime-local" style="flex:1;padding:9px 12px;border-radius:9px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:14px">'
    +'<button class="btn btn-primary" id="ts-hu-go" style="white-space:nowrap">Convert →</button>'
    +'</div>'
    +'<label style="font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:6px;margin-bottom:8px"><input type="checkbox" id="ts-hu-utc"> This time is in UTC (otherwise your local time zone)</label>'
    +'<div id="ts-hu-out" style="font-size:13.5px;font-family:monospace;color:var(--text);min-height:20px"></div>'
    +'</div>'
    +'</div>';

  // Live clock
  function tickClock(){
    var now=Date.now();
    var unix=Math.floor(now/1000);
    var d=new Date(now);
    document.getElementById('ts-now-unix').textContent=unix;
    document.getElementById('ts-now-ms').textContent=now+' ms';
    document.getElementById('ts-now-human').textContent=d.toUTCString()+' (UTC)';
  }
  tickClock();
  var clockInterval=setInterval(tickClock,1000);
  // Clean up when tool changes
  var origInner=panel.innerHTML;
  var obs=new MutationObserver(function(){if(!panel.querySelector('#ts-now-unix')){clearInterval(clockInterval);obs.disconnect();}});
  obs.observe(panel,{childList:true});

  document.getElementById('ts-copy-unix').onclick=function(){
    navigator.clipboard.writeText(document.getElementById('ts-now-unix').textContent).then(function(){toast('Unix seconds copied!','ok');});
  };
  document.getElementById('ts-copy-ms').onclick=function(){
    navigator.clipboard.writeText(Date.now().toString()).then(function(){toast('Milliseconds copied!','ok');});
  };
  document.getElementById('ts-ux-go').onclick=function(){
    var v=document.getElementById('ts-ux-in').value.trim().replace(/[,_\s]/g,''),out=document.getElementById('ts-ux-out');
    if(!v){out.textContent='Enter a Unix timestamp.';return;}
    if(!/^[+-]?\d+(\.\d+)?$/.test(v)){out.textContent='Invalid timestamp: use digits only, for example 1735689600';return;}
    /* The size of the number tells the unit: 1e11 seconds is the year 5138 */
    var n=Number(v),abs=Math.abs(n);
    var u=abs<1e11?['seconds',1000]:abs<1e14?['milliseconds',1]:abs<1e17?['microseconds',1e-3]:['nanoseconds',1e-6];
    var d=new Date(Math.round(n*u[1]));
    if(isNaN(d.getTime())){out.textContent='Invalid timestamp: that date is out of range';return;}
    out.innerHTML=
      '<div>Local: <strong>'+d.toLocaleString()+'</strong> ('+Intl.DateTimeFormat().resolvedOptions().timeZone+')</div>'
      +'<div>UTC: '+d.toUTCString()+'</div>'
      +'<div>ISO: '+d.toISOString()+'</div>'
      +'<div style="color:var(--text-dim)">Read as '+u[0]+'</div>';
  };
  document.getElementById('ts-hu-go').onclick=function(){
    var v=document.getElementById('ts-hu-in').value,out=document.getElementById('ts-hu-out');
    var utc=document.getElementById('ts-hu-utc').checked;
    var ms=v?new Date(v+(utc?'Z':'')).getTime():NaN;
    if(isNaN(ms)){out.textContent='Choose a date and time.';return;}
    out.innerHTML=
      '<div>Unix seconds: <strong>'+Math.floor(ms/1000)+'</strong></div>'
      +'<div>Unix milliseconds: '+ms+'</div>';
  };
};
