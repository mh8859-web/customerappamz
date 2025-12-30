import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '../icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Teleport the modal to the bottom of the body to escape dashboard clipping
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop: High-end blur and dark overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container: Full visibility logic */}
      <div 
        className="relative bg-white rounded-[40px] shadow-premium w-full max-w-5xl flex flex-col border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header: Fixed at top */}
        <div className="flex justify-between items-center border-b border-slate-100 px-8 py-6 flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 bg-brand-blue rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
            <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-slate-900 rounded-full p-2 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        
        {/* Body: Independent Scroll Area */}
        <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;