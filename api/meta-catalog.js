// GET /api/meta-catalog: product feed for Meta Commerce Manager (Facebook & Instagram Shops).
// Built from api/_catalog.js, so prices in the feed always match the website.
const { PRODUCTS } = require('./_catalog');

const SITE = 'https://www.maika.food';
const ABOUT = {
  'pinni': 'Homemade Punjabi pinni, made in small batches.',
  'panjiri': 'Homemade winter panjiri, made in small batches.',
  'til-laddoo': 'Homemade til (sesame) laddoo, made in small batches.',
  'dry-fruit-laddoo': 'Homemade dry fruit laddoo, made in small batches.',
  'chikki': 'Homemade gur chikki, made in small batches.',
};
const ORDERS_OPEN = '2027-01-01T00:00+05:30';

const cell = v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };

module.exports = (req, res) => {
  const preorder = Date.now() < Date.parse(ORDERS_OPEN);
  const head = ['id', 'title', 'description', 'availability', 'availability_date', 'condition', 'price', 'link', 'image_link', 'brand', 'google_product_category', 'quantity_to_sell_on_facebook'];
  const rows = Object.keys(PRODUCTS).map(id => {
    const p = PRODUCTS[id];
    return [
      id, `Maika ${p.name} (${p.pack})`, `${ABOUT[id] || 'Homemade by Maika, in small batches.'} ${p.pack} jar.`,
      preorder ? 'preorder' : 'in stock', preorder ? ORDERS_OPEN : '', 'new', `${p.price.toFixed(2)} INR`,
      `${SITE}/#${id}`, `${SITE}/images/catalog/${id}.jpg`, 'Maika', 'Food, Beverages & Tobacco > Food Items', 50,
    ];
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).send([head, ...rows].map(r => r.map(cell).join(',')).join('\n') + '\n');
};
