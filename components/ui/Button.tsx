import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white' | 'outline-white';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 shadow-sm",
    secondary: "border-transparent text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500",
    outline: "border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-primary-500",
    white: "border-transparent text-slate-900 bg-white hover:bg-slate-100 focus:ring-white",
    "outline-white": "border-white text-white bg-transparent hover:bg-white/10 focus:ring-white",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};