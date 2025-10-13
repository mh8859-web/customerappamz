import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface/80 backdrop-blur-md rounded-xl shadow-soft border border-border-color w-full max-w-lg p-6 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-border-color pb-4 mb-4">
          <h2 className="text-xl font-bold text-text-headline">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-headline text-2xl font-light">&times;</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;