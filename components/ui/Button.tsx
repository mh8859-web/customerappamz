import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, title }) => {
  const baseClasses = 'px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0';
  
  const variantClasses = {
    primary: 'bg-brand-blue text-white shadow-sm hover:bg-brand-blue-hover focus:ring-brand-blue',
    secondary: 'bg-secondary text-text-primary hover:bg-secondary-hover focus:ring-brand-blue'
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
