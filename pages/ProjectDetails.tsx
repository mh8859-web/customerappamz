
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, ZapIcon, FilePlusIcon, EyeIcon, DownloadIcon, SparklesIcon, TrashIcon, FileTextIcon, PhotoIcon } from '../components/icons';
import { UserRole, Milestone } from '../types';
import ProjectStatusBar from '../components/ProjectStatusBar';
import MaterialSelection from '../components/project/MaterialSelection';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import UploadQuoteModal from '../components/admin/UploadQuoteModal';
import Modal from '../components/ui/Modal';
import { createRecord, uploadProjectFile, deleteProject, deleteRecord } from '../services/api';

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
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const projectMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [milestones, projectId]);
    
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    const calculateTimeRemaining = useCallback(() => {
        if (!project || project.status === 'Completed') return;
        
        const projectStart = new Date(project.startDate);
        projectStart.setHours(0, 0, 0, 0); 

        const commitmentMs = 45 * 24 * 60 * 60 * 1000;
        const deadlineTime = projectStart.getTime() + commitmentMs;
        const now = new Date().getTime();
        
        let distance = deadlineTime - now;
        const finalDistance = Math.min(commitmentMs, Math.max(0, distance));
        
        setTimeLeft({
            d: Math.floor(finalDistance / (1000 * 60 * 60 * 24)),
            h: Math.floor((finalDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            m: Math.floor((finalDistance % (1000 * 60 * 60)) / (1000 * 60)),
            s: Math.floor((finalDistance % (1000 * 60)) / 1000)
        });
    }, [project]);

    useEffect(() => {
        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeRemaining]);

    const handleDeleteProject = async () => {
        if (!project || user?.role !== 'Admin') return;
        if (window.confirm(`PERMANENTLY VOID PROJECT: "${project.title}"? All associated data, schedules, and financial records will be purged.`)) {
            const { error } = await deleteProject(project.id);
            if (error) alert("Deletion error: " + error.message);
            else {
                await refetchData();
                navigate('/projects');
            }
        }
    };

    if (usersLoading || dataLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Portfolio...</div>;
    if (!project || !user) return <div className="text-center p-20">Broken Link.</div>;

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);

    return (
        <>
            <Modal 
                isOpen={isCommitmentModalOpen} 
                onClose={() => setCommitmentModalOpen(false)} 
                title="AMAZ GUARANTEE"
            >
                <div className="text-center py-6 px-4">
                    <img 
                        src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                        alt="AMAZ" 
                        className="h-10 mx-auto mb-10" 
                    />
                    <p className="text-2xl sm:text-3xl font-display font-black text-slate-900 leading-tight tracking-tight uppercase mb-8">
                        "WE ARE FULLY COMMITED TO PROVIDE YOU A GREAT EXPERIENCE THIS IS YOUR LIFE'S BEST MOMENT SO WE MAKE EVERY PROCESS AMAZING SO WE ARE ON TIME"
                    </p>
                    <div className="h-px w-20 bg-brand-gold mx-auto mb-8"></div>
                    <Button onClick={() => setCommitmentModalOpen(false)} className="!rounded-full !px-12 !py-4 shadow-button">
                        ACKNOWLEDGED
                    </Button>
                </div>
            </Modal>

            <div className="space-y-8 pb-20 max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pt-4 px-1">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-[2px] w-8 bg-brand-gold rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Archival Registry</span>
                            {user.role === 'Admin' && (
                                <button onClick={handleDeleteProject} className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors" title="Purge Project">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight uppercase">
                            {project.title}
                        </h1>
                    </div>

                    <button 
                        onClick={() => setCommitmentModalOpen(true)}
                        className="w-full sm:w-[380px] bg-white rounded-[32px] shadow-soft p-6 border border-slate-100 relative overflow-hidden text-left transition-all hover:scale-[1.02] hover:shadow-premium group active:scale-95"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[9px] font-black text-brand-gold uppercase tracking-[3px]">Strict Commitment</p>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Delivery Registry In</h3>
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
                                    <div className="text-3xl font-display font-black text-slate-900 tabular-nums">
                                        {unit.v.toString().padStart(2, '0')}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">
                                        {unit.l}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
                            <SparklesIcon className="w-3 h-3 text-brand-gold" />
                        </div>
                    </button>
                </div>

                <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

                <div className="space-y-6">
                    <nav className="flex gap-1 bg-slate-100/60 p-1 rounded-2xl w-full overflow-x-auto no-scrollbar border border-slate-200/50">
                        {tabs.map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                                    activeTab === tab 
                                    ? 'bg-white text-brand-blue shadow-sm ring-1 ring-slate-200/50' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>

                    <div className="min-h-[400px]">
                        {activeTab === 'Live Updates' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="luxury-glass group border-slate-100/50">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[3px]">Site Location</span>
                                    <p className="text-base font-bold text-slate-900 mt-2">{project.address}</p>
                                </Card>
                                <Card className="luxury-glass group border-slate-100/50">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[3px]">Capital Allocation</span>
                                    <p className="text-2xl font-display font-black text-slate-900 mt-1">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p>
                                </Card>
                                <Card className="luxury-glass group border-slate-100/50">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[3px]">Project Lead</span>
                                    <div className="mt-2">
                                        <UserNameDisplay user={designer} showAvatar={true} textClassName="font-bold text-sm text-slate-900" imageSize="w-8 h-8" />
                                    </div>
                                </Card>
                            </div>
                        )}
                        
                        {activeTab === 'Designs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {designs.filter(d => d.projectId === project.id).map(design => (
                                    <Card key={design.id} className="p-0 overflow-hidden border-slate-100 group relative">
                                        <div className="aspect-video bg-slate-100 overflow-hidden">
                                            <img src={design.fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Design Version" />
                                        </div>
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">Version {design.version}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{design.approved ? '✓ Approved' : 'Awaiting Review'}</p>
                                            </div>
                                            <a href={design.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="secondary" className="!p-2"><DownloadIcon className="w-4 h-4" /></Button>
                                            </a>
                                        </div>
                                    </Card>
                                ))}
                                {designs.filter(d => d.projectId === project.id).length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[32px]">
                                        <PhotoIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        No designs uploaded yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Quotes & Docs' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {quotes.filter(q => q.projectId === project.id).map(quote => (
                                        <Card key={quote.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[24px] hover:shadow-soft transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-brand-blue/5 rounded-2xl flex items-center justify-center text-brand-blue">
                                                    <FileTextIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 uppercase tracking-wide text-sm">{quote.version}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Uploaded {new Date(quote.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="secondary" className="!p-2.5 !rounded-xl border-slate-100 hover:border-brand-gold transition-all">
                                                        <DownloadIcon className="w-5 h-5 text-brand-gold" />
                                                    </Button>
                                                </a>
                                                {user.role === 'Admin' && (
                                                    <button 
                                                        onClick={async () => { if(window.confirm('Delete this document?')) { await deleteRecord('quotes', quote.id); refetchData(); } }}
                                                        className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {(user.role === 'Admin' || user.role === 'Designer') && (
                                    <button 
                                        onClick={() => setUploadQuoteModalOpen(true)} 
                                        className="flex items-center gap-6 p-8 border-2 border-dashed border-slate-200 rounded-[32px] hover:border-brand-blue hover:bg-white transition-all group shadow-sm bg-slate-50/50 w-full"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-slate-300 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                                            <FilePlusIcon className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-[3px] text-sm transition-colors">Register New Quotation Asset</h3>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        {activeTab === 'Materials' && (
                            <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />
                        )}
                    </div>
                </div>
                
                <UploadQuoteModal 
                    isOpen={isUploadQuoteModalOpen} 
                    onClose={() => setUploadQuoteModalOpen(false)} 
                    onUpload={async (f,v) => { 
                        const url = await uploadProjectFile(project.id, f); 
                        if(url) { 
                            await createRecord('quotes', { project_id: project.id, version: v, file_url: url, uploaded_by: user.id }); 
                            await refetchData(); 
                        } 
                    }} 
                />
            </div>
        </>
    );
};

export default ProjectDetails;
