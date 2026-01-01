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
        return milestones.some(m => m.projectId === project.id && (m.statusDisplay === 'Completed' || m.statusDisplay === 'Verifying'));
    }, [project, user, milestones]);

    const needsActivation = useMemo(() => {
        if (!project || !user) return false;
        return user.role === 'Designer' && project.designerId === user.id && (!project.startDate || project.status === 'Archived');
    }, [project, user]);

    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    const calculateTimeRemaining = useCallback(() => {
        if (!project || !project.startDate) {
            setTimeLeft({ d: 45, h: 0, m: 0, s: 0 });
            return;
        };
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
            await createRecord('messages', {
                chat_id: project.id,
                body: "OFFICIAL COMMENCEMENT: Your 45-day precision timeline has started now.",
                sender_id: '786786',
                is_system_message: true
            });
            await refetchData();
        } catch (err) {
            alert("System error.");
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

    if (usersLoading || dataLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-[4px] text-xs font-display">Synchronizing...</div>;
    if (!project || !user) return <div className="text-center p-20 font-sans">Project not found.</div>;

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-[10000] bg-slate-900 flex items-center justify-center p-6 text-center">
                <div className="max-w-xl w-full space-y-12 animate-reveal">
                    <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" className="h-10 mx-auto" alt="AMAZ" />
                    
                    <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 bg-brand-gold/20 rounded-[40px] blur-3xl animate-pulse"></div>
                        <div className="relative w-32 h-32 rounded-[40px] bg-white text-slate-900 flex items-center justify-center shadow-gold-glow">
                            <LockIcon className="w-12 h-12" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-5xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-tight">VAULT LOCKED</h2>
                        <p className="text-brand-gold font-bold uppercase tracking-[8px] text-xs font-display opacity-80">Awaiting Settlement Confirmation</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[48px] p-10 md:p-14 backdrop-blur-3xl">
                        <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium font-sans">
                            "AWAITING FOR PROJECT TEAM TO CONFIRM PAYMENT ONCE CONFIRMED YOU CAN ACCESS LIVE PROJECT DASHBOARD AND MONITOR ALL UPDATES!"
                        </p>
                        <div className="mt-12 flex flex-col gap-5">
                            <Button onClick={() => navigate('/')} variant="secondary" className="!w-full !rounded-full !bg-white/10 !text-white !border-white/20 !px-12 !py-6 font-bold uppercase tracking-widest text-[12px] font-display hover:!bg-white hover:!text-slate-900 transition-all">
                                Return Home Terminal
                            </Button>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verification expected in 2-4 hours</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);

    return (
        <div className="space-y-12 pb-24">
            {/* Commencement Handshake for Designers */}
            {needsActivation && (
                <div className="fixed inset-0 z-[10000] bg-slate-900 flex items-center justify-center p-6">
                    <div className="max-w-xl w-full text-center space-y-12 animate-in">
                        <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ" className="h-12 mx-auto" />
                        <div className="space-y-4">
                            <h2 className="text-5xl font-display font-bold text-white tracking-tighter uppercase leading-none">
                                ACTIVATE <span className="text-brand-gold">PRECISION</span> TIMER?
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[4px] text-xs font-display">Professional Handshake Interface</p>
                        </div>
                        <div className="bg-white/5 p-10 rounded-[48px] border border-white/10">
                            <p className="text-slate-300 text-sm font-medium leading-relaxed italic font-sans px-4">
                                "Activation initiates the 45-day architectural commitment and formally notifies the project owner. Ensure all site logistics are verified."
                            </p>
                        </div>
                        <Button 
                            onClick={handleStartProject} 
                            disabled={isStartingProject} 
                            className="!w-full !py-8 !rounded-full !bg-brand-gold !text-slate-900 !text-xl !font-bold uppercase tracking-[4px] shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all font-display"
                        >
                            {isStartingProject ? 'SYSTEM INITIALIZING...' : 'YES, START PROJECT NOW'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 pt-4 px-1">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-[3px] w-12 bg-brand-gold rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase tracking-[5px] text-slate-400 font-display">Master Archive</span>
                        {user.role === 'Admin' && (
                            <button onClick={handleDeleteProject} className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight uppercase leading-none">
                        {project.title}
                    </h1>
                </div>

                <div onClick={() => setCommitmentModalOpen(true)} className="w-full sm:w-[420px] bg-white rounded-[40px] shadow-premium p-8 border border-slate-100 relative overflow-hidden text-left transition-all hover:scale-[1.02] group cursor-pointer">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[4px] font-display">Contractual Guarantee</p>
                            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest font-display">Portfolio Delivery Registry</h3>
                        </div>
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-500">
                            <ZapIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { v: timeLeft.d, l: 'DAYS' },
                            { v: timeLeft.h, l: 'HRS' },
                            { v: timeLeft.m, l: 'MIN' },
                            { v: timeLeft.s, l: 'SEC' }
                        ].map((unit) => (
                            <div key={unit.l} className="flex flex-col items-center">
                                <div className="text-4xl font-display font-bold text-slate-900 tabular-nums tracking-tighter">
                                    {unit.v.toString().padStart(2, '0')}
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2 font-display">
                                    {unit.l}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            <div className="space-y-8">
                <nav className="flex gap-2 bg-slate-100/60 p-2 rounded-3xl w-full overflow-x-auto no-scrollbar border border-slate-200/50">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap font-display ${activeTab === tab ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="min-h-[500px]">
                    {activeTab === 'Live Updates' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="luxury-glass !rounded-[32px] !p-8">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[4px] font-display">Site Location</span>
                                <p className="text-lg font-bold text-slate-900 mt-4 font-sans leading-tight">{project.address}</p>
                            </Card>
                            <Card className="luxury-glass !rounded-[32px] !p-8">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[4px] font-display">Capital Allocation</span>
                                <p className="text-3xl font-display font-bold text-slate-900 mt-3">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                            </Card>
                            <Card className="luxury-glass !rounded-[32px] !p-8">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[4px] font-display">Assigned Creative</span>
                                <div className="mt-4">
                                    <UserNameDisplay user={designer} showAvatar={true} textClassName="font-bold text-base text-slate-900 font-sans" imageSize="w-10 h-10" />
                                </div>
                            </Card>
                        </div>
                    )}
                    
                    {activeTab === 'Designs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {designs.filter(d => d.projectId === project.id).map(design => (
                                <Card key={design.id} className="p-0 overflow-hidden !rounded-[32px] border-slate-100 group relative bg-white">
                                    <div className="aspect-[16/11] bg-slate-100 overflow-hidden relative">
                                        <img src={design.fileUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" alt="Design" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    </div>
                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg font-display uppercase tracking-tight">Version {design.version}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{design.approved ? '✓ Verified' : 'Review In Progress'}</p>
                                        </div>
                                        <a href={design.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="secondary" className="!p-3 !rounded-2xl border-slate-100 hover:border-brand-gold"><DownloadIcon className="w-5 h-5 text-brand-gold" /></Button>
                                        </a>
                                    </div>
                                </Card>
                            ))}
                            {designs.filter(d => d.projectId === project.id).length === 0 && (
                                <div className="col-span-full py-32 text-center text-slate-300 font-bold uppercase tracking-[6px] border-2 border-dashed border-slate-100 rounded-[48px] font-display">
                                    <PhotoIcon className="w-16 h-16 mx-auto mb-6 opacity-10" />
                                    Registry Empty.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Materials' && (
                        <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;