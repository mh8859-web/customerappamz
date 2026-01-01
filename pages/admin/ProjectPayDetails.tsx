import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { updateRecord, createRecord } from '../../services/api';
import { DollarSignIcon, CheckCircleIcon, ZapIcon, AlertTriangleIcon, CreditCardIcon, UserIcon, MapPinIcon, MegaphoneIcon, XMarkIcon, RefreshIcon, BellIcon } from '../../components/icons';
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

    const handleRequestMilestone = async (milestoneId: string, title: string) => {
        if (!project || isSyncing) return;
        
        setIsSyncing(true);
        try {
            const { error } = await updateRecord('projects', project.id, { 
                is_payment_alert_active: true,
                requested_milestone_id: milestoneId,
                friendly_reminder_milestone_id: null,
                updated_at: new Date().toISOString()
            });
            
            if (error) throw error;
            
            await createRecord('messages', {
                chat_id: project.id,
                body: `SETTLEMENT REQUIRED: Access restricted. Action requested for milestone "${title}".`,
                sender_id: '786786',
                is_system_message: true
            });
            
            await refetchData();
        } catch (err: any) {
            console.error("Critical Failure:", err);
            alert(`Sync Error: ${err.message}.`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFriendlyNudge = async (milestoneId: string, title: string) => {
        if (!project || isSyncing) return;
        setIsSyncing(true);
        try {
            await updateRecord('projects', project.id, {
                friendly_reminder_milestone_id: milestoneId,
                is_payment_alert_active: false
            });
            
            await createRecord('messages', {
                chat_id: project.id,
                body: `FRIENDLY REMINDER: Payment for "${title}" is now due. Please process this to maintain project momentum.`,
                sender_id: '786786',
                is_system_message: true
            });
            
            await refetchData();
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearLock = async () => {
        if (!project || isSyncing) return;
        setIsSyncing(true);
        try {
            await updateRecord('projects', project.id, { 
                is_payment_alert_active: false,
                requested_milestone_id: null,
                friendly_reminder_milestone_id: null
            });
            await refetchData();
        } finally {
            setIsSyncing(false);
        }
    }

    const handleMarkAsPaid = async (milestoneId: string, title: string) => {
        if (isSyncing) return;
        if (!window.confirm(`CONFIRM SETTLEMENT: Has payment for "${title}" been received and verified?`)) return;
        
        setIsSyncing(true);
        try {
            await updateRecord('milestones', milestoneId, {
                status_display: 'Paid',
                paid_date_display: new Date().toISOString()
            });
            
            // Automatically clear dashboard lockout if this milestone was the cause
            if (project?.requestedMilestoneId === milestoneId || project?.friendlyReminderMilestoneId === milestoneId) {
                await updateRecord('projects', project.id, { 
                    is_payment_alert_active: false,
                    requested_milestone_id: null,
                    friendly_reminder_milestone_id: null
                });
            }
            
            await refetchData();
        } catch (err) {
            console.error("Payment sync fault", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRevertToUnpaid = async (milestoneId: string, title: string) => {
        if (isSyncing) return;
        if (!window.confirm(`REVERT TO UNPAID: Reset "${title}" to Pending status? This will allow you to request payment again.`)) return;

        setIsSyncing(true);
        try {
            await updateRecord('milestones', milestoneId, {
                status_display: 'Pending',
                paid_date_display: null
            });
            
            await createRecord('messages', {
                chat_id: project!.id,
                body: `SYSTEM UPDATE: Status of "${title}" has been reset to Pending for administrative correction.`,
                sender_id: '786786',
                is_system_message: true
            });

            await refetchData();
        } catch (err) {
            console.error("Reversal sync fault", err);
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

    if (loading || !project) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[6px] text-xs font-display">Syncing Ledger...</div>;

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

                <div className={`p-8 flex items-center gap-8 rounded-[36px] shadow-premium transition-all duration-500 border border-white/5 ${project.isPaymentAlertActive ? 'bg-red-600' : project.friendlyReminderMilestoneId ? 'bg-brand-gold/10 border-brand-gold/30' : 'bg-slate-50'}`}>
                    <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-[4px] ${project.isPaymentAlertActive ? 'text-white/60' : 'text-slate-400'}`}>BLOCKER SENTINEL</p>
                        <p className={`text-sm font-extrabold uppercase tracking-widest mt-1.5 ${project.isPaymentAlertActive ? 'text-white' : project.friendlyReminderMilestoneId ? 'text-brand-gold' : 'text-slate-900'}`}>
                            {project.isPaymentAlertActive ? 'VAULT RESTRICTED' : project.friendlyReminderMilestoneId ? 'FRIENDLY NUDGE ACTIVE' : 'REGISTRY OPEN'}
                        </p>
                    </div>
                    {(project.isPaymentAlertActive || project.friendlyReminderMilestoneId) && (
                        <Button 
                            onClick={handleClearLock}
                            disabled={isSyncing}
                            className={`!rounded-full !px-8 !py-4 !text-[10px] font-black uppercase tracking-[2px] shadow-xl ${project.isPaymentAlertActive ? '!bg-white !text-red-600' : '!bg-brand-gold !text-slate-900'}`}
                        >
                            CLOSE NOTIFICATION
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <Card className="luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium">
                        <div className="bg-slate-50/80 px-12 py-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-[4px]">Milestone Ledger</h2>
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
                                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">Control Hub</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {pMilestones.map(m => {
                                        const isBlocked = project.requestedMilestoneId === m.id && project.isPaymentAlertActive;
                                        const isNudged = project.friendlyReminderMilestoneId === m.id;
                                        const isVerifying = m.statusDisplay === 'Verifying';
                                        
                                        return (
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
                                                    <div className="flex justify-end gap-3 items-center">
                                                        {m.statusDisplay !== 'Paid' ? (
                                                            <>
                                                                <div className="flex gap-2 mr-4 border-r border-slate-100 pr-4">
                                                                    <button 
                                                                        onClick={() => handleFriendlyNudge(m.id, m.title)}
                                                                        disabled={isSyncing || isNudged}
                                                                        className={`p-3 rounded-xl transition-all ${isNudged ? 'bg-brand-gold text-slate-900 animate-pulse' : 'bg-slate-50 text-slate-300 hover:text-brand-gold hover:bg-brand-gold/10'}`}
                                                                        title="Send Gentle Reminder"
                                                                    >
                                                                        <BellIcon className="w-5 h-5" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleRequestMilestone(m.id, m.title)}
                                                                        disabled={isSyncing || isBlocked}
                                                                        className={`p-3 rounded-xl transition-all ${isBlocked ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                                                                        title="Mandatory Block Dashboard"
                                                                    >
                                                                        <MegaphoneIcon className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                                <Button 
                                                                    onClick={() => handleMarkAsPaid(m.id, m.title)}
                                                                    disabled={isSyncing}
                                                                    className={`!rounded-full !px-8 !py-3 !text-[10px] font-black uppercase tracking-[3px] font-display shadow-premium transition-all ${isVerifying ? '!bg-brand-gold !text-slate-900 animate-bounce' : '!bg-slate-900 !text-white'}`}
                                                                >
                                                                    {isVerifying ? 'VERIFY PAYMENT' : 'MARK PAID'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-5">
                                                                <div className="flex items-center gap-2 text-accent-success font-black uppercase tracking-widest text-[10px]">
                                                                    <CheckCircleIcon className="w-5 h-5" /> VERIFIED
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleRevertToUnpaid(m.id, m.title)}
                                                                    disabled={isSyncing}
                                                                    className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-slate-100 hover:border-red-200"
                                                                    title="Accidental Mark? Retrive Unpaid Status"
                                                                >
                                                                    <RefreshIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {pMilestones.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-32 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Awaiting milestone distribution for this project.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <Card className="luxury-glass border-slate-100 !p-12 !rounded-[48px] shadow-premium bg-white">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-10">FINANCIAL SUMMARY</h3>
                        <div className="space-y-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">PROJECT VALUATION</p>
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