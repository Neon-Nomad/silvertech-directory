import 'dotenv/config';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type DigitalProduct = {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  currency: string;
  stripe_price_id?: string | null;
  payment_link_url?: string | null;
};

async function fetchProducts(): Promise<DigitalProduct[]> {
  const { data, error } = await supabase
    .from('digital_products')
    .select('id,slug,title,price_cents,currency,stripe_price_id,payment_link_url');
  if (error) {
    console.error('Failed to fetch digital_products:', error.message);
    process.exit(1);
  }
  return data || [];
}

async function ensureStripePrice(product: DigitalProduct) {
  if (product.stripe_price_id) {
    try {
      const existing = await stripe.prices.retrieve(product.stripe_price_id);
      if (existing.active) return existing.id;
    } catch (e) {
      // fall through to create
    }
  }

  const stripeProduct = await stripe.products.create({
    name: product.title,
    metadata: { slug: product.slug, type: 'digital_pdf' },
  });

  const price = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: product.price_cents,
    currency: product.currency || 'usd',
  });

  return price.id;
}

async function ensurePaymentLink(priceId: string, slug: string) {
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { slug, type: 'digital_pdf' },
  });
  return link.url;
}

async function run() {
  const products = await fetchProducts();
  for (const product of products) {
    console.log(`Processing ${product.slug}...`);
    const priceId = await ensureStripePrice(product);
    const linkUrl = await ensurePaymentLink(priceId, product.slug);

    const { error } = await supabase
      .from('digital_products')
      .update({ stripe_price_id: priceId, payment_link_url: linkUrl })
      .eq('id', product.id);
    if (error) {
      console.error(`Failed to update ${product.slug}:`, error.message);
      process.exitCode = 1;
      continue;
    }
    console.log(`Updated ${product.slug}: price=${priceId}, link=${linkUrl}`);
  }
  console.log('Done.');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
