
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, UserRole, UserSalaryConfig } from '../../types';
import { USER_ROLES } from '../../constants';
import { uploadAvatar, uploadIdProof, upsertRecord } from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import { 
    UserIcon, BriefcaseIcon, DollarSignIcon, FileTextIcon, 
    XMarkIcon, UploadCloudIcon, CameraIcon, CheckCircleIcon,
    TrashIcon, EditIcon
} from '../icons';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (userId: string, updates: Partial<User>) => Promise<void>;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
    >
        {icon}
        {children}
    </button>
);

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'work' | 'docs' | 'payroll'>('profile');
  const [formData, setFormData] = useState<Partial<User>>({});
  const [salaryConfig, setSalaryConfig] = useState<Partial<UserSalaryConfig>>({ payType: 'Monthly', baseAmount: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // ID Proof Upload State
  const [idFiles, setIdFiles] = useState<File[]>([]);
  const [uploadingIds, setUploadingIds] = useState(false);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
        // Initialize form data
        setFormData({
            fullName: user.fullName,
            role: user.role,
            verified: user.verified,
            joinedDate: user.joinedDate || '',
            experience: user.experience || '',
            phoneNumber: user.phoneNumber || '',
            idProofUrls: user.idProofUrls || []
        });
        setAvatarPreview(user.avatarUrl);
        setAvatarFile(null);
        setIdFiles([]);
        
        // Fetch Salary
        const fetchSalary = async () => {
            const { data } = await supabase.from('user_salary_configs').select('*').eq('user_id', user.id).single();
            if (data) {
                setSalaryConfig({
                    payType: data.pay_type,
                    baseAmount: data.base_amount
                });
            } else {
                setSalaryConfig({ payType: 'Monthly', baseAmount: 0 });
            }
        };
        fetchSalary();
    }
  }, [user, isOpen]);

  const handleInputChange = (field: keyof User, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
      }
  };

  const handleIdProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) return;
      const files = Array.from(e.target.files || []) as File[];
      if (files.length === 0) return;
      
      const currentCount = (formData.idProofUrls?.length || 0) + idFiles.length;
      if (currentCount + files.length > 10) {
          alert("Maximum 10 ID proofs allowed.");
          return;
      }

      setUploadingIds(true);
      const newUrls: string[] = [];
      
      for (const file of files) {
          const url = await uploadIdProof(user.id, file);
          if (url) newUrls.push(url);
      }
      
      setFormData(prev => ({
          ...prev,
          idProofUrls: [...(prev.idProofUrls || []), ...newUrls]
      }));
      setUploadingIds(false);
  };

  const removeIdProof = (index: number) => {
      setFormData(prev => ({
          ...prev,
          idProofUrls: prev.idProofUrls?.filter((_, i) => i !== index)
      }));
  };

  const handleSubmit = async () => {
      if (!user) return;
      setIsSubmitting(true);

      try {
          // 1. Upload Avatar if changed
          let newAvatarUrl = user.avatarUrl;
          if (avatarFile) {
              const url = await uploadAvatar(user.id, avatarFile);
              if (url) newAvatarUrl = url;
          }

          // 2. Prepare User DB Updates
          const userUpdates: any = {
              full_name: formData.fullName,
              role: formData.role,
              verified: formData.verified,
              avatar_url: newAvatarUrl,
              joined_date: formData.joinedDate || null,
              experience: formData.experience,
              phone_number: formData.phoneNumber,
              id_proof_urls: formData.idProofUrls
          };

          await onUpdate(user.id, {
              ...formData,
              avatarUrl: newAvatarUrl
          }); // This handles local state update via prop function which likely calls upsertRecord internally or refreshes

          // Also explicitly update DB fields that might strictly need DB column names if onUpdate assumes generic User type
          await upsertRecord('users', { id: user.id, ...userUpdates });

          // 3. Update Salary
          await upsertRecord('user_salary_configs', {
              user_id: user.id,
              pay_type: salaryConfig.payType,
              base_amount: salaryConfig.baseAmount,
              updated_at: new Date().toISOString()
          });

          onClose();
      } catch (err) {
          console.error(err);
          alert("Failed to save changes.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all";
  const labelClasses = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1";

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee HR Profile">
        <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar / Tabs */}
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:w-48 flex-shrink-0">
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon className="w-4 h-4"/>}>Profile</TabButton>
                <TabButton active={activeTab === 'work'} onClick={() => setActiveTab('work')} icon={<BriefcaseIcon className="w-4 h-4"/>}>Work Info</TabButton>
                <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileTextIcon className="w-4 h-4"/>}>Documents</TabButton>
                <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<DollarSignIcon className="w-4 h-4"/>}>Payroll</TabButton>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
                
                {/* Header Info */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="relative group">
                        <img src={avatarPreview || user.avatarUrl} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100" alt="Avatar"/>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <CameraIcon className="w-6 h-6"/>
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </label>
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-slate-900 uppercase">{formData.fullName}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {user.userId} &bull; {formData.role}</p>
                    </div>
                </div>

                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in">
                        <div>
                            <label className={labelClasses}>Full Legal Name</label>
                            <input type="text" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Mobile Number</label>
                            <input type="tel" value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} className={inputClasses} placeholder="+91..." />
                        </div>
                        <div>
                            <label className={labelClasses}>System Email</label>
                            <input type="email" value={user.email} readOnly className={`${inputClasses} bg-slate-100 text-slate-400 cursor-not-allowed`} />
                        </div>
                        <div>
                            <label className={labelClasses}>Account Status</label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className={`text-xs font-bold uppercase tracking-wider ${formData.verified ? 'text-green-600' : 'text-slate-400'}`}>
                                    {formData.verified ? 'Verified Active' : 'Unverified'}
                                </span>
                                <button 
                                    onClick={() => handleInputChange('verified', !formData.verified)}
                                    className="ml-auto text-[10px] font-black uppercase underline text-brand-blue"
                                >
                                    Toggle Status
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'work' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in">
                        <div>
                            <label className={labelClasses}>Role / Designation</label>
                            <select value={formData.role} onChange={e => handleInputChange('role', e.target.value)} className={inputClasses}>
                                {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Date of Joining</label>
                            <input type="date" value={formData.joinedDate ? new Date(formData.joinedDate).toISOString().split('T')[0] : ''} onChange={e => handleInputChange('joinedDate', e.target.value)} className={inputClasses} />
                        </div>
                        <div className="col-span-full">
                            <label className={labelClasses}>Experience / Skills Summary</label>
                            <textarea 
                                value={formData.experience} 
                                onChange={e => handleInputChange('experience', e.target.value)} 
                                className={`${inputClasses} h-32 resize-none`} 
                                placeholder="e.g. 5 Years in Modular Kitchen Design, Expert in AutoCAD..." 
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-6 animate-in">
                        <div className="flex justify-between items-center">
                            <label className={labelClasses}>ID Proofs & Documents</label>
                            <span className="text-[10px] font-bold text-slate-400">{formData.idProofUrls?.length || 0} / 10 Uploaded</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.idProofUrls?.map((url, index) => (
                                <div key={index} className="relative aspect-[4/3] group rounded-xl overflow-hidden border border-slate-200 bg-white">
                                    <img src={url} alt="ID Proof" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeIdProof(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 left-0 right-0 bg-slate-900/60 text-white text-[9px] font-bold uppercase text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Full
                                    </a>
                                </div>
                            ))}
                            {(formData.idProofUrls?.length || 0) < 10 && (
                                <button 
                                    onClick={() => idFileInputRef.current?.click()}
                                    className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all"
                                >
                                    {uploadingIds ? <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div> : <UploadCloudIcon className="w-6 h-6" />}
                                    <span className="text-[9px] font-black uppercase">Upload New</span>
                                </button>
                            )}
                        </div>
                        <input type="file" ref={idFileInputRef} onChange={handleIdProofUpload} className="hidden" accept="image/*" multiple />
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <div className="space-y-6 animate-in">
                        <div className="p-6 bg-brand-gold/5 border border-brand-gold/20 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <DollarSignIcon className="w-5 h-5 text-brand-gold" />
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Remuneration Config</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Payout Structure</label>
                                    <select 
                                        value={salaryConfig.payType} 
                                        onChange={e => setSalaryConfig({...salaryConfig, payType: e.target.value as any})}
                                        className={inputClasses}
                                    >
                                        <option value="Monthly">Fixed Monthly Salary</option>
                                        <option value="Daily">Daily Wage Basis</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Base Valuation (₹)</label>
                                    <input 
                                        type="number" 
                                        value={salaryConfig.baseAmount} 
                                        onChange={e => setSalaryConfig({...salaryConfig, baseAmount: parseFloat(e.target.value) || 0})}
                                        className={inputClasses} 
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 italic">
                            * Changes to salary structure will reflect in the next payroll generation cycle (Admin Dashboard > Salary Allocation).
                        </p>
                    </div>
                )}

            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
            <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-colors">Discard Changes</button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="!rounded-xl !px-8 !py-3 !text-xs !font-black uppercase tracking-widest shadow-premium">
                {isSubmitting ? 'Updating Database...' : 'Save & Update Profile'}
            </Button>
        </div>
    </Modal>
  );
};

export default EditUserModal;