import React from 'react';

interface SectionHeaderProps {
  title: string;
  helper?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, helper, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2 pb-4 border-b border-warm-gray ${className}`}>
      <h2 className="text-xl md:text-[22px] font-semibold text-charcoal">{title}</h2>
      {helper ? <p className="text-sm text-charcoal/60">{helper}</p> : null}
    </div>
  );
};
