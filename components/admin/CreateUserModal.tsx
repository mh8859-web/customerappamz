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
  <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-black uppercase tracking-[2px] text-slate-400 ml-1 flex items-center gap-2">
        {icon && <span className="text-brand-blue opacity-50">{icon}</span>}
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
  
  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-[16px] py-3.5 px-5 text-sm text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 focus:bg-white transition-all duration-200 placeholder:text-slate-300 shadow-inner";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Identity Provisioning">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Identity Group */}
            <FormField label="Full Legal Name" icon={<UserIcon className="w-3 h-3"/>} className="md:col-span-2">
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} placeholder="Alex Pierce" required />
            </FormField>

            <FormField label="Designated Role" icon={<ShieldCheckIcon className="w-3 h-3"/>}>
                <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </FormField>

            {formData.role === 'Customer' ? (
                 <FormField label="Identity Mobile" icon={<PhoneIcon className="w-3 h-3"/>}>
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
                <FormField label="Access ID (User ID)" icon={<UserIcon className="w-3 h-3"/>}>
                    <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required placeholder="DES-4402" />
                </FormField>
            )}

            {/* Credential Group */}
            <FormField label="System Email" icon={<MailIcon className="w-3 h-3"/>} className="md:col-span-2">
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={`${inputClasses} ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100 opacity-60' : ''}`} 
                    placeholder="name@amazmodular.com" 
                    required 
                    readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                />
            </FormField>

            <FormField label="Security Key (Password)" icon={<ShieldCheckIcon className="w-3 h-3"/>} className="md:col-span-2">
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClasses} pr-14 ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100 opacity-60' : ''}`}
                        placeholder="••••••••••••"
                        required
                        readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                    />
                    {formData.role !== 'Customer' && (
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue transition-colors">
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </FormField>
        </div>
        
        {/* Verification Checkbox - Full Width Background */}
        <div className="flex items-center justify-between p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
            <div className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" id="verify-check" name="verified" checked={formData.verified} onChange={handleChange} className="w-5 h-5 rounded-lg border-slate-300 text-brand-blue focus:ring-brand-blue/20" />
                <label htmlFor="verify-check" className="text-xs font-black text-slate-600 uppercase tracking-widest cursor-pointer">Authorize & Verify Entity</label>
            </div>
            <div className="hidden sm:block text-[10px] font-bold text-brand-blue uppercase opacity-60">Verified Access Profile</div>
        </div>
        
        {/* Actions - Horizontal and Wide */}
        <div className="flex items-center justify-end gap-6 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-4 text-[12px] font-black uppercase tracking-[3px] text-slate-400 hover:text-slate-900 transition-all"
          >
            Discard
          </button>
          <Button 
            type="submit" 
            className="!py-5 !px-12 !rounded-2xl !bg-slate-900 !text-[12px] !font-black !tracking-[4px] uppercase shadow-button active:scale-95" 
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