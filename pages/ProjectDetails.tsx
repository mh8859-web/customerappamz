
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
    ArrowPathIcon, ChevronRightIcon, DollarSignIcon, TrendingUpIcon, BuildingIcon
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

    // THE COMMENCEMENT OVERRIDE:
    // If the project status is 'Active' but we want the DESIGNER to trigger the 45-day countdown specifically,
    // we check if they've pushed the "START" signal yet. 
    // We treat 'progress === 0' as the "not yet physically started" state.
    const needsCommencement = useMemo(() => {
        if (!project || !user) return false;
        // Only the assigned designer can start the 45-day clock.
        // It shows if the project is Active but progress is at 0 (initial state).
        return user.role === 'Designer' && project.designerId === user.id && project.progress === 0;
    }, [project, user]);

    const [timeLeft, setTimeLeft] = useState({ d: 45, h: 0, m: 0, s: 0 });

    const calculateTimeRemaining = useCallback(() => {
        // If not started or completed, keep it at 45 days flat.
        if (!project || !project.startDate || project.progress === 0 || project.status === 'Completed') {
            setTimeLeft({ d: 45, h: 0, m: 0, s: 0 });
            return;
        }
        
        const startTime = new Date(project.startDate).getTime();
        const fortyFiveDaysInMs = 45 * 24 * 60 * 60 * 1000;
        const deadlineTime = startTime + fortyFiveDaysInMs; 
        const now = new Date().getTime();
        
        let distance = deadlineTime - now;

        // FORCE CAP: Never show more than 45 days. 
        // This fixes the "74 days" bug caused by future-dated start dates.
        if (distance > fortyFiveDaysInMs) {
            distance = fortyFiveDaysInMs;
        }

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
    }, [project?.startDate, project?.progress, calculateTimeRemaining]);

    const handleStartProject = async () => {
        if (!project || isStartingProject) return;
        setIsStartingProject(true);
        const startTime = new Date().toISOString();
        try {
            // Optimistically update local project to trigger timer immediately starting from 45 days
            setLocalProject({
                ...project,
                status: 'Active',
                startDate: startTime,
                stage: 'Design',
                progress: 1 // Moving progress to 1 signals the clock is running
            });

            await updateRecord('projects', project.id, {
                status: 'Active',
                start_date: startTime,
                stage: 'Design',
                progress: 1 
            });
            await refetchData();
        } catch (err) {
            setLocalProject(null);
            alert("Commencement signal failed. Check network link.");
        } finally {
            setIsStartingProject(false);
        }
    };

    const handleUploadDesign = async (file: File, notes: string, type: 'image' | 'gltf') => {
        if (!project || !user) return;
        setRefreshing(true);
        try {
            const url = await uploadProjectFile(project.id, file);
            if (!url) {
                alert("CRITICAL ERROR: Cloud upload failed.");
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

            if (dbError) {
                alert(`DATABASE ERROR: Ensure 'designs' table exists.`);
            } else {
                await refetchData();
                setUploadModalOpen(false);
            }
        } finally {
            setRefreshing(false);
        }
    };

    if (usersLoading || dataLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Syncing Portfolio Data...</div>;
    if (!project || !user) return <div className="text-center p-20 font-display font-black text-slate-400 uppercase">Registry Not Found</div>;

    if (isLocked) return (
        <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] animate-reveal">
            <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-8 border border-red-100 shadow-xl">
                <LockIcon className="w-12 h-12 text-red-600 animate-pulse"/>
            </div>
            <h2 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter">Vault Restricted</h2>
            <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium leading-relaxed uppercase tracking-widest text-[10px]">
                Technical access to the project interface has been restricted by Accounts HQ pending milestone settlement.
            </p>
            <Button onClick={() => navigate('/customer/dashboard')} variant="secondary" className="mt-10 !rounded-full !px-12 uppercase font-black text-[11px] tracking-widest">Return to Base</Button>
        </div>
    );

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);
    const projectDesigns = designs.filter(d => d.projectId === project.id).sort((a,b) => (b.version || 0) - (a.version || 0));
    const projectQuotes = quotes.filter(q => q.projectId === project.id);
    const projectMilestones = milestones.filter(m => m.projectId === project.id);
    const projectExpenses = expenses.filter(e => e.projectId === project.id);

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

            {/* DESIGNER ACTIVATION OVERLAY */}
            {needsCommencement && (
                <div className="fixed inset-0 z-[10000] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-6">
                    <div className="max-w-xl w-full text-center space-y-12 animate-reveal">
                        <div className="w-24 h-24 bg-brand-gold rounded-[32px] flex items-center justify-center mx-auto shadow-gold-glow animate-bounce-slow">
                            <ZapIcon className="w-12 h-12 text-slate-900" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-display font-black text-white uppercase leading-none">COMMENCE <span className="text-brand-gold">45-DAY</span> MISSION?</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[4px] text-xs">The countdown starts the moment you authorize commencement.</p>
                        </div>
                        <Button 
                            onClick={handleStartProject} 
                            disabled={isStartingProject} 
                            className="!w-full !py-10 !rounded-[40px] !bg-brand-gold !text-slate-900 !text-2xl font-black uppercase tracking-[6px] shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
                        >
                            {isStartingProject ? 'STARTING...' : 'YES, START 45-DAY CLOCK'}
                        </Button>
                        <p className="text-[10px] text-white/30 uppercase tracking-[5px] font-black">Contractual Agreement & Performance Commitment</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-10 pt-4">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[6px] text-brand-gold">Master Architectural Record</span>
                    <h1 className="text-5xl font-display font-black text-slate-900 uppercase leading-none tracking-tighter">{project.title}</h1>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-brand-gold/10 blur-[40px] rounded-full animate-pulse group-hover:bg-brand-gold/20 transition-all"></div>
                    <Card className="luxury-glass !p-8 sm:!p-10 rounded-[40px] border-brand-gold/20 min-w-[340px] sm:min-w-[480px] relative z-10 shadow-premium overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${project.progress > 0 ? 'bg-brand-gold animate-pulse' : 'bg-slate-300'} shadow-[0_0_8px_rgba(212,175,55,1)]`}></div>
                                <span className="text-[11px] font-black text-brand-gold uppercase tracking-[5px]">
                                    {project.progress > 0 ? '45-Day Commitment Live' : 'Mission Pending Start'}
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-slate-900 rounded-full text-[8px] font-black text-white uppercase tracking-[2px]">STRICT CLOCK</div>
                        </div>
                        <div className="flex justify-around items-center">
                            {[
                                { v: timeLeft.d, l: 'DAYS' },
                                { v: timeLeft.h, l: 'HRS' },
                                { v: timeLeft.m, l: 'MIN' },
                                { v: timeLeft.s, l: 'SEC' }
                            ].map((unit, idx) => (
                                <React.Fragment key={unit.l}>
                                    <div className="text-center group/unit min-w-[60px]">
                                        <div className="text-4xl sm:text-6xl font-display font-black text-slate-900 tabular-nums tracking-tighter leading-none group-hover/unit:text-brand-gold transition-colors">{String(unit.v).padStart(2, '0')}</div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[3px] mt-4 block group-hover/unit:text-slate-500">{unit.l}</span>
                                    </div>
                                    {idx < 3 && <div className="h-12 w-px bg-slate-100 mx-2 opacity-60"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

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
                                        Asset Registry Profile
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">Site Location</p>
                                            <div className="flex items-start gap-3">
                                                <MapPinIcon className="w-5 h-5 text-brand-gold mt-1 flex-shrink-0" />
                                                <p className="text-lg font-bold text-slate-800 leading-tight">{project.address}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">Design Lead</p>
                                            <div className="mt-2 flex items-center gap-4">
                                                <img src={designer?.avatarUrl} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-slate-50 shadow-soft" alt="" />
                                                <div>
                                                    <UserNameDisplay user={designer} showAvatar={false} textClassName="font-black text-slate-900 text-lg" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Creative Director</p>
                                                </div>
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] mt-2">High-Fidelity Visual Archive</p>
                                </div>
                                {user.role === 'Designer' && (
                                    <Button onClick={() => setUploadModalOpen(true)} disabled={refreshing} className="!rounded-full !px-8 shadow-button">
                                        <FilePlusIcon className="w-5 h-5 mr-2" /> {refreshing ? 'Syncing...' : 'Upload New Version'}
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {projectDesigns.map(design => (
                                    <Card key={design.id} className="p-0 overflow-hidden rounded-[32px] group border-slate-100 hover:border-brand-gold/30 transition-all bg-white shadow-premium">
                                        <div className="aspect-video relative overflow-hidden bg-slate-100">
                                            <img src={design.fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button onClick={() => setSelectedDesign(design)} variant="secondary" className="!bg-white !text-slate-900 !rounded-full !text-[10px] font-black uppercase">Inspect Detail</Button>
                                            </div>
                                            <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase">v{design.version}</span></div>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-sm text-slate-600 font-medium italic">"{design.notes}"</p>
                                            <div className="mt-6 flex justify-between items-center">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${design.approved ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {design.approved ? 'Approved' : 'Review Pending'}
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase">{design.comments?.length || 0} Comments</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {projectDesigns.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No designs uploaded yet.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Feedback' && (
                        <div className="space-y-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Client Review Feed</h3>
                            <div className="space-y-4">
                                {projectDesigns.flatMap(d => d.comments).length > 0 ? (
                                    projectDesigns.flatMap(d => (d.comments || []).map((c: any) => (
                                        <Card key={c.id} className="luxury-glass !p-6 rounded-[24px] border-slate-100">
                                            <div className="flex gap-4">
                                                <img src={findUserById(c.authorId)?.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <UserNameDisplay user={findUserById(c.authorId)} textClassName="font-black text-slate-900 text-sm" />
                                                        <span className="text-[9px] font-black text-slate-300 uppercase">On v{d.version}</span>
                                                    </div>
                                                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">{c.text}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    )))
                                ) : (
                                    <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Awaiting client feedback loop.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Docs' && (
                        <div className="space-y-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Technical Repository</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projectQuotes.map(q => (
                                    <div key={q.id} className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between group hover:border-brand-gold/30 transition-all shadow-soft">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-gold group-hover:text-white transition-all">
                                                <FileTextIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{q.version} Specification</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Uploaded {new Date(q.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <a href={q.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-xl hover:bg-brand-blue hover:text-white transition-all">
                                            <DownloadIcon className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                                {projectQuotes.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No technical documents found.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Materials' && <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />}
                    
                    {(activeTab === 'Execution Log' || activeTab === 'Site Log') && (
                         <div className="space-y-8">
                            {user.role === 'Site Head' && <SiteUpdateModule projectId={project.id} onSuccess={refetchData} />}
                            <div className="space-y-6 relative">
                                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100"></div>
                                {siteHistory.map(log => (
                                    <div key={log.id} className="relative pl-14">
                                        <div className="absolute left-[21px] top-1.5 w-3 h-3 bg-brand-gold rounded-full ring-4 ring-white shadow-sm"></div>
                                        <Card className="luxury-glass border-slate-100 !p-6 rounded-[24px]">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest bg-brand-blue/5 px-2 py-1 rounded">{log.stage}</p>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-slate-700 font-medium">{log.notes}</p>
                                            {log.image_url && <img src={log.image_url} className="mt-4 rounded-xl h-40 w-full object-cover border border-slate-100" alt="Site" />}
                                        </Card>
                                    </div>
                                ))}
                                {siteHistory.length === 0 && <p className="text-center text-slate-300 font-black uppercase text-[10px] tracking-[5px] py-20">Full site history sync complete.</p>}
                            </div>
                         </div>
                    )}

                    {activeTab === 'Expenses' && (
                        <div className="space-y-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Project P&L (Expenses)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projectExpenses.map(e => (
                                    <div key={e.id} className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between shadow-soft">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                                                <DollarSignIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase text-sm">{e.description}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{e.category} &bull; {new Date(e.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-display font-black text-red-500">₹{e.amount.toLocaleString()}</p>
                                            <span className="text-[9px] font-black uppercase text-slate-300">{e.status}</span>
                                        </div>
                                    </div>
                                ))}
                                {projectExpenses.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No project-specific expenses logged.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Financial Ledger' && (
                        <Card className="luxury-glass !p-10 rounded-[40px] bg-white border-slate-100 shadow-premium">
                             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Receivables Sentinel</h3>
                             <div className="space-y-6">
                                {projectMilestones.map(m => (
                                    <div key={m.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                                        <div>
                                            <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{m.title}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Valuation: ₹{m.amountDisplay.toLocaleString()}</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${m.statusDisplay === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                                            {m.statusDisplay}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </Card>
                    )}

                    {activeTab === 'Sourcing' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Project BOM (Bill of Materials)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.filter(p => p.projectId === project.id).map(prod => (
                                    <Card key={prod.id} className="bg-white border-slate-100 rounded-[32px] p-6 group hover:border-brand-gold/30 transition-all shadow-soft">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><PackageIcon className="w-6 h-6" /></div>
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{prod.status}</span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase leading-tight">{prod.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Vendor: {prod.supplier}</p>
                                        <div className="mt-6 flex justify-between items-end">
                                            <p className="text-sm font-black text-brand-blue">Qty: {prod.quantity}</p>
                                            <p className="text-xl font-display font-black text-slate-900">₹{(prod.cost * prod.quantity).toLocaleString()}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

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
