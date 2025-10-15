import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress' | 'status' | 'stage'>) => void;
}

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

  useEffect(() => {
    // Reset form data when the modal is closed to prevent stale input
    if (!isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const clients = users.filter(u => u.role === 'Customer');
  const designers = users.filter(u => u.role === 'Designer');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    
    onCreate({
        ...formData,
        budgetDisplay: parseInt(formData.budgetDisplay, 10),
        areaSqft: parseInt(formData.areaSqft, 10),
        adminId: adminUser.id,
    });
  };

  const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-text-headline mb-1">{label}</label>
        {children}
    </div>
  );

  const inputClasses = "w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Project Name">
          <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClasses} required />
        </FormField>
        <FormField label="Description">
          <textarea name="description" value={formData.description} onChange={handleChange} className={inputClasses} rows={3} required />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Client">
                <select name="customerId" value={formData.customerId} onChange={handleChange} className={inputClasses} required>
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
            </FormField>
            <FormField label="Designer">
                <select name="designerId" value={formData.designerId} onChange={handleChange} className={inputClasses} required>
                    <option value="">Assign a designer</option>
                    {designers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
            </FormField>
        </div>
        <FormField label="Site Location / Address">
          <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClasses} required />
        </FormField>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Total Budget (₹)">
              <input type="number" name="budgetDisplay" value={formData.budgetDisplay} onChange={handleChange} className={inputClasses} required />
            </FormField>
            <FormField label="Area (sqft)">
              <input type="number" name="areaSqft" value={formData.areaSqft} onChange={handleChange} className={inputClasses} required />
            </FormField>
        </div>
        <FormField label="Start Date">
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClasses} required />
        </FormField>
        <FormField label="Initial Quote (PDF)">
            <input type="file" accept=".pdf" className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/20 file:text-accent hover:file:bg-accent/30`}/>
        </FormField>
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create Project</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;