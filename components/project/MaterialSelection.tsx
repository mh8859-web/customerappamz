
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
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // --- FIX: Explicitly type files as File[] to prevent inference as unknown[] which causes error on line 69 ---
        const files: File[] = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > 10) {
            alert("Maximum 10 images can be uploaded at once.");
            return;
        }
        
        setSelectedFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.brand.trim()) {
            alert("Please fill in the material name and brand.");
            return;
        }

        if (selectedFiles.length === 0) {
            alert("Please select at least one material image.");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const uploadedUrl = await uploadProjectFile(projectId, file);
                
                if (!uploadedUrl) throw new Error(`Upload Failed for image ${i + 1}`);

                const { error } = await createRecord('project_materials', {
                    project_id: projectId,
                    name: selectedFiles.length > 1 ? `${formData.name} (Ref ${i + 1})` : formData.name,
                    category: formData.category,
                    brand: formData.brand.trim(),
                    image_url: uploadedUrl,
                    status: 'Pending'
                });

                if (error) throw error;
                setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            }

            onSuccess();
            onClose();
            // Reset
            setFormData({ name: '', category: 'Laminate', brand: '' });
            setSelectedFiles([]);
            setPreviews([]);
        } catch (err: any) {
            alert(`Error: ${err.message || 'Could not save materials.'}`);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Batch Material Registration">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Master Suite Hardware"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand / Catalog</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Hafele Elite Collection"
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className={inputClasses}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Physical Swatches ({selectedFiles.length}/10)</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Add More</button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {previews.map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                                <img src={src} className="w-full h-full object-cover" alt="" />
                                <button 
                                    type="button" 
                                    onClick={() => removeFile(i)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        
                        {selectedFiles.length < 10 && (
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-brand-gold hover:bg-slate-50 transition-all text-slate-300"
                            >
                                <UploadCloudIcon className="w-6 h-6" />
                                <span className="text-[8px] font-black uppercase">Attach</span>
                            </button>
                        )}
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                        multiple
                    />
                </div>

                {isSubmitting && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-brand-blue">Uploading Stream...</span>
                            <span className="text-slate-400">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-brand-blue h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-4"
                    >
                        Discard
                    </button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || selectedFiles.length === 0} 
                        className="!px-10 !py-4 !rounded-2xl !bg-slate-900 !text-[11px] !font-black uppercase tracking-widest shadow-button"
                    >
                        {isSubmitting ? `Processing ${selectedFiles.length} Assets...` : 'Register Materials'}
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
            if (!window.confirm(`There are still ${pendingCount} materials awaiting client approval. Finalize anyway?`)) return;
        } else {
            if (!window.confirm("Move project to Production phase?")) return;
        }

        setIsCompleting(true);
        try {
            const { error } = await updateRecord('projects', projectId, { 
                stage: 'Production',
                progress: Math.max(currentProject.progress, 30)
            });

            if (error) throw error;

            await createRecord('messages', {
                chat_id: projectId,
                body: `SYSTEM: Material Selection Finalized. Moving to factory production protocol.`,
                sender_id: user?.id,
                is_system_message: true
            });

            onUpdate();
        } catch (err) {
            alert("Phase Shift Failed.");
        } finally {
            setIsCompleting(false);
        }
    };

    if (loading) return <div className="p-24 text-center text-slate-400 font-black uppercase tracking-[6px] animate-pulse">Scanning Registry...</div>;

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
                    <h3 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tight">Material Registry</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-[4px]">Sourced Finishes & Components</p>
                </div>
                <div className="flex gap-4">
                    {canComplete && materials.length > 0 && (
                        <Button 
                            onClick={handleCompleteSelection} 
                            disabled={isCompleting}
                            className="!rounded-full !px-8 !py-4 shadow-gold-glow !bg-brand-gold !text-slate-900 !text-[11px] font-black uppercase tracking-widest animate-pulse hover:animate-none"
                        >
                            Finalize Selection
                        </Button>
                    )}
                    {!isClient && (
                        <Button onClick={() => setAddModalOpen(true)} className="!rounded-full !px-8 !py-4 shadow-button !bg-slate-900 !text-[11px] font-black uppercase tracking-widest">
                            <FilePlusIcon className="w-5 h-5 mr-2 text-brand-gold" /> Upload Materials
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
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registry Empty</h4>
                        <p className="text-sm text-slate-400 font-bold uppercase mt-2 tracking-widest">
                            {isClient ? "Designer is uploading your project's physical palette." : "Attach material assets to this project."}
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
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <button 
                                        onClick={() => setViewerAsset({ url: material.imageUrl, name: material.name })}
                                        className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] uppercase font-black tracking-widest shadow-premium"
                                    >
                                        Inspect
                                    </button>
                                </div>
                                <div className="absolute top-8 left-8">
                                    <span className="px-5 py-2 bg-white/95 backdrop-blur-md shadow-premium rounded-full text-[10px] font-black text-slate-900 uppercase tracking-[3px] border border-slate-100">{material.category}</span>
                                </div>
                            </div>
                            <div className="p-10">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{material.name}</h4>
                                <p className="text-[11px] text-brand-gold font-black uppercase mt-2 tracking-[4px]">{material.brand}</p>
                                
                                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                                    <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[2px] border ${
                                        material.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                        material.status === 'Rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                                        'bg-slate-50 text-slate-400 border-slate-200/60'
                                    }`}>
                                        {material.status}
                                    </span>
                                    
                                    {isClient && material.status === 'Pending' && (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleApproval(material.id, 'Rejected')} 
                                                className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <XMarkIcon className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={() => handleApproval(material.id, 'Approved')} 
                                                className="w-10 h-10 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <CheckCircleIcon className="w-5 h-5"/>
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
