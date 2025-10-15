import React, { useState, useEffect, useCallback } from 'react';
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

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div>
      <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
      {children}
  </div>
);

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Designer' as UserRole,
    userId: '',
    verified: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullName: user.fullName,
        role: user.role,
        userId: user.userId || '',
        verified: user.verified || false,
      });
    } else if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [user, isOpen]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        setFormData(prev => ({ ...prev, [target.name]: target.checked }));
    } else {
        setFormData(prev => ({ ...prev, [target.name]: target.value }));
    }
  }, []);

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
  
  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface placeholder:text-text-secondary/80";

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user.fullName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name">
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={formInputClasses} required />
        </FormField>
        <FormField label="Role">
            <select name="role" value={formData.role} onChange={handleChange} className={formInputClasses} required>
                {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
        </FormField>
        <FormField label="User ID">
            <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={formInputClasses} required />
        </FormField>
         <FormField label="Email (System - Cannot be changed)">
            <input type="email" value={user.email} readOnly className={`${formInputClasses} bg-secondary cursor-not-allowed text-text-secondary`} />
        </FormField>
        
        <div className="flex items-center">
            <input type="checkbox" id="edit-verified" name="verified" checked={formData.verified} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
            <label htmlFor="edit-verified" className="ml-2 block text-sm text-text-primary">
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