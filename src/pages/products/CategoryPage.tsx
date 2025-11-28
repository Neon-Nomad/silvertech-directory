import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProductCard } from '../../components/ProductCard';
import { BuyerGuidePlaceholder } from '../../components/BuyerGuidePlaceholder';
import { FAQPlaceholder } from '../../components/FAQPlaceholder';
import { AffiliateDisclaimer } from '../../components/AffiliateDisclaimer';
import productsData from '../../data/products.json';

export const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  
  // Helper to format slug to title (e.g., "daily-living" -> "Daily Living")
  const formatTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const title = category ? formatTitle(category) : 'Products';
  const products = category && (productsData as any)[category] ? (productsData as any)[category] : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Helmet>
        <title>{title} Products | SilverTech Directory</title>
        <meta name="description" content={`Top recommended ${title} products for seniors.`} />
        {/* TODO: Insert ProductList schema here */}
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          {title} Products
        </h1>

        {/* Category Description Placeholder */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-12 text-slate-600">
          <p>
            [Category Description Placeholder] Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Detailed overview of {title} products will go here.
          </p>
        </div>

        <BuyerGuidePlaceholder />

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {products.length > 0 ? (
            products.map((product: any, index: number) => (
              <ProductCard key={index} {...product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
              No products available in this category yet.
            </div>
          )}
        </div>

        <FAQPlaceholder />

        <AffiliateDisclaimer />
      </div>
    </div>
  );
};
