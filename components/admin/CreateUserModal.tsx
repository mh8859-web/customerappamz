import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { UserRole } from '../../types';
import { USER_ROLES } from '../../constants';
import { EyeIcon, EyeOffIcon } from '../icons';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: {
    fullName: string;
    role: UserRole;
    userId: string;
    password: string;
    verified: boolean;
  }) => Promise<void>;
}

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div>
      <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
      {children}
  </div>
);

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Designer' as UserRole,
    userId: '',
    password: '',
    verified: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // This effect resets the form's state whenever the modal is closed.
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: '',
        role: 'Designer' as UserRole,
        userId: '',
        password: '',
        verified: false,
      });
      setShowPassword(false);
      setPasswordError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
    if (formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
    }
    setPasswordError('');
    setIsSubmitting(true);
    await onCreate(formData);
  };
  
  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface placeholder:text-text-secondary/80";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name">
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={formInputClasses} required />
        </FormField>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Role">
                <select name="role" value={formData.role} onChange={handleChange} className={formInputClasses} required>
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </FormField>
            <FormField label="User ID">
                <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={formInputClasses} required placeholder="Create a unique ID" />
                 <p className="mt-1 text-xs text-text-secondary">This is the unique ID the user will use to log in.</p>
            </FormField>
        </div>

        <FormField label="Password">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={(e) => {
                    handleChange(e);
                    if (passwordError) setPasswordError('');
                }}
                className={`${formInputClasses} pr-10`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {passwordError ? (
                <p className="mt-1 text-xs text-red-400">{passwordError}</p>
            ) : (
                <p className="mt-1 text-xs text-text-secondary">Must be at least 6 characters.</p>
            )}
        </FormField>
        
        <div className="flex items-center">
            <input type="checkbox" id="verified" name="verified" checked={formData.verified} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
            <label htmlFor="verified" className="ml-2 block text-sm text-text-primary">
                Mark as Verified
            </label>
        </div>
        
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating User...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;