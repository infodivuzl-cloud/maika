// GET /api/catalog: prices, delivery rule, and whether online payment is switched on.
const { PRODUCTS, DELIVERY, MAX_QTY } = require('./_catalog');

module.exports = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const enabled = Boolean(keyId && process.env.RAZORPAY_KEY_SECRET);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    products: PRODUCTS,
    delivery: DELIVERY,
    maxQty: MAX_QTY,
    payments: { enabled, provider: 'razorpay', keyId: enabled ? keyId : '' },
  });
};
