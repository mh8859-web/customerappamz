import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface UploadDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, notes: string, type: 'image' | 'gltf') => void;
}

const UploadDesignModal: React.FC<UploadDesignModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    const fileType = file.name.endsWith('.gltf') ? 'gltf' : 'image';
    await onUpload(file, notes, fileType);
    setIsUploading(false);
    onClose();
  };

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New Design">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Design File</label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept="image/*,.gltf" 
            className={`${formInputClasses} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20`} 
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Version Notes</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            rows={3} 
            className={formInputClasses} 
            placeholder="e.g., Added new lighting fixtures, changed wall color."
            required 
          />
        </div>
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Design'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadDesignModal;