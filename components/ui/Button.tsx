import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  // Added 'gold' to the variant options to support brand-specific luxury styling
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  type = 'button', 
  disabled = false,
  title 
}) => {
  const baseClasses = 'px-6 py-2.5 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variantClasses = {
    primary: 'bg-brand-blue text-white shadow-button hover:bg-brand-blue-dark hover:shadow-lg',
    secondary: 'bg-brand-blue-light text-brand-blue border border-brand-blue/10 hover:bg-blue-100',
    danger: 'bg-red-50 text-accent-danger border border-red-100 hover:bg-red-100',
    ghost: 'bg-transparent text-text-secondary hover:bg-slate-100 hover:text-text-primary',
    // Added gold variant styles using theme-specific luxury colors
    gold: 'bg-brand-gold text-brand-dark shadow-gold-glow hover:bg-brand-gold-dark hover:shadow-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;