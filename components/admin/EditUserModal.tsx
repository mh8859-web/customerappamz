import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, UserRole } from '../../types';
import { USER_ROLES } from '../../constants';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (userId: string, updates: Partial<User>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Designer' as UserRole,
    userId: '',
    verified: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        role: user.role,
        userId: user.userId || '',
        verified: user.verified || false,
      });
    }
    // Reset submitting state when modal is opened/closed or user changes
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [user, isOpen]);

  // FIX: Added a type guard to ensure `e.target` is an HTMLInputElement before accessing its `checked` property, resolving a TypeScript error.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
        setFormData(prev => ({ ...prev, [name]: e.target.checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
        const updates: Partial<User> = {};
        if (formData.fullName !== user.fullName) updates.fullName = formData.fullName;
        if (formData.role !== user.role) updates.role = formData.role;
        if (formData.userId !== user.userId) updates.userId = formData.userId;
        if (formData.verified !== user.verified) updates.verified = formData.verified;
        
        if (Object.keys(updates).length > 0) {
            setIsSubmitting(true);
            await onUpdate(user.id, updates);
            setIsSubmitting(false);
        }
    }
    onClose();
  };
  
  const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-text-headline mb-1">{label}</label>
        {children}
    </div>
  );

  const inputClasses = "w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent";

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user.fullName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name">
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} required />
        </FormField>
        <FormField label="Role">
            <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
        </FormField>
        <FormField label="User ID">
            <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required />
        </FormField>
         <FormField label="Email (System - Cannot be changed)">
            <input type="email" value={user.email} readOnly className={`${inputClasses} bg-surface cursor-not-allowed text-text-muted`} />
        </FormField>
        
        <div className="flex items-center">
            <input type="checkbox" id="edit-verified" name="verified" checked={formData.verified} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
            <label htmlFor="edit-verified" className="ml-2 block text-sm text-text-headline">
                Mark as Verified
            </label>
        </div>
        
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;