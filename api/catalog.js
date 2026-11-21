// GET /api/catalog: prices, delivery rule, whether online payment is on, and the Meta Pixel ID (if set).
const { PRODUCTS, DELIVERY, MAX_QTY } = require('./_catalog');

module.exports = (req, res) => {
  const pixelId = /^\d{10,20}$/.test(process.env.META_PIXEL_ID || '') ? process.env.META_PIXEL_ID : '';
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const enabled = Boolean(keyId && process.env.RAZORPAY_KEY_SECRET);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    products: PRODUCTS,
    delivery: DELIVERY,
    maxQty: MAX_QTY,
    payments: { enabled, provider: 'razorpay', keyId: enabled ? keyId : '' },
    meta: { pixelId },  // Meta Pixel: off until META_PIXEL_ID is set in Vercel; loads only after the visitor accepts
  });
};
