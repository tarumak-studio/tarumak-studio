/* ============================================================
   TARUMAK STUDIO — Shared Utilities
   Loaded before all other JS. Defines global helpers.
   ============================================================ */
/* pdf.js worker — fetch → blob URL so it works on file:// and https:// alike */
(async()=>{
  if(!window.pdfjsLib)return;
  /* Suppress the "Setting up fake worker" console warning in any fallback case */
  const _cw=console.warn;
  console.warn=function(...a){if(typeof a[0]==='string'&&a[0].toLowerCase().includes('fake worker'))return;_cw.apply(console,a);};
  try{
    const r=await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
    if(!r.ok)throw new Error('fetch failed');
    const blob=new Blob([await r.text()],{type:'text/javascript'});
    pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(blob);
  }catch(e){
    /* file:// or offline — fake worker used; warning already suppressed above */
    pdfjsLib.GlobalWorkerOptions.workerSrc='';
  }
})();
/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmtBytes=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB';
function download(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);toast(name+' downloaded','ok');bumpCount();}
function readImg(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=e.target.result;};r.onerror=rej;r.readAsDataURL(file);});}
function ab(file){return file.arrayBuffer();}
function dropzone(el,input,onFiles){if(!el||!input)return;el.addEventListener('click',()=>input.click());['dragover','dragenter'].forEach(e=>el.addEventListener(e,ev=>{ev.preventDefault();el.classList.add('drag');}));['dragleave','drop'].forEach(e=>el.addEventListener(e,ev=>{ev.preventDefault();el.classList.remove('drag');}));el.addEventListener('drop',ev=>onFiles(ev.dataTransfer.files));input.addEventListener('change',()=>onFiles(input.files));}
const UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>';