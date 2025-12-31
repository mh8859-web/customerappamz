
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MapPinIcon, UserCircleIcon, FileTextIcon, DollarSignIcon, MessageSquareIcon, PhotoIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, CalendarIcon, SparklesIcon, FilePlusIcon, ZapIcon, ThumbUpIcon, RefreshIcon, InfoIcon } from '../components/icons';
import { Project, Design, User, UserRole, UnifiedUpdate, Milestone, Quote } from '../types';
import Modal from '../components/ui/Modal';
import ProjectStatusBar from '../components/ProjectStatusBar';
import ProjectGanttChart from '../components/customer/ProjectGanttChart';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import UploadDesignModal from '../components/design/UploadDesignModal';
import UploadQuoteModal from '../components/admin/UploadQuoteModal';
import AddMilestoneModal from '../components/admin/AddMilestoneModal';
import PaymentModal from '../components/customer/PaymentReminderModal';
import { createRecord, updateRecord, uploadProjectFile, deleteRecord } from '../services/api';

const TABS: Record<UserRole, string[]> = {
    Customer: ['Live Updates', 'Designs', 'Timeline', 'Quotes & Docs', 'Milestones'],
    Designer: ['Live Updates', 'Designs', 'Feedback', 'Quotes & Docs', 'Milestones'],
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
        const total = projectMilestones.reduce((sum, m) => sum + m.amountDisplay, 0);
        const settled = projectMilestones.filter(m => m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);
        const outstanding = total - settled;
        const progress = total > 0 ? (settled / total) * 100 : 0;
        return { total, settled, outstanding, progress };
    }, [projectMilestones]);

    const handleApplyStandardPlan = async () => {
        if (!project || isResettingPlan) return;
        if (!window.confirm("WARNING: This will delete ALL existing milestones for this project and apply the 10/40/45/5 split. Proceed?")) return;

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
                { title: '5% - ON COMPLETION', pct: 0.05, days: 75 }
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
            alert("Standard payment plan applied successfully.");
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
                body: `SUCCESS: The client has approved the final quotation! Moving project to Material Selection phase.`,
                sender_id: user?.id,
                is_system_message: true
            });
            await refetchData();
        } catch (err) {
            alert("Sync failed. Check connection.");
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

    if (usersLoading || dataLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synchronizing Project Data...</div>;
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
                        <UserNameDisplay user={customer} showAvatar={true} textClassName="text-sm font-bold text-slate-900" imageSize="w-8 h-8" />
                        <div className="h-4 w-px bg-slate-200"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {project.id.slice(0, 8)}</span>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/chat/' + project.id)} className="!rounded-full !px-8 h-14 shadow-sm">
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
                                <Card className="!p-10 bg-brand-gold/5 border-2 border-brand-gold/30 rounded-[40px] shadow-gold-glow flex flex-col md:flex-row items-center justify-between gap-8 animate-pulse-fast">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 rounded-[28px] bg-brand-gold text-slate-900 flex items-center justify-center shadow-lg"><FileTextIcon className="w-10 h-10" /></div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Final Quote Ready</h3>
                                            <p className="text-sm text-slate-500 font-bold uppercase mt-2">Approve now to move into material selection and site setup.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <a href={latestQuote.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="!rounded-full !px-10 !py-4 uppercase font-black tracking-widest text-[11px]">View PDF</Button></a>
                                        <Button onClick={handleApproveQuote} disabled={isApproveSubmitting} className="!rounded-full !px-12 !py-4 !bg-slate-900 !text-white uppercase font-black tracking-[3px] text-[11px]">{isApproveSubmitting ? 'Syncing...' : 'Approve & Start'}</Button>
                                    </div>
                                </Card>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="luxury-glass">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Address</span>
                                    <p className="text-sm font-bold text-slate-900 mt-2">{project.address}</p>
                                </Card>
                                <Card className="luxury-glass">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Allocation (₹)</span>
                                    <p className="text-xl font-display font-black text-slate-900 mt-1">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                                </Card>
                                <Card className="luxury-glass">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Team Lead</span>
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

                    {activeTab === 'Milestones' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Mandatory Payment Schedule</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">10% Token / 40% Materials / 45% Installation / 5% Completion</p>
                                </div>
                                {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
                                    <Button onClick={handleApplyStandardPlan} disabled={isResettingPlan} variant="secondary" className="!rounded-full !py-3 !px-6 !text-[10px] uppercase font-black tracking-widest border-brand-gold/30">
                                        <RefreshIcon className={`w-4 h-4 mr-2 text-brand-gold ${isResettingPlan ? 'animate-spin' : ''}`} /> Reset Standard Plan
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {projectMilestones.map((m, idx) => (
                                    <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-white border border-slate-100 rounded-[32px] hover:shadow-premium transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${m.statusDisplay === 'Paid' ? 'bg-accent-success/10 text-accent-success' : 'bg-slate-50 text-slate-300'}`}>
                                                {m.statusDisplay === 'Paid' ? <CheckCircleIcon className="w-6 h-6" /> : (idx + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-wide">{m.title}</h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Due {new Date(m.dueDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[2px]">Allocation</p>
                                                <p className="text-xl font-display font-black text-slate-900 tracking-tight">₹{m.amountDisplay.toLocaleString()}</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${m.statusDisplay === 'Paid' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' : 'bg-slate-50 text-slate-400 border-slate-200/50'}`}>
                                                {m.statusDisplay === 'Paid' ? 'Settled' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Quotes & Docs' && (
                        <div className="grid gap-6">
                            {(user.role === 'Admin' || user.role === 'Designer') && (
                                <button onClick={() => setUploadQuoteModalOpen(true)} className="flex items-center gap-6 p-8 border-2 border-dashed border-slate-200 rounded-[32px] hover:border-brand-blue hover:bg-white transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-brand-blue transition-all"><FilePlusIcon className="w-7 h-7" /></div>
                                    <h3 className="font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest text-sm">Upload Updated Quotation</h3>
                                </button>
                            )}
                            {projectQuotes.map(quote => (
                                <Card key={quote.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 luxury-glass border-slate-100 rounded-[32px]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300"><FileTextIcon className="w-7 h-7" /></div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-wide">{quote.version} Quote</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Uploaded {new Date(quote.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="!rounded-full !px-8 uppercase font-black text-[10px] tracking-widest">View PDF</Button></a>
                                        {user.role === 'Customer' && project.stage === 'awaiting_updated_quote' && quote.id === latestQuote.id && (
                                            <Button onClick={handleApproveQuote} disabled={isApproveSubmitting} className="!rounded-full !px-10 !bg-brand-gold !text-slate-900 uppercase font-black text-[10px] tracking-widest shadow-gold-glow animate-pulse">Approve This Version</Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <UploadQuoteModal isOpen={isUploadQuoteModalOpen} onClose={() => setUploadQuoteModalOpen(false)} onUpload={async (f,v) => { const url = await uploadProjectFile(project.id, f); if(url) { await createRecord('quotes', { project_id: project.id, version: v, file_url: url, uploaded_by: user.id }); await refetchData(); } }} />
            <AddMilestoneModal isOpen={isAddMilestoneModalOpen} onClose={() => setAddMilestoneModalOpen(false)} onAdd={async (m) => { await createRecord('milestones', { project_id: project.id, ...m, status_display: 'Pending' }); await refetchData(); }} />
        </div>
    );
};

export default ProjectDetails;
