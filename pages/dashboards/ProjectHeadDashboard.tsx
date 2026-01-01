import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { 
    BriefcaseIcon, CheckCircleIcon, CalendarIcon, UsersIcon, 
    ZapIcon, TrendingUpIcon, AlertTriangleIcon, PackageIcon,
    ArrowPathIcon, ChevronRightIcon, ClockIcon
} from '../../components/icons';
import Button from '../../components/ui/Button';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { supabase } from '../../services/supabaseClient';
import { updateRecord } from '../../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string; isUrgent?: boolean }> = ({ title, value, icon, color, subtitle, isUrgent }) => (
    <Card className={`flex items-start p-6 luxury-glass border-slate-100 shadow-premium group hover:border-brand-gold/20 transition-all ${isUrgent ? 'ring-2 ring-red-500/20' : ''}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-lg`} style={{ backgroundColor: isUrgent ? '#EF4444' : `${color}15`, color: isUrgent ? '#FFFFFF' : color }}>
           {icon}
        </div>
        <div className="ml-5 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">{title}</p>
            <div className="flex items-center gap-3">
                <p className={`text-3xl font-display font-black tracking-tighter leading-none ${isUrgent ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
                {isUrgent && <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping"></span>}
            </div>
            {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{subtitle}</p>}
        </div>
    </Card>
);

const ProjectHeadDashboard: React.FC = () => {
    const { projects, milestones, expenses, refetchData, loading: dataLoading } = useData();
    const { users, findUserById, loading: usersLoading } = useUsers();
    const navigate = useNavigate();

    const [materialRequests, setMaterialRequests] = useState<any[]>([]);
    const [siteUpdates, setSiteUpdates] = useState<any[]>([]);

    useEffect(() => {
        const fetchPHData = async () => {
            const { data: mats } = await supabase.from('material_requests').select('*').eq('status', 'Requested');
            const { data: sites } = await supabase.from('site_updates').select('*').order('created_at', { ascending: false }).limit(10);
            if (mats) setMaterialRequests(mats);
            if (sites) setSiteUpdates(sites);
        };
        if (!dataLoading) fetchPHData();
    }, [dataLoading]);

    const isLoading = dataLoading || usersLoading;

    // --- Intelligence Engine ---
    const dashboardStats = useMemo(() => {
        const active = projects.filter(p => p.status === 'Active');
        const delayed = active.filter(p => p.isDelayed);
        
        const totalBudget = active.reduce((s, p) => s + (p.budgetApproved || p.budgetDisplay), 0);
        const totalSpent = expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
        const budgetUtilized = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        return { active, delayed, totalBudget, totalSpent, budgetUtilized };
    }, [projects, expenses]);

    const handleApproveMaterial = async (id: string) => {
        const { error } = await supabase.from('material_requests').update({ status: 'Approved', approved_by: users.find(u => u.role === 'Project Head')?.id }).eq('id', id);
        if (!error) {
            setMaterialRequests(prev => prev.filter(m => m.id !== id));
            await refetchData();
        }
    };

    if (isLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs">Synchronizing Portfolio Terminal...</div>;

    return (
        <div className="space-y-10 pb-20 animate-reveal">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">Management HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-3 flex items-center gap-2">
                        <ZapIcon className="w-4 h-4 text-brand-gold" />
                        Executive Oversight Mode Active
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => refetchData()} className="!rounded-full !px-6 shadow-soft">
                        <ArrowPathIcon className={`w-5 h-5 ${dataLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="gold" onClick={() => navigate('/projects')} className="!rounded-full !px-10 !py-4 !text-[11px] font-black uppercase tracking-widest shadow-gold-glow">
                        <BriefcaseIcon className="w-5 h-5 mr-2" /> All Portfolios
                    </Button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Active Portfolios" value={dashboardStats.active.length} color="#2563EB" icon={<BriefcaseIcon className="w-7 h-7" />} subtitle="Live Monitoring" />
                <StatCard title="Critical Delays" value={dashboardStats.delayed.length} color="#EF4444" icon={<AlertTriangleIcon className="w-7 h-7" />} isUrgent={dashboardStats.delayed.length > 0} subtitle="Immediate Action Required" />
                <StatCard title="Pending Approvals" value={materialRequests.length} color="#F59E0B" icon={<PackageIcon className="w-7 h-7" />} subtitle="Materials Queue" />
                <StatCard title="Portfolio Spend" value={`₹${(dashboardStats.totalSpent / 100000).toFixed(1)}L`} color="#10B981" icon={<TrendingUpIcon className="w-7 h-7" />} subtitle={`${dashboardStats.budgetUtilized.toFixed(1)}% Utilized`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Live Site Updates (Priority 3) */}
                <div className="lg:col-span-7 space-y-10">
                    <Card className="luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium h-fit">
                        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                                Today's Site Update Module
                            </h2>
                        </div>
                        <div className="p-10 space-y-8 max-h-[800px] overflow-y-auto no-scrollbar relative">
                            <div className="absolute left-14 top-10 bottom-10 w-px bg-slate-100"></div>
                            {siteUpdates.map((update) => {
                                const project = projects.find(p => p.id === update.project_id);
                                return (
                                    <div key={update.id} className="relative pl-12 group">
                                        <div className="absolute left-[3px] top-1.5 w-3 h-3 bg-brand-gold rounded-full ring-4 ring-white shadow-sm z-10"></div>
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 group-hover:border-brand-gold/20 transition-all hover:shadow-premium">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-wide text-xs">{project?.title}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{update.stage} Phase</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm font-medium leading-relaxed italic">"{update.notes}"</p>
                                            {update.image_url && (
                                                <div className="mt-4 rounded-3xl overflow-hidden h-48 w-full ring-1 ring-slate-100 shadow-inner">
                                                    <img src={update.image_url} className="w-full h-full object-cover" alt="Site Visual" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {siteUpdates.length === 0 && (
                                <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-[10px]">Registry Empty. Awaiting supervisor sync.</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Approvals & Financials (Priority 4-5) */}
                <div className="lg:col-span-5 space-y-10">
                    {/* Material Approval Queue */}
                    <Card className="luxury-glass !p-10 !rounded-[48px] border-slate-100 shadow-premium">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Approval Pipeline</h3>
                        <div className="space-y-4">
                            {materialRequests.map(req => {
                                const project = projects.find(p => p.id === req.project_id);
                                return (
                                    <div key={req.id} className="p-6 bg-white rounded-3xl border border-slate-100 group hover:border-brand-gold/30 transition-all shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm uppercase">{req.material_name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{project?.title}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-[9px] font-black uppercase">Qty: {req.quantity}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <button onClick={() => handleApproveMaterial(req.id)} className="py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Authorize</button>
                                            <button className="py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">Decline</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {materialRequests.length === 0 && (
                                <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <CheckCircleIcon className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Queue Fully Authorized</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Financial Intelligence (Priority 5) */}
                    <Card className="luxury-glass !p-10 !rounded-[48px] border-slate-100 shadow-premium bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] mb-10">Budget Precision</h3>
                        <div className="space-y-10">
                            {dashboardStats.active.slice(0, 5).map(p => {
                                const pExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
                                const utilization = p.budgetApproved > 0 ? (pExpenses / p.budgetApproved) * 100 : 0;
                                const isWarning = utilization >= 80;
                                const isCritical = utilization >= 100;
                                
                                return (
                                    <div key={p.id} className="relative">
                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[200px]">{p.title}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Spend: ₹{(pExpenses/1000).toFixed(0)}k / ₹{(p.budgetApproved/1000).toFixed(0)}k</p>
                                            </div>
                                            <span className={`text-[10px] font-black tabular-nums px-2 py-1 rounded ${isCritical ? 'bg-red-500 text-white animate-pulse' : isWarning ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
                                                {utilization.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : isWarning ? 'bg-orange-400' : 'bg-brand-blue'}`} 
                                                style={{ width: `${Math.min(100, Math.max(5, utilization))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Manpower Resource Map (Priority 6) */}
                    <Card className="luxury-glass !p-10 !rounded-[48px] border-slate-100 shadow-premium">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Resource Load</h3>
                        <div className="space-y-4">
                            {users.filter(u => u.role === 'Designer' || u.role === 'Site Head').map(staff => {
                                const load = projects.filter(p => (p.designerId === staff.id || p.adminId === staff.id) && p.status === 'Active').length;
                                return (
                                    <div key={staff.id} className="flex items-center justify-between bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm group hover:scale-[1.02] transition-all">
                                        <UserNameDisplay user={staff} showAvatar={true} imageSize="w-10 h-10" textClassName="font-black text-slate-900 text-xs" />
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${load > 3 ? 'bg-red-50 text-red-500' : 'bg-brand-blue/5 text-brand-blue'}`}>{load} Sites</span>
                                        </div>
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