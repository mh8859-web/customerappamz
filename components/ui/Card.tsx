import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface rounded-2xl p-6 shadow-card ${className}`}>
      {children}
    </div>
  );
};

export default Card;