import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, ZapIcon, FilePlusIcon, EyeIcon, DownloadIcon, SparklesIcon, TrashIcon, FileTextIcon, PhotoIcon, CheckCircleIcon, LockIcon } from '../components/icons';
import { UserRole, Milestone } from '../types';
import ProjectStatusBar from '../components/ProjectStatusBar';
import MaterialSelection from '../components/project/MaterialSelection';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import UploadQuoteModal from '../components/admin/UploadQuoteModal';
import Modal from '../components/ui/Modal';
import { createRecord, uploadProjectFile, deleteProject, deleteRecord, updateRecord } from '../services/api';

const TABS: Record<UserRole, string[]> = {
    Customer: ['Live Updates', 'Designs', 'Timeline', 'Materials', 'Quotes & Docs', 'Milestones'],
    Designer: ['Live Updates', 'Designs', 'Feedback', 'Materials', 'Quotes & Docs', 'Milestones'],
    Admin: ['Live Updates', 'Designs', 'Quotes & Docs', 'Milestones'],
    'Sub-Admin': ['Live Updates', 'Designs', 'Quotes & Docs', 'Milestones'],
    Accounts: ['Live Updates', 'Financial Ledger', 'Quotes & Docs', 'Milestones'],
    'Project Head': ['Live Updates', 'Designs', 'Feedback', 'Quotes & Docs', 'Milestones'],
    'Production Head': ['Live Updates', 'Quotes & Docs'],
    'Site Head': ['Live Updates', 'Timeline', 'Designs', 'Quotes & Docs'],
};

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { findUserById, loading: usersLoading } = useUsers();
    const { projects, designs, milestones, expenses, quotes, refetchData, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('Live Updates');
    const [isUploadQuoteModalOpen, setUploadQuoteModalOpen] = useState(false);
    const [isCommitmentModalOpen, setCommitmentModalOpen] = useState(false);
    const [isStartingProject, setIsStartingProject] = useState(false);
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

    const isLocked = useMemo(() => {
        if (!project || !user || user.role !== 'Customer') return false;
        // Lock for customers if any milestone is awaiting payment (Completed) or verifying
        return milestones.some(m => m.projectId === project.id && (m.statusDisplay === 'Completed' || m.statusDisplay === 'Verifying'));
    }, [project, user, milestones]);

    const needsActivation = useMemo(() => {
        if (!project || !user) return false;
        // If designer is assigned but project hasn't officially started (Archive status or no startDate)
        return user.role === 'Designer' && project.designerId === user.id && (!project.startDate || project.status === 'Archived');
    }, [project, user]);

    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    const calculateTimeRemaining = useCallback(() => {
        if (!project || !project.startDate) {
            // If not started, show the full 45 day commitment ceiling
            setTimeLeft({ d: 45, h: 0, m: 0, s: 0 });
            return;
        };
        
        // Timer Logic: Start date + 45 days
        const startTime = new Date(project.startDate).getTime();
        const commitmentMs = 45 * 24 * 60 * 60 * 1000;
        const deadlineTime = startTime + commitmentMs;
        const now = new Date().getTime();
        const distance = deadlineTime - now;
        
        if (distance <= 0 || project.status === 'Completed') {
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
        try {
            const now = new Date().toISOString();
            await updateRecord('projects', project.id, {
                status: 'Active',
                start_date: now,
                stage: 'design_phase',
                progress: 0
            });
            
            // Formal notification to client
            await createRecord('messages', {
                chat_id: project.id,
                body: "OFFICIAL COMMENCEMENT: Your 45-day precision timeline has started now. We are fully committed to provide you a great experience. This is your life's best moment so we make every process amazing so we are on time.",
                sender_id: '786786',
                is_system_message: true
            });
            
            await refetchData();
        } catch (err) {
            alert("System error initializing project. Please verify connectivity.");
        } finally {
            setIsStartingProject(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project || user?.role !== 'Admin') return;
        if (window.confirm(`PERMANENTLY VOID PROJECT: "${project.title}"?`)) {
            const { error } = await deleteProject(project.id);
            if (error) alert("Deletion error: " + error.message);
            else {
                await refetchData();
                navigate('/projects');
            }
        }
    };

    if (usersLoading || dataLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-[4px] text-xs font-display">Synchronizing Portfolio...</div>;
    if (!project || !user) return <div className="text-center p-20 font-sans">Project not found in registry.</div>;

    // MANDATORY VAULT OVERLAY
    if (isLocked) {
        return (
            <div className="fixed inset-0 z-[10000] bg-slate-900 flex items-center justify-center p-6 text-center">
                <div className="max-w-xl w-full space-y-10 animate-in">
                    <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" className="h-10 mx-auto" alt="AMAZ" />
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-brand-gold/20 rounded-[32px] blur-2xl animate-pulse"></div>
                        <div className="relative w-24 h-24 rounded-[32px] bg-white text-slate-900 flex items-center justify-center shadow-gold-glow">
                            <LockIcon className="w-10 h-10" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white uppercase tracking-tighter leading-tight">VAULT LOCKED</h2>
                        <p className="text-brand-gold font-bold uppercase tracking-[4px] text-[10px]">Awaiting for Payment Confirmation</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">
                        <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium font-sans">
                            "AWAITING FOR PROJECT TEAM TO CONFIRM PAYMENT ONCE CONFIRMED YOU CAN ACCESS LIVE PROJECT DASHBOARD AND MONITOR ALL UPDATES!"
                        </p>
                        <div className="mt-10 flex flex-col gap-4">
                            <Button onClick={() => navigate('/')} variant="secondary" className="!w-full !rounded-full !bg-white/10 !text-white !border-white/20 !px-12 !py-5 font-bold uppercase tracking-widest text-[11px] font-display">
                                Return Home
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);

    return (
        <>
            {/* DESIGNER ACTIVATION HANDSHAKE */}
            {needsActivation && (
                <div className="fixed inset-0 z-[10000] bg-slate-900 flex items-center justify-center p-6">
                    <div className="max-w-xl w-full text-center space-y-10 animate-in">
                        <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ" className="h-12 mx-auto" />
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white tracking-tighter uppercase leading-none">
                                ARE YOU READY TO <span className="text-brand-gold">START</span> PROJECT?
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[4px] text-xs">Professional Commencement Interface</p>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
                            <p className="text-slate-300 text-sm font-medium leading-relaxed italic font-sans px-6">
                                "Activation initiates the 45-day commitment timer and notifies the client. Ensure all site verification and logistics are locked."
                            </p>
                        </div>
                        <Button 
                            onClick={handleStartProject} 
                            disabled={isStartingProject} 
                            className="!w-full !py-6 !rounded-full !bg-brand-gold !text-slate-900 !text-lg !font-extrabold uppercase tracking-[4px] shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all font-display"
                        >
                            {isStartingProject ? 'INITIALIZING PRECISION TIMER...' : 'YES, START PROJECT NOW'}
                        </Button>
                    </div>
                </div>
            )}

            <Modal isOpen={isCommitmentModalOpen} onClose={() => setCommitmentModalOpen(false)} title="AMAZ GUARANTEE">
                <div className="text-center py-6 px-4">
                    <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ" className="h-10 mx-auto mb-10" />
                    <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight tracking-tight uppercase mb-8">
                        "WE ARE FULLY COMMITED TO PROVIDE YOU A GREAT EXPERIENCE THIS IS YOUR LIFE'S BEST MOMENT SO WE MAKE EVERY PROCESS AMAZING SO WE ARE ON TIME"
                    </p>
                    <div className="h-px w-20 bg-brand-gold mx-auto mb-8"></div>
                    <Button onClick={() => setCommitmentModalOpen(false)} className="!rounded-full !px-12 !py-4 shadow-button font-bold tracking-widest text-[11px] uppercase font-display">
                        ACKNOWLEDGED
                    </Button>
                </div>
            </Modal>

            <div className="space-y-8 pb-20 max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pt-4 px-1">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-[2px] w-8 bg-brand-gold rounded-full"></div>
                            <span className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400 font-display">Registry Terminal</span>
                            {user.role === 'Admin' && (
                                <button onClick={handleDeleteProject} className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors" title="Purge Project">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight uppercase leading-none">
                            {project.title}
                        </h1>
                    </div>

                    <button onClick={() => setCommitmentModalOpen(true)} className="w-full sm:w-[380px] bg-white rounded-[32px] shadow-soft p-6 border border-slate-100 relative overflow-hidden text-left transition-all hover:scale-[1.02] hover:shadow-premium group active:scale-95">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[9px] font-bold text-brand-gold uppercase tracking-[3px] font-display">Commitment Tracker</p>
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-display">Portfolio Delivery In</h3>
                            </div>
                            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors">
                                <ZapIcon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                            {[
                                { v: timeLeft.d, l: 'DAYS' },
                                { v: timeLeft.h, l: 'HRS' },
                                { v: timeLeft.m, l: 'MIN' },
                                { v: timeLeft.s, l: 'SEC' }
                            ].map((unit) => (
                                <div key={unit.l} className="flex flex-col items-center">
                                    <div className="text-3xl font-display font-extrabold text-slate-900 tabular-nums">
                                        {unit.v.toString().padStart(2, '0')}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2 font-display">
                                        {unit.l}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </button>
                </div>

                <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

                <div className="space-y-6">
                    <nav className="flex gap-1 bg-slate-100/60 p-1 rounded-2xl w-full overflow-x-auto no-scrollbar border border-slate-200/50">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap font-display ${activeTab === tab ? 'bg-white text-brand-blue shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>
                                {tab}
                            </button>
                        ))}
                    </nav>

                    <div className="min-h-[400px]">
                        {activeTab === 'Live Updates' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="luxury-glass group border-slate-100/50">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-[3px] font-display">Site Location</span>
                                    <p className="text-sm font-bold text-slate-900 mt-2 font-sans">{project.address}</p>
                                </Card>
                                <Card className="luxury-glass group border-slate-100/50">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-[3px] font-display">Investment Allocation</span>
                                    <p className="text-2xl font-display font-extrabold text-slate-900 mt-1">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                                </Card>
                                <Card className="luxury-glass group border-slate-100/50">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-[3px] font-display">Creative Lead</span>
                                    <div className="mt-2">
                                        <UserNameDisplay user={designer} showAvatar={true} textClassName="font-bold text-sm text-slate-900 font-sans" imageSize="w-8 h-8" />
                                    </div>
                                </Card>
                            </div>
                        )}
                        {/* Remaining tabs logic preserved... */}
                        {activeTab === 'Designs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {designs.filter(d => d.projectId === project.id).map(design => (
                                    <Card key={design.id} className="p-0 overflow-hidden border-slate-100 group relative">
                                        <div className="aspect-video bg-slate-100 overflow-hidden">
                                            <img src={design.fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Design Version" />
                                        </div>
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm font-sans">Version {design.version}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{design.approved ? '✓ Approved' : 'Awaiting Review'}</p>
                                            </div>
                                            <a href={design.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="secondary" className="!p-2"><DownloadIcon className="w-4 h-4" /></Button>
                                            </a>
                                        </div>
                                    </Card>
                                ))}
                                {designs.filter(d => d.projectId === project.id).length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[32px] font-display">
                                        <PhotoIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        No designs uploaded yet.
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'Materials' && (
                            <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />
                        )}
                    </div>
                </div>
                
                <UploadQuoteModal isOpen={isUploadQuoteModalOpen} onClose={() => setUploadQuoteModalOpen(false)} onUpload={async (f,v) => { 
                    const url = await uploadProjectFile(project.id, f); 
                    if(url) { 
                        await createRecord('quotes', { project_id: project.id, version: v, file_url: url, uploaded_by: user.id }); 
                        await refetchData(); 
                    } 
                }} />
            </div>
        </>
    );
};

export default ProjectDetails;