
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
    BriefcaseIcon, ZapIcon, FilePlusIcon, PhotoIcon, CheckCircleIcon, 
    LockIcon, PackageIcon, MapPinIcon, BuildingIcon, FileTextIcon,
    ChevronRightIcon, LayoutGridIcon, FolderIcon
} from '../components/icons';
import { UserRole, Design, Project } from '../types';
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
    Customer: ['Live Updates', 'Directory', 'Designs', 'Materials', 'Docs', 'Milestones'],
    Designer: ['Live Updates', 'Directory', 'Designs', 'Feedback', 'Materials', 'Docs', 'Milestones'],
    Admin: ['Live Updates', 'Directory', 'Designs', 'Docs', 'Milestones', 'Expenses'],
    'Sub-Admin': ['Live Updates', 'Directory', 'Designs', 'Docs', 'Milestones'],
    Accounts: ['Live Updates', 'Financial Ledger', 'Docs', 'Milestones'],
    'Project Head': ['Live Updates', 'Directory', 'Designs', 'Materials', 'Docs', 'Milestones', 'Site Log'],
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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const [siteHistory, setSiteHistory] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    
    const project = useMemo(() => {
        return projects.find(p => p.id === projectId) || null;
    }, [projects, projectId]);

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

    const projectDesigns = useMemo(() => 
        designs.filter(d => d.projectId === projectId).sort((a,b) => (b.version || 0) - (a.version || 0)),
    [designs, projectId]);

    const isDesignApproved = useMemo(() => 
        projectDesigns.some(d => d.approved === true),
    [projectDesigns]);

    const showNextPhaseButton = useMemo(() => {
        if (!project || !user) return false;
        // Fix: Button appears if in Design stage AND client has approved at least one design
        return user.role === 'Designer' && project.designerId === user.id && project.stage === 'Design' && isDesignApproved;
    }, [project, user, isDesignApproved]);

    const handleMoveToNextPhase = async () => {
        if (!project || isTransitioning) return;
        setIsTransitioning(true);
        try {
            const { error } = await updateRecord('projects', project.id, {
                stage: 'Material Ordering',
                progress: 15 
            });
            if (error) throw error;
            
            await createRecord('messages', {
                chat_id: project.id,
                body: `SYSTEM: Designer has transitioned project to MATERIAL SELECTION phase.`,
                sender_id: user!.id,
                is_system_message: true
            });
            
            await refetchData();
            setActiveTab('Materials');
        } catch (err) {
            alert("Phase Transition Failed.");
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
                body: `DESIGN AUTHORITY: Client has ${status.toUpperCase()} design version v${designs.find(d => d.id === designId)?.version}.`,
                sender_id: user!.id,
                is_system_message: true
            });

            await refetchData();
        } catch (err) {
            alert("Sync Error.");
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
    if (!project || !user) return <div className="text-center p-20 font-display font-black text-slate-400 uppercase">Project Registry Not Found</div>;

    if (isLocked) return (
        <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] animate-reveal">
            <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-8 border border-red-100 shadow-xl">
                <LockIcon className="w-12 h-12 text-red-600 animate-pulse"/>
            </div>
            <h2 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter">Vault Restricted</h2>
            <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium leading-relaxed uppercase tracking-widest text-[10px]">
                TECHNICAL ACCESS HAS BEEN RESTRICTED PENDING MILESTONE SETTLEMENT.
            </p>
            <Button onClick={() => navigate('/customer/dashboard')} variant="secondary" className="mt-10 !rounded-full !px-12 uppercase font-black text-[11px] tracking-widest">Return to Base</Button>
        </div>
    );

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);
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

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-10 pt-4">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[6px] text-brand-gold">Master Architectural Record</span>
                    <h1 className="text-5xl font-display font-black text-slate-900 uppercase leading-none tracking-tighter">{project.title}</h1>
                </div>

                <Card className="luxury-glass !px-8 !py-6 rounded-[32px] border-slate-100 shadow-premium flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-accent-success animate-pulse shadow-gold-glow"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Status: {project.status}</span>
                    </div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Phase</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest mt-0.5">{STAGE_DISPLAY_NAMES[project.stage] || project.stage}</p>
                    </div>
                </Card>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            {/* PHASE TRANSITION COMMANDER */}
            {showNextPhaseButton && (
                <div className="animate-in slide-in-from-top-4">
                    <Card className="!bg-slate-900 border-brand-gold/30 !p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-gold-glow">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-slate-900 shadow-xl">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Design Phase Approved</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-[2px] mt-1">Ready to initialize material procurement protocol.</p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleMoveToNextPhase}
                            disabled={isTransitioning}
                            className="!rounded-full !px-12 !py-4 !bg-brand-gold !text-slate-900 font-black uppercase tracking-[3px] shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
                        >
                            {isTransitioning ? 'INITIALIZING...' : 'PHASE COMPLETE: NEXT STEP'}
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
                    {/* DIRECTORY TAB: THE FOLDER HUB */}
                    {activeTab === 'Directory' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { id: 'floorplan', label: 'FLOOR PLAN', icon: <BuildingIcon className="w-10 h-10" />, tab: 'Docs', desc: 'Architectural Layouts' },
                                { id: 'quote', label: 'QUOTE', icon: <FileTextIcon className="w-10 h-10" />, tab: 'Docs', desc: 'Financial Proposals' },
                                { id: 'designs', label: 'DESIGNS', icon: <PhotoIcon className="w-10 h-10" />, tab: 'Designs', desc: '3D Renders & Visuals' },
                                { id: 'materials', label: 'MATERIALS', icon: <PackageIcon className="w-10 h-10" />, tab: 'Materials', desc: 'Physical Finishes' },
                            ].map((folder) => (
                                <Card 
                                    key={folder.id} 
                                    onClick={() => setActiveTab(folder.tab)}
                                    className="luxury-glass !p-10 !rounded-[48px] border-slate-100 shadow-premium flex flex-col items-center justify-center text-center group cursor-pointer hover:border-brand-gold/40 transition-all hover:-translate-y-2 duration-500 bg-white"
                                >
                                    <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-gold/10 group-hover:text-brand-gold transition-all duration-500 mb-6">
                                        {folder.icon}
                                    </div>
                                    <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tighter">{folder.label}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{folder.desc}</p>
                                    <div className="mt-8 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-brand-gold group-hover:text-slate-900 transition-all duration-500">
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Live Updates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-8 space-y-10">
                                {(user.role === 'Site Head' || user.role === 'Designer') && <SiteUpdateModule projectId={project.id} onSuccess={refetchData} />}
                                <Card className="luxury-glass !p-10 rounded-[40px] border-slate-100 shadow-premium bg-white">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <BuildingIcon className="w-5 h-5 text-brand-blue" />
                                        Registry Profile
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
                                                <button onClick={() => setSelectedDesign(design)} className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase shadow-premium hover:scale-105 transition-all">Inspect Detail</button>
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
