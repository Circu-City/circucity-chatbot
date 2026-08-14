const Stripe = require('stripe');
const stripe = new Stripe('REPLACE_WITH_YOUR_STRIPE_SECRET_KEY');

async function main() {
  // Create products if they don't exist
  const existingProducts = await stripe.products.list({limit:10});
  const existingNames = new Set(existingProducts.data.map(p => p.name));

  const plans = [
    { name: 'Starter', description: 'Up to 1,000 messages/month for new stores.' },
    { name: 'Growth', description: 'Up to 10,000 messages/month. Advanced analytics and priority support.' },
    { name: 'Enterprise', description: 'Unlimited messages. Dedicated account manager and custom integrations.' },
  ];

  const priceIds = {};
  for (const plan of plans) {
    let product = existingProducts.data.find(p => p.name === plan.name);
    if (!product) {
      product = await stripe.products.create({ name: plan.name, description: plan.description });
      console.log('Created product:', plan.name, product.id);
    }
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 5 });
    if (existingPrices.data.length === 0) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.name === 'Starter' ? 0 : plan.name === 'Growth' ? 4900 : 19900,
        currency: 'sek',
        recurring: { interval: 'month' },
      });
      priceIds[plan.name.toLowerCase()] = price.id;
      console.log('Created price:', plan.name, price.id, price.unit_amount + ' SEK');
    } else {
      priceIds[plan.name.toLowerCase()] = existingPrices.data[0].id;
      console.log('Existing price:', plan.name, existingPrices.data[0].id);
    }
  }

  console.log('\nAdd these to .env:');
  console.log('STRIPE_PRICE_STARTER=' + priceIds.starter);
  console.log('STRIPE_PRICE_GROWTH=' + priceIds.growth);
  console.log('STRIPE_PRICE_ENTERPRISE=' + priceIds.enterprise);
}
main().catch(e => console.error(e.message));
