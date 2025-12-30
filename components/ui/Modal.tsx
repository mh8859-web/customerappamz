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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 sm:p-10 custom-scrollbar">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Expanded Container: Full Visibility Logic */}
      <div 
        className="relative bg-white rounded-[40px] shadow-modal w-full max-w-7xl border border-white/20 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center border-b border-slate-100 px-10 py-8 rounded-t-[40px] bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="h-10 w-2 bg-brand-blue rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)]"></div>
            <h2 className="text-3xl font-display font-black text-slate-900 tracking-tighter uppercase">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-slate-900 rounded-full p-3 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 shadow-sm"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>
        
        {/* Body: No internal max-height to avoid boxed clipping */}
        <div className="p-10 sm:p-16">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;