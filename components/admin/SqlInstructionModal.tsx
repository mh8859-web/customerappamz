
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { adminUpdateUserPassword } from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import { DatabaseIcon, LockIcon, RefreshIcon, AlertTriangleIcon, ZapIcon, PackageIcon } from '../icons';

interface SqlInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SqlInstructionModal: React.FC<SqlInstructionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'password' | 'schema' | 'storage'>('schema');
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

  const STORAGE_SQL = `-- 1. RUN THIS IN SUPABASE SQL EDITOR TO FIX BUCKET ISSUES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('amaz-storage', 'amaz-storage', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. ENABLE PUBLIC ACCESS FOR UPLOADS & DOWNLOADS
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'amaz-storage');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'amaz-storage');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'amaz-storage');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'amaz-storage');`;

  const FULL_INIT_SQL = `-- 1. FIX PHASE SHIFT ERROR: ALLOW UPDATES ON PROJECTS
-- Run this to grant UPDATE access to Designers and Admins
DO $$ 
BEGIN
    -- Policy for Designers: Can update their assigned projects
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow Designers update assigned') THEN
        CREATE POLICY "Allow Designers update assigned" 
        ON public.projects FOR UPDATE TO authenticated
        USING (auth.uid() = designer_id)
        WITH CHECK (auth.uid() = designer_id);
    END IF;

    -- Policy for Admins: Can update all projects
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow Admins update all') THEN
        CREATE POLICY "Allow Admins update all" 
        ON public.projects FOR UPDATE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'Admin' OR users.role = 'Sub-Admin')
          )
        );
    END IF;
END $$;

-- 2. ENSURE CORE TABLES AND RLS ARE STABLE
-- If you are still seeing 'Access Denied', try running:
-- ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
-- (Only use the above command for rapid development/debugging)

CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    avatar_url text,
    user_id text UNIQUE NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    customer_id uuid REFERENCES public.users(id),
    designer_id uuid REFERENCES public.users(id),
    admin_id uuid REFERENCES public.users(id),
    address text,
    budget_display numeric DEFAULT 0,
    is_payment_alert_active boolean DEFAULT false,
    requested_milestone_id uuid,
    friendly_reminder_milestone_id uuid,
    status text DEFAULT 'Active',
    stage text DEFAULT 'Design',
    progress integer DEFAULT 0,
    start_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`;

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Advanced Admin Actions">
        <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab('schema')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'schema' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Master SQL
            </button>
            <button 
                onClick={() => setActiveTab('storage')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'storage' ? 'bg-brand-gold text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Storage Fix
            </button>
            <button 
                onClick={() => setActiveTab('password')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'password' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                ID Recovery
            </button>
        </div>

        {activeTab === 'storage' && (
            <div className="space-y-6 animate-reveal">
                <div className="bg-brand-gold/10 border border-brand-gold/30 p-6 rounded-[24px] flex items-start gap-4">
                    <PackageIcon className="w-6 h-6 text-brand-gold mt-1" />
                    <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Supabase Storage Policies</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">Run this script to ensure the 'amaz-storage' bucket exists and has public read/write permissions.</p>
                    </div>
                </div>
                <div className="relative group">
                    <pre className="bg-slate-900 text-brand-gold-light p-6 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[300px] custom-scrollbar border border-white/10 shadow-inner">
                        {STORAGE_SQL}
                    </pre>
                    <button 
                        onClick={() => { navigator.clipboard.writeText(STORAGE_SQL); alert("Storage SQL Copied!"); }}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Copy SQL
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'schema' && (
             <div className="space-y-6 animate-reveal">
                <div className="bg-slate-900 border border-brand-gold/30 p-5 rounded-2xl flex items-start gap-4">
                    <DatabaseIcon className="w-6 h-6 text-brand-gold mt-1" />
                    <div>
                        <h4 className="font-black text-white uppercase tracking-tight text-sm">FIX PHASE SHIFT ERRORS</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">Run the SQL below in Supabase. It includes the UPDATE policies needed to allow Designers and Admins to modify projects.</p>
                    </div>
                </div>
                <pre className="bg-slate-900 text-brand-gold-light p-6 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[300px] custom-scrollbar border border-white/10">
                    {FULL_INIT_SQL}
                </pre>
                <div className="flex justify-end pt-4">
                    <Button onClick={() => { navigator.clipboard.writeText(FULL_INIT_SQL); alert("Master SQL Copied!"); }} className="!rounded-full !px-8 !text-[10px] font-black uppercase">Copy SQL</Button>
                </div>
            </div>
        )}

        {activeTab === 'password' && (
            <form onSubmit={handleSubmitPassword} className="space-y-6 animate-reveal">
                <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl flex items-start gap-4">
                    <LockIcon className="w-6 h-6 text-yellow-600 mt-1" />
                    <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Identity Override</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Reset a staff member's security key using their ID.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className={inputClasses} placeholder="ID (e.g. AMZ-101)" required />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} placeholder="New Security Key" required />
                </div>
                {message && <div className={`text-xs p-4 rounded-xl font-bold uppercase tracking-widest border ${status === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>{message}</div>}
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-50">
                    <Button type="submit" disabled={status === 'loading'} className="!bg-slate-900 !rounded-full !px-10 !text-[11px] uppercase tracking-widest">Reset Access</Button>
                </div>
            </form>
        )}
    </Modal>
  );
};

export default SqlInstructionModal;
