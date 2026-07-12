/* tool-content.js — Tarumak Studio tool-page VARIANT SYSTEM data.
 *
 * This file exists to fix one specific problem: every one of the 66 tool
 * pages used to render the exact same five benefit cards, the exact same
 * six feature tags, and the exact same four how-to steps, in the exact
 * same order, with only the tool name swapped in. Structurally identical
 * pages read as templated regardless of how good the copy is.
 *
 * Two tiers of content, by design, not by accident:
 *
 * 1. TOOL_META — hand-authored per tool. Every claim in here was checked
 *    against that tool's real INIT[] implementation before being written
 *    (e.g. OCR's 8 languages, the compressor's real 10-100% quality
 *    slider, PDF Merger's actual up/down reorder buttons — not "drag to
 *    reorder", which the tool doesn't do). This is the full-fidelity
 *    tier: bespoke hero, bespoke benefits, bespoke use cases, bespoke
 *    tips — one flagship tool per category (plus two extra in Image,
 *    since the brief named Background Remover, Image Compressor AND OCR
 *    explicitly as different-hero examples).
 *
 * 2. CAT_DEFAULTS — category-level pools for every tool NOT in TOOL_META.
 *    These are still real, true, category-appropriate content (never a
 *    fabricated specific claim about a tool's mechanics) — but instead of
 *    one fixed list, each category has a POOL of 6-8 real options, and
 *    build-tool-pages.js picks a deterministic subset + order per tool
 *    (seeded by the tool's own slug, so it's stable across rebuilds, not
 *    random). Two tools in the same category will not show the identical
 *    benefit set in the identical order. This is a floor, not a ceiling:
 *    hand-authoring TOOL_META entries for more tools over time is how the
 *    ceiling extends — see NAV... no, see TOOL-VARIANT-SYSTEM.md for the
 *    rollout plan.
 *
 * HERO TYPES (visual family, rendered by build-tool-pages.js + styled by
 * tool-variants.css): 'compare' (before/after slider), 'scan' (document
 * scan-line + language badges), 'workflow' (stacked/fanning documents),
 * 'code' (console mock with syntax-colored lines), 'live' (animated
 * live-preview card), 'convert' (format-A -> arrow -> format-B badges).
 *
 * LAYOUT VARIANTS (section composition, matching the brief's A/B/C/D):
 *   A = hero, tool, benefits, howto, usecases, faq, related, guides, cta
 *   B = hero, comparison, tool, benefits(trimmed), faq, guides, related, cta
 *   C = hero, tool, tips, mistakes, faq, related, cta
 *   D = hero, tool, usecases, workflow, guides, related, cta
 * These are implemented as one data-driven section dispatcher in
 * build-tool-pages.js, not four copy-pasted template functions — so
 * adding a variant E later is a data change, not a new template to keep
 * in sync with the other four.
 */
'use strict';

/* ────────────────────────────────────────────────────────────────
   Small deterministic helpers — used by build-tool-pages.js to pick
   a stable-but-varied subset/order from a CAT_DEFAULTS pool per tool.
   Seeded by the slug's own hash, so two separate builds of the same
   site produce byte-identical output (important: this is a static
   site with no server, so "random" would mean "different every git
   diff" for no reason) while two different tools in the same
   category still get visibly different selections.
──────────────────────────────────────────────────────────────── */
function slugHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seededPick(pool, n, seed) {
  const arr = pool.slice();
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr.slice(0, Math.min(n, arr.length));
}

/* ────────────────────────────────────────────────────────────────
   CAT_DEFAULTS — one entry per category. Every string here is
   generically true for the WHOLE category (verified against the
   site's existing IS_FILE_TOOL classifier and real CDN/library
   list) — nothing here asserts a specific mechanic (like "batch
   processing" or "no file size limit") that isn't true for every
   single tool in the category, since that can't be individually
   verified for all 59 non-flagship tools from this data file alone.
──────────────────────────────────────────────────────────────── */
const CAT_DEFAULTS = {
  image: {
    hero: 'compare', variant: 'A', accent: '#22d3ee',
    benefitPool: [
      ['zap', 'Instant, not queued', 'Results appear the moment {name} finishes on your own device \u2014 no upload wait, no server queue.'],
      ['monitor', 'Processed on your device', '{name} runs locally in your browser. Nothing is sent anywhere, so there is nothing to wait on and nothing to trust with your files.'],
      ['gem', 'Full quality output', 'You get exactly what {name} produces \u2014 no forced extra compression, no watermark, no resolution cap behind a paywall.'],
      ['shield', 'No account, ever', 'Open the tool and use it immediately. No sign-up, no email, no usage cap.'],
      ['heart', 'Genuinely free', '{name} has no premium tier hiding behind this free version \u2014 what you see is the whole tool.'],
      ['layers', 'Built for real files', '{name} works with the formats you actually have \u2014 no forced re-export from another app first.']
    ],
    featurePool: ['Drag & drop upload', 'Keyboard accessible', 'Works in any modern browser', 'No sign-up required', 'No watermark added', 'Mobile & tablet friendly', 'Original aspect ratio preserved', 'Loads once, works offline after'],
    useCasePool: [
      ['E-commerce listings', 'Product photos that need to load fast and look consistent across a whole catalog.'],
      ['Social media graphics', 'Quick turnarounds for posts, stories and profile assets without opening a design app.'],
      ['Website performance', 'Smaller, better-optimized images that help real Core Web Vitals scores, not just file size.'],
      ['Email newsletters', 'Images sized and compressed so they do not get clipped or trigger spam filters.'],
      ['Client delivery', 'A fast way to prep final assets before handing off a project.']
    ],
    ctaVerb: 'Process another image'
  },
  pdf: {
    hero: 'workflow', variant: 'D', accent: '#a78bfa',
    benefitPool: [
      ['zap', 'No install, no wait', '{name} works the moment the page loads \u2014 no desktop software, no plugin, no account.'],
      ['monitor', 'Processed on your device', 'Your PDF is handled locally in your browser. It is never uploaded to a server to do the work.'],
      ['shield', 'No account, ever', 'Open the tool and use it immediately \u2014 no sign-up, no email required.'],
      ['gem', 'Nothing gated', 'Every feature you see in {name} is available \u2014 no page-count limit, no watermark, no premium tier.'],
      ['heart', 'Genuinely free', 'There is no premium version of {name} hiding better output behind a paywall.']
    ],
    featurePool: ['Works in any modern browser', 'No file uploaded to a server', 'No sign-up required', 'No watermark added', 'Keyboard accessible', 'Mobile friendly'],
    useCasePool: [
      ['Tax and financial documents', 'Handling paperwork you would rather not upload to a third-party server.'],
      ['Client contracts & proposals', 'Preparing documents for a client without installing desktop PDF software.'],
      ['Reports and internal docs', 'Quick document prep before sharing internally or with stakeholders.'],
      ['Scanned paperwork', 'Cleaning up documents that started life as a phone camera scan.'],
      ['Signed agreements', 'Getting a document into its final, shareable shape.']
    ],
    workflowSteps: ['Add your PDF file(s)', 'Set the options for this tool', 'Preview the result before downloading', 'Download the finished file'],
    ctaVerb: 'Process another PDF'
  },
  developer: {
    hero: 'code', variant: 'C', accent: '#34d399',
    benefitPool: [
      ['zap', 'Instant, keystroke by keystroke', '{name} responds as you type \u2014 no round trip to a server for every change.'],
      ['monitor', 'Processed on your device', 'Your input is handled locally in the browser and never sent to a server.'],
      ['shield', 'No account, ever', 'Open the tool and use it immediately \u2014 no sign-up required.'],
      ['gem', 'Nothing gated', 'Every feature of {name} is available for free, with no usage limit.'],
      ['layers', 'Built for real workflows', '{name} is built around how the data actually shows up in practice, not a toy example.']
    ],
    featurePool: ['Works offline after first load', 'No sign-up required', 'Keyboard accessible', 'No usage limit', 'Mobile friendly', 'No watermark or attribution required'],
    useCasePool: [
      ['API response debugging', 'Making sense of a payload that came back as one unreadable line.'],
      ['Config file editing', 'Checking a config file is valid before it breaks a deploy.'],
      ['Webhook payload inspection', 'Reading through incoming data from a third-party integration.'],
      ['Learning & teaching', 'A quick, no-install way to demonstrate a concept to someone else.']
    ],
    tipsPool: [
      'Keep a working copy of your input before running a destructive operation \u2014 undo is a browser back-button, not a history stack.',
      'When something looks wrong, check the start of the input first \u2014 most parsing errors cascade from one early character.',
      'Bookmark this page. It is a static URL with no login, so it works the same way every time you need it.'
    ],
    mistakePool: [
      'Assuming a paid tool would give a more "official" result \u2014 the underlying parsing logic is the same either way.',
      'Not checking for trailing commas, smart quotes, or copy-pasted invisible characters \u2014 the most common source of a confusing error.',
      'Working directly on the only copy of an important file instead of a duplicate.'
    ],
    ctaVerb: 'Run another one'
  },
  marketing: {
    hero: 'live', variant: 'B', accent: '#fb923c',
    benefitPool: [
      ['zap', 'See it update live', '{name} redraws its preview as you change the inputs \u2014 no separate "generate" step to wait on.'],
      ['monitor', 'Made on your device', 'Nothing you type into {name} is sent to a server \u2014 the output is built locally in your browser.'],
      ['shield', 'No account, ever', 'Open the tool and use it immediately \u2014 no sign-up required.'],
      ['gem', 'Full-resolution download', 'The file you download is the real output \u2014 no watermark, no locked "preview only" quality.'],
      ['heart', 'Genuinely free', '{name} is not a free trial of a paid tool \u2014 there is no premium tier behind it.']
    ],
    featurePool: ['Live preview as you type', 'No sign-up required', 'No watermark added', 'Mobile friendly', 'Works in any modern browser', 'No usage limit'],
    useCasePool: [
      ['Social media campaigns', 'Quick creative assets for a specific post or promotion.'],
      ['Email marketing', 'Elements that need to look right without a design tool subscription.'],
      ['Landing pages', 'Supporting assets for a page that needs to ship today, not next sprint.'],
      ['Client presentations', 'Polished output to hand to a client without extra software.']
    ],
    comparisonIntro: 'What changes when {name} does this instead of doing it by hand.',
    ctaVerb: 'Create another'
  },
  converter: {
    hero: 'convert', variant: 'B', accent: '#a3e635',
    benefitPool: [
      ['zap', 'Instant conversion', '{name} converts the moment you drop a file \u2014 no queue, no email-when-ready wait.'],
      ['monitor', 'Processed on your device', 'The conversion runs locally in your browser \u2014 your file is never uploaded to do the work.'],
      ['shield', 'No account, ever', 'Open the tool and use it immediately \u2014 no sign-up required.'],
      ['gem', 'Full quality output', 'You get exactly what the conversion produces \u2014 no forced extra compression, no watermark.'],
      ['heart', 'Genuinely free', 'There is no premium tier of {name} hiding a better export behind a paywall.']
    ],
    featurePool: ['Works in any modern browser', 'No sign-up required', 'No watermark added', 'Mobile friendly', 'Drag & drop upload', 'No file uploaded to a server'],
    useCasePool: [
      ['Cross-platform compatibility', 'Getting a file into a format the next app or person can actually open.'],
      ['Meeting a size or format requirement', 'A form, upload portal or platform that only accepts one specific format.'],
      ['Archiving in a durable format', 'Converting something fragile or proprietary into a format that will still open in ten years.'],
      ['Cleaning up before sharing', 'One less "can you resend that as a ___" reply to deal with.']
    ],
    comparisonIntro: 'The trade-off between the two formats {name} sits between.',
    ctaVerb: 'Convert another file'
  }
};

/* ────────────────────────────────────────────────────────────────
   WORKFLOW_NEXT — cross-CATEGORY related-tool recommendations,
   keyed by slug. Where a tool has an entry here, it overrides the
   old "same category only" related-tools logic with what someone
   doing this task would realistically reach for next, even if that
   tool lives in a different category page. Not exhaustive by design
   (that would mean hand-curating 66 workflows) \u2014 tools without
   an entry fall back to the existing same-category logic, which is
   itself still a reasonable default.
──────────────────────────────────────────────────────────────── */
const WORKFLOW_NEXT = {
  'background-remover': ['ai-image-upscaler', 'image-compressor', 'image-resizer', 'watermark-image'],
  'ai-image-upscaler': ['ai-photo-enhancer', 'image-compressor', 'image-resizer', 'background-remover'],
  'ai-photo-enhancer': ['ai-object-remover', 'ai-image-upscaler', 'image-compressor', 'background-remover'],
  'ai-object-remover': ['ai-photo-enhancer', 'background-remover', 'ai-image-upscaler', 'watermark-image'],
  'image-compressor': ['background-remover', 'image-resizer', 'png-to-webp', 'social-image-resizer'],
  'ocr-image-to-text': ['pdf-to-text', 'text-diff', 'word-counter', 'markdown-to-html'],
  'pdf-merger': ['pdf-compressor', 'pdf-splitter', 'pdf-page-rotator', 'pdf-organizer'],
  'json-formatter': ['base64-encoder', 'regex-tester', 'url-encoder', 'timestamp-converter'],
  'og-image-gen': ['social-image-resizer', 'qr-code-generator', 'color-palette-gen', 'utm-builder'],
  'word-to-pdf': ['pdf-compressor', 'pdf-merger', 'html-to-pdf', 'txt-to-pdf']
};

/* ────────────────────────────────────────────────────────────────
   TOOL_META — the 7 hand-verified flagship tools. Every mechanic
   named below was confirmed directly in image-tools.js / pdf-tools.js
   / developer-tools.js / marketing-tools.js before being written.
──────────────────────────────────────────────────────────────── */
const TOOL_META = {

  'background-remover': {
    hero: 'compare', heroVariant: 'checkerboard', variant: 'C', accent: '#22d3ee',
    benefits: [
      ['zap', 'Real AI, not a color-key trick', 'Runs a real segmentation model (@imgly/background-removal) directly in your browser \u2014 it understands hair and edges, it does not just key out one flat color.'],
      ['monitor', 'The model runs on your device', 'The AI model downloads once and then runs locally \u2014 your photo is never uploaded anywhere to be processed.'],
      ['layers', 'Transparent PNG, not a white box', 'Output is a real transparent PNG you can drop onto any background \u2014 not a checkered thumbnail you still have to fix.'],
      ['gem', 'No manual masking', 'No lasso tool, no brush-and-erase \u2014 the model finds the subject for you.']
    ],
    features: ['Real AI segmentation model', 'Transparent PNG output', 'Runs after first load, even offline', 'No sign-up required', 'No watermark added', 'Works on portraits and objects'],
    useCases: [
      ['Amazon & e-commerce listings', 'Clean, consistent product shots on a pure white or transparent background.'],
      ['LinkedIn & profile photos', 'Swap a busy backdrop for something simpler without a photo editor.'],
      ['Marketing creatives', 'Cut a subject out to composite into an ad, banner or social post.'],
      ['Presentation graphics', 'Product or headshot cutouts that drop cleanly into a slide.']
    ],
    tips: [
      'Good, even lighting on the subject gives the model the cleanest edge \u2014 harsh shadows are the most common cause of a rough cutout.',
      'If the result is imperfect around fine hair, a second pass at a slightly higher source resolution often helps.',
      'Save the transparent PNG rather than flattening it early \u2014 you can always add a new background later without redoing the cutout.'
    ],
    mistakes: [
      'Using a low-resolution or heavily compressed source photo \u2014 the model can only find edges that are actually visible in the pixels.',
      'Expecting a perfect result on very fine, wind-blown hair or semi-transparent fabric \u2014 genuinely hard cases for any segmentation model, not just this one.',
      'Flattening onto a background immediately, then needing a different one later.'
    ],
    ctaVerb: 'Remove another background'
  },

  'image-compressor': {
    hero: 'compare', heroVariant: 'meter', variant: 'A', accent: '#22d3ee',
    benefits: [
      ['zap', 'You control the trade-off', 'A real 10\u2013100% quality slider \u2014 not a fixed "high/medium/low" preset guessing what you need.'],
      ['gem', 'JPG or WebP output', 'Choose the smaller JPG for maximum compatibility, or WebP for the best size-to-quality ratio in modern browsers.'],
      ['monitor', 'Processed on your device', 'Compression runs locally in your browser \u2014 your images are never uploaded to a server.'],
      ['layers', 'See the size drop in real numbers', 'The result shows the actual before/after file size, not a vague "optimized" label.']
    ],
    features: ['10\u2013100% quality slider', 'JPG or WebP output', 'Multiple images per session', 'No sign-up required', 'No watermark added', 'Works on JPG, PNG and WebP input'],
    useCases: [
      ['Website performance', 'Shrinking hero images and galleries so a page actually hits good Core Web Vitals scores.'],
      ['Email attachments', 'Getting a photo under an inbox\u2019s attachment size limit without visibly losing quality.'],
      ['Faster page loads on mobile data', 'Meaningfully smaller downloads for visitors on a slow or metered connection.'],
      ['Bulk prep before upload', 'Getting a batch of photos ready for a CMS or platform with its own size limits.']
    ],
    howTo: [
      ['Drop in one or more images', 'JPG, PNG or WebP \u2014 drag them in or click to browse. Nothing is uploaded.'],
      ['Set the quality slider', 'Start around 75% and watch the live preview \u2014 you will usually find you can go lower than expected before it looks different.'],
      ['Pick JPG or WebP as the output', 'WebP gives the smaller file for the same visual quality in any modern browser; JPG is the safer choice for maximum compatibility.'],
      ['Compress and compare the sizes', 'The before/after file size is shown directly \u2014 adjust the slider again if you want to push it further.'],
      ['Download the result', 'The compressed file is ready instantly \u2014 it never left your device during processing.']
    ],
    ctaVerb: 'Compress another image'
  },

  'ocr-image-to-text': {
    hero: 'scan', variant: 'C', accent: '#22d3ee',
    benefits: [
      ['zap', '8 languages, one tool', 'English, Hindi, French, German, Spanish, Japanese, Simplified Chinese and Arabic \u2014 pick the language before you scan.'],
      ['monitor', 'The OCR engine runs on your device', 'Powered by Tesseract.js, downloaded once and run locally \u2014 your photo or scan is never uploaded to a server.'],
      ['gem', 'Live progress, not a spinner', 'Watch the actual recognition percentage tick up while it reads your image.'],
      ['layers', 'Copy the text instantly', 'Extracted text lands in an editable box \u2014 select and copy, no extra export step.']
    ],
    features: ['8 supported languages', 'Live recognition progress', 'Works on photos and scans', 'No sign-up required', 'No watermark added', 'Runs after first load, even offline'],
    useCases: [
      ['Invoices & receipts', 'Pulling line-item text out of a photographed receipt instead of retyping it.'],
      ['Business cards', 'Getting a name, number or email out of a photo without manual entry.'],
      ['Scanned books & documents', 'Making an old scanned page searchable or editable again.'],
      ['Screenshots', 'Extracting text from a screenshot when the original file is not available.']
    ],
    tips: [
      'Straight, well-lit, in-focus photos read far better than an angled or blurry one \u2014 recognition quality depends entirely on what the model can actually see.',
      'Select the correct language before scanning \u2014 running English OCR on Hindi text will produce garbled output no matter how clean the photo is.',
      'For a printed page, a flat scan will always out-perform a handheld photo at an angle.'
    ],
    mistakes: [
      'Scanning at an angle or in low light and expecting clean output \u2014 OCR accuracy tracks image quality closely.',
      'Leaving the language on the default when the source text is in a different one.',
      'Trying to OCR handwriting \u2014 Tesseract-based OCR is built for printed text, not handwritten notes.'
    ],
    ctaVerb: 'Extract more text'
  },

  'pdf-merger': {
    hero: 'workflow', heroVariant: 'stack', variant: 'D', accent: '#a78bfa',
    benefits: [
      ['zap', 'Merge as many as you need', 'No arbitrary two-file limit \u2014 add every PDF you need combined into one.'],
      ['layers', 'Reorder before you merge', 'Move any file up or down with one click until the order is right \u2014 no need to re-drop files to fix a mistake.'],
      ['monitor', 'Processed on your device', 'Merging happens locally in your browser using pdf-lib \u2014 your files are never uploaded to a server.'],
      ['gem', 'One clean output file', 'The merged PDF keeps every page from every source file, in the order you set.']
    ],
    features: ['Unlimited files per merge', 'One-click reorder (move up/down)', 'Remove a file before merging', 'No sign-up required', 'Works in any modern browser', 'No file uploaded to a server'],
    useCases: [
      ['Tax and financial documents', 'Combining several statements or receipts into one file for an accountant.'],
      ['Client proposals', 'Merging a cover letter, the proposal itself, and an appendix into one document.'],
      ['Contracts with attachments', 'Keeping a signed contract and its exhibits together as a single file.'],
      ['Multi-part reports', 'Combining separately-authored sections into one final report.']
    ],
    howTo: [
      ['Drop in two or more PDF files', 'Add every file you want combined \u2014 nothing is uploaded to a server.'],
      ['Check the order', 'Files list in the order you added them, each showing its position.'],
      ['Reorder if needed', 'Use the up/down arrows on any file to move it \u2014 no need to start over.'],
      ['Merge and download', 'The combined PDF downloads instantly, with every page in the order you set.']
    ],
    ctaVerb: 'Merge another set of PDFs'
  },

  'json-formatter': {
    hero: 'code', variant: 'C', accent: '#34d399',
    benefits: [
      ['zap', 'Format, minify or validate', 'One tool for all three \u2014 not a separate page for each.'],
      ['monitor', 'Processed on your device', 'Your JSON is validated and formatted locally in the browser \u2014 never sent to a server.'],
      ['layers', 'Errors point to the real problem', 'Validation catches malformed JSON before you waste time debugging the wrong thing.'],
      ['gem', 'No account, no size limit', 'Paste JSON of any size, as many times as you need, with no sign-up.']
    ],
    features: ['Format (beautify) with 2-space indent', 'Minify for production use', 'Live validation as you type', 'No sign-up required', 'Works offline after first load', 'No usage limit'],
    useCases: [
      ['API response debugging', 'Turning a one-line API response into something you can actually read and reason about.'],
      ['Config file cleanup', 'Reformatting a config file someone else minified, so you can safely edit it.'],
      ['Webhook payload inspection', 'Reading through incoming JSON from a third-party integration during debugging.'],
      ['Trimming before production', 'Minifying a finished config or data file to shave bytes before deployment.']
    ],
    tips: [
      'Format first, read the structure, then decide what to change \u2014 it is much easier to spot a misplaced bracket in indented JSON.',
      'Keep the minified version for production and the formatted version for your own editing \u2014 the tool switches between them instantly, so there is no reason to keep only one.',
      'If validation fails, check the very start of the file first \u2014 a stray character there is the single most common cause.'
    ],
    mistakes: [
      'Trailing commas after the last item in an object or array \u2014 valid in JavaScript object literals, invalid in JSON.',
      'Smart/curly quotes from a word processor instead of straight quotes \u2014 an easy way to accidentally break otherwise-correct JSON.',
      'Forgetting to re-minify after a manual edit to an already-minified file, leaving inconsistent formatting in production.'
    ],
    ctaVerb: 'Format more JSON'
  },

  'og-image-gen': {
    hero: 'live', heroVariant: 'social-card', variant: 'B', accent: '#fb923c',
    benefits: [
      ['zap', 'Live canvas preview', 'Every change \u2014 title, colors, logo text \u2014 redraws the preview instantly, at the real 1200\\u00d7630 OG size.'],
      ['gem', 'Full brand control', 'Set your own background, accent and text colors, plus a logo wordmark \u2014 not a fixed template with one swappable headline.'],
      ['monitor', 'Built on your device', 'The image is drawn locally on an HTML canvas \u2014 nothing about your title or branding is sent to a server.'],
      ['layers', 'Correct dimensions, every time', 'Ships at exactly 1200\\u00d7630 \u2014 the size link previews actually expect, so it never displays cropped oddly.']
    ],
    features: ['Live 1200\\u00d7630 canvas preview', 'Custom background, accent & text color', 'Optional logo wordmark', 'Automatic title word-wrap', 'No sign-up required', 'PNG download'],
    useCases: [
      ['Blog post link previews', 'A consistent-looking card whenever a post gets shared on social media or Slack.'],
      ['Landing page shares', 'A branded preview image instead of whatever a platform picks by default.'],
      ['Client site deliverables', 'A quick OG image for a client site that does not have design software on hand.'],
      ['A/B testing headlines', 'Generating a few variants quickly to see which preview gets more clicks.']
    ],
    comparisonIntro: 'A page with no Open Graph image gets a blank or randomly-cropped preview when shared \u2014 one with a proper 1200\\u00d7630 card looks intentional wherever it is linked.',
    ctaVerb: 'Create another OG image'
  },

  'word-to-pdf': {
    hero: 'convert', variant: 'B', accent: '#a3e635',
    benefits: [
      ['zap', 'Instant conversion', 'Converts the moment you drop a .docx file \u2014 no email-when-ready wait.'],
      ['gem', 'Formatting mostly survives', 'Headings, bold, italic, lists and tables carry through \u2014 built on mammoth.js, not a screenshot of the page.'],
      ['monitor', 'Processed on your device', 'Your document is converted locally in the browser and never uploaded to a server.'],
      ['shield', 'No account, ever', 'Open the tool and convert immediately \u2014 no sign-up required.']
    ],
    features: ['Preserves headings, lists & tables', 'No file uploaded to a server', 'No sign-up required', 'Works in any modern browser', 'No watermark added', '.docx input only'],
    useCases: [
      ['Job applications', 'Sending a resume as a PDF so formatting cannot shift on someone else\u2019s machine.'],
      ['Client deliverables', 'Handing off a document in a format the client cannot accidentally edit.'],
      ['Archiving', 'Converting an old Word file into a more durable, widely-readable format.'],
      ['Submission portals', 'Meeting a "PDF only" requirement on a form or application.']
    ],
    comparisonIntro: 'A .docx file can shift its layout depending on the fonts installed on whoever opens it; a PDF looks identical everywhere it is opened.',
    ctaVerb: 'Convert another document'
  }
};

if (typeof module !== 'undefined') module.exports = { CAT_DEFAULTS, WORKFLOW_NEXT, TOOL_META, slugHash, seededPick };
