
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FileTextIcon } from '../icons';

interface UploadQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, version: string) => Promise<void>;
}

const UploadQuoteModal: React.FC<UploadQuoteModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setVersion('');
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version.trim()) {
      alert("Please provide both the PDF file and a version name (e.g., V2, Final).");
      return;
    }
    setIsUploading(true);
    try {
        await onUpload(file, version.trim());
        onClose();
    } catch (err) {
        alert("Upload failed. Please try again.");
    } finally {
        setIsUploading(false);
    }
  };

  const formInputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/40 outline-none transition-all";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Quotation Document">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quotation Version</label>
          <input 
            type="text" 
            placeholder="e.g. Revised V2 or Final Execution Quote"
            value={version}
            onChange={e => setVersion(e.target.value)}
            className={formInputClasses}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PDF Asset</label>
          <div className="relative group">
            <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                required
            />
            <div className={`${formInputClasses} flex items-center justify-between pointer-events-none group-hover:bg-white group-hover:border-brand-blue/30`}>
                <span className={file ? 'text-slate-900' : 'text-slate-400'}>
                    {file ? file.name : 'Select PDF document...'}
                </span>
                <div className="bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase px-3 py-1.5 rounded-lg">Browse</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-4">Cancel</button>
          <Button type="submit" disabled={isUploading} className="!px-10 !py-4 !rounded-2xl !bg-slate-900 !text-[11px] !font-black uppercase tracking-widest shadow-button">
              {isUploading ? 'Uploading Document...' : 'Confirm Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadQuoteModal;
