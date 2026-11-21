/* TARUMAK STUDIO — config.js  (edit before deploying) */
const SITE = {
  name: 'Tarumak Studio',
  tagline: 'Free tools for designers, marketers and developers',
  domain: 'tarumakstudio.com',
};
/* ── Google Analytics 4 — consent-gated ────────────────────────────
   config.js is the ONE analytics entry point for the whole site.
   No page may load gtag.js on its own (the static <script> tags were
   removed from every page and from build-tool-pages.js).

   Consent model ("basic" Consent Mode v2):
   - Before a choice, or after Decline: gtag.js is NOT loaded, no
     events are queued, and any leftover _ga cookies are deleted.
   - After Accept (localStorage tmk_cookie = '1'): consent is updated
     to granted, then gtag.js loads and starts measuring.
   The banner (features.js) calls window.tmkConsent.set(true|false). */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
(function(){
  var GA_ID = 'G-ER0G4HSYQV';
  var KEY = 'tmk_cookie';
  var loaded = false;
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  function stored(){ try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function load(){
    if (loaded) return;
    loaded = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  function clearGaCookies(){
    var host = location.hostname;
    var domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      domains.forEach(function(d){
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }
  window.tmkConsent = {
    get: stored,
    granted: function(){ return stored() === '1'; },
    set: function(granted){
      try { localStorage.setItem(KEY, granted ? '1' : '0'); } catch (e) {}
      if (granted) { load(); }
      else { gtag('consent', 'update', { analytics_storage: 'denied' }); clearGaCookies(); }
    }
  };
  if (stored() === '1') load(); else clearGaCookies();
})();
window._ga = function(e,p){ if (window.tmkConsent && window.tmkConsent.granted()) gtag('event', e, p || {}); };

/* Affiliate links — AFFS declared ONLY in this file */
const AFFS = {
  image:     [{ico:'🎨',name:'Canva Pro',      desc:'Professional design templates — free 30-day trial.',cta:'Try Free',   url:'https://canva.com'}],
  pdf:       [{ico:'📄',name:'Adobe Acrobat',  desc:'Industry-standard PDF editor.',                     cta:'Start Trial',url:'https://adobe.com/acrobat'}],
  marketing: [{ico:'📧',name:'ConvertKit',     desc:'Email marketing for creators — free up to 1,000.',  cta:'Start Free', url:'https://convertkit.com'}],
  converter: [{ico:'✨',name:'Envato Elements', desc:'Unlimited design assets from $16.50/month.',        cta:'Browse',     url:'https://elements.envato.com'}],
  all:       [{ico:'🌐',name:'Namecheap',      desc:'Domains from $0.99/yr. Hosting from $1.98/month.',  cta:'Find Domain',url:'https://namecheap.com'}],
};
