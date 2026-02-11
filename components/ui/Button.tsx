import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white' | 'outline-white' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center border font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "border-transparent text-white bg-charcoal hover:bg-black focus:ring-charcoal shadow-sm",
    secondary: "border-transparent text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500",
    outline: "border-warm-gray text-charcoal bg-white hover:bg-warm-gray focus:ring-primary-500",
    white: "border-transparent text-charcoal bg-white hover:bg-warm-gray focus:ring-white",
    "outline-white": "border-white text-white bg-transparent hover:bg-white/10 focus:ring-white",
    ghost: "border-transparent text-charcoal/70 hover:text-charcoal hover:bg-warm-gray focus:ring-primary-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};