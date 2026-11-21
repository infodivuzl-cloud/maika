/* Maika cookie notice + Meta Pixel consent.
   - No META_PIXEL_ID in Vercel: a simple notice ("Okay"); nothing tracks.
   - META_PIXEL_ID set: the notice asks "Accept all / Only essential". The Meta Pixel loads ONLY after "Accept all".
   Pages report shop events with window.mkTrack(name, data, {eventID}); they are dropped unless the visitor accepted. */
(function () {
  var OLD = 'maika-cookie-ok', KEY = 'maika-consent';   // maika-consent: 'all' | 'essential'
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var queue = [], pixelOn = false, decided = false;
  window.mkTrack = function (name, data, opt) {
    if (pixelOn && window.fbq) { window.fbq('track', name, data || {}, opt || {}); return; }
    if (!decided && queue.length < 20) queue.push([name, data, opt]);
  };
  window.mkCookieSettings = function () { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD); } catch (e) {} location.reload(); };

  function loadPixel(id) {
    /* Meta's standard base code */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id); window.fbq('track', 'PageView'); pixelOn = true; decided = true;
    queue.splice(0).forEach(function (q) { window.fbq('track', q[0], q[1] || {}, q[2] || {}); });
  }
  function settle() { decided = true; if (!pixelOn) queue.length = 0; }

  var css = '' +
    '.mk-cookie{position:fixed;left:24px;bottom:24px;z-index:9990;width:min(400px,calc(100% - 32px));box-sizing:border-box;padding:18px 18px 16px;border-radius:18px;' +
    'background:#FFFBEA;color:#4A4B0E;border:2px solid #606212;font-family:Figtree,system-ui,sans-serif;font-size:14px;line-height:1.5;box-shadow:0 16px 44px rgba(30,31,4,.35);' +
    'transform:translateY(24px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s ease}' +
    '.mk-cookie.is-in{transform:none;opacity:1}' +
    '.mk-cookie__top{display:flex;gap:12px;align-items:flex-start}' +
    '.mk-cookie__icon{flex:none;width:40px;height:40px}' +
    '.mk-cookie h2{margin:0 0 4px;font-family:"Lilita One",Figtree,sans-serif;font-weight:400;font-size:20px;line-height:1.1;color:#606212;letter-spacing:.01em}' +
    '.mk-cookie p{margin:0}' +
    '.mk-cookie__row{display:flex;align-items:center;gap:14px;margin-top:14px}' +
    '.mk-cookie__ok{min-height:42px;padding:0 22px;border:0;border-radius:999px;background:#606212;color:#FFFBEA;font:800 14px/1 Figtree,system-ui,sans-serif;cursor:pointer;transition:transform .15s ease,background .15s ease}' +
    '.mk-cookie__ok:hover{background:#4A4B0E;transform:translateY(-1px)}' +
    '.mk-cookie a{color:#606212;font-weight:700;text-underline-offset:3px}' +
    '.mk-cookie :focus-visible{outline:2px dashed #606212;outline-offset:3px}' +
    '@media (max-width:599px){.mk-cookie{left:16px;right:16px;bottom:16px;width:auto;padding:16px}}' +
    '@media (prefers-reduced-motion:reduce){.mk-cookie{transition:none}}' +
    '@media print{.mk-cookie{display:none}}';

  css += '.mk-cookie__no{min-height:42px;padding:0 16px;border:2px solid #606212;border-radius:999px;background:transparent;color:#606212;font:800 14px/1 Figtree,system-ui,sans-serif;cursor:pointer}' +
    '.mk-cookie__no:hover{background:rgba(96,98,18,.08)}' +
    '.mk-cookie__row{flex-wrap:wrap}';

  function show(pixelId) {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var box = document.createElement('section');
    box.className = 'mk-cookie'; box.id = 'mk-cookie';
    box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Cookie notice');
    var text = pixelId
      ? 'We use what this site needs to work, like remembering your cart. With your OK, we also use the Meta Pixel to see which of our Facebook and Instagram ads work. We never sell your data.'
      : 'We only use what this site needs to work, like remembering your cart. No ads, no tracking. Our payment partner Razorpay may set its own when you pay.';
    var buttons = pixelId
      ? '<button type="button" class="mk-cookie__ok" data-choice="all">Accept all</button><button type="button" class="mk-cookie__no" data-choice="essential">Only essential</button>'
      : '<button type="button" class="mk-cookie__ok" data-choice="ok">Okay</button>';
    box.innerHTML =
      '<div class="mk-cookie__top">' +
        '<svg class="mk-cookie__icon" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#EDD03A"/>' +
        '<path d="M31 9a5 5 0 0 0 5 5" stroke="#FFFBEA" stroke-width="3" fill="none"/>' +
        '<g fill="#606212"><circle cx="14" cy="15" r="2.4"/><circle cx="23" cy="13" r="1.8"/><circle cx="26" cy="23" r="2.6"/><circle cx="15" cy="26" r="2"/><circle cx="20" cy="20" r="1.4"/></g></svg>' +
        '<div><h2>Just the good stuff</h2><p>' + text + '</p></div>' +
      '</div>' +
      '<div class="mk-cookie__row">' + buttons + '<a href="/cookies">Cookie Policy</a></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-in'); }); });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-choice]'); if (!b) return;
      var c = b.dataset.choice;
      if (c === 'ok') put(OLD, new Date().toISOString().slice(0, 10)); else put(KEY, c);
      if (c === 'all') loadPixel(pixelId); else settle();
      box.classList.remove('is-in');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 400);
    });
  }

  function start(pixelId) {
    var c = get(KEY);
    if (pixelId) {
      if (c === 'all') return loadPixel(pixelId);
      if (c === 'essential') return settle();
      return setTimeout(function () { show(pixelId); }, 700);
    }
    settle();
    if (!get(OLD) && !c) setTimeout(function () { show(''); }, 700);
  }
  function boot() {
    fetch('/api/catalog', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { start((c && c.meta && c.meta.pixelId) || ''); })
      .catch(function () { start(''); });
  }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();
