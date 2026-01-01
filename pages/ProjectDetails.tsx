
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
    BriefcaseIcon, ZapIcon, FilePlusIcon, EyeIcon, DownloadIcon, 
    SparklesIcon, TrashIcon, FileTextIcon, PhotoIcon, CheckCircleIcon, 
    LockIcon, PackageIcon, ClockIcon, MapPinIcon, MessageSquareIcon,
    ArrowPathIcon, ChevronRightIcon, DollarSignIcon, TrendingUpIcon, BuildingIcon,
    XMarkIcon
} from '../components/icons';
import { UserRole, Milestone, Design, Project } from '../types';
import ProjectStatusBar from '../components/ProjectStatusBar';
import MaterialSelection from '../components/project/MaterialSelection';
import SiteUpdateModule from '../components/project/SiteUpdateModule';
import MaterialRequestModule from '../components/project/MaterialRequestModule';
import UploadDesignModal from '../components/design/UploadDesignModal';
import DesignAnnotationModal from '../components/design/DesignAnnotationModal';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import { updateRecord, createRecord, uploadProjectFile } from '../services/api';
import { supabase } from '../services/supabaseClient';

const TABS: Record<UserRole, string[]> = {
    Customer: ['Live Updates', 'Designs', 'Materials', 'Docs', 'Milestones'],
    Designer: ['Live Updates', 'Designs', 'Feedback', 'Materials', 'Docs', 'Milestones'],
    Admin: ['Live Updates', 'Designs', 'Docs', 'Milestones', 'Expenses'],
    'Sub-Admin': ['Live Updates', 'Designs', 'Docs', 'Milestones'],
    Accounts: ['Live Updates', 'Financial Ledger', 'Docs', 'Milestones'],
    'Project Head': ['Live Updates', 'Designs', 'Materials', 'Docs', 'Milestones', 'Site Log'],
    'Production Head': ['Sourcing', 'Materials', 'Docs'],
    'Site Head': ['Execution Log', 'Materials', 'Live Updates', 'Docs'],
};

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { findUserById, loading: usersLoading } = useUsers();
    const { projects, designs, milestones, expenses, products, quotes, refetchData, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('');
    const [isStartingProject, setIsStartingProject] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const [siteHistory, setSiteHistory] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [localProject, setLocalProject] = useState<Project | null>(null);
    
    const project = useMemo(() => {
        return localProject || projects.find(p => p.id === projectId) || null;
    }, [projects, projectId, localProject]);

    useEffect(() => {
        if (user && !activeTab) {
            const tabs = TABS[user.role] || [];
            setActiveTab(tabs[0]);
        }
    }, [user, activeTab]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (activeTab === 'Site Log' || activeTab === 'Execution Log') {
                const { data } = await supabase.from('site_updates').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
                if (data) setSiteHistory(data);
            }
        };
        fetchHistory();
    }, [activeTab, projectId]);

    const isLocked = useMemo(() => {
        if (!project || !user || user.role !== 'Customer') return false;
        return project.isPaymentAlertActive === true;
    }, [project, user]);

    const needsCommencement = useMemo(() => {
        if (!project || !user) return false;
        return user.role === 'Designer' && project.designerId === user.id && (!project.startDate);
    }, [project, user]);

    const projectDesigns = useMemo(() => 
        designs.filter(d => d.projectId === projectId).sort((a,b) => (b.version || 0) - (a.version || 0)),
    [designs, projectId]);

    const isDesignApproved = useMemo(() => 
        projectDesigns.some(d => d.approved === true),
    [projectDesigns]);

    const showNextPhaseButton = useMemo(() => {
        if (!project || !user) return false;
        // Designer sees button if design is approved and we are still in "Design" phase
        return user.role === 'Designer' && project.designerId === user.id && project.stage === 'Design' && isDesignApproved;
    }, [project, user, isDesignApproved]);

    const [timeLeft, setTimeLeft] = useState({ d: 45, h: 0, m: 0, s: 0 });

    const calculateTimeRemaining = useCallback(() => {
        if (!project || !project.startDate || project.status === 'Completed') {
            setTimeLeft({ d: 45, h: 0, m: 0, s: 0 });
            return;
        }
        
        const startTime = new Date(project.startDate).getTime();
        const fortyFiveDaysInMs = 45 * 24 * 60 * 60 * 1000;
        const deadlineTime = startTime + fortyFiveDaysInMs; 
        const now = new Date().getTime();
        
        let distance = deadlineTime - now;
        if (distance > fortyFiveDaysInMs) distance = fortyFiveDaysInMs;

        if (distance <= 0) {
            setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            return;
        }

        setTimeLeft({
            d: Math.floor(distance / (1000 * 60 * 60 * 24)),
            h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            s: Math.floor((distance % (1000 * 60)) / 1000)
        });
    }, [project]);

    useEffect(() => {
        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(timer);
    }, [project?.startDate, calculateTimeRemaining]);

    const handleStartProject = async () => {
        if (!project || isStartingProject) return;
        setIsStartingProject(true);
        const startTime = new Date().toISOString();
        try {
            await updateRecord('projects', project.id, {
                status: 'Active',
                start_date: startTime,
                stage: 'Design',
                progress: 1 
            });
            setLocalProject({ ...project, status: 'Active', startDate: startTime, stage: 'Design', progress: 1 });
            await refetchData();
        } catch (err) {
            alert("Activation Error.");
        } finally {
            setIsStartingProject(false);
        }
    };

    const handleMoveToNextPhase = async () => {
        if (!project || isTransitioning) return;
        setIsTransitioning(true);
        try {
            const { error } = await updateRecord('projects', project.id, {
                stage: 'Material Ordering',
                progress: 15 // Increment progress on phase change
            });
            if (error) throw error;
            
            await createRecord('messages', {
                chat_id: project.id,
                body: `PHASE TRANSITION: Designer has completed the Design Phase. Project moved to MATERIAL SELECTION.`,
                sender_id: user!.id,
                is_system_message: true
            });
            
            await refetchData();
            setActiveTab('Materials');
        } catch (err) {
            alert("Transition Failed.");
        } finally {
            setIsTransitioning(false);
        }
    };

    const handleDesignStatus = async (designId: string, status: 'Approved' | 'Rejected') => {
        setRefreshing(true);
        try {
            const { error } = await updateRecord('designs', designId, {
                approved: status === 'Approved',
                submitted_for_review: false
            });

            if (error) throw error;

            await createRecord('messages', {
                chat_id: project!.id,
                body: `DESIGN AUTHORITY: Client has ${status.toUpperCase()} version v${designs.find(d => d.id === designId)?.version}.`,
                sender_id: user!.id,
                is_system_message: true
            });

            await refetchData();
        } catch (err) {
            alert("Sync Failed.");
        } finally {
            setRefreshing(false);
        }
    };

    const handleUploadDesign = async (file: File, notes: string, type: 'image' | 'gltf') => {
        if (!project || !user) return;
        setRefreshing(true);
        try {
            const url = await uploadProjectFile(project.id, file);
            if (!url) {
                alert("Upload failed.");
                return;
            }

            const nextVersion = designs.filter(d => d.projectId === project.id).length + 1;
            const { error: dbError } = await createRecord('designs', {
                project_id: project.id,
                file_url: url,
                notes,
                version: nextVersion,
                type,
                uploaded_by: user.id,
                submitted_for_review: true,
            });

            if (dbError) alert(`DB Error.`);
            else {
                await refetchData();
                setUploadModalOpen(false);
            }
        } finally {
            setRefreshing(false);
        }
    };

    if (usersLoading || dataLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Syncing Portals...</div>;
    if (!project || !user) return <div className="text-center p-20 font-display font-black text-slate-400 uppercase">Registry Not Found</div>;

    if (isLocked) return (
        <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] animate-reveal">
            <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-8 border border-red-100 shadow-xl">
                <LockIcon className="w-12 h-12 text-red-600 animate-pulse"/>
            </div>
            <h2 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter">Vault Restricted</h2>
            <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium leading-relaxed uppercase tracking-widest text-[10px]">
                Access restricted pending milestone settlement.
            </p>
            <Button onClick={() => navigate('/customer/dashboard')} variant="secondary" className="mt-10 !rounded-full !px-12 uppercase font-black text-[11px] tracking-widest">Return to Base</Button>
        </div>
    );

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);
    const projectQuotes = quotes.filter(q => q.projectId === project.id);
    const projectMilestones = milestones.filter(m => m.projectId === project.id);

    return (
        <div className="space-y-12 pb-24">
            <UploadDesignModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onUpload={handleUploadDesign} />
            {selectedDesign && (
                <DesignAnnotationModal 
                    isOpen={!!selectedDesign} 
                    onClose={() => setSelectedDesign(null)} 
                    design={selectedDesign} 
                    currentUser={user}
                    onSave={() => refetchData()}
                />
            )}

            {needsCommencement && (
                <div className="fixed inset-0 z-[10000] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-6">
                    <div className="max-w-xl w-full text-center space-y-12 animate-reveal">
                        <div className="w-24 h-24 bg-brand-gold rounded-[32px] flex items-center justify-center mx-auto shadow-gold-glow">
                            <ZapIcon className="w-12 h-12 text-slate-900" />
                        </div>
                        <h2 className="text-5xl font-display font-black text-white uppercase leading-none">ACTIVATE <span className="text-brand-gold">45-DAY</span> MISSION?</h2>
                        <Button 
                            onClick={handleStartProject} 
                            disabled={isStartingProject} 
                            className="!w-full !py-10 !rounded-[40px] !bg-brand-gold !text-slate-900 !text-2xl font-black uppercase tracking-[6px] shadow-gold-glow hover:scale-105 transition-all"
                        >
                            {isStartingProject ? 'ACTIVATING...' : 'YES, START COUNTDOWN'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-10 pt-4">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[6px] text-brand-gold">Master Record</span>
                    <h1 className="text-5xl font-display font-black text-slate-900 uppercase leading-none tracking-tighter">{project.title}</h1>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-brand-gold/10 blur-[40px] rounded-full animate-pulse"></div>
                    <Card className="luxury-glass !p-8 sm:!p-10 rounded-[40px] border-brand-gold/20 min-w-[340px] sm:min-w-[480px] relative z-10 shadow-premium overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold"></div>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${project.startDate ? 'bg-brand-gold animate-pulse' : 'bg-slate-300'}`}></div>
                                <span className="text-[11px] font-black text-brand-gold uppercase tracking-[5px]">
                                    {project.startDate ? '45-Day Countdown Live' : 'Waiting for Activation'}
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-slate-900 rounded-full text-[8px] font-black text-white uppercase tracking-[2px]">SYNCED</div>
                        </div>
                        <div className="flex justify-around items-center">
                            {[
                                { v: timeLeft.d, l: 'DAYS' },
                                { v: timeLeft.h, l: 'HRS' },
                                { v: timeLeft.m, l: 'MIN' },
                                { v: timeLeft.s, l: 'SEC' }
                            ].map((unit, idx) => (
                                <React.Fragment key={unit.l}>
                                    <div className="text-center min-w-[60px]">
                                        <div className="text-4xl sm:text-6xl font-display font-black text-slate-900 tabular-nums tracking-tighter leading-none">{String(unit.v).padStart(2, '0')}</div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[3px] mt-4 block">{unit.l}</span>
                                    </div>
                                    {idx < 3 && <div className="h-12 w-px bg-slate-100 mx-2 opacity-60"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            {/* PHASE TRANSITION COMMANDER FOR DESIGNER */}
            {showNextPhaseButton && (
                <div className="animate-in slide-in-from-top-4">
                    <Card className="!bg-slate-900 border-brand-gold/30 !p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-gold-glow">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-slate-900">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Design Phase Approved</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-[2px] mt-1">Ready to initialize material selection protocol.</p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleMoveToNextPhase}
                            disabled={isTransitioning}
                            className="!rounded-full !px-12 !py-4 !bg-brand-gold !text-slate-900 font-black uppercase tracking-[3px] shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
                        >
                            {isTransitioning ? 'INITIALIZING...' : 'COMPLETED NEXT: MATERIAL SELECTION'}
                        </Button>
                    </Card>
                </div>
            )}

            <div className="space-y-8">
                <nav className="flex gap-2 bg-slate-100/60 p-1.5 rounded-[24px] w-fit overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="animate-in">
                    {activeTab === 'Live Updates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-8 space-y-10">
                                {(user.role === 'Site Head' || user.role === 'Designer') && <SiteUpdateModule projectId={project.id} onSuccess={refetchData} />}
                                <Card className="luxury-glass !p-10 rounded-[40px] border-slate-100 shadow-premium bg-white">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <BuildingIcon className="w-5 h-5 text-brand-blue" />
                                        Profile Registry
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">Site Location</p>
                                            <div className="flex items-start gap-3 text-lg font-bold text-slate-800 leading-tight">
                                                <MapPinIcon className="w-5 h-5 text-brand-gold mt-1" />
                                                {project.address}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">Design Lead</p>
                                            <div className="mt-2 flex items-center gap-4">
                                                <img src={designer?.avatarUrl} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-slate-50" alt="" />
                                                <UserNameDisplay user={designer} showAvatar={false} textClassName="font-black text-slate-900 text-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div className="lg:col-span-4">
                                {(user.role === 'Designer' || user.role === 'Site Head') && <MaterialRequestModule projectId={project.id} onSuccess={refetchData} />}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'Designs' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Design Iterations</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] mt-2">Verified Visual Registry</p>
                                </div>
                                {user.role === 'Designer' && (
                                    <Button onClick={() => setUploadModalOpen(true)} className="!rounded-full !px-8 shadow-button">
                                        <FilePlusIcon className="w-5 h-5 mr-2" /> Upload New Version
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {projectDesigns.map(design => (
                                    <Card key={design.id} className="p-0 overflow-hidden rounded-[32px] group border-slate-100 hover:border-brand-gold/30 transition-all bg-white shadow-premium">
                                        <div className="aspect-video relative overflow-hidden bg-slate-100">
                                            <img src={design.fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button onClick={() => setSelectedDesign(design)} className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase shadow-premium hover:scale-105 transition-all">Inspect</button>
                                            </div>
                                            <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-white/90 rounded-full text-[9px] font-black uppercase">v{design.version}</span></div>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-sm text-slate-600 font-medium italic mb-6">"{design.notes}"</p>
                                            
                                            <div className="pt-6 border-t border-slate-50 flex flex-col gap-5">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${design.approved ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {design.approved ? 'Approved ✓' : 'Review Pending'}
                                                    </span>
                                                </div>

                                                {user.role === 'Customer' && design.submittedForReview && !design.approved && (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <button 
                                                            onClick={() => handleDesignStatus(design.id, 'Approved')}
                                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 border border-brand-gold/20"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5 text-brand-gold" /> APPROVE MASTER FINISH
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDesignStatus(design.id, 'Rejected')}
                                                            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
                                                        >
                                                            REQUEST REVISION
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {projectDesigns.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Awaiting Designer upload.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Materials' && <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />}
                    
                    {activeTab === 'Milestones' && (
                        <Card className="luxury-glass !p-10 rounded-[40px] bg-white border-slate-100 shadow-premium">
                             <div className="space-y-8">
                                {projectMilestones.map(m => (
                                    <div key={m.id} className="flex flex-col md:flex-row justify-between items-center bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{m.title}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-10 mt-6 md:mt-0">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">AMOUNT</p>
                                                <p className="text-2xl font-display font-black text-slate-900">₹{m.amountDisplay.toLocaleString()}</p>
                                            </div>
                                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${m.statusDisplay === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                {m.statusDisplay}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
