/* TARUMAK STUDIO — utils.js
   Pure helpers. No dependencies on other files.
   Defines: $, $$, fmtBytes, download, ab, readImg, toast, dz, row, setStatus */

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmtBytes=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB';
function download(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);toast(name+' downloaded','ok');bumpCount();
  if(window.trackEvent){const ext=(name||'').split('.').pop().toLowerCase();window.trackEvent('tool_download',{file_type:ext,file_size:blob&&blob.size});}}
function readImg(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=e.target.result;};r.onerror=rej;r.readAsDataURL(file);});}
function ab(file){return file.arrayBuffer();}
function dropzone(el,input,onFiles){if(!el||!input)return;
  function handle(files){
    if(window.trackEvent&&files&&files.length){const f=files[0];const ext=(f.name||'').split('.').pop().toLowerCase();window.trackEvent('tool_upload',{file_type:ext,file_count:files.length});}
    onFiles(files);
  }
  el.addEventListener('click',()=>input.click());el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();input.click();}});['dragover','dragenter'].forEach(e=>el.addEventListener(e,ev=>{ev.preventDefault();el.classList.add('drag');}));['dragleave','drop'].forEach(e=>el.addEventListener(e,ev=>{ev.preventDefault();el.classList.remove('drag');}));el.addEventListener('drop',ev=>handle(ev.dataTransfer.files));input.addEventListener('change',()=>handle(input.files));}
const UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>';

/* Copy a canvas result to the clipboard as an image. Always converts to
   PNG regardless of the tool's chosen output format — the Clipboard
   API's image support is only reliably consistent for image/png across
   browsers; JPEG/WEBP clipboard writes are inconsistently supported.
   Returns a promise so callers can show their own success/error state. */
function copyCanvasToClipboard(canvas){
  if(!navigator.clipboard||!window.ClipboardItem)return Promise.reject(new Error('not supported'));
  return new Promise((res,rej)=>{
    canvas.toBlob(function(blob){
      if(!blob){rej(new Error('export failed'));return;}
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(res).catch(rej);
    },'image/png');
  });
}
/* Share a canvas result via the OS share sheet (Web Share API, Level 2 —
   file sharing). Checks navigator.canShare with the actual file first,
   since navigator.share existing doesn't guarantee file support (some
   browsers only support sharing text/URLs). Returns null (not a
   rejected promise) when unsupported, so callers can hide the button
   instead of treating it as an error. */
function canShareFiles(){return !!(navigator.share&&navigator.canShare);}
function shareCanvas(canvas,filename,title){
  return new Promise((res,rej)=>{
    canvas.toBlob(function(blob){
      if(!blob){rej(new Error('export failed'));return;}
      var file=new File([blob],filename,{type:'image/png'});
      if(!navigator.canShare({files:[file]})){rej(new Error('not supported'));return;}
      navigator.share({files:[file],title:title||filename}).then(res).catch(rej);
    },'image/png');
  });
}
