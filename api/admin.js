// /api/admin?action=...  Password-protected admin API. Orders and payments come straight from Razorpay;
// the order's fulfilment status and tracking number are stored in the Razorpay order's notes (no database needed).
const crypto = require('crypto');
const { PRODUCTS, DELIVERY } = require('./_catalog');

const COOKIE = 'maika_admin';
const SESSION_HOURS = 12;
const STATUSES = ['new', 'packed', 'dispatched', 'delivered', 'cancelled'];

const env = () => ({
  pw: process.env.ADMIN_PASSWORD || '',
  keyId: process.env.RAZORPAY_KEY_ID || '',
  secret: process.env.RAZORPAY_KEY_SECRET || '',
  base: process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com',
});

// ---------- session (signed, HttpOnly cookie; changing ADMIN_PASSWORD logs everyone out) ----------
function sessionKey() { const e = env(); return crypto.createHash('sha256').update('maika-admin|' + e.pw + '|' + e.secret).digest(); }
function makeToken() { const exp = Date.now() + SESSION_HOURS * 3600e3; return exp + '.' + crypto.createHmac('sha256', sessionKey()).update(String(exp)).digest('hex'); }
function validToken(t) {
  if (!t || !env().pw) return false;
  const [exp, mac] = String(t).split('.');
  if (!exp || !mac || !(Number(exp) > Date.now())) return false;
  const good = crypto.createHmac('sha256', sessionKey()).update(exp).digest('hex');
  return mac.length === good.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good));
}
function cookieOf(req) {
  const m = String(req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : '';
}
function setCookie(res, value, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(value)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const same = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };

// ---------- Razorpay ----------
async function rz(method, path, body) {
  const e = env();
  const r = await fetch(e.base + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(e.keyId + ':' + e.secret).toString('base64') },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const msg = (data && data.error && data.error.description) || ('Razorpay error ' + r.status); const err = new Error(msg); err.status = r.status; throw err; }
  return data;
}
function shapeOrder(o) {
  const pays = ((o.payments && o.payments.items) || []).map(p => ({
    id: p.id, status: p.status, method: p.method, amount: p.amount / 100, refunded: (p.amount_refunded || 0) / 100,
    captured: !!p.captured, vpa: p.vpa || '', bank: p.bank || '', wallet: p.wallet || '',
    card: p.card ? (p.card.network || '') + ' ' + (p.card.last4 ? '•' + p.card.last4 : '') : '', created: p.created_at,
  }));
  return { id: o.id, created: o.created_at, amount: o.amount / 100, paid: (o.amount_paid || 0) / 100, status: o.status, receipt: o.receipt, notes: o.notes && !Array.isArray(o.notes) ? o.notes : {}, payments: pays };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const action = String((req.query && req.query.action) || new URL(req.url || '/', 'http://x').searchParams.get('action') || '');
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const e = env();

  // state-changing calls must come from the admin page itself (JSON + custom header; cookie is SameSite=Strict)
  if (req.method === 'POST' && req.headers['x-maika-admin'] !== '1') return res.status(403).json({ error: 'Forbidden.' });

  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    if (!e.pw || e.pw.length < 10) return res.status(503).json({ error: 'Admin is not set up yet: add ADMIN_PASSWORD (at least 10 characters) in Vercel and redeploy.' });
    if (!same(body.password || '', e.pw)) { await sleep(900); return res.status(401).json({ error: 'Wrong password.' }); }
    setCookie(res, makeToken(), SESSION_HOURS * 3600);
    return res.status(200).json({ ok: true });
  }
  if (action === 'logout') { setCookie(res, '', 0); return res.status(200).json({ ok: true }); }
  if (action === 'session') {
    return res.status(200).json({ loggedIn: validToken(cookieOf(req)), setUp: e.pw.length >= 10, payments: Boolean(e.keyId && e.secret), live: e.keyId.startsWith('rzp_live_') });
  }

  if (!validToken(cookieOf(req))) return res.status(401).json({ error: 'Please log in again.' });
  if (!e.keyId || !e.secret) return res.status(503).json({ error: 'Razorpay keys are not set in Vercel.' });

  try {
    if (action === 'orders' && req.method === 'GET') {
      const out = [];
      for (let skip = 0; skip < 500; skip += 100) {
        const page = await rz('GET', `/v1/orders?count=100&skip=${skip}&expand[]=payments`);
        const items = page.items || [];
        out.push(...items.map(shapeOrder));
        if (items.length < 100) break;
      }
      return res.status(200).json({ orders: out, products: PRODUCTS, delivery: DELIVERY, fetched: Date.now() });
    }

    if (action === 'update' && req.method === 'POST') {
      const id = String(body.orderId || '');
      if (!/^order_\w+$/.test(id)) return res.status(400).json({ error: 'Bad order ID.' });
      const status = String(body.status || '');
      if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
      const o = await rz('GET', '/v1/orders/' + id);
      const notes = Object.assign({}, o.notes && !Array.isArray(o.notes) ? o.notes : {});
      if (status) notes.fulfil = status;
      if (typeof body.tracking === 'string') notes.tracking = body.tracking.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
      if (!notes.tracking) delete notes.tracking;
      notes.updated = new Date().toISOString();
      const u = await rz('PATCH', '/v1/orders/' + id, { notes });
      return res.status(200).json({ ok: true, notes: u.notes });
    }

    if (action === 'refund' && req.method === 'POST') {
      const pid = String(body.paymentId || ''), oid = String(body.orderId || '');
      if (!/^pay_\w+$/.test(pid) || !/^order_\w+$/.test(oid)) return res.status(400).json({ error: 'Bad payment or order ID.' });
      if (body.confirm !== 'REFUND') return res.status(400).json({ error: 'Type REFUND to confirm.' });
      const r = await rz('POST', `/v1/payments/${pid}/refund`, { notes: { reason: 'Refunded from Maika admin' } });
      const o = await rz('GET', '/v1/orders/' + oid);
      const notes = Object.assign({}, o.notes && !Array.isArray(o.notes) ? o.notes : {}, { fulfil: 'cancelled', refund: r.id, updated: new Date().toISOString() });
      await rz('PATCH', '/v1/orders/' + oid, { notes }).catch(() => {});
      return res.status(200).json({ ok: true, refundId: r.id, amount: r.amount / 100, status: r.status });
    }

    if (action === 'capture' && req.method === 'POST') {
      const pid = String(body.paymentId || ''); const amount = Math.round(Number(body.amount) * 100);
      if (!/^pay_\w+$/.test(pid) || !(amount > 0)) return res.status(400).json({ error: 'Bad payment.' });
      const p = await rz('POST', `/v1/payments/${pid}/capture`, { amount, currency: 'INR' });
      return res.status(200).json({ ok: true, status: p.status });
    }

    return res.status(404).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('admin', action, err && err.message);
    return res.status(err.status && err.status < 500 ? 400 : 502).json({ error: err.message || 'Something went wrong.' });
  }
};
