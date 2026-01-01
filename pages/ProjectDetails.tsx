
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MapPinIcon, UserCircleIcon, FileTextIcon, DollarSignIcon, MessageSquareIcon, PhotoIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, CalendarIcon, SparklesIcon, FilePlusIcon, ZapIcon, ThumbUpIcon, RefreshIcon, InfoIcon, AlertTriangleIcon, EyeIcon, TrendingUpIcon, PackageIcon } from '../components/icons';
import { Project, Design, User, UserRole, UnifiedUpdate, Milestone, Quote, ProjectStage, Expense } from '../types';
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
import { createRecord, updateRecord, uploadProjectFile } from '../services/api';

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
    const { projects, designs, quotes, milestones, expenses, products, projectUpdates, workLogs, activityLogs, refetchData, loading: dataLoading } = useData();
    
    const [activeTab, setActiveTab] = useState('Live Updates');
    const [isUploadDesignModalOpen, setUploadDesignModalOpen] = useState(false);
    const [isUploadQuoteModalOpen, setUploadQuoteModalOpen] = useState(false);
    
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const projectDesigns = useMemo(() => designs.filter(d => d.projectId === projectId), [designs, projectId]);
    const projectMilestones = useMemo(() => milestones.filter(m => m.projectId === projectId).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [milestones, projectId]);
    const projectExpenses = useMemo(() => expenses.filter(e => e.projectId === projectId), [expenses, projectId]);

    const financialNerve = useMemo(() => {
        if (!project) return null;
        const totalBilled = projectMilestones.filter(m => m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
        const totalExpense = projectExpenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
        const outstandingAR = projectMilestones.filter(m => m.statusDisplay === 'Completed').reduce((s, m) => s + m.amountDisplay, 0);
        return { totalBilled, totalExpense, outstandingAR, gp: totalBilled - totalExpense };
    }, [project, projectMilestones, projectExpenses]);

    // --- TIMER LOGIC (STRICT 45 DAYS) ---
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, total: 0 });

    useEffect(() => {
        if (!project || project.status === 'Completed') return;
        const timer = setInterval(() => {
            const projectStart = new Date(project.startDate);
            const now = new Date();
            const commitmentDuration = 45 * 24 * 60 * 60 * 1000;
            let distance = now.getTime() < projectStart.getTime() ? commitmentDuration : (new Date(projectStart.getTime() + commitmentDuration).getTime() - now.getTime());
            if (distance < 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, total: 0 }); clearInterval(timer); }
            else {
                const capped = Math.min(distance, commitmentDuration);
                setTimeLeft({
                    d: Math.floor(capped / (1000 * 60 * 60 * 24)),
                    h: Math.floor((capped % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((capped % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((capped % (1000 * 60)) / 1000),
                    total: capped
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [project]);

    if (usersLoading || dataLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synchronizing Project Portfolio...</div>;
    if (!project || !user) return <div className="text-center p-20">Portfolio link broken.</div>;

    const tabs = TABS[user.role] || [];
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col xl:flex-row justify-between xl:items-start gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-1 w-8 bg-brand-gold rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Archival Registry</span>
                    </div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase leading-tight">{project.title}</h1>
                </div>

                <Card className="!p-0 overflow-hidden bg-white border-2 border-slate-50 shadow-premium w-full xl:w-[460px] rounded-[48px] relative">
                    <div className="relative z-10 p-10 flex flex-col gap-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[5px] mb-2">STRICT DELIVERY COMMITMENT</p>
                                <h3 className="text-[11px] font-black text-slate-500 uppercase leading-relaxed tracking-widest">PROJECT READINESS IN</h3>
                            </div>
                            <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[{ v: timeLeft.d, l: 'DAYS' }, { v: timeLeft.h, l: 'HRS' }, { v: timeLeft.m, l: 'MIN' }, { v: timeLeft.s, l: 'SEC' }].map((unit, i) => (
                                <div key={unit.l} className="flex flex-col items-center">
                                    <div className="text-[44px] font-display font-black text-slate-900 tracking-tighter tabular-nums leading-none">{unit.v.toString().padStart(2, '0')}</div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3 border-t border-slate-100 pt-2 w-full text-center">{unit.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

            <div className="space-y-8">
                <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[22px] w-fit overflow-x-auto max-w-full no-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[2px] transition-all ${activeTab === tab ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                    ))}
                </nav>

                <div className="min-h-[500px] animate-in">
                    {activeTab === 'Live Updates' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="luxury-glass"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Location</span><p className="text-sm font-bold text-slate-900 mt-2">{project.address}</p></Card>
                            <Card className="luxury-glass"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capital Allocation</span><p className="text-xl font-display font-black text-slate-900 mt-1">₹{(project.budgetDisplay / 100000).toFixed(1)}L</p></Card>
                            <Card className="luxury-glass"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Project Lead</span><UserNameDisplay user={designer} showAvatar={true} textClassName="font-bold text-sm text-slate-900" imageSize="w-8 h-8" /></Card>
                        </div>
                    )}

                    {activeTab === 'Financial Ledger' && financialNerve && (
                        <div className="space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="luxury-glass"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-1">Contract Billed</p><p className="text-2xl font-display font-black text-accent-success">₹{(financialNerve.totalBilled/1000).toFixed(0)}k</p></Card>
                                <Card className="luxury-glass"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-1">Accounts Payable</p><p className="text-2xl font-display font-black text-accent-danger">₹{(financialNerve.totalExpense/1000).toFixed(0)}k</p></Card>
                                <Card className="luxury-glass"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-1">Accounts Receivable</p><p className="text-2xl font-display font-black text-brand-gold">₹{(financialNerve.outstandingAR/1000).toFixed(0)}k</p></Card>
                                <Card className="luxury-glass"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-1">Project Profit</p><p className="text-2xl font-display font-black text-brand-blue">₹{(financialNerve.gp/1000).toFixed(0)}k</p></Card>
                             </div>
                             
                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                <Card className="luxury-glass !p-10 rounded-[40px]">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Cash Outflow (Audit)</h3>
                                    <div className="space-y-4">
                                        {projectExpenses.map(e => (
                                            <div key={e.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center">
                                                <div><p className="font-bold text-slate-900 text-sm">{e.description}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest">{e.category}</p></div>
                                                <div className="flex items-center gap-6"><p className="font-display font-black text-slate-900">₹{e.amount.toLocaleString()}</p><span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${e.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.status}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card className="luxury-glass !p-10 rounded-[40px]">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Cash Inflow (Milestones)</h3>
                                    <div className="space-y-4">
                                        {projectMilestones.map(m => (
                                            <div key={m.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center">
                                                <div><p className="font-bold text-slate-900 text-sm">{m.title}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest">Due: {new Date(m.dueDate).toLocaleDateString()}</p></div>
                                                <div className="flex items-center gap-6"><p className="font-display font-black text-slate-900">₹{m.amountDisplay.toLocaleString()}</p><span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${m.statusDisplay === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{m.statusDisplay}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                             </div>
                        </div>
                    )}
                    
                    {activeTab === 'Materials' && <MaterialSelection projectId={project.id} isClient={user.role === 'Customer'} onUpdate={refetchData} />}
                    {activeTab === 'Quotes & Docs' && (
                        <div className="grid gap-6">
                            {(user.role === 'Admin' || user.role === 'Designer') && (
                                <button onClick={() => setUploadQuoteModalOpen(true)} className="flex items-center gap-8 p-10 border-2 border-dashed border-slate-200 rounded-[40px] hover:border-brand-blue hover:bg-white transition-all group shadow-sm"><div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm"><FilePlusIcon className="w-8 h-8" /></div><div className="text-left"><h3 className="font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest text-lg transition-colors">Provision Updated Quotation</h3><p className="text-xs text-slate-300 font-bold uppercase mt-1 tracking-widest">Supports Architectural PDF Format Only</p></div></button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <UploadQuoteModal isOpen={isUploadQuoteModalOpen} onClose={() => setUploadQuoteModalOpen(false)} onUpload={async (f,v) => { const url = await uploadProjectFile(project.id, f); if(url) { await createRecord('quotes', { project_id: project.id, version: v, file_url: url, uploaded_by: user.id }); await refetchData(); } }} />
        </div>
    );
};

export default ProjectDetails;
