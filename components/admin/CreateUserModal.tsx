import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { UserRole } from '../../types';
import { USER_ROLES } from '../../constants';
import { EyeIcon, EyeOffIcon, MailIcon, UserIcon, ShieldCheckIcon, PhoneIcon } from '../icons';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: {
    fullName: string;
    email: string;
    role: UserRole;
    userId: string;
    password: string;
    verified: boolean;
  }) => Promise<void>;
}

const FormField: React.FC<{label: string, icon?: React.ReactNode, children: React.ReactNode, description?: string}> = ({label, icon, children, description}) => (
  <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
      {description && <p className="text-[10px] text-slate-400 font-medium italic ml-1">{description}</p>}
  </div>
);

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Designer' as UserRole,
    userId: '',
    password: '',
    verified: true,
  });
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: '',
        email: '',
        role: 'Designer' as UserRole,
        userId: '',
        password: '',
        verified: true,
      });
      setMobileNumber('');
      setShowPassword(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Auto-logic for Customers
  useEffect(() => {
    if (formData.role === 'Customer' && mobileNumber.length === 10) {
        const id = mobileNumber.substring(0, 5);
        setFormData(prev => ({
            ...prev,
            userId: id,
            email: `${id}@amazmodular.com`, // Auto-gen private email
            password: `@${mobileNumber.substring(5)}`,
        }));
    }
  }, [mobileNumber, formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
        await onCreate({
            ...formData,
            fullName: formData.fullName.trim(),
            userId: formData.userId.trim().toLowerCase(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password.trim(),
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/40 focus:bg-white placeholder:text-slate-300 transition-all duration-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Provision New Identity">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Identity Section */}
        <div className="space-y-4">
            <FormField label="Full Legal Name" icon={<UserIcon className="w-3 h-3"/>}>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} placeholder="e.g. Alexander Pierce" required />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Assign System Role" icon={<ShieldCheckIcon className="w-3 h-3"/>}>
                    <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                        {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </FormField>

                {formData.role === 'Customer' ? (
                     <FormField label="Verification Mobile" icon={<PhoneIcon className="w-3 h-3"/>}>
                        <input 
                            type="tel" 
                            value={mobileNumber} 
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10))} 
                            className={inputClasses}
                            placeholder="10-digit number"
                            required 
                        />
                    </FormField>
                ) : (
                    <FormField label="Unique Identity ID" icon={<UserIcon className="w-3 h-3"/>} description="Used for primary login identification.">
                        <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required placeholder="e.g. DES-4402" />
                    </FormField>
                )}
            </div>
        </div>

        {/* Credentials Section */}
        <div className="p-5 bg-slate-50/50 rounded-[24px] border border-slate-100 space-y-4">
            <FormField label="Account Email Address" icon={<MailIcon className="w-3 h-3"/>} description="Required for secure cloud authentication.">
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={inputClasses} 
                    placeholder="name@example.com" 
                    required 
                    readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                />
            </FormField>

            <FormField label="Access Security Key" icon={<ShieldCheckIcon className="w-3 h-3"/>}>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClasses} pr-12`}
                        placeholder="••••••••"
                        required
                        readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                    />
                    {formData.role !== 'Customer' && (
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue">
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </FormField>
        </div>
        
        <div className="flex items-center justify-between px-2 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="verified" checked={formData.verified} onChange={handleChange} className="w-5 h-5 rounded-lg border-slate-200 text-brand-blue focus:ring-brand-blue/20 transition-all" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest">Mark as Verified Entity</span>
            </label>
        </div>
        
        <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
          <Button type="submit" className="flex-[2] !py-4 !rounded-2xl !bg-slate-900 shadow-button" disabled={isSubmitting}>
              {isSubmitting ? 'Provisioning...' : 'Confirm & Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;