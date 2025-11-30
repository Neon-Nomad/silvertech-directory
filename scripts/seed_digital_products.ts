import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(url, key);

type ProductSeed = {
  slug: string;
  title: string;
  category: 'emotional-survival' | 'financial-legal' | 'selection-placement' | 'communication';
  short_value: string;
  price_cents: number;
  currency: string;
  download_url: string;
};

const products: ProductSeed[] = [
  {
    slug: 'surviving-the-guilt',
    title: "Surviving the Guilt: The Caregiver's Emotional Guide",
    category: 'emotional-survival',
    short_value: 'Coping exercises and scripts to process guilt while staying present for your loved one.',
    price_cents: 1999,
    currency: 'usd',
    download_url: '/pdfs/emotional/surviving-the-guilt.pdf',
  },
  {
    slug: 'finding-peace-boundaries',
    title: 'Finding Peace: Setting Boundaries After Placement',
    category: 'emotional-survival',
    short_value: 'Redefines your role post-placement with boundary templates and self-care routines.',
    price_cents: 1499,
    currency: 'usd',
    download_url: '/pdfs/emotional/finding-peace-boundaries.pdf',
  },
  {
    slug: 'first-30-days-diagnosis',
    title: "Navigating the Diagnosis: A Partner's First 30 Days",
    category: 'emotional-survival',
    short_value: 'A day-by-day emotional anchor for spouses processing an Alzheimer’s diagnosis.',
    price_cents: 1499,
    currency: 'usd',
    download_url: '/pdfs/emotional/first-30-days-diagnosis.pdf',
  },
  {
    slug: 'medicaid-planning-guide',
    title: 'The 50-State Medicaid Planning Guide: Simplified',
    category: 'financial-legal',
    short_value: 'State-by-state eligibility checkpoints, lookback rules, and action steps to protect assets.',
    price_cents: 2999,
    currency: 'usd',
    download_url: '/pdfs/emotional/medicaid-planning-guide.pdf',
  },
  {
    slug: 'hidden-cost-finder',
    title: 'The Hidden Cost Finder: Fees, Commissions, and Budgeting',
    category: 'financial-legal',
    short_value: 'Identifies referral fees, move-in costs, and recurring charges so you can budget with confidence.',
    price_cents: 1499,
    currency: 'usd',
    download_url: '/pdfs/emotional/hidden-cost-finder.pdf',
  },
  {
    slug: '72-hour-crisis-checklist',
    title: 'The 72-Hour Memory Care Crisis Checklist',
    category: 'selection-placement',
    short_value: 'Immediate steps, packing list, and records to keep control in an emergency placement.',
    price_cents: 999,
    currency: 'usd',
    download_url: '/pdfs/emotional/72-hour-crisis-checklist.pdf',
  },
  {
    slug: 'facility-interview-scorecard',
    title: 'The Facility Interview & Red Flag Scorecard',
    category: 'selection-placement',
    short_value: 'Question sets and scoring guidance to interpret inspection reports and staffing claims.',
    price_cents: 999,
    currency: 'usd',
    download_url: '/pdfs/emotional/facility-interview-scorecard.pdf',
  },
  {
    slug: 'transitioning-well-move-in',
    title: 'Transitioning Well: 10 Steps for a Smooth Move-In',
    category: 'selection-placement',
    short_value: 'Emotional prep, room setup, and week-one check-ins to calm your loved one.',
    price_cents: 1499,
    currency: 'usd',
    download_url: '/pdfs/emotional/transitioning-well-move-in.pdf',
  },
  {
    slug: 'maximizing-visits-connection',
    title: 'Maximizing Visits: Connecting with Memory Care Residents',
    category: 'communication',
    short_value: 'Sensory prompts and visit structures to make time together meaningful.',
    price_cents: 1999,
    currency: 'usd',
    download_url: '/pdfs/emotional/maximizing-visits-connection.pdf',
  },
  {
    slug: 'care-team-handbook',
    title: 'The Care Team Handbook: How to Partner with Facility Staff',
    category: 'communication',
    short_value: 'Cadences, escalation paths, and shared-notes templates to keep care aligned.',
    price_cents: 999,
    currency: 'usd',
    download_url: '/pdfs/emotional/care-team-handbook.pdf',
  },
];

async function upsertProducts() {
  for (const product of products) {
    const { error } = await supabase
      .from('digital_products')
      .upsert(
        {
          ...product,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );

    if (error) {
      console.error(`Failed to upsert ${product.slug}:`, error.message);
      process.exitCode = 1;
      return;
    }
    console.log('Upserted', product.slug);
  }
}

upsertProducts()
  .then(() => {
    console.log('Seeding complete.');
  })
  .catch((err) => {
    console.error('Unexpected error seeding products:', err);
    process.exit(1);
  });
