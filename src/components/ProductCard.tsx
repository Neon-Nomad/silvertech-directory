import React from 'react';
import { Star } from 'lucide-react';

interface ProductCardProps {
  name: string;
  image: string;
  stars: number;
  reviews?: number;
  shortReview: string;
  affiliateLink: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ name, image, stars, reviews, shortReview, affiliateLink }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="h-48 bg-slate-100 flex items-center justify-center relative">
        {/* Placeholder Image */}
        <span className="text-slate-400">Product Image</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{name || 'Product Name Placeholder'}</h3>
        
        <div className="flex items-center mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < stars ? 'fill-current' : 'text-slate-300'}`} />
            ))}
          </div>
          <span className="text-xs text-slate-500 ml-2">({reviews} reviews)</span>
        </div>

        <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-3">
          {shortReview || 'Product summary placeholder text. This will describe the key features and benefits of the product.'}
        </p>

        <a 
          href={affiliateLink || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-center font-medium rounded-lg transition-colors mt-auto"
        >
          View Product
        </a>
      </div>
    </div>
  );
};
