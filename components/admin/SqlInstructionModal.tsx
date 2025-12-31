
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { adminUpdateUserPassword } from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import { DatabaseIcon, LockIcon, RefreshIcon } from '../icons';

interface SqlInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SqlInstructionModal: React.FC<SqlInstructionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'password' | 'schema'>('schema');
  const [targetUserId, setTargetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !newPassword.trim()) {
      setStatus('error');
      setMessage('User ID and New Password are required.');
      return;
    }
    
    setStatus('loading');
    try {
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('user_id', targetUserId.trim())
        .single();

      if (findError || !user) throw new Error('User not found.');
      const { error: updateError } = await adminUpdateUserPassword(user.id, newPassword);
      if (updateError) throw updateError;

      setStatus('success');
      setMessage(`Successfully changed password for ${user.full_name}.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(`Operation failed: ${err.message}`);
    }
  };
  
  const handleClose = () => {
      onClose();
      setTimeout(() => {
          setTargetUserId('');
          setNewPassword('');
          setStatus('idle');
          setMessage('');
      }, 300);
  }

  const MASTER_SQL = `-- 1. CREATE PROJECT MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.project_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL,
    brand text NOT NULL,
    image_url text NOT NULL,
    status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENABLE RLS
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;

-- 3. CREATE POLICIES (Allow all for now to ensure functionality)
CREATE POLICY "Public Access" ON public.project_materials FOR ALL USING (true) WITH CHECK (true);

-- 4. RE-STAMP PERMISSIONS
GRANT ALL ON TABLE public.project_materials TO anon, authenticated, service_role;`;

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Advanced Admin Actions">
        <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveTab('schema')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'schema' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Database Setup
            </button>
            <button 
                onClick={() => setActiveTab('password')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'password' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                User Recovery
            </button>
        </div>

        {activeTab === 'schema' ? (
            <div className="space-y-6">
                <div className="bg-brand-blue/5 border border-brand-blue/10 p-5 rounded-2xl flex items-start gap-4">
                    <DatabaseIcon className="w-6 h-6 text-brand-blue mt-1" />
                    <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Missing Table detected</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Your Supabase instance is missing the <b>project_materials</b> table. Copy the SQL below and run it in your Supabase "SQL Editor".</p>
                    </div>
                </div>

                <div className="relative group">
                    <pre className="bg-slate-900 text-brand-gold-light p-6 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[300px] custom-scrollbar border border-white/10 shadow-inner">
                        {MASTER_SQL}
                    </pre>
                    <button 
                        onClick={() => { navigator.clipboard.writeText(MASTER_SQL); alert("SQL Copied to Clipboard!"); }}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                    >
                        Copy SQL
                    </button>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleClose} className="!bg-slate-900 !rounded-2xl !px-10 !text-[11px] uppercase tracking-widest">Done, I've run the SQL</Button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmitPassword} className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl flex items-start gap-4">
                    <LockIcon className="w-6 h-6 text-yellow-600 mt-1" />
                    <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Emergency Override</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Directly reset a member's security key using their unique Identification ID.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Member ID</label>
                        <input type="text" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className={inputClasses} placeholder="e.g. 786786" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Security Key</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} placeholder="••••••••" required />
                    </div>
                </div>

                {message && (
                    <div className={`text-xs p-4 rounded-xl font-bold uppercase tracking-widest border ${
                        status === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                    }`}>
                        {message}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-50">
                    <button type="button" onClick={handleClose} className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-4">Cancel</button>
                    <Button type="submit" disabled={status === 'loading'} className="!bg-slate-900 !rounded-2xl !px-10 !text-[11px] uppercase tracking-widest shadow-button">
                        {status === 'loading' ? 'Processing...' : 'Reset Member Access'}
                    </Button>
                </div>
            </form>
        )}
    </Modal>
  );
};

export default SqlInstructionModal;
