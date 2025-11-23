import React from 'react';

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  dark?: boolean;
}

export const Section: React.FC<SectionProps> = ({ id, className = '', children, dark = false }) => {
  return (
    <section 
      id={id} 
      className={`py-20 px-6 md:px-12 lg:px-24 ${dark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
};