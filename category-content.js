/* category-content.js — data for the category landing page system.
   Adding a future category (Video Tools, Audio Tools, etc.) means one
   new entry here plus real tool entries in data.js's TOOLS array —
   build-category-pages.js does the rest, no template changes needed.

   Group assignments below are an editorial taxonomy decision (chips on
   TOOLS are format/feature tags, not clean category labels — there's no
   way to mechanically derive "AI Tools" vs "Utilities" from them), but
   every real tool in every category is accounted for exactly once —
   build-category-pages.js validates this at build time and fails loudly
   if a tool is ever missing or double-counted, so this can't silently
   drift from data.js as tools are added or renamed. */

const CATEGORIES = {

  image: {
    slug: 'image-tools', name: 'Image Tools', accent: '#22d3ee', dataCat: 'image',
    eyebrow: 'IMAGE TOOLS',
    heroTitle: 'Free Image Tools, Built for the Browser',
    heroSubtitle: 'Real AI, real format conversion, real compression \u2014 processed on your device. Nothing you upload here ever leaves it.',
    leadParagraph: 'Every Tarumak Studio image tool runs entirely inside your browser. Images are processed locally using the Canvas API and FileReader \u2014 nothing is sent to any server, nothing is stored, and there is no file size limit imposed by an upload restriction. The collection covers the most common image tasks for designers, marketers and developers: reducing file size before publishing to a website, converting between JPG, PNG, WebP and SVG, resizing to exact pixel dimensions for social media or print, cropping to standard aspect ratios, adding text or logo watermarks, stripping EXIF metadata for privacy, and using real on-device AI for background removal, enhancement and upscaling. Every tool here is free, with no account required and no limit tied to a subscription tier.',
    stats: [
      ['21', 'Free tools'],
      ['100%', 'Runs locally'],
      ['0', 'Uploads required'],
      ['4', 'Real AI tools'],
    ],
    featured: [
      ['background-remover', 'Popular'],
      ['ai-photo-enhancer', 'AI Powered'],
      ['ai-image-upscaler', 'AI Powered'],
      ['ai-object-remover', 'AI Powered'],
    ],
    groups: [
      ['AI Tools', ['background-remover', 'ai-object-remover', 'ai-photo-enhancer', 'ai-image-upscaler']],
      ['Format Converters', ['jpg-to-png', 'png-to-jpg', 'jpg-to-webp', 'webp-to-jpg', 'png-to-webp', 'webp-to-png', 'png-to-svg', 'svg-to-jpg', 'heic-to-jpg', 'image-to-pdf']],
      ['Editing & Optimization', ['image-compressor', 'image-resizer', 'image-cropper', 'watermark-image']],
      ['Metadata & Privacy', ['exif-remover']],
      ['Utilities', ['qr-code-generator', 'ocr-image-to-text']],
    ],
    workflow: {
      title: 'Product Photo Workflow',
      steps: [['background-remover', 'Remove background'], ['ai-photo-enhancer', 'Enhance'], ['ai-image-upscaler', 'Upscale'], ['image-compressor', 'Compress for web']],
    },
    insights: [
      ['Why use browser-based image tools?', 'Every tool here runs on the Canvas API directly in your browser \u2014 your photos never touch a server. That matters for anything you wouldn\u2019t want stored somewhere else: client work, ID photos, product shots under NDA, or just personal photos you\u2019d rather keep private.'],
      ['Why remove EXIF data before sharing photos?', 'Phone photos carry embedded metadata \u2014 GPS coordinates, device model, sometimes a timestamp down to the second. Most people don\u2019t realize it\u2019s there until it\u2019s already been shared. The EXIF Remover strips it in one click, locally, before you post.'],
      ['When does AI actually help with photo editing?', 'Background removal, upscaling and exposure correction are genuinely hard to do well by hand \u2014 that\u2019s where the AI tools focus. Simple tasks like resizing or format conversion don\u2019t need AI at all, which is why those stay as fast, direct, non-AI tools instead.'],
    ],
    trust: ['Runs locally in your browser', 'No account or signup', 'No file size limit from uploads', 'Free, with no paid tier'],
    compareLinks: ['tarumak-vs-removebg', 'tarumak-vs-canva-bg-remover'],
    faq: [
      ['Do I need to install anything?', 'No \u2014 every tool runs in the page you\u2019re on right now, using your browser\u2019s own Canvas API. Nothing to download or install.'],
      ['Is there a limit on image size?', 'Each tool has its own practical limit based on what a browser can safely hold in memory (usually tens of megapixels) \u2014 there\u2019s no artificial cap tied to an account tier.'],
      ['Do any of these tools need an internet connection after the page loads?', 'Most process entirely offline once loaded. The AI tools may download a model file once per session (cached afterward); everything else works with no connection at all.'],
    ],
  },

  pdf: {
    slug: 'pdf-tools', name: 'PDF Tools', accent: '#a78bfa', dataCat: 'pdf',
    eyebrow: 'PDF TOOLS',
    heroTitle: 'Free PDF Tools That Never Leave Your Device',
    heroSubtitle: 'Merge, split, compress, convert and secure PDFs entirely in your browser \u2014 including a real table-reconstructing PDF to Excel converter.',
    leadParagraph: 'Every PDF tool here processes your document entirely on your own device \u2014 nothing is uploaded to a server, which matters for exactly the kind of files people convert most: contracts, financial statements, tax paperwork, HR documents. The collection covers the everyday PDF workflow: merging and splitting documents, compressing oversized files, converting to and from JPG, Excel and plain text, password-protecting or unlocking a file, reordering and rotating pages, and scanning paper documents straight into a PDF. Every tool is free, with no account required and no page-count fee tied to a subscription tier \u2014 just a sensible per-file page limit set by what a browser tab can safely hold in memory.',
    stats: [
      ['16', 'Free tools'],
      ['100%', 'Runs locally'],
      ['0', 'Uploads required'],
      ['60', 'Page limit per file'],
    ],
    featured: [
      ['pdf-to-excel', 'New'],
      ['pdf-merger', 'Popular'],
      ['pdf-compressor', 'Popular'],
      ['pdf-password-protect', 'Privacy First'],
    ],
    groups: [
      ['Convert', ['pdf-to-jpg', 'pdf-to-excel', 'jpg-to-pdf', 'png-to-pdf', 'pdf-to-text', 'scan-to-pdf', 'images-to-pdf']],
      ['Organize & Edit', ['pdf-merger', 'pdf-splitter', 'pdf-page-rotator', 'pdf-page-remover', 'pdf-organizer']],
      ['Compress', ['pdf-compressor']],
      ['Security', ['pdf-password-protect', 'pdf-unlock']],
      ['Utilities', ['pdf-reader']],
    ],
    workflow: {
      title: 'Document Prep Workflow',
      steps: [['pdf-merger', 'Merge'], ['pdf-compressor', 'Compress'], ['pdf-to-excel', 'Extract to Excel'], ['pdf-password-protect', 'Protect']],
    },
    insights: [
      ['Why convert PDF to Excel locally?', 'A PDF-to-Excel converter necessarily reads every page of your document \u2014 which, for financial statements, contracts or HR paperwork, is exactly the kind of file you don\u2019t want passing through a third-party server. Doing it in-browser means that data never leaves your device.'],
      ['Why password-protect a PDF before sharing it?', 'Email and file-sharing links are rarely as private as they feel. A password-protected PDF stays unreadable even if the file itself ends up somewhere it shouldn\u2019t \u2014 forwarded, misdelivered, or left in a shared folder.'],
      ['Does compressing a PDF reduce quality?', 'Text and vector content in a PDF compress losslessly \u2014 you won\u2019t see a difference. Size reduction mostly comes from re-encoding embedded images, which is the one place a quality/size tradeoff genuinely exists.'],
    ],
    trust: ['Runs locally in your browser', 'No account or signup', 'Passwords never sent anywhere', 'Free, with no paid tier'],
    compareLinks: [],
    faq: [
      ['Can these tools handle password-protected PDFs?', 'Yes \u2014 tools that need to read a protected PDF will ask for the password first. It\u2019s only ever used locally to decrypt the file in your browser.'],
      ['Is there a page limit?', 'Yes, 60 pages for the browser-based converters \u2014 processing very large documents in a browser tab has real memory limits. Split a larger PDF first with the PDF Splitter if you hit this.'],
      ['Do I need Adobe Acrobat for any of this?', 'No \u2014 these cover the common day-to-day PDF tasks (merge, split, compress, convert, protect) without needing separately installed desktop software.'],
    ],
  },

  developer: {
    slug: 'developer-tools', name: 'Developer & SEO Tools', accent: '#34d399', dataCat: 'developer',
    eyebrow: 'DEVELOPER & SEO',
    heroTitle: 'Developer Utilities Without the Context Switch',
    heroSubtitle: 'Formatters, encoders, generators and validators for the small tasks that interrupt real work \u2014 no account, no ads gating the result.',
    leadParagraph: 'These are the small, recurring tasks that interrupt actual development and content work: formatting and validating JSON, encoding or decoding Base64 and URLs, generating a secure password, testing a regular expression against real sample text, converting between color formats, checking a timestamp, or writing SEO meta tags and structured data that actually validates. Every tool runs in your own browser tab \u2014 nothing you paste in is transmitted anywhere, and there\u2019s no daily rate limit tied to an account, because there\u2019s no server-side quota to hit in the first place.',
    stats: [
      ['15', 'Free tools'],
      ['100%', 'Runs locally'],
      ['0', 'Uploads required'],
      ['0', 'Rate limits'],
    ],
    featured: [
      ['json-formatter', 'Popular'],
      ['regex-tester', 'Recommended'],
      ['base64-encoder', 'Popular'],
    ],
    groups: [
      ['Encoding & Formatting', ['base64-encoder', 'json-formatter', 'url-encoder']],
      ['Text & Content', ['word-counter', 'lorem-ipsum', 'text-diff', 'text-case-converter', 'slug-generator']],
      ['SEO & Meta', ['meta-tag-gen', 'hashtag-gen']],
      ['Generators & Utilities', ['password-generator', 'css-gradient-gen', 'color-converter', 'regex-tester', 'timestamp-converter']],
    ],
    workflow: {
      title: 'Content Prep Workflow',
      steps: [['word-counter', 'Check length'], ['slug-generator', 'Generate slug'], ['meta-tag-gen', 'Write meta tags'], ['json-formatter', 'Validate structured data']],
    },
    insights: [
      ['Why use SEO generators instead of guessing meta tags by hand?', 'Title length limits, Open Graph requirements and structured-data syntax all have real, checkable rules. A generator that validates as you type catches a truncated title or a malformed JSON-LD block before it ships, not after Search Console flags it.'],
      ['Why does JSON formatting matter for structured data?', 'A single misplaced comma in JSON-LD schema can make Google silently ignore it \u2014 no error, just no rich result. Validating the structure before you paste it into a page catches this class of bug immediately instead of during the next Search Console audit.'],
      ['Is a regex tester actually useful day to day?', 'Writing a regex and testing it against real sample strings in the same view \u2014 rather than in production \u2014 is the difference between catching an edge case now versus after it\u2019s already matched (or failed to match) something in a live system.'],
    ],
    trust: ['Runs locally in your browser', 'No account or signup', 'No daily rate limits', 'Free, with no paid tier'],
    compareLinks: [],
    faq: [
      ['Are these tools rate-limited?', 'No \u2014 since processing happens in your own browser rather than on a shared server, there\u2019s no per-account quota to hit.'],
      ['Is my data sent anywhere when I format JSON or test a regex?', 'No \u2014 text stays in the page. Nothing is transmitted for these tools to work.'],
      ['Can I use these for production secrets or real API keys?', 'The tools don\u2019t transmit anything, but as a general practice avoid pasting genuinely sensitive production secrets into any browser-based tool, this one included, since a browser environment (extensions, dev tools) is a different trust boundary than an isolated local script.'],
      ['What\u2019s the difference between URL encoding and Base64 encoding?', 'URL encoding replaces characters that aren\u2019t safe in a URL (spaces, special symbols) with percent-escaped equivalents, so a string can be safely embedded in a link. Base64 encodes arbitrary binary or text data into a compact ASCII representation \u2014 used for things like embedding small images inline or encoding data for APIs, not specifically for URL safety.'],
    ],
  },

  marketing: {
    slug: 'marketing-tools', name: 'Marketing & Designer Tools', accent: '#fb923c', dataCat: 'marketing',
    eyebrow: 'MARKETING & DESIGNER',
    heroTitle: 'Campaign and Brand Tools, Ready in Seconds',
    heroSubtitle: 'UTM links, brand colors, social image sizing and campaign assets \u2014 the small recurring tasks behind every marketing push.',
    leadParagraph: 'Marketing work is full of small, recurring production tasks that don\u2019t need a full design suite: building a correctly-tagged UTM link before a campaign goes out, pulling exact brand colors from an existing logo, generating an Open Graph image so a shared link actually looks intentional, resizing one graphic for every social platform\u2019s dimensions, or drafting ad copy and a call-to-action button quickly. Every tool here handles one of those tasks directly and completely, in your browser, with nothing uploaded and no subscription required to use the result.',
    stats: [
      ['8', 'Free tools'],
      ['100%', 'Runs locally'],
      ['0', 'Uploads required'],
      ['0', 'Design software needed'],
    ],
    featured: [
      ['utm-builder', 'Popular'],
      ['og-image-gen', 'Recommended'],
      ['brand-color-extract', 'Recommended'],
    ],
    groups: [
      ['Campaign Tools', ['ad-copy-gen', 'cta-button-gen', 'utm-builder', 'pdf-lead-magnet']],
      ['Design Assets', ['color-palette-gen', 'brand-color-extract', 'og-image-gen']],
      ['Social Media', ['social-image-resizer']],
    ],
    workflow: {
      title: 'Campaign Launch Workflow',
      steps: [['brand-color-extract', 'Pull brand colors'], ['og-image-gen', 'Create share image'], ['utm-builder', 'Build tracked links'], ['social-image-resizer', 'Resize for each platform']],
    },
    insights: [
      ['Why does a UTM link matter if the URL still works without one?', 'The link works either way \u2014 the UTM parameters are what let Google Analytics tell you which specific campaign, email, or post actually drove the click, instead of lumping all traffic together as "unknown."'],
      ['Why extract brand colors from a logo instead of asking a designer for hex codes?', 'It\u2019s common to inherit a brand with no documented palette at all \u2014 pulling the real hex/RGB values directly from an existing logo or asset gives you an accurate starting point in seconds rather than guessing or waiting on someone else.'],
      ['What is an Open Graph image, and why do I need one?', 'It\u2019s the preview image that shows up when a link is shared on social media or messaging apps. Without one, shared links show a blank or arbitrary image \u2014 a defined OG image is what makes a shared link look intentional.'],
    ],
    trust: ['Runs locally in your browser', 'No account or signup', 'No design software required', 'Free, with no paid tier'],
    compareLinks: [],
    faq: [
      ['Do I need Canva or Photoshop alongside these?', 'For the specific tasks covered here \u2014 UTM links, OG images, brand color extraction, social sizing \u2014 no. They\u2019re built to be the direct, complete tool for that one task rather than a simplified version of a bigger design app.'],
      ['Can I use the generated assets commercially?', 'Yes \u2014 anything you generate or export here is yours to use.'],
      ['Do these tools track my campaigns or store my links?', 'No \u2014 the UTM Builder and other tools just construct the output in your browser; nothing is logged or stored on our end.'],
      ['How do I know which UTM parameters to actually use?', 'The standard set is source (where the click came from, like "newsletter" or "instagram"), medium (the channel type, like "email" or "social"), and campaign (the specific push, like "spring-sale-2026"). Term and content are optional, used mainly for paid search keyword tracking or A/B-testing different ad creative.'],
      ['Why does the Open Graph image matter more than the page\u2019s actual content sometimes?', 'On social platforms, most people decide whether to click based on the preview card alone \u2014 the image, title and description that show up before anyone visits the page. A missing or generic OG image is one of the most common, and easiest to fix, reasons a genuinely good link underperforms when shared.'],
    ],
  },

  converter: {
    slug: 'converter-tools', name: 'Converter Tools', accent: '#a3e635', dataCat: 'converter',
    eyebrow: 'CONVERTERS',
    heroTitle: 'File Conversion, Done Directly in the Browser',
    heroSubtitle: 'Documents, images and animations converted between formats \u2014 no install, no watching an upload progress bar for a file that never needed to leave your device.',
    leadParagraph: 'This collection covers the everyday file-conversion tasks that don\u2019t fit neatly under Image or PDF Tools: converting Word, plain text, HTML or Markdown into a shareable PDF, building an animated GIF or converting one to the smaller WebP format, generating a full set of favicon sizes from one image, or building a quick collage from several photos. Each tool runs entirely in your browser \u2014 conversion happens on your device, with no watermark added to the result and no software to install first.',
    stats: [
      ['10', 'Free tools'],
      ['100%', 'Runs locally'],
      ['0', 'Uploads required'],
      ['0', 'Watermarks'],
    ],
    featured: [
      ['word-to-pdf', 'Popular'],
      ['html-to-pdf', 'Recommended'],
      ['favicon-generator', 'Popular'],
    ],
    groups: [
      ['Document Converters', ['txt-to-pdf', 'html-to-pdf', 'word-to-pdf', 'markdown-to-html']],
      ['Image & Animation', ['gif-maker', 'gif-to-webp', 'webp-to-gif', 'image-collage', 'color-picker']],
      ['Web Assets', ['favicon-generator']],
    ],
    workflow: {
      title: 'Web Asset Workflow',
      steps: [['markdown-to-html', 'Write in Markdown'], ['html-to-pdf', 'Export to PDF'], ['favicon-generator', 'Generate favicon'], ['image-collage', 'Build a preview collage']],
    },
    insights: [
      ['Why convert Word to PDF instead of just exporting from Word?', 'Not everyone has Word installed, and PDF is the safer format for sharing something you don\u2019t want casually edited. Converting in-browser also means the document\u2019s content never has to pass through a third-party conversion service.'],
      ['Why does a favicon need multiple sizes?', 'Browsers, bookmarks, home-screen icons and search results all request different pixel dimensions. Generating the full set at once avoids the common bug where a site\u2019s icon looks sharp in a browser tab but blurry when saved to a phone home screen.'],
      ['What\u2019s the actual difference between GIF and WebP for animation?', 'WebP animations are typically significantly smaller than an equivalent GIF at similar quality, but GIF still has near-universal compatibility \u2014 including in contexts (some older email clients, certain embeds) where WebP support is inconsistent.'],
    ],
    trust: ['Runs locally in your browser', 'No account or signup', 'No watermarks added', 'Free, with no paid tier'],
    compareLinks: [],
    faq: [
      ['Will converting a Word document preserve formatting?', 'Core formatting \u2014 headings, bold/italic, lists, basic layout \u2014 carries over. Very complex, heavily-styled documents may need a quick visual check afterward.'],
      ['Is there a file size limit?', 'Limits are set by what a browser tab can hold in memory rather than an account tier \u2014 practically generous for everyday documents and images.'],
      ['Do converted files include a watermark?', 'No \u2014 outputs are clean, with no watermark or branding added.'],
      ['Why convert Markdown to HTML instead of writing HTML directly?', 'Markdown is faster to write and far more readable in its raw form \u2014 useful for documentation, README files, or blog drafts. Converting it to HTML at the end gives you the same result with less time spent on tags and closing brackets along the way.'],
    ],
  },
};

module.exports = { CATEGORIES };
