
import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { CheckCircleIcon, XMarkIcon, PackageIcon, FilePlusIcon, PhotoIcon, SparklesIcon } from '../icons';
import { supabase } from '../../services/supabaseClient';
import { updateRecord, createRecord } from '../../services/api';

interface MaterialSelectionProps {
    projectId: string;
    isClient: boolean;
    onUpdate: () => void;
}

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await createRecord('project_materials', {
            project_id: projectId,
            name: formData.name,
            category: formData.category,
            brand: formData.brand,
            image_url: formData.imageUrl,
            status: 'Pending'
        });
        setIsSubmitting(false);
        if (!error) {
            onSuccess();
            onClose();
            setFormData({ name: '', category: 'Laminate', brand: '', imageUrl: '' });
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
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sample Image URL</label>
                    <div className="relative">
                        <PhotoIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="url" 
                            placeholder="https://images.unsplash.com/..."
                            value={formData.imageUrl}
                            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                            className={`${inputClasses} pl-12`}
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
                    <Button type="submit" disabled={isSubmitting} className="!px-10 !py-4 !rounded-2xl !bg-slate-900 !text-[11px] !font-black uppercase tracking-widest shadow-button">
                        {isSubmitting ? 'Registering...' : 'Provision Material'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const MaterialSelection: React.FC<MaterialSelectionProps> = ({ projectId, isClient, onUpdate }) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setAddModalOpen] = useState(false);

    const fetchMaterials = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('project_materials')
            .select('*')
            .eq('project_id', projectId);
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

    if (loading) return <div className="p-24 text-center text-slate-400 font-black uppercase tracking-[6px] animate-pulse">Scanning Material Archive...</div>;

    return (
        <div className="space-y-10 animate-in">
            <AddMaterialModal 
                isOpen={isAddModalOpen} 
                onClose={() => setAddModalOpen(false)} 
                projectId={projectId} 
                onSuccess={fetchMaterials} 
            />

            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <h3 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tight">Material Specification</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-[4px]">Verified Board, Finish, and Hardware Palette</p>
                </div>
                {!isClient && (
                    <Button onClick={() => setAddModalOpen(true)} className="!rounded-full !px-8 !py-4 shadow-button !bg-slate-900 !text-[11px] font-black uppercase tracking-widest">
                        <FilePlusIcon className="w-5 h-5 mr-2 text-brand-gold" /> Register New Finish
                    </Button>
                )}
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
                    {!isClient && (
                        <Button variant="secondary" onClick={() => setAddModalOpen(true)} className="!rounded-full !px-10 !py-4 uppercase !text-[11px] font-black tracking-[4px] mt-4 border-slate-200">
                            Start Selection Process
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {materials.map(material => (
                        <Card key={material.id} className="p-0 overflow-hidden rounded-[40px] group border-slate-100 hover:shadow-premium transition-all bg-white relative">
                            <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                                <img src={material.imageUrl} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={material.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
