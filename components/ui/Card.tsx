import React from 'react';

interface CardProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ id, className = '', children }) => {
  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-warm-gray shadow-[0_1px_2px_rgba(45,45,45,0.06)] p-6 md:p-7 ${className}`}
    >
      {children}
    </div>
  );
};
