import React, { useState, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { PhotoIcon, ZapIcon } from '../icons';
import { PROJECT_STAGES, STAGE_DISPLAY_NAMES } from '../../constants';
import { uploadProjectFile } from '../../services/api';

interface SiteUpdateModuleProps {
    projectId: string;
    onSuccess: () => void;
}

const SiteUpdateModule: React.FC<SiteUpdateModuleProps> = ({ projectId, onSuccess }) => {
    const { user } = useAuth();
    const [notes, setNotes] = useState('');
    const [stage, setStage] = useState(PROJECT_STAGES[0]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        let imageUrl = null;
        if (file) {
            imageUrl = await uploadProjectFile(projectId, file);
        }

        const { error } = await supabase.from('site_updates').insert({
            project_id: projectId,
            supervisor_id: user?.id,
            notes,
            stage,
            image_url: imageUrl
        });

        setLoading(false);
        if (!error) {
            setNotes('');
            setFile(null);
            onSuccess();
            alert("Site update published.");
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none";

    return (
        <Card className="luxury-glass border-slate-100 !p-8 rounded-[32px]">
            <div className="flex items-center gap-3 mb-6">
                <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Daily Site Feed</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select value={stage} onChange={e => setStage(e.target.value as any)} className={inputClasses}>
                    {PROJECT_STAGES.filter(s => s !== 'completed').map(s => (
                        <option key={s} value={s}>{STAGE_DISPLAY_NAMES[s]}</option>
                    ))}
                </select>
                <textarea 
                    placeholder="Supervisor notes... (e.g. Laminate pressing started for kitchen)" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className={`${inputClasses} min-h-[100px]`} 
                    required 
                />
                <div className="flex justify-between items-center">
                    <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-blue transition-colors">
                        <PhotoIcon className="w-5 h-5" /> {file ? file.name.slice(0, 15) : 'Add Site Photo'}
                    </button>
                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <Button type="submit" disabled={loading} className="!rounded-full !px-8 !text-[10px] font-black uppercase tracking-widest">
                        {loading ? 'Syncing...' : 'Publish Update'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default SiteUpdateModule;