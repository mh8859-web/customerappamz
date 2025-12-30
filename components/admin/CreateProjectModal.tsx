
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress' | 'status' | 'stage'>, quoteFile: File) => Promise<void>;
}

const FormField: React.FC<{label: string, children: React.ReactNode, fullWidth?: boolean}> = ({label, children, fullWidth = false}) => (
  <div className={fullWidth ? 'col-span-full' : 'col-span-1'}>
      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{label}</label>
      {children}
  </div>
);

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { user: adminUser } = useAuth();
  const { users } = useUsers();
  const initialFormData = {
    title: '',
    description: '',
    customerId: '',
    designerId: '',
    address: '',
    budgetDisplay: '',
    areaSqft: '',
    startDate: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setQuoteFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const clients = users.filter(u => u.role === 'Customer');
  const designers = users.filter(u => u.role === 'Designer');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQuoteFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    if (!quoteFile) {
        alert("Please select an initial quote PDF to upload.");
        return;
    };
    
    setIsSubmitting(true);
    try {
        await onCreate({
            ...formData,
            budgetDisplay: parseInt(formData.budgetDisplay, 10) || 0,
            areaSqft: parseInt(formData.areaSqft, 10) || 0,
            adminId: adminUser.id,
        }, quoteFile);
        onClose();
    } catch (err: any) {
        console.error(err);
        alert(`Failed to create project: ${err.message || 'Unknown error'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formInputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[14px] text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/40 focus:bg-white placeholder:text-slate-400 transition-all duration-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate New Project">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <FormField label="Project Identity" fullWidth>
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            className={formInputClasses} 
            placeholder="e.g. Skyline Penthouse Renovation" 
            required 
          />
        </FormField>
        
        <FormField label="Project Brief" fullWidth>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className={`${formInputClasses} resize-none`} 
            rows={2} 
            placeholder="High-level project scope and vision..." 
            required 
          />
        </FormField>

        <FormField label="Assigned Client">
            <select name="customerId" value={formData.customerId} onChange={handleChange} className={formInputClasses} required>
                <option value="">Select identity...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
        </FormField>

        <FormField label="Lead Designer">
            <select name="designerId" value={formData.designerId} onChange={handleChange} className={formInputClasses} required>
                <option value="">Assign creative lead...</option>
                {designers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
        </FormField>

        <FormField label="Site Physical Address" fullWidth>
          <input 
            type="text" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            className={formInputClasses} 
            placeholder="Full site location details" 
            required 
          />
        </FormField>

        <FormField label="Estimated Budget (₹)">
          <input 
            type="number" 
            name="budgetDisplay" 
            value={formData.budgetDisplay} 
            onChange={handleChange} 
            className={formInputClasses} 
            placeholder="0.00" 
            required 
          />
        </FormField>

        <FormField label="Floor Area (SQFT)">
          <input 
            type="number" 
            name="areaSqft" 
            value={formData.areaSqft} 
            onChange={handleChange} 
            className={formInputClasses} 
            placeholder="e.g. 2400" 
            required 
          />
        </FormField>

        <FormField label="Target Commencement">
          <input 
            type="date" 
            name="startDate" 
            value={formData.startDate} 
            onChange={handleChange} 
            className={formInputClasses} 
            required 
          />
        </FormField>

        <FormField label="Initial Proposal (PDF)">
            <div className="relative">
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    required
                />
                <div className={`${formInputClasses} flex items-center justify-between pointer-events-none`}>
                    <span className={quoteFile ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                        {quoteFile ? quoteFile.name : 'Upload document...'}
                    </span>
                    <div className="bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase px-2 py-1 rounded-md">Browse</div>
                </div>
            </div>
        </FormField>

        <div className="col-span-full flex justify-end items-center pt-8 mt-4 border-t border-slate-100 gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-widest px-4 py-2 transition-colors"
            disabled={isSubmitting}
          >
            Discard
          </button>
          <Button 
            type="submit" 
            className="!px-10 !py-4 !rounded-2xl !bg-slate-900 hover:!bg-brand-dark !shadow-button transition-all duration-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Initiate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
