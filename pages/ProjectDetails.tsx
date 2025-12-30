
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MapPinIcon, UserCircleIcon, FileTextIcon, DollarSignIcon, MessageSquareIcon, PhotoIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, CalendarIcon } from '../components/icons';
import { Project, Design, User, UserRole, UnifiedUpdate, Milestone } from '../types';
import Modal from '../components/ui/Modal';
import ProjectStatusBar from '../components/ProjectStatusBar';
import ProjectGanttChart from '../components/customer/ProjectGanttChart';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import UploadDesignModal from '../components/design/UploadDesignModal';
import AddMilestoneModal from '../components/admin/AddMilestoneModal';
import PaymentModal from '../components/customer/PaymentReminderModal';
import { createRecord, updateRecord } from '../services/api';

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
    const [isAddMilestoneModalOpen, setAddMilestoneModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const projectMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [milestones, projectId]);
    
    const financialStats = useMemo(() => {
        const total = projectMilestones.reduce((sum, m) => sum + m.amountDisplay, 0);
        const settled = projectMilestones.filter(m => m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);
        const outstanding = total - settled;
        const progress = total > 0 ? (settled / total) * 100 : 0;
        return { total, settled, outstanding, progress };
    }, [projectMilestones]);

    const isLoading = dataLoading || usersLoading;

    const handleAddMilestone = async (data: any) => {
        if (!projectId) return;
        const { error } = await createRecord('milestones', {
            project_id: projectId,
            title: data.title,
            amount_display: data.amountDisplay,
            due_date: data.dueDate,
            status_display: 'Pending'
        });
        if (!error) await refetchData();
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

    if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Synchronizing Portfolio...</div>;
    if (!project || !user) return <div className="text-center text-red-500 p-12">Project not found.</div>;

    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);
    const tabs = TABS[user.role] || [];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase tracking-widest rounded-md border border-brand-gold/20">Official Account</span>
                        <span className="text-slate-300 text-xs font-medium">Ref: {project.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight leading-none uppercase">{project.title}</h1>
                    <div className="mt-4 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Client:</span>
                            <UserNameDisplay user={customer} textClassName="text-sm font-bold text-slate-900" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => navigate('/chat/' + project.id)} className="!rounded-full !px-8 h-12 shadow-sm border-slate-200">
                      <MessageSquareIcon className="w-4 h-4 mr-2" />
                      Open Channel
                    </Button>
                </div>
            </div>

            {/* Tracker Hub */}
            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            {/* Content Tabs */}
            <div className="space-y-8">
                <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[22px] w-fit overflow-x-auto max-w-full no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[2px] whitespace-nowrap transition-all duration-300 ${
                                activeTab === tab 
                                ? 'bg-white text-brand-blue shadow-card ring-1 ring-slate-200/50' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="min-h-[500px] animate-in">
                    {activeTab === 'Live Updates' && (
                        <div className="space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="luxury-glass border-slate-100">
                                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Site Location</span>
                                    </div>
                                    <p className="text-sm text-slate-900 font-bold">{project.address}</p>
                                </Card>
                                <Card className="luxury-glass border-slate-100">
                                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                                        <UserCircleIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Creative Lead</span>
                                    </div>
                                    <UserNameDisplay user={designer} showAvatar={true} textClassName="text-slate-900 font-black text-sm" imageSize="w-8 h-8" />
                                </Card>
                                <Card className="luxury-glass border-slate-100">
                                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                                        <DollarSignIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Allocation</span>
                                    </div>
                                    <p className="text-xl font-display font-black text-slate-900 tracking-tighter">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                                </Card>
                             </div>

                            {unifiedUpdateFeed.length > 0 ? (
                                <div className="space-y-4">
                                    {unifiedUpdateFeed.map((update) => (
                                        <div key={update.id} className="flex gap-6 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-50 flex-shrink-0 ring-1 ring-slate-100">
                                                    <img src={update.author?.avatarUrl} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="w-0.5 flex-1 bg-slate-100 group-last:bg-transparent my-2"></div>
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <div className="flex justify-between items-baseline mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{update.author?.fullName}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                            update.type === 'System' ? 'bg-purple-100 text-purple-600' : 'bg-brand-blue/10 text-brand-blue'
                                                        }`}>{update.type}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase">{new Date(update.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-base text-slate-600 font-medium leading-relaxed">{update.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 text-slate-300 font-black uppercase tracking-[4px] text-xs">Awaiting first update...</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Designs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {user.role === 'Designer' && (
                                <button onClick={() => setUploadDesignModalOpen(true)} className="aspect-video rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-brand-blue hover:shadow-premium transition-all group">
                                    <PhotoIcon className="w-10 h-10 text-slate-300 group-hover:text-brand-blue" />
                                    <span className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 group-hover:text-brand-blue">Upload Asset</span>
                                </button>
                            )}
                            {designs.filter(d => d.projectId === project.id).map(design => (
                                <Card key={design.id} className="p-0 overflow-hidden border-slate-100 hover:shadow-premium transition-all rounded-[32px]">
                                    <div className="aspect-video relative group">
                                        <img src={design.fileUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" className="!rounded-full">View Large</Button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-black text-slate-900 uppercase tracking-wide">V{design.version} Render</h3>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${design.approved ? 'text-accent-success' : 'text-accent-warning'}`}>
                                                {design.approved ? 'Approved' : 'In Review'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium line-clamp-2">{design.notes}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Milestones' && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="bg-slate-900 text-white md:col-span-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Financial Settlement</span>
                                            <span className="text-brand-gold font-bold text-xs">{financialStats.progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden ring-1 ring-white/10">
                                            <div className="bg-brand-gold h-full rounded-full transition-all duration-1000 shadow-gold-glow" style={{ width: `${financialStats.progress}%` }}></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Contract Total</p>
                                                <p className="text-2xl font-display font-black tracking-tight text-white">₹{(financialStats.total / 100000).toFixed(2)}L</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Settled Capital</p>
                                                <p className="text-2xl font-display font-black text-brand-gold tracking-tight text-brand-gold">₹{(financialStats.settled / 100000).toFixed(2)}L</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="luxury-glass flex flex-col justify-center text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Balance</p>
                                    <p className="text-3xl font-display font-black text-slate-900 tracking-tighter">₹{(financialStats.outstanding / 1000).toFixed(0)}K</p>
                                </Card>

                                {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
                                    <button 
                                        onClick={() => setAddMilestoneModalOpen(true)}
                                        className="h-full border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-brand-gold transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-gold/10 group-hover:text-brand-gold text-slate-400 transition-colors">
                                            <DollarSignIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-gold">Add Milestone</span>
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {projectMilestones.map((m, idx) => (
                                    <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-white border border-slate-100 rounded-[32px] hover:shadow-premium transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${
                                                m.statusDisplay === 'Paid' ? 'bg-accent-success/10 text-accent-success' : 
                                                m.statusDisplay === 'Completed' ? 'bg-brand-blue/10 text-brand-blue' : 
                                                'bg-slate-50 text-slate-300'
                                            }`}>
                                                {m.statusDisplay === 'Paid' ? <CheckCircleIcon className="w-6 h-6" /> : (idx + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-wide">{m.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" /> Due {new Date(m.dueDate).toLocaleDateString()}
                                                    </span>
                                                    {m.paidDateDisplay && (
                                                        <span className="text-[10px] font-black text-accent-success uppercase tracking-widest flex items-center gap-1">
                                                            <CheckCircleIcon className="w-3 h-3" /> Settled {new Date(m.paidDateDisplay).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-6">
                                            <div className="text-left md:text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[2px]">Allocation</p>
                                                <p className="text-xl font-display font-black text-slate-900 tracking-tight">₹{m.amountDisplay.toLocaleString()}</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {user.role === 'Customer' && m.statusDisplay === 'Completed' && (
                                                    <Button 
                                                        onClick={() => { setSelectedMilestone(m); setPaymentModalOpen(true); }}
                                                        className="!rounded-full !px-8 !py-3 !bg-slate-900 !text-[10px] !font-black uppercase tracking-widest shadow-button"
                                                    >
                                                        Proceed to Settlement
                                                    </Button>
                                                )}

                                                {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
                                                    <div className="flex gap-2">
                                                        {m.statusDisplay === 'Pending' && (
                                                            <button 
                                                                onClick={() => handleUpdateMilestoneStatus(m.id, 'Completed')}
                                                                className="px-4 py-2 bg-slate-100 hover:bg-brand-blue/10 hover:text-brand-blue text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                                            >
                                                                Mark Completed
                                                            </button>
                                                        )}
                                                        {m.statusDisplay === 'Completed' && (
                                                            <button 
                                                                onClick={() => handleUpdateMilestoneStatus(m.id, 'Paid')}
                                                                className="px-4 py-2 bg-brand-gold/10 text-brand-gold text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                                            >
                                                                Confirm Payment
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                                    m.statusDisplay === 'Paid' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' : 
                                                    m.statusDisplay === 'Completed' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20 animate-pulse' : 
                                                    'bg-slate-50 text-slate-400 border-slate-200/50'
                                                }`}>
                                                    {m.statusDisplay === 'Paid' ? 'Settled' : m.statusDisplay === 'Completed' ? 'Invoiced' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'Timeline' && <ProjectGanttChart milestones={projectMilestones} startDate={project.startDate} />}
                    
                    {activeTab === 'Quotes & Docs' && (
                        <div className="grid gap-4 max-w-3xl">
                            {quotes.filter(q => q.projectId === project.id).map(quote => (
                                <Card key={quote.id} className="flex items-center justify-between p-6 luxury-glass border-slate-100 rounded-[24px]">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-brand-blue/5 rounded-2xl text-brand-blue">
                                            <FileTextIcon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">{quote.version} Quote</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Uploaded {new Date(quote.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <a href={quote.fileUrl} target="_blank" className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[3px] px-8 py-4 rounded-2xl hover:bg-brand-dark transition-all shadow-button active:scale-95">Access PDF</a>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <UploadDesignModal isOpen={isUploadDesignModalOpen} onClose={() => setUploadDesignModalOpen(false)} onUpload={() => {}} />
            <AddMilestoneModal isOpen={isAddMilestoneModalOpen} onClose={() => setAddMilestoneModalOpen(false)} onAdd={handleAddMilestone} />
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
