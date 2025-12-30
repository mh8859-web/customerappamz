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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex justify-center items-center p-2 sm:p-4 overflow-hidden transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[24px] shadow-modal w-full max-w-lg flex flex-col border border-slate-200/50 overflow-hidden modal-content-animation"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex justify-between items-center border-b border-slate-100 px-5 py-4 flex-shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-display font-black text-slate-900 tracking-tight leading-none uppercase">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 rounded-full p-1.5 bg-slate-50 hover:bg-slate-100 transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar overflow-x-hidden flex-1 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;