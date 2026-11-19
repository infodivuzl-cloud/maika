// POST /api/verify-payment: confirms the payment really came from Razorpay (HMAC-SHA256 signature check).
const crypto = require('crypto');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ verified: false, error: 'Online payment is not switched on.' });

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const orderId = String(b.razorpay_order_id || ''), paymentId = String(b.razorpay_payment_id || ''), signature = String(b.razorpay_signature || '');
  if (!/^order_\w+$/.test(orderId) || !/^pay_\w+$/.test(paymentId) || !/^[a-f0-9]{64}$/.test(signature)) {
    return res.status(400).json({ verified: false, error: 'Payment details are missing.' });
  }

  const expected = crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex');
  const ok = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  if (!ok) return res.status(400).json({ verified: false, error: 'We could not confirm this payment. If money was taken, contact us and we will sort it out.' });
  return res.status(200).json({ verified: true, orderId, paymentId });
};
