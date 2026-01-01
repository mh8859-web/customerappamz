import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { 
    BriefcaseIcon, CheckCircleIcon, CalendarIcon, UsersIcon, 
    ZapIcon, TrendingUpIcon, ClockIcon, DollarSignIcon, 
    ChevronDownIcon, MessageSquareIcon, XMarkIcon 
} from '../../components/icons';
import Button from '../../components/ui/Button';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { updateRecord } from '../../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="flex items-start p-6 luxury-glass border-slate-100 shadow-premium group hover:border-brand-gold/20 transition-all">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500" style={{ backgroundColor: `${color}15`, color }}>
           {icon}
        </div>
        <div className="ml-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">{title}</p>
            <p className="text-3xl font-display font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        </div>
    </Card>
);

const ProjectHeadDashboard: React.FC = () => {
    const { projects, designs, leaveRequests, currentWorks, milestones, expenses, refetchData, loading: dataLoading } = useData();
    const { users, findUserById, loading: usersLoading } = useUsers();
    const navigate = useNavigate();

    const isLoading = dataLoading || usersLoading;

    // --- Logic & Calculations ---
    const activeProjects = useMemo(() => projects.filter(p => p.status === 'Active'), [projects]);
    const activeDesigners = useMemo(() => users.filter(u => u.role === 'Designer'), [users]);
    const designsForReview = useMemo(() => designs.filter(d => d.submittedForReview && !d.approved), [designs]);
    const pendingLeave = useMemo(() => leaveRequests.filter(l => l.status === 'Pending'), [leaveRequests]);
    
    const recentDesignerUpdates = useMemo(() => {
        return [...currentWorks]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [currentWorks]);

    const handleLeaveAction = async (requestId: string, status: 'Approved' | 'Rejected') => {
        await updateRecord('leave_requests', requestId, { status });
        await refetchData();
    };

    if (isLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[6px] text-xs">Accessing Strategic Terminal...</div>;

    return (
        <div className="space-y-10 pb-20 animate-reveal">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase leading-none">Management HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-3">Portfolio Performance & Team Oversight</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => navigate('/chat')} className="!rounded-full !px-8 !py-3.5 !text-[10px] font-black uppercase tracking-widest shadow-soft">
                        <MessageSquareIcon className="w-5 h-5 mr-2" /> Global Channel
                    </Button>
                    <Button variant="gold" onClick={() => navigate('/admin/overview')} className="!rounded-full !px-10 !py-3.5 !text-[10px] font-black uppercase tracking-widest shadow-gold-glow">
                        <TrendingUpIcon className="w-5 h-5 mr-2" /> Portfolio Stats
                    </Button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Portfolio Value" value={`₹${(activeProjects.reduce((s, p) => s + p.budgetDisplay, 0) / 100000).toFixed(1)}L`} color="#2563EB" icon={<BriefcaseIcon className="w-6 h-6" />} />
                <StatCard title="Lead Creatives" value={activeDesigners.length} color="#D4AF37" icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard title="Review Queue" value={designsForReview.length} color="#EF4444" icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard title="Duty Requests" value={pendingLeave.length} color="#8B5CF6" icon={<CalendarIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Live Activity Stream */}
                <div className="lg:col-span-8 space-y-10">
                    <Card className="luxury-glass !p-0 overflow-hidden !rounded-[40px] border-slate-100 shadow-premium">
                        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                                Designer Pulse (Live)
                            </h2>
                            <button onClick={() => navigate('/admin/work-tracking')} className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">Full Feed &rarr;</button>
                        </div>
                        <div className="p-10 space-y-8 max-h-[700px] overflow-y-auto no-scrollbar relative">
                            <div className="absolute left-14 top-10 bottom-10 w-px bg-slate-100"></div>
                            {recentDesignerUpdates.map((update) => {
                                const designer = findUserById(update.designerId);
                                return (
                                    <div key={update.id} className="relative pl-12 group">
                                        <div className="absolute left-[3px] top-1.5 w-3 h-3 bg-brand-gold rounded-full ring-4 ring-white shadow-sm z-10"></div>
                                        <div className="bg-white p-6 rounded-[28px] border border-slate-100 group-hover:border-brand-gold/20 transition-all hover:shadow-premium">
                                            <div className="flex justify-between items-center mb-4">
                                                <UserNameDisplay user={designer} showAvatar={true} textClassName="font-black text-slate-900 uppercase tracking-wide text-xs" imageSize="w-8 h-8" />
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm font-medium leading-relaxed">{update.content}</p>
                                            {update.imageUrl && (
                                                <img src={update.imageUrl} className="mt-4 rounded-2xl h-40 w-full object-cover ring-1 ring-slate-100" alt="Work Visual" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {recentDesignerUpdates.length === 0 && (
                                <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs">No activity logged in current cycle.</div>
                            )}
                        </div>
                    </Card>

                    <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Design Approval Pipeline</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {designsForReview.map(design => {
                                const project = projects.find(p => p.id === design.projectId);
                                return (
                                    <div key={design.id} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden group hover:shadow-premium transition-all">
                                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                            <img src={design.fileUrl} className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-110" alt="Design" />
                                            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm truncate">{project?.title}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Version {design.version}</p>
                                            <Button onClick={() => navigate(`/projects/${project?.id}`)} className="w-full mt-6 !rounded-full !py-2.5 !text-[9px] font-black uppercase tracking-widest">Enter Terminal Review</Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {designsForReview.length === 0 && (
                                <div className="col-span-full py-16 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px]">
                                    <CheckCircleIcon className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                    <p className="font-bold uppercase tracking-widest text-[10px]">Registry Clear. No designs awaiting verification.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Personnel & Financial Intelligence */}
                <div className="lg:col-span-4 space-y-10">
                    <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Duty Exceptions</h3>
                        <div className="space-y-4">
                            {pendingLeave.map(req => {
                                const designer = findUserById(req.designerId);
                                return (
                                    <div key={req.id} className="p-5 bg-slate-50/80 rounded-3xl border border-slate-100">
                                        <UserNameDisplay user={designer} showAvatar={true} textClassName="font-bold text-slate-900 text-sm" imageSize="w-9 h-9" />
                                        <div className="mt-4">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reason</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed italic">"{req.reason}"</p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-brand-blue uppercase bg-brand-blue/5 px-2 py-1 rounded">{req.startDate}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleLeaveAction(req.id, 'Approved')} className="p-2 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"><CheckCircleIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><XMarkIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {pendingLeave.length === 0 && (
                                <p className="text-center py-8 text-slate-300 font-bold uppercase tracking-widest text-[9px]">Full Personnel Availability</p>
                            )}
                        </div>
                    </Card>

                    <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium bg-white">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Margin Intelligence</h3>
                        <div className="space-y-6">
                            {activeProjects.slice(0, 5).map(p => {
                                const billed = milestones.filter(m => m.projectId === p.id && m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
                                const pExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
                                const margin = billed > 0 ? ((billed - pExpenses) / billed) * 100 : 0;
                                
                                return (
                                    <div key={p.id}>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-[11px] font-black text-slate-900 uppercase truncate pr-4">{p.title}</p>
                                            <span className={`text-[10px] font-black tabular-nums ${margin > 25 ? 'text-accent-success' : 'text-accent-danger'}`}>{margin.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${margin > 25 ? 'bg-accent-success' : 'bg-accent-danger'}`} 
                                                style={{ width: `${Math.min(100, Math.max(5, margin))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            <button onClick={() => navigate('/admin/overview')} className="w-full !mt-8 text-[9px] font-black uppercase tracking-widest text-brand-blue hover:underline">Full Analytics &rarr;</button>
                        </div>
                    </Card>

                    <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Resource Map</h3>
                        <div className="space-y-4">
                            {activeDesigners.map(designer => {
                                const projectCount = activeProjects.filter(p => p.designerId === designer.id).length;
                                return (
                                    <div key={designer.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-50">
                                        <UserNameDisplay user={designer} showAvatar={true} imageSize="w-8 h-8" textClassName="font-bold text-slate-900 text-xs" />
                                        <span className="text-[10px] font-black text-brand-blue bg-brand-blue/5 px-2 py-1 rounded uppercase tracking-widest">{projectCount} Projects</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectHeadDashboard;