import React from 'react';

interface FactItem {
  label: string;
  value: string | React.ReactNode;
}

interface FactGridProps {
  items: FactItem[];
}

export const FactGrid: React.FC<FactGridProps> = ({ items }) => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-50 rounded-lg border border-slate-100 px-4 py-3">
          <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">{item.label}</p>
          <div className="mt-1 text-[15px] font-semibold text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
};
