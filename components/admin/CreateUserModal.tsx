import React, { useState, useEffect } from 'react';
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

const FormField: React.FC<{label: string, icon?: React.ReactNode, children: React.ReactNode, className?: string}> = ({label, icon, children, className = ""}) => (
  <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-[1.5px] text-slate-400 ml-1 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
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

  useEffect(() => {
    if (formData.role === 'Customer' && mobileNumber.length === 10) {
        const id = mobileNumber.substring(0, 5);
        setFormData(prev => ({
            ...prev,
            userId: id,
            email: `${id}@amazmodular.com`,
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
  
  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-[14px] py-2.5 px-4 text-[13px] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 focus:bg-white transition-all duration-200 placeholder:text-slate-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Identity Center">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Row 1: Name & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" icon={<UserIcon className="w-3 h-3"/>}>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} placeholder="Alex Pierce" required />
            </FormField>

            <FormField label="System Role" icon={<ShieldCheckIcon className="w-3 h-3"/>}>
                <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </FormField>
        </div>

        {/* Row 2: ID & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.role === 'Customer' ? (
                 <FormField label="Client Mobile" icon={<PhoneIcon className="w-3 h-3"/>}>
                    <input 
                        type="tel" 
                        value={mobileNumber} 
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10))} 
                        className={inputClasses}
                        placeholder="10 Digits"
                        required 
                    />
                </FormField>
            ) : (
                <FormField label="Unique ID" icon={<UserIcon className="w-3 h-3"/>}>
                    <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required placeholder="DES-4402" />
                </FormField>
            )}

            <FormField label="Account Email" icon={<MailIcon className="w-3 h-3"/>}>
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={`${inputClasses} ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100 opacity-70' : ''}`} 
                    placeholder="name@example.com" 
                    required 
                    readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                />
            </FormField>
        </div>

        {/* Row 3: Security Key & Verification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <FormField label="Access Key" icon={<ShieldCheckIcon className="w-3 h-3"/>}>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClasses} pr-12 ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100 opacity-70' : ''}`}
                        placeholder="••••••••"
                        required
                        readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                    />
                    {formData.role !== 'Customer' && (
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue">
                            {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </FormField>

            <div className="flex items-center gap-3 px-1 h-11 bg-slate-50 border border-dashed border-slate-200 rounded-[14px]">
                <input type="checkbox" id="verify-check" name="verified" checked={formData.verified} onChange={handleChange} className="w-4 h-4 ml-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20" />
                <label htmlFor="verify-check" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">Verify Entity</label>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3.5 text-[10px] font-black uppercase tracking-[2px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Discard
          </button>
          <Button 
            type="submit" 
            className="flex-1 !py-4 !rounded-2xl !bg-slate-900 !text-[11px] !font-black !tracking-[3px] uppercase shadow-button" 
            disabled={isSubmitting}
          >
              {isSubmitting ? 'Processing...' : 'Confirm & Provision'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;