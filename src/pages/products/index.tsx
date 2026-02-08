import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CategoryTile } from '../../components/CategoryTile';
import { AffiliateDisclaimer } from '../../components/AffiliateDisclaimer';

import categoriesData from '../../data/productCategories.json';

export const ProductsHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Helmet>
        <title>Recommended Elder-Care Products | SilverTech Directory</title>
        <meta name="description" content="Independent recommendations curated to help families save time, confusion, and money. No commissions. No pay-to-rank." />
        <link rel="canonical" href="https://silvertechdirectory.com/products" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Recommended Elder-Care Products | SilverTech Directory" />
        <meta property="og:description" content="Independent recommendations curated to help families save time, confusion, and money. No commissions. No pay-to-rank." />
        <meta property="og:url" content="https://silvertechdirectory.com/products" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Recommended Elder-Care Products | SilverTech Directory" />
        <meta name="twitter:description" content="Independent recommendations curated to help families save time, confusion, and money. No commissions. No pay-to-rank." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          Recommended Elder-Care Products
        </h1>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-12 text-slate-600">
          <p className="text-lg">
            Independent recommendations curated to help families save time, confusion, and money. 
            We may use affiliate links to support our work, but these never affect our rankings or recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {categoriesData.map((cat) => (
            <CategoryTile 
              key={cat.slug} 
              title={cat.title} 
              slug={cat.slug}
              tagline={cat.tagline}
              // icon={cat.icon} // TODO: Map string to Lucide icon
            />
          ))}
        </div>

        <AffiliateDisclaimer />
      </div>
    </div>
  );
};
