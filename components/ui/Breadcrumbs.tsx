import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-1">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
            {item.path && index < items.length - 1 ? (
              <Link
                to={item.path}
                className="text-sm text-slate-500 hover:text-gold transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-charcoal">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
