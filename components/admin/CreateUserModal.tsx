import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, UserRole } from '../../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: Omit<User, 'avatarUrl'>) => void;
}

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm text-text-headline">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={() => setEnabled(!enabled)} />
      <div className={`block w-14 h-8 rounded-full transition ${enabled ? 'bg-accent' : 'bg-surface'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    password: '',
    role: 'Designer' as UserRole,
    salary: '',
    verified: false,
    mobileNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleToggle = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, verified: enabled }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Exclude password and salary from the final user object for security/simplicity in this mock app
    const { password, salary, ...userData } = formData;
    
    if (!userData.id || !userData.fullName || !userData.email) {
        alert('Please fill all required fields');
        return;
    }

    onCreate({
        ...userData,
        role: userData.role as UserRole
    });

    // Reset form and close modal
    onClose();
    setFormData({
        id: '',
        fullName: '',
        email: '',
        password: '',
        role: 'Designer' as UserRole,
        salary: '',
        verified: false,
        mobileNumber: '',
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} required />
        </FormField>
        <FormField label="Email Address">
          <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} required />
        </FormField>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Role">
                <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                    <option value="Designer">Designer</option>
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                </select>
            </FormField>
            <FormField label="ID">
              <input type="text" name="id" value={formData.id} placeholder="e.g., user-designer-3" onChange={handleChange} className={inputClasses} required />
            </FormField>
        </div>
        
        {formData.role === 'Customer' ? (
          <FormField label="Mobile Number">
            <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className={inputClasses} required />
          </FormField>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField label="Password">
                <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClasses} required />
              </FormField>
               <FormField label="Salary (₹) (Admin view only)">
                <input type="number" name="salary" value={formData.salary} onChange={handleChange} className={inputClasses} required />
              </FormField>
          </div>
        )}

        <FormField label="File Upload (Optional)">
            <input type="file" className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/20 file:text-accent hover:file:bg-accent/30`}/>
        </FormField>
        <div className="bg-primary-bg p-3 rounded-xl">
           <ToggleSwitch label="Verified User" enabled={formData.verified} setEnabled={handleToggle} />
        </div>
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create User</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;