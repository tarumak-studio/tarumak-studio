/* comparison-content.js — data for the comparison-page system.
   Adding a new competitor page requires ONE new entry in COMPARISONS
   below, following the exact shape of the ones already here. No new
   code, no new templates, no CSS changes — build-comparison-pages.js
   reads this file and does the rest.

   Every factual claim about a competitor below was checked against
   multiple independent, current (2026) sources before being written —
   pricing specifics are deliberately kept approximate ("around $X/month")
   since they change and vary slightly by source/region; the structural
   facts (free tier exists or doesn't, signup required or not, upload
   required or not) are the well-corroborated, stable claims this content
   actually leans on. Nothing here is a benchmark, a speed test, or a
   fabricated statistic — where a claim couldn't be verified, it's
   phrased as a general reputation ("widely considered..."), not a
   specific, checkable number Tarumak Studio didn't measure itself. */

const SITE_NAME = 'Tarumak Studio';
const LAST_UPDATED = 'July 2026';

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
  offlineCapable: 'Yes, once the page is loaded',
  batchProcessing: 'One image at a time per tool, currently',
};

const COMPARISONS = [
  {
    slug: 'tarumak-vs-removebg',
    competitor: 'Remove.bg',
    competitorUrl: 'https://www.remove.bg',
    tarumakTool: 'background-remover', /* which Tarumak tool this maps to, for internal linking + How It Works reuse */
    metaTitle: `${SITE_NAME} vs Remove.bg \u2014 Which Background Remover Is Right for You?`,
    metaDescription: `An honest, side-by-side comparison of Tarumak Studio and Remove.bg: privacy, pricing, resolution limits, and which one actually fits your workflow.`,
    heroQuestion: 'Which background remover is better for privacy, everyday editing, and not hitting a paywall mid-task?',
    summary: `Remove.bg popularized AI background removal and is still a strong, accurate choice \u2014 especially with its API for developers. Its free tier caps out at low-resolution, watermark-free output, with full resolution behind a paid plan. Tarumak Studio's Background Remover runs entirely in your browser: no upload, no account, no resolution cap, and no cost \u2014 the tradeoff is that Remove.bg's cloud model and years of production tuning give it an edge on very difficult edge cases (flyaway hair, motion blur, glass and transparency).`,
    chooseUsIf: [
      'You want the image to never leave your device',
      'You don\u2019t want to create an account or manage credits',
      'You need full-resolution output without paying',
      'You\u2019re doing everyday edits \u2014 product shots, headshots, social graphics',
    ],
    chooseThemIf: [
      'You need a developer API with SLA-backed uptime',
      'You\u2019re processing very high volumes and want dedicated infrastructure',
      'Your images have genuinely difficult edges (fine hair, glass, motion blur) where mature, large-scale cloud models still tend to have an edge',
    ],
    featureTable: [
      ['Background removal', true, true],
      ['Runs in your browser (no upload)', true, false],
      ['Free, full-resolution output', true, 'Free tier is capped to preview resolution'],
      ['Account/signup required', 'Never', 'Not for basic use; required for API and paid plans'],
      ['Watermark on free output', 'Never', 'No watermark, but free tier is low-resolution'],
      ['Developer API', false, true],
      ['Batch processing', false, 'Available on paid plans'],
      ['Works offline once loaded', true, false],
      ['Mobile browser support', true, true],
    ],
    detailedSections: [
      ['Image Quality', `Both tools handle typical subjects \u2014 people, products, simple backgrounds \u2014 well. Remove.bg's model has years of production refinement across a huge, varied image set and is widely considered strong on genuinely hard cases like wispy hair or semi-transparent objects. Tarumak Studio's browser-based model handles the same everyday cases capably; for the hardest edge cases, a cloud-scale model with more compute headroom can have a real advantage.`],
      ['Privacy', `This is where the two tools differ most. Remove.bg processes your image on its servers \u2014 standard for a cloud AI product, and their published privacy documentation describes how that data is handled. Tarumak Studio's processing happens entirely in your browser; the image is never transmitted anywhere, which is a structurally different privacy guarantee, not just a policy promise.`],
      ['Pricing', `Tarumak Studio is free with no paid tier. Remove.bg's free tier exists but is limited to lower-resolution preview output; full-resolution exports and higher volume require a paid plan (credit-based, roughly in line with other cloud AI image APIs). If you only need occasional full-resolution cutouts, that's the practical cost difference to weigh.`],
      ['Ease of Use', `Both are drag-and-drop simple with no learning curve. Remove.bg's interface is slightly more polished around bulk/API workflows; Tarumak Studio's is built around single-image, in-the-moment editing.`],
      ['API & Automation', `Remove.bg has a mature, well-documented API used by many production integrations. Tarumak Studio does not currently offer an API \u2014 it's built as a direct-use browser tool, not an integration layer.`],
    ],
    useCases: [
      ['E-commerce & product photography', 'Either works well for standard product shots. Remove.bg\u2019s API is the better fit if you need to process a catalog programmatically; Tarumak Studio suits doing it yourself, image by image, without a subscription.'],
      ['Social media & marketing', 'Tarumak Studio\u2019s no-signup, no-cost model fits well for quick, frequent graphics.'],
      ['Developers building a product', 'Remove.bg\u2019s API is the practical choice \u2014 Tarumak Studio doesn\u2019t offer one currently.'],
      ['Freelancers & small studios', 'Tarumak Studio removes the recurring cost for occasional client work; Remove.bg\u2019s paid tier makes more sense at higher volume.'],
      ['Privacy-sensitive work (legal, medical, HR photos)', 'Tarumak Studio\u2019s no-upload model is the more defensible choice when images can\u2019t leave the device.'],
    ],
    advantagesUs: [
      'No upload \u2014 the image never leaves your device',
      'No account, no credits, no watermark, no cost',
      'Full resolution on every export',
    ],
    advantagesThem: [
      'Mature, well-documented developer API',
      'Large-scale cloud infrastructure for high-volume/batch use',
      'Widely regarded as strong on genuinely difficult edge cases',
    ],
    limitationsUs: [
      'No API or batch processing currently',
      'Relies on the device\u2019s own processing power \u2014 very large images take longer than a dedicated server would',
    ],
    limitationsThem: [
      'Free tier is resolution-capped, not full-quality',
      'Recurring cost for full-resolution or high-volume use',
      'Images are processed on their servers, not yours',
    ],
    faq: [
      ['Is Tarumak Studio\u2019s Background Remover really free?', 'Yes \u2014 there is no paid tier, no credit system, and no watermark. Every export is full resolution.'],
      ['Does Remove.bg require an account?', 'Not for casual use of the web tool, but the API and paid plans do require signing up.'],
      ['Which one is more private?', 'Tarumak Studio\u2019s processing happens entirely in your browser, so the image is never uploaded anywhere. Remove.bg processes images on its servers, which is standard for a cloud AI tool but a meaningfully different privacy model.'],
      ['Which has better quality on hard images?', 'For everyday subjects, both perform well. For genuinely difficult cases \u2014 fine hair, motion blur, glass \u2014 Remove.bg\u2019s cloud-scale model is widely considered to have an edge.'],
    ],
    verdict: `If privacy, cost, and simplicity matter most to you, Tarumak Studio's Background Remover is the straightforward choice \u2014 it's free, requires nothing to sign up for, and never uploads your image. If you need a production API, very high volume, or you're consistently working with genuinely difficult edge cases, Remove.bg's mature cloud infrastructure is worth the cost. Neither is "better" outright \u2014 they're built for different situations.`,
  },

  {
    slug: 'tarumak-vs-tinypng',
    competitor: 'TinyPNG',
    competitorUrl: 'https://tinypng.com',
    tarumakTool: 'image-compressor',
    metaTitle: `${SITE_NAME} vs TinyPNG \u2014 Which Image Compressor Should You Use?`,
    metaDescription: `Compare Tarumak Studio's browser-based Image Compressor with TinyPNG: privacy, limits, formats, and which is the better fit for your workflow.`,
    heroQuestion: 'Which image compressor fits better \u2014 an unlimited browser tool, or an established cloud service with a developer API?',
    summary: `TinyPNG is a well-established, developer-trusted compressor with a mature API and browser plugin ecosystem. Its free web tool needs no signup but does have per-session limits on file count and size; unlimited use requires a paid plan. Tarumak Studio's Image Compressor runs entirely in your browser with no session limits, no signup, and no cost \u2014 the tradeoff being no server-side batch API for large, automated pipelines.`,
    chooseUsIf: [
      'You compress images occasionally and don\u2019t want session limits',
      'You want the file to stay on your device',
      'You don\u2019t need a developer API or CMS plugin',
    ],
    chooseThemIf: [
      'You need the Tinify developer API for an automated pipeline',
      'You use WordPress, Magento or another CMS with a TinyPNG/Tinify plugin',
      'You\u2019re compressing at a scale where a dedicated server-side service is worth paying for',
    ],
    featureTable: [
      ['Image compression', true, true],
      ['Runs in your browser (no upload)', true, false],
      ['Per-session file limits', false, 'Free web tool caps files per session'],
      ['Account/signup required', 'Never', 'Not for the web tool; required for the API'],
      ['Developer API', false, true],
      ['CMS plugins (WordPress, etc.)', false, true],
      ['Supported formats', 'JPG, PNG, WebP', 'PNG, JPEG, WebP, AVIF, JXL'],
      ['Batch processing', false, 'Limited on free tier, expanded on paid'],
      ['Works offline once loaded', true, false],
    ],
    detailedSections: [
      ['Image Quality', `Both use lossy compression techniques aimed at minimizing visible quality loss. TinyPNG's algorithm is mature and widely trusted by developers; independent write-ups generally describe the practical size/quality difference between browser-based and TinyPNG's server-side compression as small.`],
      ['Privacy', `TinyPNG's web tool and API compress images on Tinify's servers. Tarumak Studio's compressor runs the entire operation in your browser via the Canvas API \u2014 nothing is uploaded.`],
      ['Pricing', `Tarumak Studio has no paid tier. TinyPNG's free web tool has session limits before prompting an upgrade; its paid Pro tier (billed annually) removes those caps and adds unlimited use.`],
      ['Format Support', `Tarumak Studio currently supports the most common web formats (JPG, PNG, WebP). TinyPNG additionally supports AVIF and JPEG XL, which matters if you specifically need those newer formats.`],
      ['Ease of Use', `Both are drag-and-drop simple. TinyPNG's plugin ecosystem (WordPress, Shopify-adjacent tools) is a real advantage if you want compression built into an existing publishing workflow rather than a manual step.`],
    ],
    useCases: [
      ['Bloggers & website owners', 'Tarumak Studio suits a manual, occasional workflow with nothing to sign up for; TinyPNG\u2019s CMS plugins suit automating it once and forgetting about it.'],
      ['Developers automating a pipeline', 'TinyPNG\u2019s API is the practical choice \u2014 Tarumak Studio doesn\u2019t offer a server-side API.'],
      ['Students & casual users', 'Tarumak Studio\u2019s no-limit, no-signup model fits infrequent, one-off use well.'],
      ['Agencies handling client assets', 'Depends on volume \u2014 TinyPNG\u2019s paid tier is built for exactly this; Tarumak Studio works fine below the volume where that subscription pays for itself.'],
    ],
    advantagesUs: [
      'No upload, no signup, no session limits',
      'Nothing to configure \u2014 open the page and drop a file',
    ],
    advantagesThem: [
      'Mature developer API and CMS plugin ecosystem',
      'Supports AVIF and JPEG XL in addition to the common formats',
      'Long production track record trusted by many developers',
    ],
    limitationsUs: [
      'No API, no CMS plugin, no server-side automation',
      'No AVIF/JPEG XL support currently',
    ],
    limitationsThem: [
      'Free web tool has per-session file limits',
      'Full automation requires a paid plan',
    ],
    faq: [
      ['Does Tarumak Studio\u2019s compressor have a file limit?', 'No per-session cap the way TinyPNG\u2019s free tier does \u2014 processing happens locally, so it\u2019s limited only by your device\u2019s own capability, not a service quota.'],
      ['Is TinyPNG\u2019s free tool good enough for occasional use?', 'Yes, for light or occasional use its limits are unlikely to matter; they become relevant with frequent, high-volume compression.'],
      ['Which compresses images smaller?', 'Both use modern lossy compression and are generally comparable in practice; exact results vary by image content, and we haven\u2019t run a controlled benchmark ourselves to make a precise claim either way.'],
    ],
    verdict: `For occasional, manual compression with nothing to sign up for, Tarumak Studio's compressor is the simpler choice. If you need CMS integration, a developer API, or AVIF/JPEG XL support, TinyPNG's paid tier is built for that and is worth the cost at that point.`,
  },

  {
    slug: 'tarumak-vs-canva-bg-remover',
    competitor: 'Canva Background Remover',
    competitorUrl: 'https://www.canva.com',
    tarumakTool: 'background-remover',
    metaTitle: `${SITE_NAME} vs Canva Background Remover \u2014 Free Alternative Compared`,
    metaDescription: `Canva's background remover requires Canva Pro. See how Tarumak Studio's free, browser-based Background Remover compares on privacy, cost and everyday use.`,
    heroQuestion: 'Do you need Canva\u2019s whole design suite, or just a background removed \u2014 free, right now?',
    summary: `Canva's Background Remover is a genuinely convenient one-click tool \u2014 but it's a Canva Pro feature, not available on Canva's free plan (aside from a trial). If background removal is your only need, paying for the full Canva subscription just to unlock it is a real cost to weigh. Tarumak Studio's Background Remover is a free, standalone tool: no design suite, no subscription, just the one job done in your browser.`,
    chooseUsIf: [
      'You just need a background removed \u2014 not a design suite',
      'You don\u2019t want to pay for Canva Pro just for this feature',
      'You want the image to stay on your device',
    ],
    chooseThemIf: [
      'You\u2019re already a Canva Pro subscriber for design work',
      'You want to remove the background and continue designing in the same place immediately',
      'You need Canva\u2019s Erase/Restore brush and template ecosystem in one workflow',
    ],
    featureTable: [
      ['Background removal', true, 'Canva Pro only \u2014 not on the free plan'],
      ['Runs in your browser (no upload)', true, false],
      ['Free to use', true, 'Requires a paid Canva Pro subscription (or trial)'],
      ['Account/signup required', 'Never', 'Yes, plus a Pro subscription for this feature'],
      ['Integrated design suite', false, true],
      ['Manual edge refinement brush', false, true],
      ['Works offline once loaded', true, false],
    ],
    detailedSections: [
      ['Image Quality', `Canva's remover handles typical subjects well and includes a manual Erase/Restore brush for touch-ups \u2014 a genuine convenience Tarumak Studio doesn't have a direct equivalent for yet. Tarumak Studio's automatic result is comparable on straightforward subjects; for pixel-level manual correction, Canva's brush tool has the edge.`],
      ['Pricing', `This is the core difference: Canva's background remover is locked behind a Canva Pro subscription (billed monthly or annually), not available on the free plan except via trial. Tarumak Studio's Background Remover is free with no subscription of any kind.`],
      ['Privacy', `Canva processes images on its servers as part of its cloud design platform. Tarumak Studio processes the image entirely in your browser \u2014 it's never uploaded.`],
      ['Workflow Fit', `If you're already designing inside Canva, removing the background without leaving the canvas is a real convenience. If background removal is the entire task, opening a dedicated free tool avoids paying for software you won't otherwise use.`],
    ],
    useCases: [
      ['Someone who just needs one background removed', 'Tarumak Studio \u2014 free, no subscription required for a single task.'],
      ['Active Canva Pro subscribers already designing in Canva', 'Canva\u2019s built-in remover is more convenient since it\u2019s already part of your workflow.'],
      ['Students & hobbyists on a budget', 'Tarumak Studio avoids paying for a subscription tier just for this one feature.'],
      ['Marketing teams already on Canva Pro for templates', 'Canva\u2019s integrated tool fits naturally into an existing subscription you\u2019re already paying for.'],
    ],
    advantagesUs: [
      'Completely free \u2014 no subscription of any kind required',
      'No account needed at all',
      'Image never leaves your device',
    ],
    advantagesThem: [
      'Manual Erase/Restore brush for fixing edges',
      'Removing the background and continuing to design happen in the same tool',
      'Part of a much broader design and template ecosystem',
    ],
    limitationsUs: [
      'No manual touch-up brush currently \u2014 the result is automatic only',
      'Not a design tool \u2014 you\u2019ll need somewhere else to build the final graphic',
    ],
    limitationsThem: [
      'Background removal itself requires paying for Canva Pro',
      'Not available on Canva\u2019s free plan outside of a trial',
      'Images are processed on Canva\u2019s servers',
    ],
    faq: [
      ['Can I remove a background in Canva for free?', 'Generally no \u2014 the Background Remover is a Canva Pro feature, with the main free-plan exception being a limited trial.'],
      ['Is Tarumak Studio\u2019s Background Remover really free with no catch?', 'Yes \u2014 no subscription, no trial period, no watermark.'],
      ['Can I use Tarumak Studio\u2019s result inside Canva afterward?', 'Yes \u2014 download the transparent PNG and upload it into any Canva design like any other image.'],
    ],
    verdict: `If you only need a background removed and don't otherwise use Canva, paying for Canva Pro just to unlock that one feature is hard to justify \u2014 Tarumak Studio does the same core job for free. If you're already a Canva Pro subscriber designing inside Canva regularly, using the built-in remover without leaving your design is the more convenient choice.`,
  },
];

module.exports = { SITE_NAME, LAST_UPDATED, TARUMAK_PROFILE, COMPARISONS };
