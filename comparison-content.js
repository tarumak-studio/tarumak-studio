/* comparison-content.js — data for the comparison-page system.
   Adding a new competitor page requires ONE new entry in COMPARISONS
   below, following the exact shape of the ones already here. No new
   code, no new templates, no CSS changes — build-comparison-pages.js
   reads this file and does the rest.

   Every factual claim about a competitor was checked on that company's own
   public pages on 24 November 2026. Claims that could not be confirmed there
   were left out. Nothing here is a benchmark; recheck before editing. */

const SITE_NAME = 'Tarumak Studio';
const LAST_UPDATED = 'November 2026';

/* Tarumak Studio's own side of every comparison table — kept in ONE
   place so every comparison page states the same facts about us,
   rather than each config re-typing (and risking drifting on) claims
   about our own product. */
const TARUMAK_PROFILE = {
  name: 'Tarumak Studio',
  tagline: 'Free, browser-based, privacy-first',
  processing: 'On your device (Canvas API + WebGL where available)',
  signup: 'Not required',
  watermark: 'Never',
  pricing: 'Free',
  uploadRequired: 'No \u2014 files never leave your device',
  api: 'Not currently offered',
  offlineCapable: 'Depends on the tool',
  batchProcessing: 'Depends on the tool',
};

const COMPARISONS = [
  {
    slug: 'tarumak-vs-removebg',
    category: 'Background Removal',
    competitor: 'Remove.bg',
    competitorUrl: 'https://www.remove.bg',
    tarumakTool: 'background-remover',
    metaTitle: 'Remove.bg Closes 1 December 2026: What Now?',
    metaDescription: 'Remove.bg’s website closes on 1 December 2026. What happens to credits, subscriptions and the API, and how Tarumak Studio and Canva compare as replacements.',
    heroQuestion: 'Remove.bg is closing its website. What happens to your account, and what can you use instead?',
    summary: 'Remove.bg states that its standalone website will no longer be available from 1 December 2026, 9:00 am CET. Background removal moves to Canva and API access to Leonardo.ai, both part of the same group. Tarumak Studio’s Background Remover is one alternative for single pictures: free, without an account, and processed in your browser. It does not replace the API or bulk processing. Statements about Remove.bg come from its own FAQ, read on 24 November 2026.',
    chooseUsIf: [
      'You cut out one picture at a time',
      'You do not want to upload the picture or create an account',
      'You can accept a large one-time download for AI mode, about 100 MB',
      'You need full-size results without paying',
    ],
    chooseThemIf: [
      'You have an enterprise API contract, which continues as normal',
      'You want the same technology: it is now part of Canva, and of Leonardo.ai for developers',
      'You process pictures in bulk or automatically',
    ],
    featureTable: [
      ['Available after 1 December 2026', true, 'Website and self-service API: no. Canva and Leonardo.ai: yes'],
      ['Runs in your browser (no upload)', true, false],
      ['Account required', 'Never', 'Canva may ask you to log in'],
      ['Free, full-size output', true, 'Canva: limited number of free high-resolution downloads'],
      ['Bulk processing', false, 'Through Canva or the Leonardo.ai API'],
      ['Developer API', false, 'Leonardo.ai; enterprise contracts continue'],
      ['Manual touch-up brush', false, 'Erase and Restore in Canva'],
      ['Download before first use', 'AI mode about 100 MB; Solid mode none', 'None'],
    ],
    detailedSections: [
      ['What to do before 1 December', 'Use up pay-as-you-go credits: Remove.bg says unused ones expire on that date. Export your credit usage report and invoices from your account page, because accounts will not be accessible afterwards. Download any results you still need.'],
      ['Subscriptions', 'According to Remove.bg, subscriptions end automatically and are not charged again. Annual plans with unused time are refunded proportionally to the original payment method, without any action on your part. A final monthly renewal on or after 1 November is free.'],
      ['API, plugins and desktop app', 'The self-service API stops accepting requests; Remove.bg offers a migration guide to Leonardo.ai. The Photoshop plugin and other integrations end too. For bulk work on the desktop it points to Canva. Enterprise API contracts are not affected.'],
      ['Quality', 'We have not run a controlled comparison and make no claim to be better. Remove.bg says Canva uses the same technology. Test your own difficult pictures, with hair, glass or motion blur, before you choose a replacement.'],
      ['Privacy', 'Remove.bg and Canva process uploaded pictures on servers. Our tool works on your device; only the AI model is downloaded. That matters for private photos, less for public product pictures.'],
    ],
    useCases: [
      ['A profile picture now and then', 'Tarumak Studio, or a free Canva download if you already have an account.'],
      ['A shop with hundreds of products', 'Canva’s bulk removal or the Leonardo.ai API. Our tool handles one picture at a time.'],
      ['Developers', 'Leonardo.ai or another API. We do not offer one.'],
      ['Photoshop users', 'Remove.bg suggests Affinity, where the function needs Canva Pro. Photoshop has its own background removal as well.'],
      ['Photos that must not be uploaded', 'Tarumak Studio, as the picture stays in the browser.'],
    ],
    advantagesUs: [
      'No upload, no account, no credits',
      'Full-size PNG without payment',
      'Instant Solid mode for logos and plain backgrounds',
    ],
    advantagesThem: [
      'The technology lives on in Canva and Leonardo.ai',
      'Bulk processing and an API',
      'No model download and little load on your device',
    ],
    limitationsUs: [
      'One picture at a time, no API, no touch-up brush',
      'AI mode downloads about 100 MB once and needs a reasonably fast device',
      'Single hairs, glass and motion blur remain difficult',
    ],
    limitationsThem: [
      'The website and self-service API close on 1 December 2026',
      'Unused pay-as-you-go credits expire',
      'Pictures are processed on servers',
    ],
    faq: [
      ['When does Remove.bg close?', 'Its website states 1 December 2026 at 9:00 am CET for the standalone website and the self-service API.'],
      ['What happens to my credits?', 'Remove.bg says unused pay-as-you-go credits expire on 1 December 2026 and recommends using them before.'],
      ['Will I get money back for an annual plan?', 'Remove.bg states that unused time is refunded proportionally and automatically to the original payment method.'],
      ['Is Tarumak Studio a replacement?', 'For single pictures, yes. For bulk processing and the API, no; look at Canva or Leonardo.ai.'],
    ],
    verdict: 'Use your credits and save your invoices before 1 December. If you liked Remove.bg for its results and its bulk functions, Canva is the official successor and Leonardo.ai the one for developers. If you mainly need a quick cut-out without an account or upload, try our Background Remover with one of your own pictures first.',
  },

  {
    slug: 'tarumak-vs-tinypng',
    category: 'Image Compression',
    competitor: 'TinyPNG',
    competitorUrl: 'https://tinypng.com',
    tarumakTool: 'image-compressor',
    metaTitle: 'Tarumak Studio vs TinyPNG: Limits and Formats',
    metaDescription: 'TinyPNG or Tarumak Studio? Free limits, formats, privacy, API and plugins compared with TinyPNG’s own pages, as read in November 2026.',
    heroQuestion: 'Do you need the best PNG compression and automation, or unlimited compression without uploading?',
    summary: 'TinyPNG, by Tinify, is an established service with smart compression for many formats, an API, a CDN and a WordPress plugin. Its free web tool takes up to 20 images of 5 MB per session. Tarumak Studio’s Image Compressor works in your browser, without a limit on files or size other than your device, and saves JPG or WebP. Statements about TinyPNG come from its own pages, read on 24 November 2026.',
    chooseUsIf: [
      'Your files are larger than 5 MB or you have more than 20',
      'You do not want to upload the pictures',
      'JPG or WebP output is fine for you',
    ],
    chooseThemIf: [
      'You want a smaller PNG that stays a PNG',
      'You work with AVIF, JPEG XL, SVG or animated PNG',
      'You want compression inside WordPress or an automated process',
    ],
    featureTable: [
      ['Runs in your browser (no upload)', true, false],
      ['Free images per session', 'No set limit', '20'],
      ['Free file size', 'No set limit', '5 MB per image'],
      ['Input formats', 'JPG, PNG, WebP', 'AVIF, JPEG XL, WebP, PNG, JPEG, HEIC, SVG'],
      ['Output', 'JPG or WebP', 'Keeps the format; HEIC becomes JPG; conversion limited on free'],
      ['Quality control', 'Slider, 10 to 100%', 'Automatic'],
      ['Several images at once', true, true],
      ['Account required', 'Never', 'Not for the web tool'],
      ['API, WordPress plugin, CDN', false, true],
      ['How long images are kept', 'Not received', 'At most 48 hours, according to TinyPNG'],
      ['Paid plan', 'None', 'Web Pro from $3.25 a month, billed annually (November 2026)'],
    ],
    detailedSections: [
      ['Compression', 'TinyPNG chooses the settings for you and is known for reducing the colours of PNG files cleverly. Our tool lets you set the quality and shows sizes before and after. A PNG becomes a JPG, or WebP if it is transparent. We have not run a benchmark against TinyPNG; compare with your own pictures.'],
      ['Limits', 'TinyPNG Free allows 20 images per session with up to 5 MB each, and three conversions. Web Pro removes the count and allows 75 MB, Web Ultra 150 MB. With us the memory of your device is the limit.'],
      ['Privacy', 'TinyPNG says that only you can access uploaded images and that they are deleted after 48 hours at the latest. With us they are not uploaded. Compressed copies from our tool no longer contain location or camera data.'],
      ['Automation', 'For websites with many pictures, TinyPNG’s API, plugin and CDN save work every day. We have nothing comparable.'],
      ['Other formats with us', 'AVIF and HEIC are handled by our separate Universal Image Converter, and fixed sizes by Compress Image to Exact KB.'],
    ],
    useCases: [
      ['A few photos for a blog post', 'Either. Resize them first; that saves most.'],
      ['Screenshots and logos as PNG', 'TinyPNG, since it keeps PNG. Lossless WebP from our PNG to WebP tool is an option in Chrome and Edge.'],
      ['Camera photos of 8 MB', 'Tarumak Studio, or a paid TinyPNG plan.'],
      ['A WordPress site with daily uploads', 'TinyPNG’s plugin.'],
      ['Confidential pictures', 'Tarumak Studio, because nothing is uploaded.'],
    ],
    advantagesUs: [
      'No upload, account, session or size limit',
      'Adjustable quality with sizes shown',
    ],
    advantagesThem: [
      'Keeps PNG and supports many modern formats',
      'API, WordPress plugin and CDN',
      'Automatic settings with a long track record',
    ],
    limitationsUs: [
      'Saves only JPG and WebP',
      'No API or plugin; slow devices take longer',
    ],
    limitationsThem: [
      '20 images and 5 MB each on the free web tool',
      'Pictures are processed on servers and kept for up to 48 hours',
    ],
    faq: [
      ['What is the TinyPNG free limit?', 'Its website states up to 20 images of at most 5 MB each per session.'],
      ['Does Tarumak Studio keep PNG as PNG?', 'Not in the Image Compressor. It saves JPG, or WebP for pictures with transparency.'],
      ['How long does TinyPNG keep images?', 'According to its website, at most 48 hours.'],
      ['Which one makes smaller files?', 'It depends on the picture and the settings. We have not measured both under equal conditions.'],
    ],
    verdict: 'For PNG graphics, unusual formats and automation, TinyPNG is the better choice. For photos, large files and anything you would rather not upload, our Image Compressor does the job without limits. Using both is perfectly sensible.',
  },

  {
    slug: 'tarumak-vs-canva-bg-remover',
    category: 'Background Removal',
    competitor: 'Canva Background Remover',
    competitorUrl: 'https://www.canva.com/features/background-remover/',
    tarumakTool: 'background-remover',
    metaTitle: 'Tarumak Studio vs Canva Background Remover',
    metaDescription: 'Canva’s background remover offers limited free downloads. Compare it with Tarumak Studio’s browser-based tool on cost, privacy, editing and bulk work.',
    heroQuestion: 'A full design suite, or just one cut-out without an account?',
    summary: 'Canva’s remover is part of its design platform, with Erase and Restore for corrections, bulk removal and templates. Canva’s feature page says you can try it with a limited number of free high-resolution downloads; paid plans make them unlimited. Tarumak Studio’s Background Remover does one job in your browser, without account, limit or upload. Statements about Canva come from its own feature and help pages, read on 24 November 2026.',
    chooseUsIf: [
      'You only need the cut-out',
      'You do not want an account or an upload',
      'You need full-size results without counting downloads',
    ],
    chooseThemIf: [
      'You want to keep designing in the same place',
      'You need to correct edges by hand',
      'You process many pictures at once',
    ],
    featureTable: [
      ['Free use', 'Unlimited', 'Limited number of free high-resolution downloads'],
      ['Runs in your browser (no upload)', true, false],
      ['Account required', 'Never', 'Log in or create one if prompted'],
      ['Erase and Restore brush', false, true],
      ['Bulk removal', false, true],
      ['Design tools and templates', false, true],
      ['Transparent PNG', true, true],
      ['Instant mode for plain backgrounds', true, 'One automatic mode'],
      ['Download before first use', 'AI mode about 100 MB; Solid mode none', 'None'],
    ],
    detailedSections: [
      ['Cost', 'Canva’s feature page offers limited free high-resolution downloads and unlimited ones with a paid plan. Some Canva help pages describe the function as included in paid plans only, so check what your account shows. Our tool is free.'],
      ['Quality and corrections', 'Both work automatically. Canva adds a brush to erase or restore parts, which is a clear advantage for hair and jewellery. We have not run a controlled comparison.'],
      ['Picture size', 'Canva’s help mentions a limit of 9 MB and reduces pictures above 10 megapixels. Our tool saves at the size of the original; very large pictures depend on the memory of your device.'],
      ['Privacy', 'Canva processes uploads on its servers under its terms and privacy policy. With us the picture stays on your device, and only the AI model is downloaded.'],
      ['Remove.bg users', 'Remove.bg closes its website on 1 December 2026 and names Canva as its successor, with the same technology.'],
    ],
    useCases: [
      ['One product photo', 'Either. Ours needs no account.'],
      ['Social media graphics', 'Canva, since the design follows at once. Or cut out here and upload the PNG to Canva.'],
      ['Fifty catalogue pictures', 'Canva’s bulk function.'],
      ['A logo on white', 'Our Solid mode is instant.'],
      ['Private photos', 'Tarumak Studio, as nothing is uploaded.'],
    ],
    advantagesUs: [
      'Free without limits or account',
      'The picture stays on your device',
      'Full-size PNG',
    ],
    advantagesThem: [
      'Erase and Restore brush',
      'Bulk removal and a complete design workflow',
      'No model download',
    ],
    limitationsUs: [
      'No manual corrections and one picture at a time',
      'AI mode downloads about 100 MB once',
    ],
    limitationsThem: [
      'Free downloads are limited',
      'Pictures are uploaded, and an account may be needed',
    ],
    faq: [
      ['Is Canva’s background remover free?', 'Its feature page says you can try it with a limited number of free high-resolution downloads and that paid plans are unlimited.'],
      ['Can I use the result in Canva?', 'Yes. Download the transparent PNG and upload it to your Canva design.'],
      ['Is Tarumak Studio’s remover really free?', 'Yes, without a trial, account or watermark.'],
      ['Why is the first use slow?', 'AI mode downloads its model once, about 100 MB in total. Solid mode starts at once.'],
    ],
    verdict: 'If you design in Canva, use Canva: the brush and the bulk function are worth it. If you need a cut-out now and then and prefer not to upload or sign in, our tool is enough. With mobile data, use Solid mode or wait for Wi-Fi.',
  },
];

module.exports = { SITE_NAME, LAST_UPDATED, TARUMAK_PROFILE, COMPARISONS };
