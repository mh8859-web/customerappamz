import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress' | 'status' | 'stage'>) => Promise<void>;
}

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div>
      <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
      {children}
  </div>
);

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { user: adminUser, users } = useAppContext();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset form data when the modal is closed to prevent stale input
    if (!isOpen) {
      setFormData(initialFormData);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const clients = users.filter(u => u.role === 'Customer');
  const designers = users.filter(u => u.role === 'Designer');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    
    setIsSubmitting(true);
    await onCreate({
        ...formData,
        budgetDisplay: parseInt(formData.budgetDisplay, 10),
        areaSqft: parseInt(formData.areaSqft, 10),
        adminId: adminUser.id,
    });
  };

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface placeholder:text-text-secondary/80";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Project Name">
          <input type="text" name="title" value={formData.title} onChange={handleChange} className={formInputClasses} required />
        </FormField>
        <FormField label="Description">
          <textarea name="description" value={formData.description} onChange={handleChange} className={formInputClasses} rows={3} required />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Client">
                <select name="customerId" value={formData.customerId} onChange={handleChange} className={formInputClasses} required>
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
            </FormField>
            <FormField label="Designer">
                <select name="designerId" value={formData.designerId} onChange={handleChange} className={formInputClasses} required>
                    <option value="">Assign a designer</option>
                    {designers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
            </FormField>
        </div>
        <FormField label="Site Location / Address">
          <input type="text" name="address" value={formData.address} onChange={handleChange} className={formInputClasses} required />
        </FormField>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Total Budget (₹)">
              <input type="number" name="budgetDisplay" value={formData.budgetDisplay} onChange={handleChange} className={formInputClasses} required />
            </FormField>
            <FormField label="Area (sqft)">
              <input type="number" name="areaSqft" value={formData.areaSqft} onChange={handleChange} className={formInputClasses} required />
            </FormField>
        </div>
        <FormField label="Start Date">
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={formInputClasses} required />
        </FormField>
        <FormField label="Initial Quote (PDF)">
            <input type="file" accept=".pdf" className={`${formInputClasses} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20`}/>
        </FormField>
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
