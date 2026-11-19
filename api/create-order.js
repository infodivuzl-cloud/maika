// POST /api/create-order: prices the cart on the server and opens a Razorpay order for that exact amount.
const { priceCart } = require('./_catalog');

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }

  const keyId = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return res.status(503).json({ error: 'Online payment is not switched on yet. Please choose another payment option.' });

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  let order;
  try { order = priceCart(body.items); } catch (e) { return res.status(400).json({ error: e.message }); }

  const c = body.customer || {};
  const phone = clip(c.phone, 10);
  if (!clip(c.name, 80) || !/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ error: 'Please add your name and a 10-digit mobile number.' });

  // Razorpay notes: at most 15 keys, 256 characters each. These show up in the Razorpay dashboard and emails.
  const notes = {
    items: clip(order.lines.map(l => `${l.qty} x ${l.name} ${l.pack}`).join('; '), 256),
    customer: clip(c.name, 120),
    phone: '+91 ' + phone,
    email: clip(c.email, 120),
    address: clip(c.address, 256),
    delivery: clip(c.delivery, 120),
    note: clip(c.note, 256),
    subtotal_inr: String(order.subtotal),
    delivery_inr: String(order.delivery),
  };
  Object.keys(notes).forEach(k => { if (!notes[k]) delete notes[k]; });

  const base = process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com';
  try {
    const r = await fetch(base + '/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(keyId + ':' + secret).toString('base64') },
      body: JSON.stringify({ amount: order.total * 100, currency: 'INR', receipt: 'maika_' + Date.now(), notes }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.id) {
      console.error('Razorpay order failed', r.status, data && data.error);
      return res.status(502).json({ error: 'Could not start the payment. Please try again in a minute.' });
    }
    return res.status(200).json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId, order });
  } catch (e) {
    console.error('Razorpay order error', e && e.message);
    return res.status(502).json({ error: 'Could not reach the payment service. Please try again in a minute.' });
  }
};

function safeJson(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
