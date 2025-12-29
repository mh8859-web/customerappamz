import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'white' | 'blue' | 'flat';
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, variant = 'white' }) => {
  const baseClasses = "rounded-2xl p-6 transition-all duration-300";
  
  const variants = {
    white: "bg-surface shadow-card border border-slate-100",
    blue: "bg-brand-blue text-white shadow-button",
    flat: "bg-slate-50 border border-slate-200"
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;