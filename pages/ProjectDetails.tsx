
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES, PROJECT_STAGES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
    BriefcaseIcon, ZapIcon, FilePlusIcon, PhotoIcon, CheckCircleIcon, 
    PackageIcon, MapPinIcon, BuildingIcon, FileTextIcon,
    ChevronRightIcon, AlertTriangleIcon, XMarkIcon, ShieldCheckIcon, ClockIcon
} from '../components/icons';
import { UserRole, Design, Project } from '../types';
import ProjectStatusBar from '../components/ProjectStatusBar';
import MaterialSelection from '../components/project/MaterialSelection';
import SiteUpdateModule from '../components/project/SiteUpdateModule';
import MaterialRequestModule from '../components/project/MaterialRequestModule';
import UploadDesignModal from '../components/design/UploadDesignModal';
import DesignAnnotationModal from '../components/design/DesignAnnotationModal';
import TestimonialFlow from '../components/dashboard/TestimonialFlow';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import { updateRecord, createRecord, uploadProjectFile } from '../services/api';

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
    const { projects, designs, milestones, refetchData, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionError, setTransitionError] = useState<string | null>(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    
    const project = useMemo(() => projects.find(p => p.id === projectId) || null, [projects, projectId]);

    useEffect(() => {
        if (user && !activeTab) {
            const tabs = TABS[user.role] || [];
            setActiveTab(tabs[0]);
        }
    }, [user, activeTab]);

    const projectDesigns = useMemo(() => 
        designs.filter(d => d.projectId === projectId).sort((a,b) => (b.version || 0) - (a.version || 0)),
    [designs, projectId]);

    const isDesignApproved = useMemo(() => 
        projectDesigns.some(d => d.approved === true),
    [projectDesigns]);

    // Determines if the "Next Step/Close Project" button should appear
    const showNextPhaseButton = useMemo(() => {
        if (!project || !user || project.status === 'Completed') return false;
        
        // Critical Logic: Allow Admins to close if at Step 7 OR Step 8
        if (project.stage === 'management_approval' || project.stage === 'completed') {
            return user.role === 'Admin' || user.role === 'Sub-Admin';
        }

        // Standard logic for other phases
        return (user.role === 'Designer' && project.designerId === user.id) || user.role === 'Admin' || user.role === 'Sub-Admin';
    }, [project, user]);

    const handleMoveToNextPhase = async () => {
        if (!project || isTransitioning) return;
        setTransitionError(null);

        // --- CLOSURE LOGIC (Step 7 or 8) ---
        // If we are at Management Verification OR already technically at 'completed' stage but status is still Active
        if (project.stage === 'management_approval' || project.stage === 'completed') {
             setIsTransitioning(true);
             try {
                 const { error } = await updateRecord('projects', project.id, {
                     stage: 'completed',
                     status: 'Completed',
                     progress: 100
                 });
                 if (error) throw error;
                 
                 await createRecord('messages', {
                    chat_id: project.id,
                    body: `PROJECT CLOSED: This masterpiece is now officially completed and fully verified by management. Handover protocol finalized.`,
                    sender_id: user!.id,
                    is_system_message: true
                });
                await refetchData();
             } catch (err: any) {
                 setTransitionError(`Closure Error: ${err.message}`);
             } finally {
                 setIsTransitioning(false);
             }
             return;
        }
        
        const currentStageIdx = PROJECT_STAGES.indexOf(project.stage);
        const nextStageIdx = currentStageIdx + 1;
        
        if (nextStageIdx >= PROJECT_STAGES.length) return;
        
        const nextStage = PROJECT_STAGES[nextStageIdx];

        // --- VALIDATION PROTOCOLS ---
        if (project.stage === 'design_phase' && !isDesignApproved) {
            setTransitionError(`You need design approval from customer to go to Step ${nextStageIdx + 1}`);
            return;
        }

        setIsTransitioning(true);
        try {
            const updates: any = {
                stage: nextStage,
                progress: Math.min(project.progress + 15, 95)
            };

            const { error } = await updateRecord('projects', project.id, updates);

            if (error) throw new Error(error.message || "DATABASE_SYNC_FAILURE");
            
            await createRecord('messages', {
                chat_id: project.id,
                body: `PHASE ADVANCE: Project has successfully transitioned to ${STAGE_DISPLAY_NAMES[nextStage]}.`,
                sender_id: user!.id,
                is_system_message: true
            });
            
            await refetchData();
            if (nextStage === 'material_selection') setActiveTab('Materials');
        } catch (err: any) {
            setTransitionError(`Sync Error: ${err.message}`);
        } finally {
            setIsTransitioning(false);
        }
    };

    const handleDesignStatus = async (designId: string, status: 'Approved' | 'Rejected') => {
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
        }
    };

    const handleUploadDesign = async (file: File, notes: string, type: 'image' | 'gltf') => {
        if (!project || !user) return;
        try {
            const url = await uploadProjectFile(project.id, file);
            if (!url) return;
            const nextVersion = designs.filter(d => d.projectId === project.id).length + 1;
            const { error } = await createRecord('designs', {
                project_id: project.id,
                file_url: url,
                notes,
                version: nextVersion,
                type,
                uploaded_by: user.id,
                submitted_for_review: true,
            });
            if (!error) {
                await refetchData();
                setUploadModalOpen(false);
            }
        } catch (e) { console.error(e); }
    };

    if (usersLoading || dataLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Syncing Master Record...</div>;
    if (!project || !user) return <div className="text-center p-20 font-display font-black text-slate-400 uppercase tracking-widest">Project Not Found</div>;

    // --- CUSTOMER COMPLETION FLOW ---
    if (user.role === 'Customer' && project.status === 'Completed') {
        return <TestimonialFlow project={project} />;
    }

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);
    const projectMilestones = milestones.filter(m => m.projectId === project.id);
    
    // Determine button state
    const isReadyToClose = project.stage === 'management_approval' || project.stage === 'completed';

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
                    <span className="text-[10px] font-black uppercase tracking-[6px] text-brand-gold">Architecture Control</span>
                    <h1 className="text-5xl font-display font-black text-slate-900 uppercase leading-none tracking-tighter">{project.title}</h1>
                </div>
                
                <Card className="luxury-glass !px-10 !py-6 rounded-[32px] border-slate-100 shadow-premium flex items-center gap-8 bg-white">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse shadow-gold-glow ${project.status === 'Completed' ? 'bg-brand-gold' : 'bg-accent-success'}`}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Status: {project.status.toUpperCase()}</span>
                    </div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Step Registry</span>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest mt-0.5">{STAGE_DISPLAY_NAMES[project.stage] || project.stage}</p>
                    </div>
                </Card>
            </div>

            {/* MANAGEMENT HOLD BANNER FOR CLIENTS */}
            {user.role === 'Customer' && isReadyToClose && project.status !== 'Completed' && (
                <Card className="!p-10 bg-brand-gold/5 border-brand-gold/30 rounded-[40px] flex flex-col md:flex-row items-center gap-8 shadow-premium animate-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="w-20 h-20 rounded-[28px] bg-brand-gold text-slate-900 flex items-center justify-center shadow-xl flex-shrink-0 animate-bounce-slow">
                        <ShieldCheckIcon className="w-10 h-10" />
                    </div>
                    <div className="text-center md:text-left relative z-10">
                        <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">Final Verification Protocol</h3>
                        <p className="text-lg text-slate-600 font-bold uppercase tracking-widest mt-4 italic leading-relaxed max-w-2xl">
                            "MANAGEMENT CHECKING ALL DETAILS PAYMENTS AND ALL ONCE MANAGEMENT VERIFIED THIS PROJECT WILL BE COMPLETED"
                        </p>
                    </div>
                </Card>
            )}

            {/* COMPLETION BANNER FOR ADMINS/STAFF */}
            {project.status === 'Completed' && user.role !== 'Customer' && (
                <Card className="!p-12 bg-green-50 border-green-200 rounded-[40px] shadow-premium animate-in text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/30 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                     <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center mb-6 shadow-lg">
                            <CheckCircleIcon className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-display font-black text-green-900 uppercase tracking-tighter">Project Successfully Completed!</h2>
                        <p className="text-green-700 font-bold uppercase tracking-widest mt-2">All Phases Verified & Archived.</p>
                     </div>
                </Card>
            )}

            {project.status !== 'Completed' && <ProjectStatusBar currentStage={project.stage} progress={project.progress} />}

            {/* PHASE TRANSITION COMMANDER */}
            {showNextPhaseButton && (
                <div className="animate-in slide-in-from-top-4 space-y-4">
                    {transitionError && (
                        <Card className="!bg-red-50 border-red-200 !p-6 rounded-[24px] flex items-center gap-6 animate-shake shadow-lg">
                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <AlertTriangleIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-red-900 font-black uppercase tracking-tight text-lg">Sequence Error</h4>
                                <p className="text-red-600 text-sm font-bold uppercase tracking-wider mt-1">{transitionError}</p>
                            </div>
                            <button onClick={() => setTransitionError(null)} className="p-2 text-red-300 hover:text-red-600"><XMarkIcon className="w-6 h-6"/></button>
                        </Card>
                    )}
                    
                    <Card className={`!p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-10 shadow-premium transition-all duration-500 border-luxury ${isReadyToClose ? '!bg-brand-gold shadow-gold-glow border-slate-900/10' : '!bg-slate-900'}`}>
                        <div className="flex items-center gap-8 text-left">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-colors ${isReadyToClose ? 'bg-slate-900 text-brand-gold' : 'bg-brand-gold text-slate-900'}`}>
                                {isReadyToClose ? <ShieldCheckIcon className="w-9 h-9" /> : <ZapIcon className="w-9 h-9" />}
                            </div>
                            <div>
                                <h3 className={`text-2xl font-display font-black uppercase tracking-tight ${isReadyToClose ? 'text-slate-900' : 'text-white'}`}>
                                    {isReadyToClose ? 'Executive Verification Required' : 'Phase Advance Interface'}
                                </h3>
                                <p className={`${isReadyToClose ? 'text-slate-700' : 'text-slate-400'} text-xs font-bold uppercase tracking-[3px] mt-2`}>
                                    {isReadyToClose ? 'Audit all deliverables and financial settlements before project closure.' : 'Initialize next protocol for project execution workflow.'}
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleMoveToNextPhase}
                            disabled={isTransitioning}
                            className={`!rounded-full !px-16 !py-6 !text-sm !font-black uppercase tracking-[4px] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all ${isReadyToClose ? '!bg-slate-900 !text-white' : '!bg-brand-gold !text-slate-900'}`}
                        >
                            {isTransitioning ? 'SYNCHRONIZING...' : isReadyToClose ? 'CLOSE PROJECT' : 'NEXT STEP: PHASE ADVANCE'}
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
                    {activeTab === 'Directory' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { id: 'floorplan', label: 'FLOOR PLAN', icon: <BuildingIcon className="w-10 h-10" />, tab: 'Docs', desc: 'Architectural Layouts' },
                                { id: 'quote', label: 'QUOTE', icon: <FileTextIcon className="w-10 h-10" />, tab: 'Docs', desc: 'Financial Records' },
                                { id: 'designs', label: 'DESIGNS', icon: <PhotoIcon className="w-10 h-10" />, tab: 'Designs', desc: '3D Render Registry' },
                                { id: 'materials', label: 'MATERIALS', icon: <PackageIcon className="w-10 h-10" />, tab: 'Materials', desc: 'Sourcing Catalog' },
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
                                {(user.role === 'Site Head' || user.role === 'Designer') && project.stage !== 'completed' && project.status !== 'Completed' && <SiteUpdateModule projectId={project.id} onSuccess={refetchData} />}
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
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">Architect</p>
                                            <div className="mt-2 flex items-center gap-4">
                                                <img src={designer?.avatarUrl} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-slate-50 shadow-soft" alt="" />
                                                <div>
                                                    <UserNameDisplay user={designer} showAvatar={false} textClassName="font-black text-slate-900 text-lg" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Creative</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div className="lg:col-span-4">
                                {(user.role === 'Designer' || user.role === 'Site Head') && project.stage !== 'completed' && project.status !== 'Completed' && <MaterialRequestModule projectId={project.id} onSuccess={refetchData} />}
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
                                {user.role === 'Designer' && project.status !== 'Completed' && (
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
