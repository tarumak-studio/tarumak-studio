/* TARUMAK STUDIO — data.js
   TOOLS array, categories, icons, INIT/FEAT/FAQ registries.
   INIT is populated by tool files loaded after this. */

const CAT={image:'Image Tools',pdf:'PDF Tools',converter:'Converter Tools',marketing:'Marketing Designer',developer:'Developer & SEO'};
const ICON={image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',converter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>',marketing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',developer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'};

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
 ['image-compressor','Image Compressor','image','Compress JPG, PNG and WebP images online — reduce file size by up to 80% with no visible quality loss. Free, browser-based, no uploads.',['JPG','PNG','WEBP']],
 ['image-resizer','Image Resizer','image','Resize images to exact pixel dimensions or percentage online. Batch resize multiple images while keeping the original aspect ratio.',['JPG','PNG']],
 ['image-cropper','Image Cropper','image','Crop images online to any custom size or preset ratio (1:1, 16:9, 4:3). Preview before downloading — no software needed.',['JPG','PNG']],
 ['jpg-to-png','JPG to PNG Converter','image','Convert JPG to PNG online for free. Preserve transparency and get lossless quality — instant conversion, no uploads.',['JPG→PNG']],
 ['png-to-jpg','PNG to JPG Converter','image','Convert PNG to JPG online to reduce file size for web and email. Adjust quality level before downloading.',['PNG→JPG']],
 ['jpg-to-webp','JPG to WebP Converter','image','Convert JPG to WebP online — get files 25–35% smaller than JPG with the same visual quality. Works in all modern browsers.',['JPG→WEBP']],
 ['webp-to-jpg','WebP to JPG Converter','image','Convert WebP images to JPG online for compatibility with older software, email clients and social media platforms.',['WEBP→JPG']],
 ['png-to-webp','PNG to WebP Converter','image','Convert PNG to WebP online and save up to 26% file size. Keeps transparency. Ideal for web performance and Core Web Vitals.',['PNG→WEBP']],
 ['webp-to-png','WebP to PNG Converter','image','Convert WebP to PNG for full compatibility with all image editors, design tools and platforms that do not yet support WebP.',['WEBP→PNG']],
 ['svg-to-png','SVG to PNG Converter','image','Convert SVG vector files to PNG at any resolution online. Set exact pixel width and height — perfect for app icons and assets.',['SVG→PNG']],
 ['svg-to-jpg','SVG to JPG Converter','image','Convert SVG to JPG online with a white background. Choose output quality and dimensions for social media or print.',['SVG→JPG']],
 ['image-to-pdf','Image to PDF Converter','image','Convert JPG or PNG images to a PDF document online. Combine multiple images into one PDF in seconds — no software needed.',['IMG→PDF']],
 ['watermark-image','Watermark Image Tool','image','Add a text or image watermark to photos online. Adjust opacity, size and position. Protect your images before sharing.',['JPG','PNG']],
 ['exif-remover','EXIF Data Remover','image','Remove EXIF metadata from photos to protect your privacy. Strips GPS location, camera model and timestamps from JPG files.',['JPG']],
 ['qr-code-generator','QR Code Generator','image','Generate a free QR code for any URL, text, email or phone number. Download as high-resolution PNG — no sign-up required.',['PNG']],
 ['pdf-merger','PDF Merger','pdf','Merge multiple PDF files into one online for free. Drag to reorder pages before combining — no uploads, no sign-up.',['PDF']],
 ['pdf-splitter','PDF Splitter','pdf','Split a PDF into separate pages or extract a specific page range online. Download as individual PDFs instantly.',['PDF']],
 ['pdf-compressor','PDF Compressor','pdf','Compress PDF file size online for free. Reduce large PDFs for email attachments and web uploads — all in your browser.',['PDF']],
 ['pdf-to-jpg','PDF to JPG Converter','pdf','Convert PDF pages to JPG images online. Extract every page as a high-quality image — free, fast and private.',['PDF→JPG']],
 ['jpg-to-pdf','JPG to PDF Converter','pdf','Convert JPG images to PDF online in seconds. Combine multiple JPGs into one PDF or convert individually.',['JPG→PDF']],
 ['png-to-pdf','PNG to PDF Converter','pdf','Convert PNG images to PDF online. Preserves transparency as white background. Merge multiple PNGs into one document.',['PNG→PDF']],
 ['pdf-to-text','PDF to Text Converter','pdf','Extract text from a PDF file online. Convert PDF to plain TXT for editing, copying or analysis — no software needed.',['PDF→TXT']],
 ['pdf-password-protect','PDF Password Protector','pdf','Add password protection to a PDF online. Encrypt your PDF before sharing to prevent unauthorised access.',['PDF']],
 ['pdf-unlock','PDF Unlock Tool','pdf','Remove password from a PDF online. Unlock a PDF you own to enable editing, printing and copying.',['PDF']],
 ['pdf-page-rotator','PDF Page Rotator','pdf','Rotate PDF pages online — rotate individual pages or the entire document 90° or 180°. Download the corrected PDF.',['PDF']],
 ['pdf-page-remover','PDF Page Remover','pdf','Delete specific pages from a PDF online. Enter page numbers or ranges and download the PDF with those pages removed.',['PDF']],
 ['pdf-organizer','PDF Organizer','pdf','Reorder PDF pages online with drag-and-drop thumbnail view. Rearrange, rotate and preview before downloading.',['PDF']],
 ['scan-to-pdf','Scan to PDF Tool','pdf','Scan documents to PDF using your device camera. Capture multiple pages and merge them into a single PDF file.',['IMG→PDF']],
 ['images-to-pdf','Multiple Images to PDF','pdf','Convert multiple images to a single PDF online. Drag in JPG, PNG or WebP files, reorder them and download.',['IMG→PDF']],
 ['pdf-reader','PDF Reader Web App','pdf','Read and view PDF files online without downloading software. Navigate pages and zoom in — all in your browser.',['PDF']],
 ['txt-to-pdf','TXT to PDF Converter','converter','Convert plain text files to PDF online. Paste text or upload a .txt file and download a formatted PDF document.',['TXT→PDF']],
 ['html-to-pdf','HTML to PDF Converter','converter','Convert HTML to PDF online. Paste HTML code and generate a PDF document — useful for web page archiving.',['HTML→PDF']],
 ['gif-maker','GIF Maker','converter','Create animated GIFs from multiple images online. Set frame duration and loop settings — free GIF creator in your browser.',['IMG→GIF']],
 ['gif-to-webp','GIF to WebP Converter','converter','Convert animated GIF to WebP online for smaller file sizes and better web performance. Keeps all animation frames.',['GIF→WEBP']],
 ['webp-to-gif','WebP to GIF Converter','converter','Convert animated WebP to GIF for wider compatibility with older browsers, email clients and social platforms.',['WEBP→GIF']],
 ['color-picker','Color Picker from Image','converter','Pick and identify any color from an uploaded image. Get HEX, RGB and HSL values — free online eyedropper tool.',['HEX','RGB']],
 ['image-collage','Image Collage Maker','converter','Create a photo collage online from multiple images. Choose grid layout, gaps and background color — download as PNG.',['JPG','PNG']],
 ['favicon-generator','Favicon Generator','converter','Generate favicons for your website from any image. Creates all required sizes (16x16 to 512x512) — free, instant.',['ICO','PNG']],
 ['social-image-resizer','Social Media Image Resizer','marketing','Resize images for Instagram, Facebook, Twitter, LinkedIn, YouTube and 8 more platforms. Exact pixel dimensions, drag-to-crop.',['RESIZE','SOCIAL','CANVAS']],
 ['color-palette-gen','Color Palette Generator','marketing','Extract a color palette from any image or generate harmonious color schemes (complementary, triadic, analogous) from a base color.',['PALETTE','HEX','CSS']],
 ['ad-copy-gen','Ad Copy Generator','marketing','Generate ad headlines, body copy and CTAs for Facebook, Google and Instagram ads. Template-based, no AI subscription needed.',['ADS','COPY','HEADLINES']],
 ['cta-button-gen','CTA Button Generator','marketing','Design CTA buttons with live preview. Adjust color, radius, size and padding — copy the CSS or download as PNG.',['CTA','BUTTON','CSS']],
 ['utm-builder','UTM Link Builder','marketing','Build UTM campaign URLs for Google Analytics 4. Track source, medium, campaign and content. Also decodes existing UTM links.',['UTM','GA4','TRACKING']],
 ['og-image-gen','Open Graph Image Generator','marketing','Create Open Graph images (1200x630) for social media link previews. Add title, brand colors and logo — download as PNG.',['OG','1200x630','SOCIAL']],
 ['pdf-lead-magnet','PDF Lead Magnet Creator','marketing','Create professional PDF lead magnets — checklists, guides and cheatsheets — to grow your email list. Download instantly.',['PDF','CHECKLIST','LEAD']],
 ['brand-color-extract','Brand Color Extractor','marketing','Extract brand colors from any logo or image. Get HEX, RGB and HSL values plus ready-to-paste CSS custom properties.',['BRAND','HEX','EXTRACT']],
 ['word-counter','Word & Character Counter','developer','Count words, characters, sentences and reading time. Essential for bloggers, copywriters and SEO content creators.',['WORDS','CHARS','SEO']],
 ['password-generator','Secure Password Generator','developer','Generate strong random passwords with custom length, uppercase, numbers and symbols. Uses cryptographic randomness.',['PASSWORD','SECURE','RANDOM']],
 ['css-gradient-gen','CSS Gradient Generator','developer','Create beautiful CSS linear and radial gradients with a live visual picker. Copy the ready-to-use CSS code.',['CSS','GRADIENT','DESIGN']],
 ['base64-encoder','Base64 Encoder & Decoder','developer','Encode text to Base64 and decode Base64 strings back to plain text. Essential for web developers and API work.',['BASE64','ENCODE','DECODE']],
 ['json-formatter','JSON Formatter & Validator','developer','Format, beautify and validate JSON data online. Minify JSON and highlight syntax errors with clear messages.',['JSON','FORMAT','VALIDATE']],
 ['meta-tag-gen','Meta Tag Generator','developer','Generate SEO title tags, meta descriptions and Open Graph tags for any web page. Copy-ready HTML output.',['SEO','META','HTML']],
 ['hashtag-gen','Hashtag Generator','developer','Generate targeted hashtags for Instagram, Twitter and LinkedIn from design, marketing, business and tech categories.',['HASHTAG','SOCIAL','SEO']],
 ['lorem-ipsum','Lorem Ipsum Generator','developer','Generate placeholder text in paragraphs, sentences or words. Start with classic Lorem ipsum or use random text.',['LOREM','PLACEHOLDER','TEXT']],
 ['color-converter','Color Code Converter','developer','Convert between HEX, RGB and HSL color formats instantly. Click any result to copy to clipboard.',['HEX','RGB','HSL']],
 ['url-encoder','URL Encoder & Decoder','developer','Encode special characters in URLs for safe transmission. Decode URL-encoded strings back to readable text.',['URL','ENCODE','DECODE']],
];
const bySlug=s=>TOOLS.find(t=>t[0]===s);

/* ---------- home grid ---------- */
let activeCat='all',term='';
const tabsEl=$('#tabs'),gridEl=$('#grid');
