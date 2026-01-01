import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { 
    BriefcaseIcon, CheckCircleIcon, CalendarIcon, UsersIcon, 
    ZapIcon, TrendingUpIcon, AlertTriangleIcon, PackageIcon,
    ArrowPathIcon, ChevronRightIcon, ClockIcon, DollarSignIcon,
    ShieldCheckIcon, ClipboardIcon, MessageSquareIcon
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
    const location = useLocation();

    const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'ledger'>('overview');
    const [materialRequests, setMaterialRequests] = useState<any[]>([]);
    const [siteUpdates, setSiteUpdates] = useState<any[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'approvals' || tab === 'ledger') {
            setActiveTab(tab);
        } else {
            setActiveTab('overview');
        }
    }, [location]);

    useEffect(() => {
        const fetchPHData = async () => {
            const { data: mats } = await supabase.from('material_requests').select('*').order('created_at', { ascending: false });
            const { data: sites } = await supabase.from('site_updates').select('*').order('created_at', { ascending: false }).limit(20);
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

    const handleApproveMaterial = async (id: string, status: 'Approved' | 'Rejected') => {
        const { error } = await supabase.from('material_requests').update({ 
            status, 
            approved_by: users.find(u => u.role === 'Project Head')?.id 
        }).eq('id', id);
        if (!error) {
            setMaterialRequests(prev => prev.map(m => m.id === id ? { ...m, status } : m));
            await refetchData();
        }
    };

    if (isLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Synchronizing Master Terminal...</div>;

    return (
        <div className="space-y-10 pb-20 animate-reveal">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">Management HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-3 flex items-center gap-2">
                        <ZapIcon className="w-4 h-4 text-brand-gold" />
                        One-Screen Control Panel
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('approvals')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Approvals</button>
                    <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Ledger</button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Active" value={dashboardStats.active.length} color="#2563EB" icon={<BriefcaseIcon className="w-7 h-7" />} />
                <StatCard title="Critical Delays" value={dashboardStats.delayed.length} color="#EF4444" icon={<AlertTriangleIcon className="w-7 h-7" />} isUrgent={dashboardStats.delayed.length > 0} />
                <StatCard title="Material Requests" value={materialRequests.filter(m => m.status === 'Requested').length} color="#F59E0B" icon={<PackageIcon className="w-7 h-7" />} />
                <StatCard title="Portfolio Spend" value={`₹${(dashboardStats.totalSpent / 100000).toFixed(1)}L`} color="#10B981" icon={<TrendingUpIcon className="w-7 h-7" />} />
            </div>

            <div className="animate-in">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Site Update Stream */}
                        <div className="lg:col-span-8 space-y-10">
                            <Card className="luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium">
                                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                                        Today's Site Registry (Live)
                                    </h2>
                                </div>
                                <div className="p-10 space-y-8 max-h-[800px] overflow-y-auto no-scrollbar relative">
                                    <div className="absolute left-14 top-10 bottom-10 w-px bg-slate-100"></div>
                                    {siteUpdates.map((update) => {
                                        const project = projects.find(p => p.id === update.project_id);
                                        const supervisor = findUserById(update.supervisor_id);
                                        return (
                                            <div key={update.id} className="relative pl-12 group">
                                                <div className="absolute left-[3px] top-1.5 w-3 h-3 bg-brand-gold rounded-full ring-4 ring-white shadow-sm z-10"></div>
                                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 group-hover:border-brand-gold/20 transition-all hover:shadow-premium">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">{project?.title}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Stage: {update.stage} &bull; <span className="text-brand-blue">{supervisor?.fullName}</span></p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <ClockIcon className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">{new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 text-base leading-relaxed italic font-medium">"{update.notes}"</p>
                                                    {update.image_url && (
                                                        <div className="mt-6 rounded-3xl overflow-hidden h-64 w-full ring-1 ring-slate-100 shadow-inner group-hover:scale-[1.01] transition-transform duration-500">
                                                            <img src={update.image_url} className="w-full h-full object-cover" alt="Site Visual" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Right Summary Column */}
                        <div className="lg:col-span-4 space-y-10">
                             <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Resource Map</h3>
                                <div className="space-y-4">
                                    {users.filter(u => u.role === 'Designer' || u.role === 'Site Head').slice(0, 5).map(staff => {
                                        const load = projects.filter(p => (p.designerId === staff.id || p.adminId === staff.id) && p.status === 'Active').length;
                                        return (
                                            <div key={staff.id} className="flex items-center justify-between bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm">
                                                <UserNameDisplay user={staff} showAvatar={true} imageSize="w-10 h-10" textClassName="font-black text-slate-900 text-xs" />
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${load > 3 ? 'bg-red-50 text-red-500' : 'bg-brand-blue/5 text-brand-blue'}`}>{load} Sites</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium bg-slate-900">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[5px] mb-8">Global Terminal</h3>
                                <div className="space-y-4">
                                    <Button onClick={() => navigate('/chat')} variant="secondary" className="w-full !bg-white/10 !text-white !border-white/10 !rounded-2xl !py-5 uppercase tracking-[3px] !text-[10px] font-black">
                                        <MessageSquareIcon className="w-6 h-6 mr-3" /> Global Discussion
                                    </Button>
                                    <Button onClick={() => navigate('/admin/overview')} variant="secondary" className="w-full !bg-white/10 !text-white !border-white/10 !rounded-2xl !py-5 uppercase tracking-[3px] !text-[10px] font-black">
                                        <TrendingUpIcon className="w-6 h-6 mr-3" /> Advanced Analytics
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <Card className="luxury-glass !p-10 rounded-[48px] border-slate-100 shadow-premium">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10">Material Approval Flow</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {materialRequests.filter(m => m.status === 'Requested').map(req => {
                                const project = projects.find(p => p.id === req.project_id);
                                return (
                                    <div key={req.id} className="p-8 bg-white rounded-[40px] border border-slate-100 group hover:border-brand-gold transition-all shadow-premium relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-12 -mt-12"></div>
                                        <div className="mb-6">
                                            <span className="px-4 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">Requested</span>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-4 leading-tight">{req.material_name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{project?.title}</p>
                                        </div>
                                        <div className="space-y-3 mb-8">
                                            <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Quantity</span> <span className="text-slate-900">{req.quantity}</span></div>
                                            <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Vendor</span> <span className="text-slate-900">{req.vendor || 'N/A'}</span></div>
                                            <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Required By</span> <span className="text-brand-blue">{req.delivery_date || 'ASAP'}</span></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => handleApproveMaterial(req.id, 'Approved')} className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Authorize</button>
                                            <button onClick={() => handleApproveMaterial(req.id, 'Rejected')} className="py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-red-50 hover:text-red-500 transition-all">Deny</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {activeTab === 'ledger' && (
                    <Card className="luxury-glass !p-10 rounded-[48px] border-slate-100 shadow-premium bg-white">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Project Budget Sentinel</h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Financial Oversight Active</span>
                        </div>
                        <div className="space-y-12">
                            {dashboardStats.active.map(p => {
                                const pExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
                                const utilization = p.budgetApproved > 0 ? (pExpenses / p.budgetApproved) * 100 : 0;
                                const isCritical = utilization >= 100;
                                const isWarning = utilization >= 80;
                                
                                return (
                                    <div key={p.id} className="relative group">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{p.title}</h4>
                                                <div className="flex items-center gap-6 mt-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget: <span className="text-slate-900">₹{(p.budgetApproved/1000).toFixed(0)}k</span></p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual: <span className={isCritical ? 'text-red-600 font-black' : 'text-slate-900'}>₹{(pExpenses/1000).toFixed(0)}k</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-display font-black tabular-nums ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-500' : 'text-slate-300'}`}>
                                                    {utilization.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner relative">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-600 animate-pulse' : isWarning ? 'bg-orange-400' : 'bg-brand-blue'}`} 
                                                style={{ width: `${Math.min(100, Math.max(5, utilization))}%` }}
                                            ></div>
                                            {isCritical && <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-widest">Budget Breach Alert</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ProjectHeadDashboard;