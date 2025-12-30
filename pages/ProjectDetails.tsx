
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MapPinIcon, UserCircleIcon, FileTextIcon, DollarSignIcon, MessageSquareIcon, PhotoIcon } from '../components/icons';
import { Project, Design, User, UserRole, UnifiedUpdate } from '../types';
import Modal from '../components/ui/Modal';
import ProjectStatusBar from '../components/ProjectStatusBar';
import ProjectGanttChart from '../components/customer/ProjectGanttChart';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import UploadDesignModal from '../components/design/UploadDesignModal';

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
    const { projects, designs, quotes, milestones, projectUpdates, workLogs, activityLogs, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('Live Updates');
    const [isUploadDesignModalOpen, setUploadDesignModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const isLoading = dataLoading || usersLoading;

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
            {/* Elegant Header */}
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

            {/* Detail Grid - High Clarity Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="luxury-glass border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                        <BriefcaseIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Description</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3">{project.description}</p>
                </Card>

                <Card className="luxury-glass border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                        <MapPinIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Site Address</span>
                    </div>
                    <p className="text-sm text-slate-900 font-bold leading-relaxed">{project.address}</p>
                </Card>

                <Card className="luxury-glass border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                        <UserCircleIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Design Lead</span>
                    </div>
                    <UserNameDisplay user={designer} showAvatar={true} textClassName="text-slate-900 font-black text-sm" imageSize="w-10 h-10" />
                </Card>

                <Card className="luxury-glass border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                        <DollarSignIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Budget Allocation</span>
                    </div>
                    <p className="text-2xl font-display font-black text-slate-900 tracking-tighter">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{project.areaSqft} SQFT</p>
                </Card>
            </div>

            {/* Content Tabs Navigation */}
            <div className="space-y-8">
                <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[22px] w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[2px] transition-all duration-300 ${
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
                        <div className="space-y-6">
                            {unifiedUpdateFeed.length > 0 ? (
                                <div className="space-y-4">
                                    {unifiedUpdateFeed.map((update) => (
                                        <div key={update.id} className="flex gap-6 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-50 flex-shrink-0 ring-1 ring-slate-100">
                                                    <img src={update.author?.avatarUrl} className="w-full h-full object-cover" />
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
                                        <img src={design.fileUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
                    
                    {activeTab === 'Timeline' && <ProjectGanttChart milestones={milestones.filter(m => m.projectId === project.id)} startDate={project.startDate} />}
                    
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
        </div>
    );
};

export default ProjectDetails;
