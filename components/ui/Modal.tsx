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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex justify-center items-center p-4 transition-all duration-300 overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] shadow-modal w-full max-w-lg transform modal-content-animation flex flex-col border border-slate-200/50 overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 40px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-100 px-6 py-5 flex-shrink-0">
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none">{title}</h2>
            <div className="h-1 w-8 bg-brand-blue rounded-full mt-2"></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 rounded-full p-2 bg-slate-50 hover:bg-slate-100 transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar overflow-x-hidden flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;