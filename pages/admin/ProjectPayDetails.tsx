import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { updateRecord, createRecord } from '../../services/api';
import { DollarSignIcon, CheckCircleIcon, ZapIcon, AlertTriangleIcon, CreditCardIcon, UserIcon, MapPinIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const ProjectPayDetails: React.FC = () => {
    const { projectId } = useParams();
    const { projects, milestones, refetchData, loading } = useData();
    const { findUserById } = useUsers();
    const navigate = useNavigate();
    const [isSyncing, setIsSyncing] = useState(false);

    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const pMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId), [milestones, projectId]);
    const customer = useMemo(() => project ? findUserById(project.customerId) : null, [project, findUserById]);

    const handleToggleLock = async () => {
        if (!project || isSyncing) return;
        setIsSyncing(true);
        try {
            const nextState = !project.isPaymentAlertActive;
            await updateRecord('projects', project.id, { is_payment_alert_active: nextState });
            
            if (nextState) {
                await createRecord('messages', {
                    chat_id: project.id,
                    body: "SYSTEM LOCK: A mandatory payment release is required to continue. Dashboard access restricted.",
                    sender_id: '786786',
                    is_system_message: true
                });
            }
            await refetchData();
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMarkAsPaid = async (milestoneId: string) => {
        if (isSyncing) return;
        if (!window.confirm("Verify settlement for this milestone? This will update the project ledger.")) return;
        
        setIsSyncing(true);
        try {
            await updateRecord('milestones', milestoneId, {
                status_display: 'Paid',
                paid_date_display: new Date().toISOString()
            });
            await refetchData();
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading || !project) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Opening Command Interface...</div>;

    const totalPaid = pMilestones.filter(m => m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);

    return (
        <div className="space-y-10 animate-in pb-20">
            <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
                <div className="space-y-2">
                    <button onClick={() => navigate('/admin/track-pay')} className="text-[10px] font-black uppercase tracking-[3px] text-brand-blue hover:text-brand-gold transition-colors flex items-center gap-2 mb-4">
                        &larr; Master Registry
                    </button>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase leading-none">{project.title}</h1>
                    <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <UserIcon className="w-4 h-4 text-brand-gold" />
                            <UserNameDisplay user={customer} textClassName="text-sm font-bold text-slate-600" />
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <MapPinIcon className="w-4 h-4 text-brand-gold" />
                            <span className="text-sm font-bold text-slate-600">{project.address}</span>
                        </div>
                    </div>
                </div>

                <Card className={`!p-6 flex items-center gap-6 !rounded-[32px] border-none shadow-premium transition-all ${project.isPaymentAlertActive ? 'bg-red-600' : 'bg-slate-900'}`}>
                    <div className="text-white text-right">
                        <p className="text-[9px] font-black uppercase tracking-[3px] opacity-60">Blocker Sentinel</p>
                        <p className="text-sm font-bold uppercase tracking-widest mt-1">{project.isPaymentAlertActive ? 'Lock Enabled' : 'Registry Open'}</p>
                    </div>
                    <Button 
                        onClick={handleToggleLock}
                        disabled={isSyncing}
                        className={`!rounded-full !px-10 !py-4 !text-[11px] font-black uppercase tracking-widest shadow-lg ${project.isPaymentAlertActive ? '!bg-white !text-red-600' : '!bg-brand-gold !text-slate-900'}`}
                    >
                        {project.isPaymentAlertActive ? 'Close Request' : 'Request Payment'}
                    </Button>
                </Card>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    <Card className="luxury-glass p-0 overflow-hidden rounded-[40px] border-slate-100 shadow-premium">
                        <div className="bg-slate-50/80 px-10 py-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Financial Milestones (10/40/45/5)</h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Verified Registry</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[3px]">Stage Identity</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[3px]">Allocation</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[3px] text-center">Status</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[3px] text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {pMilestones.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-wide text-sm">{m.title}</td>
                                            <td className="px-10 py-6 font-display font-black text-slate-900">₹{m.amountDisplay.toLocaleString()}</td>
                                            <td className="px-10 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] border ${
                                                    m.statusDisplay === 'Paid' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' :
                                                    m.statusDisplay === 'Verifying' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                                                    m.statusDisplay === 'Completed' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20' :
                                                    'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>
                                                    {m.statusDisplay}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                {m.statusDisplay !== 'Paid' && (
                                                    <Button 
                                                        onClick={() => handleMarkAsPaid(m.id)}
                                                        disabled={isSyncing}
                                                        className="!rounded-full !px-6 !py-2 !text-[10px] font-black uppercase tracking-widest ml-auto"
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                                {m.statusDisplay === 'Paid' && (
                                                    <div className="flex items-center justify-end gap-2 text-accent-success font-black uppercase tracking-widest text-[10px]">
                                                        <CheckCircleIcon className="w-4 h-4" /> Settlement Verified
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="luxury-glass border-slate-100 !p-10 rounded-[40px] shadow-premium">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[5px] mb-8">Capital Summary</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Total Portfolio Value</p>
                                <p className="text-4xl font-display font-black text-slate-900 mt-1">₹{(project.budgetDisplay/100000).toFixed(2)}L</p>
                            </div>
                            <div className="pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Capital Cleared</p>
                                <p className="text-4xl font-display font-black text-accent-success mt-1">₹{(totalPaid/100000).toFixed(2)}L</p>
                            </div>
                        </div>

                        <div className="mt-12 relative w-full aspect-square flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F1F5F9" strokeWidth="2" />
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray={`${(totalPaid/project.budgetDisplay)*100}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-display font-black text-slate-900">{Math.round((totalPaid/project.budgetDisplay)*100)}%</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Revenue Realized</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectPayDetails;