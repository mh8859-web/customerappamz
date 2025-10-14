import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface border border-border-color/50 rounded-xl p-6 shadow-subtle ${className}`}>
      {children}
    </div>
  );
};

export default Card;