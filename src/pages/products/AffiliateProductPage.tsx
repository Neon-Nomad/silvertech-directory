import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/src/lib/supabase';
import { ProductCard } from '../../components/ProductCard';
import { AffiliateDisclaimer } from '../../components/AffiliateDisclaimer';
import categoriesData from '../../data/productCategories.json';

interface Product {
    id: string;
    name: string;
    category: string;
    affiliate_url: string;
    image_url: string;
    recommendation_reason: string;
}

export const AffiliateProductPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('affiliate_products')
                .select('*');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Helmet>
                <title>Silver Tech Approved Products | SilverTech Directory</title>
                <meta name="description" content="Curated selection of safety and mobility products for seniors." />
                <link rel="canonical" href="https://silvertechdirectory.com/products/affiliate" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content="Silver Tech Approved Products | SilverTech Directory" />
                <meta property="og:description" content="Curated selection of safety and mobility products for seniors." />
                <meta property="og:url" content="https://silvertechdirectory.com/products/affiliate" />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Silver Tech Approved Products | SilverTech Directory" />
                <meta name="twitter:description" content="Curated selection of safety and mobility products for seniors." />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                    Silver Tech Approved Products
                </h1>

                <div className="bg-white p-6 rounded-lg border border-slate-200 mb-8 text-slate-600">
                    <p className="text-lg mb-2">
                        Independent recommendations curated to help families save time, confusion, and money.
                    </p>
                    <AffiliateDisclaimer />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        All Categories
                    </button>
                    {categoriesData.map(cat => (
                        <button
                            key={cat.slug}
                            onClick={() => setActiveCategory(cat.slug)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.slug
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {cat.title}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500">Loading products...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    name={product.name}
                                    image={product.image_url}
                                    stars={5} // Mock stars as they are not in DB yet
                                    reviews={0} // Mock reviews
                                    shortReview={product.recommendation_reason}
                                    affiliateLink={product.affiliate_url}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
                                <p>No products found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
