
import React, { useState, useEffect, useRef } from 'react';
import { Material } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { CheckCircleIcon, XMarkIcon, PackageIcon, FilePlusIcon, PhotoIcon, SparklesIcon, UploadCloudIcon, ZapIcon, EyeIcon } from '../icons';
import { supabase } from '../../services/supabaseClient';
import { updateRecord, createRecord, uploadProjectFile } from '../../services/api';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface MaterialSelectionProps {
    projectId: string;
    isClient: boolean;
    onUpdate: () => void;
}

const ImagePreviewModal: React.FC<{ isOpen: boolean; onClose: () => void; imageUrl: string; title: string }> = ({ isOpen, onClose, imageUrl, title }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Visual Inspection: ${title}`}>
        <div className="flex flex-col items-center gap-6">
            <div className="w-full aspect-[16/10] bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 relative group">
                <img 
                    src={imageUrl} 
                    className="w-full h-full object-contain" 
                    alt={title}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200';
                    }}
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
            </div>
            <div className="flex gap-4">
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="!rounded-full !px-8">Open Original Source</Button>
                </a>
                <Button onClick={onClose} className="!rounded-full !px-8 !bg-slate-900">Close Inspection</Button>
            </div>
        </div>
    </Modal>
);

const AddMaterialModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    projectId: string; 
    onSuccess: () => void 
}> = ({ isOpen, onClose, projectId, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Laminate',
        brand: '',
        imageUrl: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.brand.trim()) {
            alert("Please fill in the material name and brand.");
            return;
        }

        if (!selectedFile && !formData.imageUrl.trim()) {
            alert("Please upload a sample image or provide a direct link.");
            return;
        }

        setIsSubmitting(true);
        
        try {
            let finalImageUrl = formData.imageUrl.trim();

            if (selectedFile) {
                const uploadedUrl = await uploadProjectFile(projectId, selectedFile);
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                } else {
                    throw new Error("Cloud Storage Upload Failed.");
                }
            }

            const { error } = await createRecord('project_materials', {
                project_id: projectId,
                name: formData.name.trim(),
                category: formData.category,
                brand: formData.brand.trim(),
                image_url: finalImageUrl,
                status: 'Pending'
            });

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({ name: '', category: 'Laminate', brand: '', imageUrl: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (err: any) {
            alert(`Error: ${err.message || 'Could not save material.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register Material Specification">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Material Category</label>
                        <select 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className={inputClasses}
                        >
                            <option>Laminate</option>
                            <option>Veneer</option>
                            <option>Hardware</option>
                            <option>Fabric</option>
                            <option>Stone/Marble</option>
                            <option>Glass</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Material Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Charcoal Matte Finish"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand/Supplier</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Merino, Ebco, Hafele"
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className={inputClasses}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Material Swatch Image</label>
                    
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative aspect-video rounded-[32px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden ${
                            previewUrl ? 'border-brand-gold bg-white' : 'border-slate-200 bg-slate-50 hover:border-brand-gold hover:bg-white'
                        }`}
                    >
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-900/60 px-4 py-2 rounded-full backdrop-blur-md">Change Selection</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-3xl bg-white shadow-soft flex items-center justify-center text-slate-300 group-hover:text-brand-gold group-hover:scale-110 transition-all duration-500">
                                    <UploadCloudIcon className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Upload High-Res Swatch</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">PNG, JPG, or HEIC (Max 10MB)</p>
                                </div>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">OR USE URL</span>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <input 
                        type="text" 
                        placeholder="Paste direct image link if already hosted"
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        className={`${inputClasses} !text-xs !p-3 !rounded-xl !bg-slate-50/50`}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-4"
                    >
                        Cancel
                    </button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="!px-10 !py-4 !rounded-2xl !bg-slate-900 !text-[11px] !font-black uppercase tracking-widest shadow-button"
                    >
                        {isSubmitting ? 'Synchronizing...' : 'Provision Material'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const MaterialSelection: React.FC<MaterialSelectionProps> = ({ projectId, isClient, onUpdate }) => {
    const { projects } = useData();
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [viewerAsset, setViewerAsset] = useState<{ url: string; name: string } | null>(null);

    const currentProject = projects.find(p => p.id === projectId);

    const fetchMaterials = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('project_materials')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (!error) setMaterials(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchMaterials();
    }, [projectId]);

    const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
        const { error } = await updateRecord('project_materials', id, { status });
        if (!error) {
            setMaterials(prev => prev.map(m => m.id === id ? { ...m, status } : m));
            onUpdate();
        }
    };

    const handleCompleteSelection = async () => {
        if (isCompleting || !currentProject) return;
        
        const pendingCount = materials.filter(m => m.status === 'Pending').length;
        if (pendingCount > 0) {
            if (!window.confirm(`There are still ${pendingCount} materials awaiting client approval. Complete selection anyway?`)) return;
        } else {
            if (!window.confirm("Finalize material selection and transition project to execution phase?")) return;
        }

        setIsCompleting(true);
        try {
            const { error } = await updateRecord('projects', projectId, { 
                stage: 'Site Work', // Fix comparison error: use capitalized name from ProjectStage enum
                progress: Math.max(currentProject.progress, 45)
            });

            if (error) throw error;

            await createRecord('messages', {
                chat_id: projectId,
                body: `PHASE UPDATE: Material selection is complete. The project has now moved to the EXECUTION phase. Site work initialization in progress.`,
                sender_id: user?.id,
                is_system_message: true
            });

            onUpdate();
        } catch (err) {
            alert("Failed to update project phase.");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; 
        target.src = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800';
    };

    if (loading) return <div className="p-24 text-center text-slate-400 font-black uppercase tracking-[6px] animate-pulse">Scanning Material Archive...</div>;

    // Fix comparison error: 'material_selection' -> 'Material Ordering'
    const canComplete = !isClient && currentProject?.stage === 'Material Ordering';

    return (
        <div className="space-y-10 animate-in">
            <AddMaterialModal 
                isOpen={isAddModalOpen} 
                onClose={() => setAddModalOpen(false)} 
                projectId={projectId} 
                onSuccess={fetchMaterials} 
            />

            {viewerAsset && (
                <ImagePreviewModal 
                    isOpen={!!viewerAsset} 
                    onClose={() => setViewerAsset(null)} 
                    imageUrl={viewerAsset.url} 
                    title={viewerAsset.name} 
                />
            )}

            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <h3 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tight">Material Specification</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-[4px]">Verified Board, Finish, and Hardware Palette</p>
                </div>
                <div className="flex gap-4">
                    {canComplete && materials.length > 0 && (
                        <Button 
                            onClick={handleCompleteSelection} 
                            disabled={isCompleting}
                            className="!rounded-full !px-8 !py-4 shadow-gold-glow !bg-brand-gold !text-slate-900 !text-[11px] font-black uppercase tracking-widest animate-pulse hover:animate-none"
                        >
                            <ZapIcon className="w-5 h-5 mr-2" /> {isCompleting ? 'Finalizing...' : 'Complete Selection'}
                        </Button>
                    )}
                    {!isClient && (
                        <Button onClick={() => setAddModalOpen(true)} className="!rounded-full !px-8 !py-4 shadow-button !bg-slate-900 !text-[11px] font-black uppercase tracking-widest">
                            <FilePlusIcon className="w-5 h-5 mr-2 text-brand-gold" /> Register New Finish
                        </Button>
                    )}
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="p-32 text-center border-2 border-dashed border-slate-200 rounded-[50px] bg-slate-50/50 flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 rounded-[32px] bg-white shadow-soft flex items-center justify-center text-slate-200">
                        <PackageIcon className="w-12 h-12" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Materials Logged</h4>
                        <p className="text-sm text-slate-400 font-bold uppercase mt-2 tracking-widest">
                            {isClient 
                                ? "Lead Architect is currently finalizing your project's physical palette." 
                                : "Initialize the material registry for this project."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {materials.map(material => (
                        <Card key={material.id} className="p-0 overflow-hidden rounded-[40px] group border-slate-100 hover:shadow-premium transition-all bg-white relative">
                            <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                                <img 
                                    src={material.imageUrl} 
                                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                                    alt={material.name}
                                    onError={handleImageError}
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <Button 
                                        onClick={() => setViewerAsset({ url: material.imageUrl, name: material.name })}
                                        className="!rounded-full !px-8 !py-3 !bg-white !text-slate-900 !text-[10px] uppercase font-black tracking-widest shadow-premium"
                                    >
                                        <EyeIcon className="w-4 h-4 mr-2" /> Inspect Swatch
                                    </Button>
                                </div>
                                <div className="absolute top-8 left-8">
                                    <span className="px-5 py-2 bg-white/95 backdrop-blur-md shadow-premium rounded-full text-[10px] font-black text-slate-900 uppercase tracking-[3px] border border-slate-100">{material.category}</span>
                                </div>
                            </div>
                            <div className="p-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{material.name}</h4>
                                        <p className="text-[11px] text-brand-gold font-black uppercase mt-2 tracking-[4px] flex items-center gap-2">
                                            <SparklesIcon className="w-3.5 h-3.5" /> {material.brand}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[3px] border ${
                                        material.status === 'Approved' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' :
                                        material.status === 'Rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                                        'bg-slate-50 text-slate-400 border-slate-200/60'
                                    }`}>
                                        {material.status === 'Approved' ? '✓ Verified' : material.status === 'Rejected' ? '✕ Revised' : 'Awaiting Review'}
                                    </span>
                                    
                                    {isClient && material.status === 'Pending' && (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleApproval(material.id, 'Rejected')} 
                                                className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm border border-red-100"
                                                title="Reject Sample"
                                            >
                                                <XMarkIcon className="w-6 h-6"/>
                                            </button>
                                            <button 
                                                onClick={() => handleApproval(material.id, 'Approved')} 
                                                className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center shadow-sm border border-green-100"
                                                title="Approve Finish"
                                            >
                                                <CheckCircleIcon className="w-6 h-6"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MaterialSelection;
