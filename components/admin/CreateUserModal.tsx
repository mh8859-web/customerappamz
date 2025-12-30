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
  <div className={`flex flex-col gap-3 ${className}`}>
      <label className="text-[12px] font-black uppercase tracking-[3px] text-slate-400 ml-1 flex items-center gap-2">
        {icon && <span className="text-brand-blue">{icon}</span>}
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
  
  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-[24px] py-5 px-8 text-lg text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white transition-all duration-300 placeholder:text-slate-300 shadow-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Identity Provisioning Terminal">
      <form onSubmit={handleSubmit} className="space-y-16">
        
        {/* ROW 1: CORE IDENTITY (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <FormField label="Full Legal Identity" icon={<UserIcon className="w-5 h-5"/>} className="lg:col-span-1">
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} placeholder="First Last" required />
            </FormField>

            <FormField label="System Permission Role" icon={<ShieldCheckIcon className="w-5 h-5"/>}>
                <select name="role" value={formData.role} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </FormField>

            {formData.role === 'Customer' ? (
                 <FormField label="Communication Mobile" icon={<PhoneIcon className="w-5 h-5"/>}>
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
                <FormField label="Unique Access Key (ID)" icon={<UserIcon className="w-5 h-5"/>}>
                    <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required placeholder="e.g. DES-101" />
                </FormField>
            )}
        </div>

        {/* ROW 2: SECURITY & AUTH (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end">
            <FormField label="Directory Auth Email" icon={<MailIcon className="w-5 h-5"/>}>
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={`${inputClasses} ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'opacity-50' : ''}`} 
                    placeholder="id@amaz.com" 
                    required 
                    readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                />
            </FormField>

            <FormField label="Encrypted Security Key" icon={<ShieldCheckIcon className="w-5 h-5"/>}>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClasses} pr-16 ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'opacity-50' : ''}`}
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

            <div className="flex items-center justify-between p-5 bg-brand-blue/5 border border-brand-blue/10 rounded-[24px] h-[72px] px-8">
                <div className="flex items-center gap-4 cursor-pointer group">
                    <input type="checkbox" id="verify-hub" name="verified" checked={formData.verified} onChange={handleChange} className="w-7 h-7 rounded-xl border-slate-300 text-brand-blue focus:ring-brand-blue/20" />
                    <label htmlFor="verify-hub" className="text-[13px] font-black text-slate-600 uppercase tracking-widest cursor-pointer select-none">Authorize & Verify</label>
                </div>
                <div className="hidden xl:block text-[10px] font-bold text-brand-blue uppercase opacity-60">Verified Identity</div>
            </div>
        </div>
        
        {/* ACTIONS: FULL WIDTH FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-8 pt-12 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-10 py-5 text-[14px] font-black uppercase tracking-[5px] text-slate-400 hover:text-slate-900 transition-all"
          >
            Cancel
          </button>
          <Button 
            type="submit" 
            className="w-full sm:w-auto !py-6 !px-24 !rounded-[28px] !bg-slate-900 !text-[14px] !font-black !tracking-[6px] uppercase shadow-premium hover:scale-[1.03] active:scale-95 transition-all" 
            disabled={isSubmitting}
          >
              {isSubmitting ? 'Provisioning...' : 'Confirm Provision'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;