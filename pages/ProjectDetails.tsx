
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MapPinIcon, UserCircleIcon, FileTextIcon, DollarSignIcon, MessageSquareIcon, PhotoIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, CalendarIcon, SparklesIcon, FilePlusIcon, ZapIcon, ThumbUpIcon, RefreshIcon, InfoIcon, AlertTriangleIcon } from '../components/icons';
import { Project, Design, User, UserRole, UnifiedUpdate, Milestone, Quote } from '../types';
import Modal from '../components/ui/Modal';
import ProjectStatusBar from '../components/ProjectStatusBar';
import ProjectGanttChart from '../components/customer/ProjectGanttChart';
import MaterialSelection from '../components/project/MaterialSelection';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import UploadDesignModal from '../components/design/UploadDesignModal';
import UploadQuoteModal from '../components/admin/UploadQuoteModal';
import AddMilestoneModal from '../components/admin/AddMilestoneModal';
import PaymentModal from '../components/customer/PaymentReminderModal';
import { createRecord, updateRecord, uploadProjectFile, deleteRecord } from '../services/api';

const TABS: Record<UserRole, string[]> = {
    Customer: ['Live Updates', 'Designs', 'Timeline', 'Materials', 'Quotes & Docs', 'Milestones'],
    Designer: ['Live Updates', 'Designs', 'Feedback', 'Materials', 'Quotes & Docs', 'Milestones'],
    Admin: ['Live Updates', 'Designs', 'Quotes & Docs', 'Milestones'],
    'Sub-Admin': ['Live Updates', 'Designs', 'Quotes & Docs', 'Milestones'],
    Accounts: ['Live Updates', 'Quotes & Docs', 'Milestones'],
    'Project Head': ['Live Updates', 'Designs', 'Feedback', 'Quotes & Docs', 'Milestones'],
    'Production Head': ['Live Updates', 'Quotes & Docs'],
    'Site Head': ['Live Updates', 'Timeline', 'Designs', 'Quotes & Docs'],
};

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { findUserById, loading: usersLoading } = useUsers();
    const { projects, designs, quotes, milestones, projectUpdates, workLogs, activityLogs, refetchData, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('Live Updates');
    const [isUploadDesignModalOpen, setUploadDesignModalOpen] = useState(false);
    const [isUploadQuoteModalOpen, setUploadQuoteModalOpen] = useState(false);
    const [isAddMilestoneModalOpen, setAddMilestoneModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
    const [isApproveSubmitting, setIsApproveSubmitting] = useState(false);
    const [isResettingPlan, setIsResettingPlan] = useState(false);
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const projectMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [milestones, projectId]);
    const projectQuotes = useMemo(() => quotes.filter(q => q.projectId === projectId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [quotes, projectId]);
    const latestQuote = projectQuotes[0];

    const financialStats = useMemo(() => {
        const baseBudget = project?.budgetDisplay || 0;
        const total = projectMilestones.length > 0 
            ? projectMilestones.reduce((sum, m) => sum + m.amountDisplay, 0)
            : baseBudget;
            
        const settled = projectMilestones.filter(m => m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);
        const outstanding = total - settled;
        const invoiced = projectMilestones.filter(m => m.statusDisplay === 'Completed').reduce((sum, m) => sum + m.amountDisplay, 0);
        const progress = total > 0 ? (settled / total) * 100 : 0;
        return { total, settled, outstanding, invoiced, progress };
    }, [projectMilestones, project]);

    const handleApplyStandardPlan = async () => {
        if (!project || isResettingPlan) return;
        if (!window.confirm("CRITICAL ACTION: Reset this project to standard 10/40/45/5% split? This deletes custom milestones.")) return;

        setIsResettingPlan(true);
        try {
            for (const m of projectMilestones) {
                await deleteRecord('milestones', m.id);
            }
            const budget = project.budgetDisplay;
            const plan = [
                { title: '10% - TOKEN ADVANCE ON CONFIRMATION', pct: 0.10, days: 0 },
                { title: '40% - ADVANCE FOR MATERIALS', pct: 0.40, days: 14 },
                { title: '45% - ON SITE INSTALLATION', pct: 0.45, days: 45 },
                { title: '5% - ON COMPLETION (SETTLEMENT)', pct: 0.05, days: 75 }
            ];
            const start = new Date(project.startDate);
            for (const step of plan) {
                const due = new Date(start);
                due.setDate(due.getDate() + step.days);
                await createRecord('milestones', {
                    project_id: project.id,
                    title: step.title,
                    amount_display: Math.round(budget * step.pct),
                    due_date: due.toISOString().split('T')[0],
                    status_display: 'Pending'
                });
            }
            await refetchData();
            alert("Standard Billing Reset Complete.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsResettingPlan(false);
        }
    };

    const handleApproveQuote = async () => {
        if (!project || isApproveSubmitting) return;
        if (!window.confirm("Approve this quotation and move to material selection?")) return;

        setIsApproveSubmitting(true);
        try {
            await updateRecord('projects', project.id, { stage: 'material_selection' });
            await createRecord('messages', {
                chat_id: project.id,
                body: `CLIENT APPROVAL: The official quotation has been accepted! We are now initializing procurement and site setup.`,
                sender_id: user?.id,
                is_system_message: true
            });
            await refetchData();
        } catch (err) {
            alert("Approval sync failed. Check connection.");
        } finally {
            setIsApproveSubmitting(false);
        }
    };

    const handleUpdateMilestoneStatus = async (mId: string, status: string) => {
        const updates: any = { status_display: status };
        if (status === 'Paid') updates.paid_date_display = new Date().toISOString();
        const { error } = await updateRecord('milestones', mId, updates);
        if (!error) await refetchData();
    };

    const unifiedUpdateFeed = useMemo(() => {
        if (!projectId) return [];
        const updates = projectUpdates.filter(u => u.projectId === projectId).map(u => ({ id: u.id, type: 'Update', author: findUserById(u.authorId), content: u.message, timestamp: u.createdAt }));
        const logs = workLogs.filter(w => w.projectId === projectId).map(w => ({ id: w.id, type: 'Work Log', author: findUserById(w.designerId), content: w.tasksCompleted, timestamp: new Date(w.date).toISOString() }));
        const system = activityLogs.filter(a => a.projectId === projectId).map(a => ({ id: a.id, type: 'System', author: findUserById(a.actorId), content: a.details, timestamp: a.createdAt }));
        return [...updates, ...logs, ...system].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [projectId, projectUpdates, workLogs, activityLogs, findUserById]);

    if (usersLoading || dataLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synchronizing Project Portfolio...</div>;
    if (!project || !user) return <div className="text-center p-20">Portfolio link broken.</div>;

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase">{project.title}</h1>
                    <div className="mt-4 flex items-center gap-6">
                        <UserNameDisplay user={customer} showAvatar={true} textClassName="font-bold text-sm text-slate-900" imageSize="w-8 h-8" />
                        <div className="h-4 w-px bg-slate-200"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project ID: {project.id.slice(0, 8)}</span>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/chat/' + project.id)} className="!rounded-full !px-8 h-14 shadow-premium border-slate-200">
                    <MessageSquareIcon className="w-5 h-5 mr-3" /> Communication Portal
                </Button>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            <div className="space-y-8">
                <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[22px] w-fit overflow-x-auto max-w-full no-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[2px] transition-all ${activeTab === tab ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                    ))}
                </nav>

                <div className="min-h-[500px] animate-in">
                    {activeTab === 'Live Updates' && (
                        <div className="space-y-12">
                            {user.role === 'Customer' && project.stage === 'awaiting_updated_quote' && latestQuote && (
                                <Card className="!p-10 bg-brand-gold/5 border-2 border-brand-gold/40 rounded-[40px] shadow-gold-glow flex flex-col md:flex-row items-center justify-between gap-8 animate-pulse-fast">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 rounded-[28px] bg-brand-gold text-slate-900 flex items-center justify-center shadow-lg animate-bounce-slow"><FileTextIcon className="w-10 h-10" /></div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Quotation Awaiting Action</h3>
                                            <p className="text-sm text-slate-600 font-bold uppercase mt-2">The revised execution quote is ready. Please approve to start procurement.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <a href={latestQuote.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="!rounded-full !px-10 !py-5 uppercase font-black tracking-widest text-[12px]">View PDF</Button></a>
                                        <Button onClick={handleApproveQuote} disabled={isApproveSubmitting} className="!rounded-full !px-14 !py-5 !bg-slate-900 !text-white uppercase font-black tracking-[4px] text-[12px] shadow-button">{isApproveSubmitting ? 'Processing...' : 'Approve & Start'}</Button>
                                    </div>
                                </Card>
                            )}
                            
                            {user.role === 'Customer' && financialStats.invoiced > 0 && (
                                <Card className="!p-8 bg-red-600 border-none rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-button ring-4 ring-red-500/20">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white text-red-600 flex items-center justify-center shadow-lg animate-pulse"><CreditCardIcon className="w-8 h-8" /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Immediate Payment Required</h3>
                                            <p className="text-sm text-white/80 font-bold uppercase tracking-wider">A milestone has been billed. Work may pause until settlement is confirmed.</p>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[2px]">Amount Due</p>
                                        <p className="text-3xl font-display font-black text-white">₹{financialStats.invoiced.toLocaleString()}</p>
                                    </div>
                                    <Button onClick={() => setActiveTab('Milestones')} className="!bg-white !text-red-600 hover:!bg-slate-100 !rounded-full !px-10 !py-4 !font-black !text-xs uppercase tracking-widest">Settle Invoice</Button>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="luxury-glass">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Location</span>
                                    <p className="text-sm font-bold text-slate-900 mt-2">{project.address}</p>
                                </Card>
                                <Card className="luxury-glass">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capital Allocation</span>
                                    <p className="text-xl font-display font-black text-slate-900 mt-1">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                                </Card>
                                <Card className="luxury-glass">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Project Lead</span>
                                    <UserNameDisplay user={designer} showAvatar={true} textClassName="font-bold text-sm text-slate-900" imageSize="w-8 h-8" />
                                </Card>
                            </div>
                            
                            <div className="space-y-4">
                                {unifiedUpdateFeed.map(update => (
                                    <div key={update.id} className="flex gap-6 group">
                                        <div className="flex flex-col items-center"><div className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-50 ring-1 ring-slate-100"><img src={update.author?.avatarUrl} className="w-full h-full object-cover" /></div><div className="w-0.5 flex-1 bg-slate-100 group-last:bg-transparent my-2"></div></div>
                                        <div className="flex-1 pb-8">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-900 uppercase">{update.author?.fullName}</span><span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-brand-blue/10 text-brand-blue">{update.type}</span></div>
                                                <span className="text-[10px] text-slate-300 font-bold uppercase">{new Date(update.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-base text-slate-600 font-medium leading-relaxed">{update.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Materials' && (
                        <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />
                    )}

                    {activeTab === 'Milestones' && (
                        <div className="space-y-10">
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-slate-900 p-10 rounded-[40px] border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                                <div className="z-10">
                                    <h3 className="font-black text-white uppercase tracking-[4px] text-lg">Official Billing Schedule</h3>
                                    <p className="text-xs text-brand-gold font-black uppercase mt-1 tracking-[2px]">10% Token | 40% Materials | 45% Installation | 5% Completion</p>
                                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div><p className="text-[9px] font-black text-white/40 uppercase">Total Contract</p><p className="text-xl font-display font-black text-white">₹{(financialStats.total / 100000).toFixed(2)}L</p></div>
                                        <div><p className="text-[9px] font-black text-white/40 uppercase">Settled</p><p className="text-xl font-display font-black text-brand-gold">₹{(financialStats.settled / 100000).toFixed(2)}L</p></div>
                                        <div><p className="text-[9px] font-black text-white/40 uppercase">Outstanding</p><p className="text-xl font-display font-black text-white">₹{(financialStats.outstanding / 1000).toFixed(0)}K</p></div>
                                        <div><p className="text-[9px] font-black text-white/40 uppercase">Completion</p><p className="text-xl font-display font-black text-white">{financialStats.progress.toFixed(0)}%</p></div>
                                    </div>
                                </div>
                                {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
                                    <Button onClick={handleApplyStandardPlan} disabled={isResettingPlan} variant="secondary" className="!rounded-full !py-4 !px-8 !text-[11px] uppercase font-black tracking-widest border-white/20 !text-white hover:bg-white/10 mt-8 lg:mt-0 z-10">
                                        <RefreshIcon className={`w-5 h-5 mr-3 text-brand-gold ${isResettingPlan ? 'animate-spin' : ''}`} /> Enforce 10/40/45/5 Split
                                    </Button>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {projectMilestones.map((m, idx) => {
                                    return (
                                        <div key={m.id} className={`flex flex-col md:flex-row md:items-center justify-between p-10 bg-white border rounded-[40px] hover:shadow-premium transition-all ${m.statusDisplay === 'Completed' ? 'border-red-500/30 ring-4 ring-red-500/5' : 'border-slate-100'}`}>
                                            <div className="flex items-center gap-8">
                                                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-lg ${
                                                    m.statusDisplay === 'Paid' ? 'bg-accent-success/10 text-accent-success' : 
                                                    m.statusDisplay === 'Completed' ? 'bg-red-600 text-white animate-pulse' : 
                                                    'bg-slate-50 text-slate-300'
                                                }`}>
                                                    {m.statusDisplay === 'Paid' ? <CheckCircleIcon className="w-8 h-8" /> : (idx + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-black text-slate-900 uppercase tracking-wide text-lg">{m.title}</h3>
                                                        {m.statusDisplay === 'Completed' && (
                                                            <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-button">Action Required: Payment</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> Due {new Date(m.dueDate).toLocaleDateString()}</span>
                                                        {m.paidDateDisplay && <span className="text-[11px] font-black text-accent-success uppercase tracking-widest flex items-center gap-1 border-l pl-3 ml-3 border-slate-200"><CheckCircleIcon className="w-4 h-4" /> Cleared {new Date(m.paidDateDisplay).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center gap-10 mt-8 md:mt-0">
                                                <div className="text-center md:text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Capital Amount</p>
                                                    <p className="text-2xl font-display font-black text-slate-900 tracking-tight">₹{m.amountDisplay.toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {user.role === 'Customer' && m.statusDisplay === 'Completed' && (
                                                        <Button onClick={() => { setSelectedMilestone(m); setPaymentModalOpen(true); }} className="!rounded-full !px-12 !py-4 !bg-slate-900 !text-white uppercase font-black text-[11px] tracking-widest shadow-button">Proceed to Settlement</Button>
                                                    )}
                                                    
                                                    {(user.role === 'Admin' || user.role === 'Sub-Admin') && m.statusDisplay === 'Pending' && (
                                                        <Button variant="secondary" onClick={() => handleUpdateMilestoneStatus(m.id, 'Completed')} className="!rounded-full !py-2.5 !px-6 !text-[10px] uppercase font-black tracking-widest">Mark Invoiced</Button>
                                                    )}

                                                    <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] border ${
                                                        m.statusDisplay === 'Paid' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' : 
                                                        m.statusDisplay === 'Completed' ? 'bg-red-50 text-red-600 border-red-200' : 
                                                        'bg-slate-50 text-slate-400 border-slate-200/50'
                                                    }`}>
                                                        {m.statusDisplay === 'Paid' ? 'Cleared' : m.statusDisplay === 'Completed' ? 'UNPAID BILL' : 'Projected'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Quotes & Docs' && (
                        <div className="grid gap-6">
                            {(user.role === 'Admin' || user.role === 'Designer') && (
                                <button onClick={() => setUploadQuoteModalOpen(true)} className="flex items-center gap-8 p-10 border-2 border-dashed border-slate-200 rounded-[40px] hover:border-brand-blue hover:bg-white transition-all group shadow-sm">
                                    <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm"><FilePlusIcon className="w-8 h-8" /></div>
                                    <div className="text-left">
                                        <h3 className="font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest text-lg transition-colors">Provision Updated Quotation</h3>
                                        <p className="text-xs text-slate-300 font-bold uppercase mt-1 tracking-widest">Supports Architectural PDF Format Only</p>
                                    </div>
                                </button>
                            )}
                            
                            {projectQuotes.map(quote => (
                                <Card key={quote.id} className="flex flex-col md:flex-row md:items-center justify-between p-10 luxury-glass border-slate-100 rounded-[40px] shadow-premium">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 rounded-[24px] bg-brand-blue/10 flex items-center justify-center text-brand-blue"><FileTextIcon className="w-8 h-8" /></div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-wide text-xl">{quote.version} Quotation</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4" /> Registered on {new Date(quote.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-6 md:mt-0">
                                        <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="!rounded-full !px-10 !py-4 uppercase font-black text-[11px] tracking-widest">View Asset</Button></a>
                                        {user.role === 'Customer' && project.stage === 'awaiting_updated_quote' && quote.id === latestQuote.id && (
                                            <Button onClick={handleApproveQuote} disabled={isApproveSubmitting} className="!rounded-full !px-12 !bg-brand-gold !text-slate-900 uppercase font-black text-[11px] tracking-widest shadow-gold-glow animate-pulse">Approve Quotation</Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'Designs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(user.role === 'Designer' || user.role === 'Admin') && (
                                <button onClick={() => setUploadDesignModalOpen(true)} className="aspect-video rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-brand-blue hover:shadow-premium transition-all group">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-blue/10 group-hover:text-brand-blue text-slate-300 transition-colors">
                                        <PhotoIcon className="w-8 h-8" />
                                    </div>
                                    <span className="text-[12px] font-black uppercase tracking-[3px] text-slate-400 group-hover:text-brand-blue">Upload Visual</span>
                                </button>
                            )}
                            {designs.filter(d => d.projectId === project.id).map(design => (
                                <Card key={design.id} className="p-0 overflow-hidden border-slate-100 hover:shadow-premium transition-all rounded-[40px] bg-white group/card">
                                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                                        <img src={design.fileUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" alt="Render" />
                                    </div>
                                    <div className="p-8">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-black text-slate-900 uppercase tracking-wide">v{design.version} Render</h3>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${design.approved ? 'bg-accent-success/10 text-accent-success' : 'bg-accent-warning/10 text-accent-warning'}`}>{design.approved ? 'Approved' : 'In Review'}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Timeline' && <ProjectGanttChart milestones={projectMilestones} startDate={project.startDate} />}
                </div>
            </div>

            <UploadQuoteModal isOpen={isUploadQuoteModalOpen} onClose={() => setUploadQuoteModalOpen(false)} onUpload={async (f,v) => { const url = await uploadProjectFile(project.id, f); if(url) { await createRecord('quotes', { project_id: project.id, version: v, file_url: url, uploaded_by: user.id }); await refetchData(); } }} />
            <AddMilestoneModal isOpen={isAddMilestoneModalOpen} onClose={() => setAddMilestoneModalOpen(false)} onAdd={async (m) => { await createRecord('milestones', { project_id: project.id, ...m, status_display: 'Pending' }); await refetchData(); }} />
            <UploadDesignModal isOpen={isUploadDesignModalOpen} onClose={() => setUploadDesignModalOpen(false)} onUpload={async (f,n,t) => { const url = await uploadProjectFile(project.id, f); if(url) { await createRecord('designs', { project_id: project.id, file_url: url, notes: n, type: t, version: designs.length + 1, uploaded_by: user.id }); await refetchData(); } }} />
            <PaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setPaymentModalOpen(false)} 
                milestone={selectedMilestone} 
                onPaymentSuccess={(id) => handleUpdateMilestoneStatus(id, 'Paid')} 
            />
        </div>
    );
};

export default ProjectDetails;
