import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const baseClasses = 'px-6 py-3 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-bg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105';
  
  const variantClasses = {
    primary: 'bg-accent text-primary-bg shadow-soft hover:shadow-glow-accent hover:bg-accent-hover focus:ring-accent',
    secondary: 'bg-surface text-text-headline border border-border-color hover:bg-border-color focus:ring-text-headline'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;