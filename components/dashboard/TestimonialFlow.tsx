
import React, { useState, useRef } from 'react';
import { Project } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CheckCircleIcon, MicIcon, VideoCameraIcon, SparklesIcon, ZapIcon, UploadCloudIcon, XMarkIcon } from '../icons';
import { uploadProjectFile, createRecord } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TestimonialFlowProps {
    project: Project;
}

const TestimonialFlow: React.FC<TestimonialFlowProps> = ({ project }) => {
    const { user } = useAuth();
    const [view, setView] = useState<'celebration' | 'options' | 'recording' | 'success'>('celebration');
    const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            // Uploading to a virtual "testimonials" folder within the project storage
            const url = await uploadProjectFile(`${project.id}/testimonials`, file);
            if (url) {
                // Save DB record
                await createRecord('testimonials', {
                    project_id: project.id,
                    client_id: user.id,
                    video_url: url
                });
                setView('success');
            }
        } catch (err) {
            alert("Asset Sync Error. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    if (view === 'celebration') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <Card className="max-w-3xl w-full !p-12 text-center luxury-glass border-brand-gold/30 relative overflow-hidden animate-reveal">
                    {/* Visual Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

                    <div className="relative z-10 space-y-10">
                        <div className="w-24 h-24 bg-brand-gold text-slate-900 rounded-[40px] flex items-center justify-center mx-auto shadow-gold-glow animate-bounce-slow">
                            <CheckCircleIcon className="w-12 h-12" />
                        </div>
                        
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">
                                Congratulations On Your <br/>
                                <span className="text-brand-gold">New Dream Home!</span>
                            </h1>
                            <div className="h-1 w-20 bg-brand-gold mx-auto rounded-full"></div>
                            <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed italic px-4">
                                "We Wish you and your family a happy and joyful life Hereafter!"
                            </p>
                        </div>

                        <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">Project Identity: {project.title}</p>
                            <Button 
                                onClick={() => setView('options')} 
                                className="!px-16 !py-6 !rounded-full !bg-slate-900 !text-sm !font-black uppercase tracking-[4px] shadow-button hover:scale-105 active:scale-95 transition-all"
                            >
                                Share Your Experience (Video)
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (view === 'options' || view === 'recording') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <Card className="max-w-4xl w-full !p-0 luxury-glass overflow-hidden rounded-[48px] border-slate-100 shadow-premium animate-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Left: Video Testimonial Option */}
                        <div className="p-12 flex flex-col items-center justify-center text-center gap-8 group hover:bg-slate-50 transition-colors border-b md:border-b-0 md:border-r border-slate-100">
                            <div className="w-20 h-20 rounded-[32px] bg-brand-blue/10 text-brand-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <VideoCameraIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-black text-slate-900 uppercase">Video Review</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium">Record a short clip of your <br/> new luxury space.</p>
                            </div>
                            <Button 
                                onClick={() => { setMediaType('video'); fileInputRef.current?.click(); }}
                                disabled={isUploading}
                                className="!rounded-full !px-10 !bg-slate-900 !text-[10px] font-black uppercase tracking-widest"
                            >
                                {isUploading && mediaType === 'video' ? 'Transmitting...' : 'Upload Video'}
                            </Button>
                        </div>

                        {/* Right: Voice Message Option */}
                        <div className="p-12 flex flex-col items-center justify-center text-center gap-8 group hover:bg-slate-50 transition-colors">
                            <div className="w-20 h-20 rounded-[32px] bg-brand-gold/10 text-brand-gold flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <MicIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-black text-slate-900 uppercase">Voice Memo</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium">Share your thoughts via <br/> an audio greeting.</p>
                            </div>
                            <Button 
                                onClick={() => { setMediaType('audio'); fileInputRef.current?.click(); }}
                                disabled={isUploading}
                                variant="gold"
                                className="!rounded-full !px-10 !text-[10px] font-black uppercase tracking-widest shadow-gold-glow"
                            >
                                {isUploading && mediaType === 'audio' ? 'Syncing Audio...' : 'Upload Voice'}
                            </Button>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-8 text-center border-t border-white/5">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[6px]">Before End Can you do as a favour? Please Share your experience in video testimonial.</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept={mediaType === 'video' ? "video/*" : "audio/*"}
                    />
                </Card>
            </div>
        );
    }

    if (view === 'success') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full !p-16 text-center luxury-glass border-slate-100 animate-reveal">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm ring-4 ring-green-50/50">
                        <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tight">Sync Complete</h2>
                    <p className="text-lg text-slate-500 font-medium mt-4 leading-relaxed italic">
                        "Your words fuel our passion. <br/> Welcome home to your Amaz creation."
                    </p>
                    <div className="mt-12 pt-10 border-t border-slate-100">
                        <Button 
                            onClick={() => window.location.href = '/'}
                            className="!px-12 !py-4 !rounded-full !bg-slate-900 !text-[10px] font-black uppercase tracking-widest"
                        >
                            Return to Portal
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
};

export default TestimonialFlow;
