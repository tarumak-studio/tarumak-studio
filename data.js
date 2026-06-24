/* TARUMAK STUDIO — data.js
   TOOLS array, categories, icons, INIT/FEAT/FAQ registries.
   INIT is populated by tool files loaded after this. */

const CAT={image:'Image Tools',pdf:'PDF Tools',converter:'Converter Tools',marketing:'Marketing Designer'};
const ICON={image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',converter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>',marketing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>'};

/* build a standard dropzone panel; returns refs */
function dz(panel,o){o=o||{};
  panel.innerHTML='<div class="drop '+(o.pdf?'pdf':'')+'" id="d_drop"><input type="file" id="d_file" accept="'+(o.accept||'*/*')+'" '+(o.multiple?'multiple':'')+' hidden>'+
    '<div class="di">'+UP+'</div><h3>'+(o.title||'Drop files here or click to browse')+'</h3><p>'+(o.sub||'')+'</p>'+
    '<div class="formats">'+(o.formats||[]).map(f=>'<span class="chip">'+f+'</span>').join('')+'</div></div>'+
    '<div class="controls" id="d_controls"></div><div class="results" id="d_results"></div><div class="actions" id="d_actions"></div><div class="status" id="d_status"></div>';
  const r={drop:$('#d_drop',panel),file:$('#d_file',panel),controls:$('#d_controls',panel),results:$('#d_results',panel),actions:$('#d_actions',panel),status:$('#d_status',panel)};
  return r;
}
function setStatus(el,msg,err){el.className='status show'+(err?' err':'');el.textContent=msg;}
function row(box,thumb,name,meta,onDl){box.classList.add('show');const d=document.createElement('div');d.className='row';
  d.innerHTML=(thumb?'<img class="thumb" src="'+thumb+'">':'<div class="thumb" style="display:grid;place-items:center;color:var(--accent)">'+ICON.pdf+'</div>')+
  '<div class="meta"><div class="nm">'+name+'</div><div class="sz">'+meta+'</div></div>';
  const b=document.createElement('button');b.className='btn btn-primary dl';b.textContent='Download';b.onclick=onDl;d.appendChild(b);box.appendChild(d);return d;}

/* ---------- tool registry ---------- */
const INIT={};            /* slug -> init(panel) */
const FEAT={};            /* slug -> [[title,desc],...] optional */
const FAQ={};             /* slug -> [[q,a],...] optional */
/* metadata for all 38 tools */
const TOOLS=[
 ['image-compressor','Image Compressor','image','Shrink JPG, PNG &amp; WebP file sizes without losing visible quality.',['JPG','PNG','WEBP']],
 ['image-resizer','Image Resizer','image','Resize images to exact pixel dimensions or by percentage.',['JPG','PNG']],
 ['image-cropper','Image Cropper','image','Crop to a custom area or fixed aspect ratio in seconds.',['JPG','PNG']],
 ['jpg-to-png','JPG to PNG Converter','image','Convert JPG photos to lossless PNG images.',['JPG→PNG']],
 ['png-to-jpg','PNG to JPG Converter','image','Turn PNG files into smaller JPGs with a solid background.',['PNG→JPG']],
 ['jpg-to-webp','JPG to WebP Converter','image','Convert JPG to modern WebP for smaller files.',['JPG→WEBP']],
 ['webp-to-jpg','WebP to JPG Converter','image','Convert WebP back to universally supported JPG.',['WEBP→JPG']],
 ['png-to-webp','PNG to WebP Converter','image','Compress PNG into WebP while keeping transparency.',['PNG→WEBP']],
 ['webp-to-png','WebP to PNG Converter','image','Convert WebP to lossless PNG for editing.',['WEBP→PNG']],
 ['svg-to-png','SVG to PNG Converter','image','Rasterize vector SVG files into crisp PNG images.',['SVG→PNG']],
 ['svg-to-jpg','SVG to JPG Converter','image','Export SVG graphics as flat JPG images.',['SVG→JPG']],
 ['image-to-pdf','Image to PDF Converter','image','Combine one or many images into a single PDF.',['IMG→PDF']],
 ['watermark-image','Watermark Image Tool','image','Add text watermarks to protect your images.',['JPG','PNG']],
 ['exif-remover','EXIF Data Remover','image','Strip location &amp; camera metadata from photos.',['JPG']],
 ['qr-code-generator','QR Code Generator','image','Create QR codes for links, text, Wi-Fi and more.',['PNG']],
 ['pdf-merger','PDF Merger','pdf','Combine multiple PDF files into one, in any order.',['PDF']],
 ['pdf-splitter','PDF Splitter','pdf','Split a PDF into separate pages or page ranges.',['PDF']],
 ['pdf-compressor','PDF Compressor','pdf','Reduce PDF file size while preserving readability.',['PDF']],
 ['pdf-to-jpg','PDF to JPG Converter','pdf','Export each PDF page as a high-quality JPG image.',['PDF→JPG']],
 ['jpg-to-pdf','JPG to PDF Converter','pdf','Turn JPG photos into a clean, shareable PDF.',['JPG→PDF']],
 ['png-to-pdf','PNG to PDF Converter','pdf','Convert PNG images into a single PDF file.',['PNG→PDF']],
 ['pdf-to-text','PDF to Text Converter','pdf','Extract plain, copyable text from any PDF.',['PDF→TXT']],
 ['pdf-password-protect','PDF Password Protector','pdf','Encrypt a PDF with a password before you share it.',['PDF']],
 ['pdf-unlock','PDF Unlock Tool','pdf','Remove restrictions or a known password from a PDF.',['PDF']],
 ['pdf-page-rotator','PDF Page Rotator','pdf','Rotate individual pages or the whole document.',['PDF']],
 ['pdf-page-remover','PDF Page Remover','pdf','Delete unwanted pages from a PDF in one click.',['PDF']],
 ['pdf-organizer','PDF Organizer','pdf','Reorder, rotate and arrange PDF pages visually.',['PDF']],
 ['scan-to-pdf','Scan to PDF Tool','pdf','Capture documents with your camera and save as PDF.',['IMG→PDF']],
 ['images-to-pdf','Multiple Images to PDF','pdf','Batch-convert many images into a single PDF.',['IMG→PDF']],
 ['pdf-reader','PDF Reader Web App','pdf','Open and read PDFs in-browser with page navigation.',['PDF']],
 ['txt-to-pdf','TXT to PDF Converter','converter','Convert plain text into a formatted PDF.',['TXT→PDF']],
 ['html-to-pdf','HTML to PDF Converter','converter','Render an HTML snippet as a PDF.',['HTML→PDF']],
 ['gif-maker','GIF Maker','converter','Build an animated GIF from a set of images.',['IMG→GIF']],
 ['gif-to-webp','GIF to WebP Converter','converter','Convert a GIF frame to a WebP image.',['GIF→WEBP']],
 ['webp-to-gif','WebP to GIF Converter','converter','Convert a WebP image to GIF format.',['WEBP→GIF']],
 ['color-picker','Color Picker from Image','converter','Pick exact HEX &amp; RGB colors from any image.',['HEX','RGB']],
 ['image-collage','Image Collage Maker','converter','Arrange photos into a grid collage and download.',['JPG','PNG']],
 ['favicon-generator','Favicon Generator','converter','Generate multi-size favicons for your website.',['ICO','PNG']],
 ['social-image-resizer','Social Media Image Resizer','marketing','Resize any image to the exact pixel dimensions for Instagram, Facebook, Twitter, LinkedIn, YouTube and 8 more platforms.',['RESIZE','SOCIAL','CANVAS']],
 ['color-palette-gen','Color Palette Generator','marketing','Extract a color palette from any image or generate harmonious palettes from a base color.',['PALETTE','HEX','CSS']],
 ['ad-copy-gen','Ad Copy Generator','marketing','Generate compelling headlines, body copy and CTAs for Facebook, Google and Instagram ads.',['ADS','COPY','HEADLINES']],
 ['cta-button-gen','CTA Button Generator','marketing','Design high-converting CTA buttons with a live preview then copy the CSS or download as PNG.',['CTA','BUTTON','CSS']],
 ['utm-builder','UTM Link Builder','marketing','Build and decode UTM campaign URLs for Google Analytics 4 tracking in seconds.',['UTM','GA4','TRACKING']],
 ['og-image-gen','Open Graph Image Generator','marketing','Create custom 1200x630 OG images for social media link previews with text and brand colors.',['OG','1200x630','SOCIAL']],
 ['pdf-lead-magnet','PDF Lead Magnet Creator','marketing','Build professional PDF checklists and guides to grow your email list — no design skills needed.',['PDF','CHECKLIST','LEAD']],
 ['brand-color-extract','Brand Color Extractor','marketing','Upload any logo to instantly extract brand colors as HEX, RGB, HSL and CSS variables.',['BRAND','HEX','EXTRACT']],
];
const bySlug=s=>TOOLS.find(t=>t[0]===s);

/* ---------- home grid ---------- */
let activeCat='all',term='';
const tabsEl=$('#tabs'),gridEl=$('#grid');
