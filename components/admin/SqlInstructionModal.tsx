
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

  const MASTER_SQL = `-- AMAZ MODULAR ECOSYSTEM - FULL DATABASE INITIALIZATION SCRIPT --

-- 1. CORE USERS & IDENTITY
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    avatar_url text,
    user_id text UNIQUE NOT NULL,
    verified boolean DEFAULT false,
    verification_requested boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROJECTS & MILESTONES
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    customer_id uuid REFERENCES public.users(id),
    designer_id uuid REFERENCES public.users(id),
    admin_id uuid REFERENCES public.users(id),
    address text,
    budget_display numeric DEFAULT 0,
    area_sqft numeric DEFAULT 0,
    start_date date,
    status text DEFAULT 'Active',
    stage text DEFAULT 'design_phase',
    progress integer DEFAULT 0,
    revenue_display numeric DEFAULT 0,
    is_payment_alert_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    amount_display numeric NOT NULL,
    due_date date NOT NULL,
    status_display text DEFAULT 'Pending',
    paid_date_display timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MATERIALS & ASSETS
CREATE TABLE IF NOT EXISTS public.project_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL,
    brand text NOT NULL,
    image_url text NOT NULL,
    status text DEFAULT 'Pending',
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    version text NOT NULL,
    file_url text NOT NULL,
    uploaded_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ATTENDANCE & PAYROLL
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    designer_id uuid REFERENCES public.users(id),
    clock_in timestamp with time zone NOT NULL,
    clock_out timestamp with time zone,
    duration text,
    location text,
    ip_address text,
    work_summary text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_salary_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) UNIQUE,
    pay_type text DEFAULT 'Monthly', -- 'Monthly' or 'Daily'
    base_amount numeric DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. EXPENSES & PRODUCTS
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric NOT NULL,
    date date NOT NULL,
    category text NOT NULL,
    receipt_url text,
    status text DEFAULT 'Pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    supplier text,
    image_url text,
    cost numeric NOT NULL,
    quantity integer DEFAULT 1,
    status text DEFAULT 'Pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COMMUNICATION & FEED
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id uuid NOT NULL,
    sender_id uuid REFERENCES public.users(id),
    body text,
    attachments jsonb,
    is_system_message boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id uuid REFERENCES public.users(id),
    content text,
    media_url text,
    media_type text,
    before_media_url text,
    reactions jsonb DEFAULT '[]',
    is_pinned boolean DEFAULT false,
    project_id uuid REFERENCES public.projects(id),
    post_type text DEFAULT 'standard',
    showcase_details jsonb,
    tags text[],
    visibility text DEFAULT 'everyone',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PRODUCTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.designer_hourly_updates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    designer_id uuid REFERENCES public.users(id),
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SECURITY: ENABLE RLS & CREATE BYPASS POLICY (FOR EASY INITIAL SETUP)
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;`;

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Advanced Admin Actions">
        <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveTab('schema')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'schema' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                System Schema (SQL)
            </button>
            <button 
                onClick={() => setActiveTab('password')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'password' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Identity Recovery
            </button>
        </div>

        {activeTab === 'schema' ? (
            <div className="space-y-6">
                <div className="bg-slate-900 border border-brand-gold/30 p-5 rounded-2xl flex items-start gap-4">
                    <DatabaseIcon className="w-6 h-6 text-brand-gold mt-1" />
                    <div>
                        <h4 className="font-black text-white uppercase tracking-tight text-sm">AMAZ Master initialization</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">This script generates the complete infrastructure for Salaries, Attendance, Projects, and Social Feed. Execute it in your Supabase SQL Editor.</p>
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
                    <Button onClick={handleClose} className="!bg-slate-900 !rounded-2xl !px-10 !text-[11px] uppercase tracking-widest">Close Terminal</Button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmitPassword} className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl flex items-start gap-4">
                    <LockIcon className="w-6 h-6 text-yellow-600 mt-1" />
                    <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Identity Override</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Directly reset a staff member's security key using their unique Identification ID.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Member ID</label>
                        <input type="text" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className={inputClasses} placeholder="e.g. AMZ-101" required />
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
