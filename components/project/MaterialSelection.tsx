
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
        const files: File[] = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > 10) {
            alert("Protocol Violation: Maximum 10 assets can be synchronized at once.");
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
            alert("Primary metadata (Name/Brand) is mandatory.");
            return;
        }

        if (selectedFiles.length === 0) {
            alert("No material assets selected for sync.");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const uploadedUrl = await uploadProjectFile(projectId, file);
                
                if (!uploadedUrl) throw new Error(`Asset Stream Failure: Ref ${i + 1}`);

                const { error } = await createRecord('project_materials', {
                    project_id: projectId,
                    name: selectedFiles.length > 1 ? `${formData.name} (${i + 1})` : formData.name,
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
            // Reset state
            setFormData({ name: '', category: 'Laminate', brand: '' });
            setSelectedFiles([]);
            setPreviews([]);
        } catch (err: any) {
            alert(`Synchronization Fault: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Batch Asset Registration">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Category</label>
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
                            <option>Paint/Finish</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Identifier</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Master Bedroom Palette"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand / Provider Code</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Hafele Luxe-2025 Series"
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className={inputClasses}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">High-Res Assets ({selectedFiles.length}/10 Max)</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:text-brand-gold transition-colors">Add More</button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {previews.map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 group bg-slate-50 shadow-sm">
                                <img src={src} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                <button 
                                    type="button" 
                                    onClick={() => removeFile(i)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/40 p-1 text-[8px] text-white font-black text-center uppercase tracking-tighter">REF-{i+1}</div>
                            </div>
                        ))}
                        
                        {selectedFiles.length < 10 && (
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-brand-gold hover:bg-slate-50 transition-all text-slate-300 group"
                            >
                                <UploadCloudIcon className="w-6 h-6 group-hover:text-brand-gold transition-colors" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Attach Asset</span>
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
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-brand-blue animate-pulse">Syncing Asset Stream...</span>
                            <span className="text-slate-500">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-blue h-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-6 pt-6 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="text-[11px] font-black uppercase tracking-[4px] text-slate-300 hover:text-slate-600 transition-colors"
                    >
                        Discard
                    </button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || selectedFiles.length === 0} 
                        className="!px-12 !py-5 !rounded-[24px] !bg-slate-900 !text-[11px] !font-black uppercase tracking-[4px] shadow-premium hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {isSubmitting ? `Transmitting ${selectedFiles.length} Assets...` : 'Authorize Sync'}
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
            if (!window.confirm(`Action Required: There are ${pendingCount} assets still awaiting client authorization. Finalize override?`)) return;
        } else {
            if (!window.confirm("Initialize Production Phase?")) return;
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
                body: `SYSTEM: Material Phase Finalized. Project has been synchronized for factory production.`,
                sender_id: user?.id,
                is_system_message: true
            });

            onUpdate();
        } catch (err) {
            alert("Phase Transition Failed.");
        } finally {
            setIsCompleting(false);
        }
    };

    if (loading) return <div className="p-24 text-center text-slate-300 font-black uppercase tracking-[8px] animate-pulse">Scanning Asset Registry...</div>;

    const canComplete = !isClient && currentProject?.stage === 'Material Ordering';

    return (
        <div className="space-y-12 animate-reveal">
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
                    <h3 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter leading-none">Material Registry</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-3 tracking-[5px]">Verified Physical Swatches & Finishes</p>
                </div>
                <div className="flex gap-4">
                    {canComplete && materials.length > 0 && (
                        <Button 
                            onClick={handleCompleteSelection} 
                            disabled={isCompleting}
                            className="!rounded-full !px-10 !py-5 shadow-gold-glow !bg-brand-gold !text-slate-900 !text-[10px] font-black uppercase tracking-[4px] animate-pulse hover:animate-none"
                        >
                            Finalize Selection Phase
                        </Button>
                    )}
                    {!isClient && (
                        <Button onClick={() => setAddModalOpen(true)} className="!rounded-full !px-10 !py-5 shadow-button !bg-slate-900 !text-[10px] font-black uppercase tracking-[4px]">
                            <FilePlusIcon className="w-5 h-5 mr-3 text-brand-gold" /> Add Asset Stream
                        </Button>
                    )}
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="p-32 text-center border-2 border-dashed border-slate-200 rounded-[64px] bg-slate-50/30 flex flex-col items-center justify-center gap-8">
                    <div className="w-24 h-24 rounded-[36px] bg-white shadow-soft flex items-center justify-center text-slate-200 ring-1 ring-slate-100">
                        <PackageIcon className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registry Uninitialized</h4>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-[4px]">
                            {isClient ? "Designer is preparing your project's material palette." : "Initiate the physical finish catalog for this project."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {materials.map(material => (
                        <Card key={material.id} className="p-0 overflow-hidden rounded-[48px] group border-slate-100 hover:shadow-premium transition-all duration-700 bg-white relative">
                            <div className="aspect-[4/5] relative overflow-hidden bg-slate-50">
                                <img 
                                    src={material.imageUrl} 
                                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                                    alt={material.name}
                                />
                                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <button 
                                        onClick={() => setViewerAsset({ url: material.imageUrl, name: material.name })}
                                        className="px-8 py-3 bg-white text-slate-900 rounded-full text-[10px] uppercase font-black tracking-[4px] shadow-2xl scale-90 group-hover:scale-100 transition-all duration-500"
                                    >
                                        Inspect Detail
                                    </button>
                                </div>
                                <div className="absolute top-10 left-10">
                                    <span className="px-6 py-2 bg-white/95 backdrop-blur-md shadow-premium rounded-full text-[10px] font-black text-slate-900 uppercase tracking-[4px] border border-slate-100">{material.category}</span>
                                </div>
                            </div>
                            <div className="p-12">
                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">{material.name}</h4>
                                <p className="text-[11px] text-brand-gold font-black uppercase mt-3 tracking-[5px]">{material.brand}</p>
                                
                                <div className="mt-12 pt-10 border-t border-slate-50 flex items-center justify-between">
                                    <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[3px] border ${
                                        material.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                        material.status === 'Rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                                        'bg-slate-50 text-slate-400 border-slate-200/60'
                                    }`}>
                                        {material.status}
                                    </span>
                                    
                                    {isClient && material.status === 'Pending' && (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => handleApproval(material.id, 'Rejected')} 
                                                className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                            >
                                                <XMarkIcon className="w-6 h-6"/>
                                            </button>
                                            <button 
                                                onClick={() => handleApproval(material.id, 'Approved')} 
                                                className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
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
