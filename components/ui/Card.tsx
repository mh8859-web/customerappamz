
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  // Added onClick prop to support interactive cards
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-surface rounded-2xl p-6 shadow-card ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
