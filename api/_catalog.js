// The ONE place for prices. The website shows these and the server charges these.
// Change a price here, publish, and both the product cards and the checkout update.
const PRODUCTS = {
  'til-laddoo':       { name: 'Til Laddoo',       pack: '250 g', price: 299 },
  'goond-laddoo':     { name: 'Goond Laddoo',     pack: '250 g', price: 399 },
  'haldi-laddoo':     { name: 'Haldi Laddoo',     pack: '200 g', price: 299 },
  'pistachio-spread': { name: 'Pistachio Spread', pack: '180 g', price: 499 },
};

// Delivery: ₹79, free when the order subtotal reaches ₹999.
const DELIVERY = { fee: 79, freeFrom: 999 };

const MAX_QTY = 20;

// Works out the order from the customer's cart, using only the prices above.
function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your cart is empty.');
  const lines = [];
  for (const it of items) {
    const p = PRODUCTS[it && it.id];
    const qty = Number(it && it.qty);
    if (!p) throw new Error('A product in your cart is no longer available.');
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new Error('Please choose between 1 and ' + MAX_QTY + ' of each product.');
    lines.push({ id: it.id, name: p.name, pack: p.pack, qty, unit: p.price, total: p.price * qty });
  }
  const subtotal = lines.reduce((t, l) => t + l.total, 0);
  const delivery = subtotal >= DELIVERY.freeFrom ? 0 : DELIVERY.fee;
  return { lines, subtotal, delivery, total: subtotal + delivery };
}

module.exports = { PRODUCTS, DELIVERY, MAX_QTY, priceCart };
