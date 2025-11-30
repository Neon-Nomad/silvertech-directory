import React, { useEffect, useState } from 'react';
import { Heart, ShieldCheck, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';

type CatalogProduct = {
  title: string;
  price: string;
  value: string;
  slug: string;
  downloadUrl: string;
};

type CatalogCategory = {
  id: string;
  label: string;
  headline: string;
  description: string;
  icon: React.ReactNode;
  products: CatalogProduct[];
};

const CATEGORIES: CatalogCategory[] = [
  {
    id: 'emotional-survival',
    label: 'Category 1',
    headline: 'Emotional Survival & Identity',
    description: "Supports the guilt, grief, and identity shift caregivers experience when a loved one needs memory care.",
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    products: [
      {
        slug: 'surviving-the-guilt',
        title: 'Surviving the Guilt: The Caregiver\'s Emotional Guide',
        price: '$19.99',
        value: 'Coping exercises and scripts to process guilt while staying present for your loved one.',
        downloadUrl: '/pdfs/emotional/surviving-the-guilt.pdf'
      },
      {
        slug: 'finding-peace-boundaries',
        title: 'Finding Peace: Setting Boundaries After Placement',
        price: '$14.99',
        value: 'Redefines your role post-placement with boundary templates and self-care routines.',
        downloadUrl: '/pdfs/emotional/finding-peace-boundaries.pdf'
      },
      {
        slug: 'first-30-days-diagnosis',
        title: 'Navigating the Diagnosis: A Partner\'s First 30 Days',
        price: '$14.99',
        value: 'A day-by-day emotional anchor for spouses processing an Alzheimer\'s diagnosis.',
        downloadUrl: '/pdfs/emotional/first-30-days-diagnosis.pdf'
      }
    ]
  },
  {
    id: 'financial-legal',
    label: 'Category 2',
    headline: 'Financial & Legal Planning',
    description: "High-stakes logistics distilled into clear, anxiety-reducing guidance built on SilverTech's regulatory data.",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    products: [
      {
        slug: 'medicaid-planning-guide',
        title: 'The 50-State Medicaid Planning Guide: Simplified',
        price: '$29.99',
        value: 'State-by-state eligibility checkpoints, lookback rules, and action steps to protect assets.',
        downloadUrl: '/pdfs/emotional/medicaid-planning-guide.pdf'
      },
      {
        slug: 'hidden-cost-finder',
        title: 'The Hidden Cost Finder: Fees, Commissions, and Budgeting',
        price: '$14.99',
        value: 'Identifies hidden referral fees, move-in costs, and ongoing charges so you can budget with confidence.',
        downloadUrl: '/pdfs/emotional/hidden-cost-finder.pdf'
      }
    ]
  },
  {
    id: 'selection-placement',
    label: 'Category 3',
    headline: 'Selection & Placement',
    description: 'Structured checklists that turn rushed decisions into confident, safety-focused choices.',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    products: [
      {
        slug: '72-hour-crisis-checklist',
        title: 'The 72-Hour Memory Care Crisis Checklist',
        price: '$9.99',
        value: 'Step-by-step actions for emergency placements to reduce risk and keep control in a crisis.',
        downloadUrl: '/pdfs/emotional/72-hour-crisis-checklist.pdf'
      },
      {
        slug: 'facility-interview-scorecard',
        title: 'The Facility Interview & Red Flag Scorecard',
        price: '$9.99',
        value: 'Question sets plus scoring guidance to interpret inspection reports and staffing claims.',
        downloadUrl: '/pdfs/emotional/facility-interview-scorecard.pdf'
      },
      {
        slug: 'transitioning-well-move-in',
        title: 'Transitioning Well: 10 Steps for a Smooth Move-In',
        price: '$14.99',
        value: 'Logistical and emotional steps that calm your loved one and prepare the care team.',
        downloadUrl: '/pdfs/emotional/transitioning-well-move-in.pdf'
      }
    ]
  },
  {
    id: 'communication',
    label: 'Category 4',
    headline: 'Ongoing Communication',
    description: 'Keeps family bonds and care-team collaboration strong after move-in.',
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    products: [
      {
        slug: 'maximizing-visits-connection',
        title: 'Maximizing Visits: Connecting with Memory Care Residents',
        price: '$19.99',
        value: 'Visit scripts, sensory prompts, and activities that create meaningful connection.',
        downloadUrl: '/pdfs/emotional/maximizing-visits-connection.pdf'
      },
      {
        slug: 'care-team-handbook',
        title: 'The Care Team Handbook: How to Partner with Facility Staff',
        price: '$9.99',
        value: 'Communication cadences, escalation paths, and shared-notes templates to keep care aligned.',
        downloadUrl: '/pdfs/emotional/care-team-handbook.pdf'
      }
    ]
  }
];

const EmotionalSupportCatalog: React.FC = () => {
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const slugs = CATEGORIES.flatMap((cat) => cat.products.map((p) => p.slug));
        const { data, error } = await supabase
          .from('digital_products')
          .select('slug,payment_link_url,download_url')
          .in('slug', slugs);
        if (error) {
          console.error('Failed to fetch payment links', error);
          return;
        }
        const map: Record<string, string> = {};
        (data || []).forEach((row) => {
          map[row.slug] = row.payment_link_url || row.download_url || '';
        });
        setLinks(map);
      } catch (err) {
        console.error('Unexpected error fetching links', err);
      }
    };

    fetchLinks();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-500 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="uppercase tracking-wide text-white/80 text-sm font-semibold">Digital Self-Help Catalog</p>
          <h1 className="text-4xl font-bold mt-3 mb-4">Emotional Support for Memory Care Families</h1>
          <p className="text-lg text-white/90 max-w-3xl">
            High-impact PDFs that balance the emotional toll with the financial and safety decisions caregivers face. Built to help spouses and adult children feel seen, prepared, and in control.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="white" className="text-primary-700">
              View Pricing Overview
            </Button>
            <Button variant="outline-white" className="gap-2">
              Talk to a Care Guide <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-10">
        {CATEGORIES.map((category) => (
          <section
            key={category.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-3">
              <div className="mt-1">{category.icon}</div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{category.label}</p>
                <h2 className="text-2xl font-bold text-slate-900">{category.headline}</h2>
                <p className="text-slate-600 mt-1">{category.description}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {category.products.map((product) => (
                <div key={product.title} className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">{product.title}</h3>
                    <p className="text-slate-600 text-sm">{product.value}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">PDF</p>
                      <p className="text-xl font-bold text-slate-900">{product.price}</p>
                    </div>
                    <a href={links[product.slug] || product.downloadUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="primary">
                        {links[product.slug] ? 'Buy & Download' : 'Download'}
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default EmotionalSupportCatalog;
