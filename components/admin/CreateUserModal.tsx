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
  <div className={`flex flex-col gap-2.5 ${className}`}>
      <label className="text-[11px] font-black uppercase tracking-[2.5px] text-slate-400 ml-1 flex items-center gap-2">
        {icon && <span className="text-brand-blue/50">{icon}</span>}
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
      setFormData({ fullName: '', email: '', role: 'Designer' as UserRole, userId: '', password: '', verified: true });
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
  
  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-[22px] py-4.5 px-6 text-[15px] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 focus:bg-white transition-all duration-300 placeholder:text-slate-300 shadow-inner";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Identity Provisioning Hub">
      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* Section 1: Identity Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <FormField label="Full Legal Identity" icon={<UserIcon className="w-4 h-4"/>} className="md:col-span-2">
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} placeholder="Alex Pierce" required />
            </FormField>

            <FormField label="System Access Role" icon={<ShieldCheckIcon className="w-4 h-4"/>}>
                <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </FormField>

            {formData.role === 'Customer' ? (
                 <FormField label="Primary Contact (Mobile)" icon={<PhoneIcon className="w-4 h-4"/>}>
                    <input 
                        type="tel" 
                        value={mobileNumber} 
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10))} 
                        className={inputClasses}
                        placeholder="10 Digit Number"
                        required 
                    />
                </FormField>
            ) : (
                <FormField label="Unique Identity Key" icon={<UserIcon className="w-4 h-4"/>}>
                    <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required placeholder="e.g. DES-4402" />
                </FormField>
            )}
        </div>

        {/* Section 2: Security Credentials */}
        <div className="p-8 sm:p-10 bg-slate-50 border border-slate-100 rounded-[32px] space-y-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[3px] border-l-4 border-brand-blue pl-4">Authentication Config</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <FormField label="Network Email" icon={<MailIcon className="w-4 h-4"/>}>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className={`${inputClasses} ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100/50 cursor-not-allowed opacity-70' : 'bg-white'}`} 
                        placeholder="name@amaz.com" 
                        required 
                        readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                    />
                </FormField>

                <FormField label="Secure Access Key" icon={<ShieldCheckIcon className="w-4 h-4"/>}>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`${inputClasses} pr-16 ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100/50 cursor-not-allowed opacity-70' : 'bg-white'}`}
                            placeholder="••••••••••••"
                            required
                            readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                        />
                        {formData.role !== 'Customer' && (
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue transition-colors">
                                {showPassword ? <EyeOffIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                            </button>
                        )}
                    </div>
                </FormField>
            </div>
        </div>
        
        {/* Footer: Authorization & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-4 cursor-pointer group">
                <div className="relative flex items-center">
                    <input type="checkbox" id="verify-check" name="verified" checked={formData.verified} onChange={handleChange} className="w-6 h-6 rounded-lg border-slate-300 text-brand-blue focus:ring-brand-blue/20 cursor-pointer" />
                </div>
                <label htmlFor="verify-check" className="text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none group-hover:text-slate-900 transition-colors">Instantly Authorize & Verify Entity</label>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 sm:flex-none px-8 py-5 text-[13px] font-black uppercase tracking-[4px] text-slate-400 hover:text-slate-900 transition-all"
              >
                Discard
              </button>
              <Button 
                type="submit" 
                className="flex-1 sm:flex-none !py-5.5 !px-16 !rounded-[24px] !bg-slate-900 !text-[13px] !font-black !tracking-[5px] uppercase shadow-premium hover:scale-[1.02] active:scale-95" 
                disabled={isSubmitting}
              >
                  {isSubmitting ? 'Provisioning...' : 'Provision Entity'}
              </Button>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;