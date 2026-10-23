/*
 * Google Analytics 4 with cookie consent (UK GDPR / PECR style opt-in).
 *
 * - Nothing is loaded and no banner is shown while GA_ID is empty.
 * - Google's script is requested only after the visitor presses "Accept".
 * - The choice is remembered for 180 days; "Cookies" in the footer reopens the banner.
 * - Advertising storage and ad personalisation are always off.
 *
 * To switch on: put the Measurement ID (G-XXXXXXXXXX) into GA_ID below.
 */
(function () {
  'use strict';
  var GA_ID = '';
  var KEY = 'kp_cookie_consent';
  var DAYS = 180;

  // The footer "Cookies" link only makes sense when analytics is on.
  var hide = document.createElement('style');
  hide.textContent = '[data-cookie-settings]{display:none !important}html[data-ga] [data-cookie-settings]{display:inline !important}';
  document.head.appendChild(hide);

  if (!GA_ID) return;
  document.documentElement.setAttribute('data-ga', 'on');

  // ---- storage -----------------------------------------------------------
  function readChoice() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.v === 'granted' || v.v === 'denied') && Date.now() - v.t < DAYS * 864e5) return v.v;
    } catch (e) {}
    return null;
  }
  function saveChoice(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  // ---- gtag --------------------------------------------------------------
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_flags: 'SameSite=Lax;Secure' });
  }
  function expireGaCookies() {
    var host = location.hostname, parts = host.split('.'), roots = [host, '.' + host];
    if (parts.length > 2) roots.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
        roots.forEach(function (d) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d; });
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      }
    });
  }
  function apply(choice) {
    if (choice === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      loadGA();
    } else {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      expireGaCookies();
    }
  }

  // ---- events ------------------------------------------------------------
  window.kpTrack = function (name, params) {
    if (readChoice() !== 'granted') return;
    gtag('event', name, params || {});
  };
  function section(path) {
    if (/^\/commercial(\/|$)/.test(path)) return 'commercial';
    if (/^\/residential/.test(path)) return 'residential';
    if (/^\/lettings/.test(path)) return 'lettings';
    if (/^\/how-we-work/.test(path)) return 'how-we-work';
    if (/^\/(index\.html)?$/.test(path)) return 'home';
    return 'other';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '', place = a.getAttribute('data-analytics') || '';
    var page = location.pathname;
    if (/^https?:\/\/wa\.me\//.test(href)) return window.kpTrack('whatsapp_click', { page_path: page, placement: place });
    if (/^mailto:/i.test(href)) return window.kpTrack('email_click', { page_path: page, placement: place });
    if (/^tel:/i.test(href)) return window.kpTrack('phone_click', { page_path: page, placement: place });
    if (/instagram\.com|linkedin\.com/.test(href)) return window.kpTrack('social_click', { network: /instagram/.test(href) ? 'instagram' : 'linkedin', page_path: page });
    try {
      var u = new URL(a.href, location.href);
      if (u.origin === location.origin) {
        var from = section(page), to = section(u.pathname);
        if (from !== to && to !== 'other') window.kpTrack('section_switch', { from_section: from, to_section: to });
      }
    } catch (err) {}
  }, true);

  // ---- banner ------------------------------------------------------------
  var css = '#kp-consent{position:fixed;left:20px;bottom:20px;z-index:200;max-width:440px;box-sizing:border-box;padding:18px 20px;background:#121212;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.78);font-family:Geist,system-ui,sans-serif;font-size:12.5px;line-height:1.55;font-weight:300}' +
    '#kp-consent p{margin:0 0 14px}#kp-consent a{color:#fff;text-decoration:underline}' +
    '#kp-consent .kp-c-row{display:flex;gap:10px}' +
    '#kp-consent button{flex:1;appearance:none;cursor:pointer;font:inherit;font-size:10px;letter-spacing:.16em;text-transform:uppercase;padding:12px 10px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;border-radius:0}' +
    '#kp-consent button[data-v="granted"]{background:#fff;color:#0A0A0A;border-color:#fff}' +
    '#kp-consent button:focus-visible{outline:1px solid #fff;outline-offset:2px}' +
    '@media (max-width:560px){#kp-consent{left:12px;right:12px;bottom:12px;max-width:none;padding:14px 16px;font-size:12px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var box = null;
  function hideBanner() { if (box && box.parentNode) box.parentNode.removeChild(box); box = null; }
  function showBanner() {
    if (box) return;
    box = document.createElement('div');
    box.id = 'kp-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie preferences');
    box.innerHTML = '<p>We use Google Analytics cookies to understand how the site is used. They are set only if you accept. See our <a href="https://docs.google.com/document/d/1BRCly03-Nmy5Nzy9uDkluf4FHnZ8pyvGmogx1WRqUkw/preview" target="_blank" rel="noopener">Privacy Policy</a>.</p>' +
      '<div class="kp-c-row"><button type="button" data-v="denied">Decline</button><button type="button" data-v="granted">Accept</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-v]');
      if (!b) return;
      var v = b.getAttribute('data-v');
      saveChoice(v); apply(v); hideBanner();
    });
    document.body.appendChild(box);
  }
  document.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (l) { e.preventDefault(); showBanner(); }
  });

  function start() {
    var c = readChoice();
    if (c) apply(c); else showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
