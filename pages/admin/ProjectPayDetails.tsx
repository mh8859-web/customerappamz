import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { updateRecord, createRecord } from '../../services/api';
import { DollarSignIcon, CheckCircleIcon, ZapIcon, AlertTriangleIcon, CreditCardIcon, UserIcon, MapPinIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import AddMilestoneModal from '../../components/admin/AddMilestoneModal';

const ProjectPayDetails: React.FC = () => {
    const { projectId } = useParams();
    const { projects, milestones, refetchData, loading } = useData();
    const { findUserById } = useUsers();
    const navigate = useNavigate();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);

    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const pMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId), [milestones, projectId]);
    const customer = useMemo(() => project ? findUserById(project.customerId) : null, [project, findUserById]);

    const handleToggleLock = async () => {
        if (!project || isSyncing) return;
        
        // Use mapped state correctly
        const currentLockState = !!project.isPaymentAlertActive;
        const nextState = !currentLockState;
        
        console.log(`[SENTINEL] Project: ${project.title} | ID: ${project.id}`);
        console.log(`[SENTINEL] Toggling Lock: ${currentLockState} -> ${nextState}`);
        
        setIsSyncing(true);
        try {
            // Update the database using snake_case field name
            const { error } = await updateRecord('projects', project.id, { 
                is_payment_alert_active: nextState,
                updated_at: new Date().toISOString()
            });
            
            if (error) {
                console.error("[DB ERROR]", error);
                alert(`Sync Error: ${error.message}. If column is missing, run SQL provided in Admin Settings.`);
                return;
            }
            
            // Log the action in the project chat for transparency
            await createRecord('messages', {
                chat_id: project.id,
                body: nextState 
                    ? "BLOCKER ACTIVATED: Project dashboard access restricted pending payment release. Secure settlement required."
                    : "BLOCKER DEACTIVATED: Full access restored by Administration.",
                sender_id: '786786',
                is_system_message: true
            });
            
            // Refresh global data context to update all UI components
            await refetchData();
        } catch (err) {
            console.error("Critical Failure:", err);
            alert("A system error occurred while toggling the lock.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMarkAsPaid = async (milestoneId: string) => {
        if (isSyncing) return;
        if (!window.confirm("CONFIRM SETTLEMENT: Verify this payment receipt?")) return;
        
        setIsSyncing(true);
        try {
            await updateRecord('milestones', milestoneId, {
                status_display: 'Paid',
                paid_date_display: new Date().toISOString()
            });
            
            // Automatically clear the lockout if it was active
            if (project?.isPaymentAlertActive) {
                await updateRecord('projects', project.id, { is_payment_alert_active: false });
            }
            
            await refetchData();
        } catch (err) {
            console.error("Payment sync fault", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddMilestone = async (m: any) => {
        if (!project) return;
        await createRecord('milestones', {
            project_id: project.id,
            title: m.title,
            amount_display: m.amountDisplay,
            due_date: m.dueDate,
            status_display: 'Pending'
        });
        await refetchData();
    };

    if (loading || !project) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[6px] text-xs font-display">Opening Financial Terminal...</div>;

    const totalPaid = pMilestones.filter(m => m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);

    return (
        <div className="space-y-12 animate-reveal pb-24 px-4 sm:px-0">
            <AddMilestoneModal 
                isOpen={isMilestoneModalOpen} 
                onClose={() => setMilestoneModalOpen(false)} 
                onAdd={handleAddMilestone} 
            />

            <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
                <div className="space-y-3">
                    <button onClick={() => navigate('/admin/track-pay')} className="text-[10px] font-extrabold uppercase tracking-[4px] text-brand-blue hover:text-brand-gold transition-colors flex items-center gap-2 mb-6">
                        &larr; Master Registry
                    </button>
                    <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tighter uppercase leading-none">{project.title}</h1>
                    <div className="flex flex-wrap items-center gap-6 mt-6">
                        <div className="flex items-center gap-2.5 text-slate-400">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><UserIcon className="w-4 h-4 text-brand-gold" /></div>
                            <UserNameDisplay user={customer} textClassName="text-sm font-bold text-slate-700" />
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-400">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><MapPinIcon className="w-4 h-4 text-brand-gold" /></div>
                            <span className="text-sm font-bold text-slate-700">{project.address}</span>
                        </div>
                    </div>
                </div>

                <div className={`p-8 flex items-center gap-8 rounded-[36px] shadow-premium transition-all duration-500 border border-white/5 ${project.isPaymentAlertActive ? 'bg-red-600' : 'bg-slate-50'}`}>
                    <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-[4px] ${project.isPaymentAlertActive ? 'text-white/60' : 'text-slate-400'}`}>BLOCKER SENTINEL</p>
                        <p className={`text-sm font-extrabold uppercase tracking-widest mt-1.5 ${project.isPaymentAlertActive ? 'text-white' : 'text-slate-900'}`}>
                            {project.isPaymentAlertActive ? 'LOCK ACTIVE' : 'REGISTRY OPEN'}
                        </p>
                    </div>
                    <Button 
                        onClick={handleToggleLock}
                        disabled={isSyncing}
                        className={`!rounded-full !px-12 !py-5 !text-[11px] font-extrabold uppercase tracking-[3px] shadow-xl transition-all hover:scale-[1.03] active:scale-95 font-display ${project.isPaymentAlertActive ? '!bg-white !text-red-600' : '!bg-brand-gold !text-slate-900 shadow-gold-glow'}`}
                    >
                        {isSyncing ? 'SYNCING...' : project.isPaymentAlertActive ? 'CLOSE REQUEST' : 'REQUEST PAYMENT'}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <Card className="luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium">
                        <div className="bg-slate-50/80 px-12 py-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-[4px]">Project Milestones</h2>
                            <Button onClick={() => setMilestoneModalOpen(true)} variant="secondary" className="!rounded-full !px-6 !py-2 !text-[10px] uppercase font-black tracking-widest">
                                + Add Manually
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-[3px]">Stage Identity</th>
                                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-[3px]">Allocation</th>
                                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">Status</th>
                                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {pMilestones.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-12 py-8 font-extrabold text-slate-900 uppercase tracking-wide text-sm font-display">{m.title}</td>
                                            <td className="px-12 py-8 font-display font-extrabold text-slate-900 text-lg">₹{m.amountDisplay.toLocaleString()}</td>
                                            <td className="px-12 py-8 text-center">
                                                <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[2px] border ${
                                                    m.statusDisplay === 'Paid' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' :
                                                    m.statusDisplay === 'Verifying' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                                                    m.statusDisplay === 'Completed' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20' :
                                                    'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>
                                                    {m.statusDisplay}
                                                </span>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                {m.statusDisplay !== 'Paid' && (
                                                    <Button 
                                                        onClick={() => handleMarkAsPaid(m.id)}
                                                        disabled={isSyncing}
                                                        className="!rounded-full !px-8 !py-2.5 !text-[10px] font-extrabold uppercase tracking-[2px] ml-auto font-display !bg-slate-900 !text-white"
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                                {m.statusDisplay === 'Paid' && (
                                                    <div className="flex items-center justify-end gap-2 text-accent-success font-black uppercase tracking-widest text-[10px]">
                                                        <CheckCircleIcon className="w-5 h-5" /> VERIFIED
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {pMilestones.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No milestones defined for this ledger.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <Card className="luxury-glass border-slate-100 !p-12 !rounded-[48px] shadow-premium bg-white">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-10">CAPITAL SUMMARY</h3>
                        <div className="space-y-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">NET PORTFOLIO VALUE</p>
                                <p className="text-4xl font-display font-extrabold text-slate-900 mt-2 tracking-tighter leading-none">₹{(project.budgetDisplay/100000).toFixed(2)}L</p>
                            </div>
                            <div className="pt-8 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">REVENUE REALIZED</p>
                                <p className="text-4xl font-display font-extrabold text-accent-success mt-2 tracking-tighter leading-none">₹{(totalPaid/100000).toFixed(2)}L</p>
                            </div>
                        </div>

                        <div className="mt-14 relative w-full aspect-square flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F8FAFC" strokeWidth="2.5" />
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray={`${(totalPaid / (project.budgetDisplay || 1)) * 100}, 100`} strokeLinecap="round" className="transition-all duration-[2000ms] ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-display font-extrabold text-slate-900 tracking-tighter">{Math.round((totalPaid / (project.budgetDisplay || 1)) * 100)}%</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">CLEARED</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectPayDetails;