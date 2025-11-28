import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryTileProps {
  title: string;
  slug: string;
  image?: string; // Placeholder for now
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ title, slug, image }) => {
  return (
    <Link to={`/products/${slug}`} className="group block">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-48 bg-slate-100 flex items-center justify-center">
          {/* Placeholder Image Area */}
          <span className="text-slate-400">Image Placeholder</span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
};
