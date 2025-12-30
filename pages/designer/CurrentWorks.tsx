
import React, { useState, useRef, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createRecord, uploadProjectFile } from '../../services/api';
import { ZapIcon, PhotoIcon, XMarkIcon, ClockIcon } from '../../components/icons';

const CurrentWorks: React.FC = () => {
    const { user } = useAuth();
    const { currentWorks, refetchData, loading } = useData();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const myUpdates = useMemo(() => {
        return currentWorks
            .filter(w => w.designerId === user?.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentWorks, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        let imageUrl = null;

        if (imageFile) {
            imageUrl = await uploadProjectFile('hourly_updates', imageFile);
        }

        await createRecord('designer_hourly_updates', {
            designer_id: user.id,
            content,
            image_url: imageUrl
        });

        localStorage.setItem(`last_hourly_update_${user.id}`, Date.now().toString());
        await refetchData();
        setContent('');
        setImageFile(null);
        setPreview(null);
        setIsSubmitting(false);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="space-y-10 max-w-4xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">CURRENT WORKS</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-1.5 flex items-center gap-2">
                        <ZapIcon className="w-3.5 h-3.5 text-brand-gold" />
                        Hourly Productivity Stream
                    </p>
                </div>
            </header>

            <Card className="luxury-glass border-brand-gold/10 p-0 overflow-hidden shadow-premium">
                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What are you focusing on right now? (e.g. detailing kitchen joinery for Project X...)"
                            className="w-full bg-transparent border-none text-xl text-slate-800 placeholder:text-slate-300 focus:ring-0 resize-none min-h-[120px] font-medium leading-relaxed"
                            required
                        />
                        {preview && (
                            <div className="relative mt-4 inline-block">
                                <img src={preview} className="h-48 rounded-2xl object-cover ring-1 ring-slate-100" />
                                <button type="button" onClick={() => { setPreview(null); setImageFile(null); }} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-lg">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-50/50 border-t border-slate-100 px-8 py-4 flex justify-between items-center">
                        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-colors font-bold text-xs uppercase tracking-widest">
                            <PhotoIcon className="w-5 h-5" />
                            Add Visual
                        </button>
                        <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept="image/*" />
                        <Button type="submit" disabled={isSubmitting} className="!px-10 !py-3 !text-[11px] !font-black uppercase tracking-[3px]">
                            {isSubmitting ? 'STREAMING...' : 'SYNC UPDATE'}
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="space-y-12">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] border-b border-slate-100 pb-4">Activity Timeline</h2>
                <div className="space-y-8 relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100"></div>
                    {myUpdates.map(work => (
                        <div key={work.id} className="relative pl-12">
                            <div className="absolute left-[13px] top-1.5 w-2 h-2 bg-brand-gold rounded-full ring-4 ring-white shadow-sm"></div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest bg-brand-blue/5 px-2 py-0.5 rounded">
                                        {new Date(work.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {new Date(work.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="text-slate-600 text-lg leading-relaxed">{work.content}</div>
                                {work.imageUrl && (
                                    <img src={work.imageUrl} className="rounded-2xl max-w-sm h-48 object-cover ring-1 ring-slate-100" />
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && myUpdates.length === 0 && (
                        <div className="text-center py-20 text-slate-300">
                            <ZapIcon className="w-12 h-12 mx-auto opacity-20 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">No updates logged for this cycle.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrentWorks;
