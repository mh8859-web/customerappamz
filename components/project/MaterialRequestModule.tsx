import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { PackageIcon, ClockIcon } from '../icons';

interface MaterialRequestModuleProps {
    projectId: string;
    onSuccess: () => void;
}

const MaterialRequestModule: React.FC<MaterialRequestModuleProps> = ({ projectId, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        qty: '',
        vendor: '',
        date: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('material_requests').insert({
            project_id: projectId,
            requester_id: user?.id,
            material_name: formData.name,
            quantity: formData.qty,
            vendor: formData.vendor,
            delivery_date: formData.date
        });
        setLoading(false);
        if (!error) {
            setFormData({ name: '', qty: '', vendor: '', date: '' });
            onSuccess();
            alert("Request sent to Project Head.");
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none";

    return (
        <Card className="luxury-glass border-slate-100 !p-8 rounded-[32px]">
            <div className="flex items-center gap-3 mb-6">
                <PackageIcon className="w-5 h-5 text-brand-gold" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Material Request</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Material Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} required />
                    <input type="text" placeholder="Quantity (e.g. 5 Sheets)" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} className={inputClasses} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Preferred Vendor" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className={inputClasses} />
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClasses} />
                </div>
                <Button type="submit" disabled={loading} className="w-full !rounded-full uppercase font-black tracking-widest text-[10px]">
                    {loading ? 'Transmitting...' : 'Submit to HQ'}
                </Button>
            </form>
        </Card>
    );
};

export default MaterialRequestModule;