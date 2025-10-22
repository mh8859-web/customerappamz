import React, { ReactNode } from 'react';
import { XMarkIcon } from '../icons';

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
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-2xl shadow-modal w-full max-w-lg transform modal-content-animation flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-border-color p-5 flex-shrink-0">
          <h2 className="text-xl font-display font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary rounded-full p-1.5 bg-secondary hover:bg-secondary-hover">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;