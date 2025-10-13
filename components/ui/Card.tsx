import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface/80 backdrop-blur-sm border border-border-color rounded-xl p-6 shadow-soft ${className}`}>
      {children}
    </div>
  );
};

export default Card;