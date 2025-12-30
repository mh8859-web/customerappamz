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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex justify-center items-center p-4 sm:p-6 overflow-hidden transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] shadow-modal w-full max-w-2xl flex flex-col border border-slate-200/50 overflow-hidden modal-content-animation"
        style={{ maxHeight: 'min(90vh, 800px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex justify-between items-center border-b border-slate-100 px-8 py-6 flex-shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none uppercase">{title}</h2>
            <div className="h-1.5 w-12 bg-brand-blue rounded-full mt-3 shadow-sm"></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 rounded-full p-2 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar overflow-x-hidden flex-1 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;