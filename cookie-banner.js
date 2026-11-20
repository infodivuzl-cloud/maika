/* Maika cookie notice. Shown once per browser until "Okay" is pressed. Maika uses no tracking or ad cookies. */
(function () {
  var KEY = 'maika-cookie-ok';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* storage blocked: show, dismiss for this page only */ }
  if (document.getElementById('mk-cookie')) return;

  var css = '' +
    '.mk-cookie{position:fixed;left:24px;bottom:24px;z-index:9990;width:min(400px,calc(100% - 32px));box-sizing:border-box;padding:18px 18px 16px;border-radius:18px;' +
    'background:#E6F1FA;color:#13294A;border:2px solid #1D3B63;font-family:Figtree,system-ui,sans-serif;font-size:14px;line-height:1.5;box-shadow:0 16px 44px rgba(10, 22, 40,.35);' +
    'transform:translateY(24px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s ease}' +
    '.mk-cookie.is-in{transform:none;opacity:1}' +
    '.mk-cookie__top{display:flex;gap:12px;align-items:flex-start}' +
    '.mk-cookie__icon{flex:none;width:40px;height:40px}' +
    '.mk-cookie h2{margin:0 0 4px;font-family:"Lilita One",Figtree,sans-serif;font-weight:400;font-size:20px;line-height:1.1;color:#1D3B63;letter-spacing:.01em}' +
    '.mk-cookie p{margin:0}' +
    '.mk-cookie__row{display:flex;align-items:center;gap:14px;margin-top:14px}' +
    '.mk-cookie__ok{min-height:42px;padding:0 22px;border:0;border-radius:999px;background:#1D3B63;color:#E6F1FA;font:800 14px/1 Figtree,system-ui,sans-serif;cursor:pointer;transition:transform .15s ease,background .15s ease}' +
    '.mk-cookie__ok:hover{background:#13294A;transform:translateY(-1px)}' +
    '.mk-cookie a{color:#1D3B63;font-weight:700;text-underline-offset:3px}' +
    '.mk-cookie :focus-visible{outline:2px dashed #1D3B63;outline-offset:3px}' +
    '@media (max-width:599px){.mk-cookie{left:16px;right:16px;bottom:16px;width:auto;padding:16px}}' +
    '@media (prefers-reduced-motion:reduce){.mk-cookie{transition:none}}' +
    '@media print{.mk-cookie{display:none}}';

  function show() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var box = document.createElement('section');
    box.className = 'mk-cookie'; box.id = 'mk-cookie';
    box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Cookie notice');
    box.innerHTML =
      '<div class="mk-cookie__top">' +
        '<svg class="mk-cookie__icon" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#E6F1FA"/>' +
        '<path d="M31 9a5 5 0 0 0 5 5" stroke="#E6F1FA" stroke-width="3" fill="none"/>' +
        '<g fill="#1D3B63"><circle cx="14" cy="15" r="2.4"/><circle cx="23" cy="13" r="1.8"/><circle cx="26" cy="23" r="2.6"/><circle cx="15" cy="26" r="2"/><circle cx="20" cy="20" r="1.4"/></g></svg>' +
        '<div><h2>Just the good stuff</h2>' +
        '<p>We only use what this site needs to work, like remembering your cart. No ads, no tracking. Our payment partner Razorpay may set its own when you pay.</p></div>' +
      '</div>' +
      '<div class="mk-cookie__row"><button type="button" class="mk-cookie__ok">Okay</button><a href="/cookies">Cookie Policy</a></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-in'); }); });
    box.querySelector('.mk-cookie__ok').addEventListener('click', function () {
      try { localStorage.setItem(KEY, new Date().toISOString().slice(0, 10)); } catch (e) {}
      box.classList.remove('is-in');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 400);
    });
  }
  function later() { setTimeout(show, 700); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
