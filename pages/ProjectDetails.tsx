
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
    BriefcaseIcon, ZapIcon, FilePlusIcon, EyeIcon, DownloadIcon, 
    SparklesIcon, TrashIcon, FileTextIcon, PhotoIcon, CheckCircleIcon, 
    LockIcon, PackageIcon, ClockIcon, MapPinIcon 
} from '../components/icons';
import { UserRole, Milestone } from '../types';
import ProjectStatusBar from '../components/ProjectStatusBar';
import MaterialSelection from '../components/project/MaterialSelection';
import SiteUpdateModule from '../components/project/SiteUpdateModule';
import MaterialRequestModule from '../components/project/MaterialRequestModule';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import { useData } from '../context/DataContext';
import { updateRecord, createRecord } from '../services/api';

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
    const { projects, designs, milestones, expenses, products, refetchData, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('');
    const [isStartingProject, setIsStartingProject] = useState(false);
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

    useEffect(() => {
        if (user && !activeTab) {
            const tabs = TABS[user.role] || [];
            setActiveTab(tabs[0]);
        }
    }, [user, activeTab]);

    const isLocked = useMemo(() => {
        if (!project || !user || user.role !== 'Customer') return false;
        return project.isPaymentAlertActive === true;
    }, [project, user]);

    const needsActivation = useMemo(() => {
        if (!project || !user) return false;
        return user.role === 'Designer' && project.designerId === user.id && !project.startDate;
    }, [project, user]);

    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    const calculateTimeRemaining = useCallback(() => {
        if (!project || !project.startDate) {
            setTimeLeft({ d: 45, h: 0, m: 0, s: 0 });
            return;
        };
        const startTime = new Date(project.startDate).getTime();
        const deadlineTime = startTime + (45 * 24 * 60 * 60 * 1000);
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
            await updateRecord('projects', project.id, {
                status: 'Active',
                start_date: new Date().toISOString(),
                stage: 'Design',
                progress: 0
            });
            await refetchData();
        } finally {
            setIsStartingProject(false);
        }
    };

    if (usersLoading || dataLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Syncing Portfolio Data...</div>;
    if (!project || !user) return <div className="text-center p-20 font-display font-black text-slate-400 uppercase">Registry Not Found</div>;

    if (isLocked) return <div className="fixed inset-0 z-[10000] bg-slate-900 flex items-center justify-center p-6 text-center"><LockIcon className="w-20 h-20 text-brand-gold mb-4"/><h2 className="text-white text-3xl font-black uppercase">Access Locked</h2></div>;

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);

    return (
        <div className="space-y-12 pb-24">
            {needsActivation && (
                <div className="fixed inset-0 z-[10000] bg-slate-900 flex items-center justify-center p-6 backdrop-blur-2xl">
                    <div className="max-w-xl w-full text-center space-y-12">
                        <h2 className="text-5xl font-display font-black text-white uppercase leading-none">Activate commitment?</h2>
                        <Button onClick={handleStartProject} disabled={isStartingProject} className="!w-full !py-8 !rounded-full !bg-brand-gold !text-slate-900 !text-xl font-black uppercase tracking-[4px]">Yes, Initiate 45-Day Timer</Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 pt-4">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Master Record</span>
                    <h1 className="text-5xl font-display font-black text-slate-900 uppercase leading-none">{project.title}</h1>
                </div>

                <div className="bg-white rounded-[40px] shadow-premium p-8 border border-slate-100 min-w-[380px]">
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { v: timeLeft.d, l: 'DAYS' },
                            { v: timeLeft.h, l: 'HRS' },
                            { v: timeLeft.m, l: 'MIN' },
                            { v: timeLeft.s, l: 'SEC' }
                        ].map((unit) => (
                            <div key={unit.l} className="text-center">
                                <div className="text-4xl font-display font-black text-slate-900 tabular-nums">{unit.v}</div>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{unit.l}</span>
                            </div>
                        ))}
                    </div>
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
                                <Card className="luxury-glass !p-10 rounded-[40px] border-slate-100">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Asset Profile</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Location</p><p className="text-lg font-bold text-slate-800 mt-2">{project.address}</p></div>
                                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Design Lead</p><div className="mt-2"><UserNameDisplay user={designer} showAvatar={true} textClassName="font-black text-slate-900" /></div></div>
                                    </div>
                                </Card>
                            </div>
                            <div className="lg:col-span-4">
                                {(user.role === 'Designer' || user.role === 'Site Head') && <MaterialRequestModule projectId={project.id} onSuccess={refetchData} />}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'Materials' && <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />}
                    
                    {activeTab === 'Execution Log' && (
                         <div className="space-y-6">
                            <SiteUpdateModule projectId={project.id} onSuccess={refetchData} />
                            <p className="text-center text-slate-300 font-black uppercase text-[10px] tracking-[5px] py-20">Full site history sync complete.</p>
                         </div>
                    )}

                    {activeTab === 'Sourcing' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Project BOM (Bill of Materials)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.filter(p => p.projectId === project.id).map(prod => (
                                    <Card key={prod.id} className="bg-white border-slate-100 rounded-[32px] p-6 group hover:border-brand-gold/30 transition-all">
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
                                {milestones.filter(m => m.projectId === project.id).map(m => (
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
