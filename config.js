/* ============================================================
   TARUMAK STUDIO — Site Configuration
   Edit this file before deploying. Everything in one place.
   ============================================================ */
const SITE = {
  name:    'Tarumak Studio',
  tagline: 'Free tools for designers, marketers and developers',
  domain:  'tarumak.studio',
  year:    '2026',
  /* ── Google Analytics 4 ──────────────────────────────────
     1. Go to analytics.google.com → Admin → Create Property
     2. Copy your Measurement ID (starts with G-)
     3. Paste it below, replacing G-XXXXXXXXXX               */
  ga4: 'G-XXXXXXXXXX',
};

/* GA4 bootstrap */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', SITE.ga4);
window._ga = function(event, params){ if(typeof gtag !== 'undefined') gtag('event', event, params || {}); };

/* ── Affiliate links ─────────────────────────────────────────
   Replace # with your real affiliate URLs.
   Sign up at: canva.com/affiliates, namecheap.com/affiliates  */
const AFFS = {
  image:     [{ ico:'🎨', name:'Canva Pro',      desc:'Professional design templates — 30-day free trial.',     cta:'Try Free',    url:'https://canva.com' }],
  pdf:       [{ ico:'📄', name:'Adobe Acrobat',  desc:'Industry-standard PDF editor.',                          cta:'Start Trial', url:'https://adobe.com/acrobat' }],
  marketing: [{ ico:'📧', name:'ConvertKit',     desc:'Email marketing for creators — free up to 1,000 subs.', cta:'Start Free',  url:'https://convertkit.com' }],
  converter: [{ ico:'✨', name:'Envato Elements', desc:'Unlimited design assets from $16.50/month.',             cta:'Browse',      url:'https://elements.envato.com' }],
  all:       [{ ico:'🌐', name:'Namecheap',      desc:'Domains from $0.99/yr. Hosting from $1.98/month.',       cta:'Find Domain', url:'https://namecheap.com' }],
};
