import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  // Added optional onClick prop to resolve assignment errors in components using Card as a clickable element
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