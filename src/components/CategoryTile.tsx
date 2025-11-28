import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryTileProps {
  title: string;
  slug: string;
  tagline?: string;
  image?: string; // Placeholder for now
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ title, slug, tagline, image }) => {
  return (
    <Link to={`/products/${slug}`} className="group block h-full">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="h-40 bg-slate-100 flex items-center justify-center flex-shrink-0">
          {/* Placeholder Image Area */}
          <span className="text-slate-400">Icon</span>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-2">
            {title}
          </h3>
          {tagline && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {tagline}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
