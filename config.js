/* TARUMAK STUDIO — config.js  (edit before deploying) */
const SITE = {
  name: 'Tarumak Studio',
  tagline: 'Free tools for designers, marketers and developers',
  domain: 'tarumakstudio.com',
};
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');
window._ga = function(e,p){ if(window.gtag) gtag('event',e,p||{}); };

/* Affiliate links — AFFS declared ONLY in this file */
const AFFS = {
  image:     [{ico:'🎨',name:'Canva Pro',      desc:'Professional design templates — free 30-day trial.',cta:'Try Free',   url:'https://canva.com'}],
  pdf:       [{ico:'📄',name:'Adobe Acrobat',  desc:'Industry-standard PDF editor.',                     cta:'Start Trial',url:'https://adobe.com/acrobat'}],
  marketing: [{ico:'📧',name:'ConvertKit',     desc:'Email marketing for creators — free up to 1,000.',  cta:'Start Free', url:'https://convertkit.com'}],
  converter: [{ico:'✨',name:'Envato Elements', desc:'Unlimited design assets from $16.50/month.',        cta:'Browse',     url:'https://elements.envato.com'}],
  all:       [{ico:'🌐',name:'Namecheap',      desc:'Domains from $0.99/yr. Hosting from $1.98/month.',  cta:'Find Domain',url:'https://namecheap.com'}],
};
