import React from 'react';

interface TabItem {
  label: string;
  href: string;
}

interface StickySectionTabsProps {
  items: TabItem[];
}

export const StickySectionTabs: React.FC<StickySectionTabsProps> = ({ items }) => {
  return (
    <div className="sticky top-0 z-20 bg-warm-gray pt-3 pb-3">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.06)] overflow-x-auto">
          <div className="flex gap-6 px-4 py-3 text-sm font-medium text-slate-600 whitespace-nowrap">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-slate-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
