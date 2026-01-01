
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MapPinIcon, UserCircleIcon, FileTextIcon, DollarSignIcon, MessageSquareIcon, PhotoIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, CalendarIcon, SparklesIcon, FilePlusIcon, ZapIcon, ThumbUpIcon, RefreshIcon, InfoIcon, AlertTriangleIcon, EyeIcon } from '../components/icons';
import { Project, Design, User, UserRole, UnifiedUpdate, Milestone, Quote, ProjectStage } from '../types';
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

const getTabForStage = (stage: ProjectStage): string => {
    switch(stage) {
        case 'design_phase': return 'Designs';
        case 'awaiting_updated_quote': return 'Quotes & Docs';
        case 'material_selection': return 'Materials';
        case 'execution': return 'Live Updates';
        case 'awaiting_client_completion_approval':
        case 'awaiting_admin_completion_approval': return 'Milestones';
        default: return 'Live Updates';
    }
};

const HDViewer: React.FC<{ isOpen: boolean; onClose: () => void; url: string; title: string }> = ({ isOpen, onClose, url, title }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Visual Inspection: ${title}`}>
        <div className="flex flex-col items-center gap-6">
            <div className="w-full aspect-video bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 relative">
                <img src={url} className="w-full h-full object-contain" alt={title} />
            </div>
            <div className="flex gap-4">
                <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="!rounded-full !px-8">View Raw Source</Button>
                </a>
                <Button onClick={onClose} className="!rounded-full !px-8 !bg-slate-900">Close</Button>
            </div>
        </div>
    </Modal>
);

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
    const [isApproveSubmitting, setIsApproveSubmitting] = useState(false);
    const [viewerAsset, setViewerAsset] = useState<{ url: string; title: string } | null>(null);
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

    const projectDesigns = useMemo(() => designs.filter(d => d.projectId === projectId), [designs, projectId]);

    // --- REAL-TIME TIMER LOGIC ---
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, total: 0 });

    useEffect(() => {
        if (!project || project.status === 'Completed') return;

        const timer = setInterval(() => {
            const deliveryTarget = new Date(project.startDate);
            deliveryTarget.setDate(deliveryTarget.getDate() + 45);
            
            const now = new Date().getTime();
            const distance = deliveryTarget.getTime() - now;

            if (distance < 0) {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0, total: 0 });
                clearInterval(timer);
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000),
                    total: distance
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [project]);

    const projectMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [milestones, projectId]);
    const projectQuotes = useMemo(() => quotes.filter(q => q.projectId === projectId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [quotes, projectId]);
    const latestQuote = projectQuotes[0];

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
            alert("Approval sync failed.");
        } finally {
            setIsApproveSubmitting(false);
        }
    };

    const handleDesignUpload = async (file: File, notes: string, type: 'image' | 'gltf') => {
        if (!project || !user) return;
        
        try {
            // 1. Cloud Storage Upload
            const url = await uploadProjectFile(project.id, file);
            if (!url) {
                alert("Storage service failed to receive the visual asset. Please check your connection.");
                return;
            }

            // 2. Database Record Creation
            const { error } = await createRecord('designs', {
                project_id: project.id,
                file_url: url,
                notes: notes,
                type: type,
                version: projectDesigns.length + 1,
                uploaded_by: user.id,
                submitted_for_review: true,
                approved: false
            });

            if (error) {
                console.error("Database sync failed:", error);
                alert(`Asset stored but index failed: ${error.message}`);
                return;
            }

            // 3. Refresh and Notify
            await refetchData();
            alert("Visual asset successfully synchronized with project timeline.");
        } catch (err: any) {
            console.error("Upload process crash:", err);
            alert("A critical system error occurred during synchronization.");
        }
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
    const phaseTab = getTabForStage(project.stage);

    return (
        <div className="space-y-8 pb-12">
            {viewerAsset && <HDViewer isOpen={!!viewerAsset} onClose={() => setViewerAsset(null)} url={viewerAsset.url} title={viewerAsset.title} />}
            
            {/* Project Header Area */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-start gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-1 w-8 bg-brand-gold rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Archival Registry</span>
                    </div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase leading-tight">{project.title}</h1>
                    
                    <div className="mt-6 flex flex-wrap items-center gap-y-4 gap-x-8">
                        <div className="flex items-center gap-4">
                            <UserNameDisplay user={customer} showAvatar={true} textClassName="font-bold text-sm text-slate-900" imageSize="w-12 h-12" />
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[4px] text-slate-400 mb-0.5">Project Registered</span>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-3 h-3 text-brand-gold" />
                                    <span className="text-[11px] font-black text-slate-800 uppercase">
                                        {new Date(project.createdAt).toLocaleDateString()} @ {new Date(project.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-white shadow-soft rounded-full border border-slate-100">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID Key</span>
                            <span className="text-[10px] font-mono font-bold text-brand-blue">{project.id.slice(0, 12)}</span>
                        </div>
                    </div>
                </div>

                {/* Live Delivery Timer - High Octane UI */}
                <Card className="!p-0 overflow-hidden bg-slate-900 border-none shadow-gold-glow w-full xl:w-[420px] rounded-[40px] group animate-in slide-in-from-right duration-700">
                    <div className="relative p-8">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-brand-gold/20 transition-all duration-1000"></div>
                        
                        <div className="relative z-10 flex flex-col gap-6">
                            <div>
                                <p className="text-[9px] font-black text-brand-gold uppercase tracking-[5px] mb-2 opacity-80">STRICT DELIVERY COMMITMENT</p>
                                <h3 className="text-xs font-black text-white/90 uppercase leading-relaxed tracking-widest">YOUR DREAM HOME WILL BE DELIVERED TO YOU IN</h3>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { v: timeLeft.d, l: 'Days' },
                                    { v: timeLeft.h, l: 'Hrs' },
                                    { v: timeLeft.m, l: 'Min' },
                                    { v: timeLeft.s, l: 'Sec' }
                                ].map((unit, i) => (
                                    <div key={unit.l} className="flex flex-col items-center">
                                        <div className="text-4xl font-display font-black text-white tracking-tighter tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                            {unit.v.toString().padStart(2, '0')}
                                        </div>
                                        <span className="text-[8px] font-black text-brand-gold uppercase tracking-widest mt-1 opacity-60">
                                            {unit.l}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                                    <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                                </div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Real-time Project Synchronization Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-brand-gold via-white to-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-1000" 
                            style={{ width: `${Math.max(2, Math.min(100, (timeLeft.d / 45) * 100))}%` }}
                        ></div>
                    </div>
                </Card>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[22px] w-fit overflow-x-auto max-w-full no-scrollbar">
                        {tabs.map(tab => {
                            const isPhaseTab = tab === phaseTab;
                            return (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[2px] transition-all relative ${
                                        activeTab === tab 
                                            ? 'bg-white text-brand-blue shadow-card' 
                                            : isPhaseTab 
                                                ? 'text-brand-blue bg-blue-50/50 border border-brand-blue/10 animate-pulse-fast' 
                                                : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab}
                                    {isPhaseTab && (
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
                                            </span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                    
                    <Button variant="secondary" onClick={() => navigate('/chat/' + project.id)} className="!rounded-full !px-8 h-14 shadow-premium border-slate-200 w-full md:w-auto">
                        <MessageSquareIcon className="w-5 h-5 mr-3" /> Communication Portal
                    </Button>
                </div>

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

                    {activeTab === 'Materials' && <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />}

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
                                            <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Registered on {new Date(quote.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-6 md:mt-0">
                                        <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="!rounded-full !px-10 !py-4 uppercase font-black text-[11px] tracking-widest">View PDF Document</Button></a>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'Designs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(user.role === 'Designer' || user.role === 'Admin') && (
                                <button onClick={() => setUploadDesignModalOpen(true)} className="aspect-video rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-brand-blue hover:shadow-premium transition-all group">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-blue/10 group-hover:text-brand-blue text-slate-300 transition-colors"><PhotoIcon className="w-8 h-8" /></div>
                                    <span className="text-[12px] font-black uppercase tracking-[3px] text-slate-400 group-hover:text-brand-blue">Upload Visual</span>
                                </button>
                            )}
                            {projectDesigns.map(design => (
                                <Card key={design.id} className="p-0 overflow-hidden border-slate-100 hover:shadow-premium transition-all rounded-[40px] bg-white group/card relative">
                                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                                        <img src={design.fileUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" alt="Render" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button 
                                                onClick={() => setViewerAsset({ url: design.fileUrl, title: `v${design.version} Design Render` })}
                                                className="!rounded-full !px-8 !py-3 !bg-white !text-slate-900 !text-[10px] uppercase font-black tracking-widest shadow-premium"
                                            >
                                                <EyeIcon className="w-4 h-4 mr-2" /> Inspect Design
                                            </Button>
                                        </div>
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
            <UploadDesignModal isOpen={isUploadDesignModalOpen} onClose={() => setUploadDesignModalOpen(false)} onUpload={handleDesignUpload} />
        </div>
    );
};

export default ProjectDetails;
