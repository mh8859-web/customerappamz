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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-[28px] shadow-modal w-full max-w-xl transform modal-content-animation flex flex-col max-h-[90vh] border border-slate-200/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-100 p-5 flex-shrink-0">
          <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-2 bg-slate-50 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;