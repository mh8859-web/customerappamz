
import React, { useState, useEffect } from 'react';
import { Material, Project } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CheckCircleIcon, XMarkIcon, PhotoIcon, PackageIcon } from '../icons';
import { supabase } from '../../services/supabaseClient';
import { updateRecord } from '../../services/api';

interface MaterialSelectionProps {
    projectId: string;
    isClient: boolean;
    onUpdate: () => void;
}

const MaterialSelection: React.FC<MaterialSelectionProps> = ({ projectId, isClient, onUpdate }) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase animate-pulse">Syncing Inventory...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Material Specification</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Select and approve finishes for your project</p>
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50">
                    <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Designer is currently preparing material samples.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {materials.map(material => (
                        <Card key={material.id} className="p-0 overflow-hidden rounded-[40px] group border-slate-100 hover:shadow-premium transition-all bg-white">
                            <div className="aspect-square relative overflow-hidden bg-slate-100">
                                <img src={material.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={material.name} />
                                <div className="absolute top-6 left-6">
                                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest">{material.category}</span>
                                </div>
                            </div>
                            <div className="p-8">
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{material.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{material.brand}</p>
                                
                                <div className="mt-8 flex items-center justify-between">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                        material.status === 'Approved' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' :
                                        material.status === 'Rejected' ? 'bg-accent-danger/5 text-accent-danger border-accent-danger/20' :
                                        'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}>
                                        {material.status}
                                    </span>
                                    
                                    {isClient && material.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproval(material.id, 'Rejected')} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><XMarkIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleApproval(material.id, 'Approved')} className="p-3 bg-green-50 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all"><CheckCircleIcon className="w-5 h-5"/></button>
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
