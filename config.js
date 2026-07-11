/* TARUMAK STUDIO — config.js  (edit before deploying) */
const SITE = {
  name: 'Tarumak Studio',
  tagline: 'Free tools for designers, marketers and developers',
  domain: 'tarumakstudio.com',
};
/* ── Google Analytics 4 ─────────────────────────────────────────────
   config.js is the ONE analytics entry point for the whole site.
   Every page loads config.js, but only index.html ever loaded the
   gtag.js library itself — so on 133 other pages, events were pushed
   into a dataLayer that nothing ever read or transmitted. Injecting
   the loader from here gives every page real collection with a single
   deployed file. The existence check matches the actual script src
   (never a bare substring — HTML comments cause false positives). */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
(function(){
  var GA_ID = 'G-ER0G4HSYQV';
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  gtag('js', new Date());
  gtag('config', GA_ID);
})();
window._ga = function(e,p){ if(window.gtag) gtag('event',e,p||{}); };

/* Affiliate links — AFFS declared ONLY in this file */
const AFFS = {
  image:     [{ico:'🎨',name:'Canva Pro',      desc:'Professional design templates — free 30-day trial.',cta:'Try Free',   url:'https://canva.com'}],
  pdf:       [{ico:'📄',name:'Adobe Acrobat',  desc:'Industry-standard PDF editor.',                     cta:'Start Trial',url:'https://adobe.com/acrobat'}],
  marketing: [{ico:'📧',name:'ConvertKit',     desc:'Email marketing for creators — free up to 1,000.',  cta:'Start Free', url:'https://convertkit.com'}],
  converter: [{ico:'✨',name:'Envato Elements', desc:'Unlimited design assets from $16.50/month.',        cta:'Browse',     url:'https://elements.envato.com'}],
  all:       [{ico:'🌐',name:'Namecheap',      desc:'Domains from $0.99/yr. Hosting from $1.98/month.',  cta:'Find Domain',url:'https://namecheap.com'}],
};
