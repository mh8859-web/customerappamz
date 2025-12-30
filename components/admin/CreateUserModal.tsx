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
  <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-[9px] font-black uppercase tracking-[1.5px] text-slate-400 ml-1 flex items-center gap-1.5 h-3">
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
  
  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-[12px] py-2 px-3.5 text-[13px] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/30 focus:bg-white transition-all duration-150 placeholder:text-slate-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Provision ID">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Full Identity */}
        <FormField label="Full Legal Name" icon={<UserIcon className="w-2.5 h-2.5"/>}>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} placeholder="Alex Pierce" required />
        </FormField>

        {/* Row 2: Grid for Role and Unique ID */}
        <div className="grid grid-cols-2 gap-3">
            <FormField label="System Role" icon={<ShieldCheckIcon className="w-2.5 h-2.5"/>}>
                <select name="role" value={formData.role} onChange={handleChange} className={inputClasses} required>
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </FormField>

            {formData.role === 'Customer' ? (
                 <FormField label="Identity Phone" icon={<PhoneIcon className="w-2.5 h-2.5"/>}>
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
                <FormField label="Identity Key" icon={<UserIcon className="w-2.5 h-2.5"/>}>
                    <input type="text" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required placeholder="DES-4402" />
                </FormField>
            )}
        </div>

        {/* Credentials Card - Compacted */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <FormField label="Auth Email" icon={<MailIcon className="w-2.5 h-2.5"/>}>
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={`${inputClasses} ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100 opacity-60' : 'bg-white'}`} 
                    placeholder="name@amaz.com" 
                    required 
                    readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                />
            </FormField>

            <FormField label="Security Key" icon={<ShieldCheckIcon className="w-2.5 h-2.5"/>}>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClasses} pr-10 ${formData.role === 'Customer' && mobileNumber.length === 10 ? 'bg-slate-100 opacity-60' : 'bg-white'}`}
                        placeholder="••••••••"
                        required
                        readOnly={formData.role === 'Customer' && mobileNumber.length === 10}
                    />
                    {formData.role !== 'Customer' && (
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue">
                            {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </FormField>
        </div>
        
        {/* Verification Check & Actions */}
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
            <div className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" id="verify-check" name="verified" checked={formData.verified} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20" />
                <label htmlFor="verify-check" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none group-hover:text-slate-900 transition-colors">Verify Account</label>
            </div>
            <div className="flex gap-2">
               <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-[10px] font-black uppercase tracking-[2px] text-slate-400 hover:text-slate-600"
              >
                Discard
              </button>
              <Button 
                type="submit" 
                className="!py-2.5 !px-6 !rounded-xl !bg-slate-900 !text-[10px] !font-black !tracking-[2px] uppercase shadow-button" 
                disabled={isSubmitting}
              >
                  {isSubmitting ? 'Working...' : 'Provision Now'}
              </Button>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;