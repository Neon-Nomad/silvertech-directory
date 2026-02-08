import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProductCard } from '../../components/ProductCard';
import { BuyerGuidePlaceholder } from '../../components/BuyerGuidePlaceholder';
import { FAQPlaceholder } from '../../components/FAQPlaceholder';
import { AffiliateDisclaimer } from '../../components/AffiliateDisclaimer';
import productsData from '../../data/products.json';
import categoriesData from '../../data/productCategories.json';
import { useJsonLd } from '@/src/hooks/useJsonLd';

export const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  
  // Find category metadata
  const categoryMeta = categoriesData.find(c => c.slug === category);
  
  // Get products for this category
  const products = category && (productsData as any)[category] ? (productsData as any)[category] : [];

  // Generate Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((product: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "image": product.image,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.stars,
          "reviewCount": product.reviews || 0
        }
      }
    }))
  };

  useJsonLd(itemListSchema);

  if (!categoryMeta) {
    return <Navigate to="/products" replace />;
  }

  const pageTitle = `${categoryMeta.title} | SilverTech Directory`;
  const pageDescription = `Top recommended ${categoryMeta.title.toLowerCase()} for seniors. Independent reviews and guides.`;
  const canonicalUrl = `https://silvertechdirectory.com/products/${categoryMeta.slug}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          {categoryMeta.title}
        </h1>

        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-12 text-slate-600">
          <p className="text-lg mb-2">
            Independent recommendations curated to help families save time, confusion, and money. 
            No commissions. No pay-to-rank.
          </p>
          <p className="text-sm text-slate-500">
            {categoryMeta.tagline}
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
              <p className="mb-2">No products available in this category yet.</p>
              <p className="text-sm">Check back soon for our curated list.</p>
            </div>
          )}
        </div>

        <FAQPlaceholder />

        <AffiliateDisclaimer />
      </div>
    </div>
  );
};
