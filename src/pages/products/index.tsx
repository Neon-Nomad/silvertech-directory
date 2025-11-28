import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CategoryTile } from '../../components/CategoryTile';
import { AffiliateDisclaimer } from '../../components/AffiliateDisclaimer';

const CATEGORIES = [
  { title: 'Mobility', slug: 'mobility' },
  { title: 'Bathroom Safety', slug: 'bathroom' },
  { title: 'Memory Care', slug: 'memory' },
  { title: 'Home Safety', slug: 'safety' },
  { title: 'Daily Living Aids', slug: 'daily-living' },
  { title: 'Incontinence', slug: 'incontinence' },
  { title: 'Medical Alert Systems', slug: 'medical-alert' },
  { title: 'Bedroom Safety', slug: 'bedroom' },
  { title: 'Gifts for Seniors', slug: 'gifts' },
  { title: 'Caregiver Tools', slug: 'caregiver' },
];

export const ProductsHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Helmet>
        <title>Recommended Products for Senior Care | SilverTech Directory</title>
        <meta name="description" content="Curated recommendations for senior care products. Mobility, safety, daily living aids, and more." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          Recommended Products for Senior Care
        </h1>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-12 text-slate-600">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {CATEGORIES.map((cat) => (
            <CategoryTile key={cat.slug} title={cat.title} slug={cat.slug} />
          ))}
        </div>

        <AffiliateDisclaimer />
      </div>
    </div>
  );
};
