
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { 
    BriefcaseIcon, CheckCircleIcon, UsersIcon, ZapIcon, TrendingUpIcon, 
    AlertTriangleIcon, PackageIcon, ArrowPathIcon, ClockIcon, 
    DollarSignIcon, ShieldCheckIcon, MessageSquareIcon, XMarkIcon
} from '../../components/icons';
import Button from '../../components/ui/Button';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { supabase } from '../../services/supabaseClient';
import { updateRecord } from '../../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; isUrgent?: boolean }> = ({ title, value, icon, color, isUrgent }) => (
    <Card className={`flex items-start p-6 luxury-glass border-slate-100 shadow-premium group hover:border-brand-gold/20 transition-all ${isUrgent ? 'ring-2 ring-red-500/20 bg-red-50/10' : ''}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-lg`} style={{ backgroundColor: isUrgent ? '#EF4444' : `${color}15`, color: isUrgent ? '#FFFFFF' : color }}>
           {icon}
        </div>
        <div className="ml-5 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">{title}</p>
            <div className="flex items-center gap-3">
                <p className={`text-3xl font-display font-black tracking-tighter leading-none ${isUrgent ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
                {isUrgent && <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping"></span>}
            </div>
        </div>
    </Card>
);

const ProjectHeadDashboard: React.FC = () => {
    const { projects, milestones, expenses, refetchData, loading: dataLoading } = useData();
    const { users, findUserById, loading: usersLoading } = useUsers();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'ledger' | 'registry'>('overview');
    const [materialRequests, setMaterialRequests] = useState<any[]>([]);
    const [siteUpdates, setSiteUpdates] = useState<any[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab') as any;
        if (['overview', 'approvals', 'ledger', 'registry'].includes(tab)) {
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

    // --- LOGIC ENGINE ---
    const phStats = useMemo(() => {
        const active = projects.filter(p => p.status === 'Active');
        const delayed = active.filter(p => p.isDelayed);
        const totalBudget = active.reduce((s, p) => s + (p.budgetApproved || p.budgetDisplay), 0);
        const totalSpent = expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
        const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        return { active, delayed, totalBudget, totalSpent, utilization };
    }, [projects, expenses]);

    const handleActionMaterial = async (id: string, status: 'Approved' | 'Rejected') => {
        const { error } = await supabase.from('material_requests').update({ status, approved_by: users.find(u => u.role === 'Project Head')?.id }).eq('id', id);
        if (!error) {
            setMaterialRequests(prev => prev.map(m => m.id === id ? { ...m, status } : m));
            await refetchData();
        }
    };

    if (isLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Initializing Management HQ...</div>;

    return (
        <div className="space-y-10 pb-20 animate-reveal">
            {/* Master Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">Management HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-3 flex items-center gap-2">
                        <ZapIcon className="w-4 h-4 text-brand-gold" />
                        Executive Control Panel Active
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                    <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sentinel</button>
                    <button onClick={() => setActiveTab('registry')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Site Updates</button>
                    <button onClick={() => setActiveTab('approvals')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Material Queue</button>
                    <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Budget Ledger</button>
                </div>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Active" value={phStats.active.length} color="#2563EB" icon={<BriefcaseIcon className="w-7 h-7" />} />
                <StatCard title="Critical Delays" value={phStats.delayed.length} color="#EF4444" icon={<AlertTriangleIcon className="w-7 h-7" />} isUrgent={phStats.delayed.length > 0} />
                <StatCard title="Pending Material" value={materialRequests.filter(m => m.status === 'Requested').length} color="#F59E0B" icon={<PackageIcon className="w-7 h-7" />} />
                <StatCard title="Portfolio Spend" value={`₹${(phStats.totalSpent / 100000).toFixed(1)}L`} color="#10B981" icon={<TrendingUpIcon className="w-7 h-7" />} />
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Summary and Map */}
                    <div className="lg:col-span-8 space-y-10">
                         <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-3">
                                <TrendingUpIcon className="w-5 h-5 text-brand-blue" />
                                Project Performance Map
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {phStats.active.map(p => {
                                     const pExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
                                     const utilization = p.budgetApproved > 0 ? (pExpenses / p.budgetApproved) * 100 : 0;
                                     return (
                                        <div key={p.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm truncate pr-4">{p.title}</p>
                                                <span className={`text-[10px] font-black px-2 py-1 rounded ${p.isDelayed ? 'bg-red-500 text-white' : 'bg-brand-blue/5 text-brand-blue'}`}>
                                                    {p.isDelayed ? 'DELAYED' : 'ON TRACK'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                                                <span>Budget Utilized</span>
                                                <span className={utilization >= 100 ? 'text-red-500' : utilization >= 80 ? 'text-orange-500' : 'text-slate-900'}>{utilization.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${utilization >= 100 ? 'bg-red-500' : utilization >= 80 ? 'bg-orange-500' : 'bg-brand-blue'}`} style={{ width: `${Math.min(100, utilization)}%` }}></div>
                                            </div>
                                        </div>
                                     );
                                })}
                            </div>
                        </Card>
                    </div>

                    {/* Right: Manpower & Quick Actions */}
                    <div className="lg:col-span-4 space-y-10">
                        <Card className="luxury-glass !p-8 !rounded-[40px] border-slate-100 shadow-premium bg-slate-900">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[5px] mb-8">Personnel Allocation</h3>
                            <div className="space-y-4">
                                {users.filter(u => u.role === 'Designer' || u.role === 'Site Head').map(staff => {
                                    const count = projects.filter(p => (p.designerId === staff.id || p.adminId === staff.id) && p.status === 'Active').length;
                                    return (
                                        <div key={staff.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <UserNameDisplay user={staff} showAvatar={true} imageSize="w-8 h-8" textClassName="font-bold text-white text-xs" />
                                            <span className={`text-[10px] font-black px-2 py-1 rounded ${count > 3 ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'}`}>{count} Sites</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'registry' && (
                <Card className="luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium">
                    <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <ZapIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                            Daily Site Registry (Verified Feed)
                        </h2>
                    </div>
                    <div className="p-10 space-y-12 max-h-[1000px] overflow-y-auto no-scrollbar relative">
                        <div className="absolute left-14 top-10 bottom-10 w-px bg-slate-100"></div>
                        {siteUpdates.map((update) => {
                            const project = projects.find(p => p.id === update.project_id);
                            const supervisor = findUserById(update.supervisor_id);
                            return (
                                <div key={update.id} className="relative pl-12 group">
                                    <div className="absolute left-[3px] top-1.5 w-3 h-3 bg-brand-gold rounded-full ring-4 ring-white shadow-sm z-10"></div>
                                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 group-hover:border-brand-gold/20 transition-all hover:shadow-premium">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl leading-none">{project?.title}</h4>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Stage: <span className="text-brand-gold">{update.stage}</span> &bull; Reported by <span className="text-brand-blue">{supervisor?.fullName}</span></p>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <ClockIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-lg leading-relaxed italic font-medium">"{update.notes}"</p>
                                        {update.image_url && (
                                            <div className="mt-8 rounded-[32px] overflow-hidden shadow-inner ring-1 ring-slate-100 h-96 w-full">
                                                <img src={update.image_url} className="w-full h-full object-cover" alt="Site Visual" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {activeTab === 'approvals' && (
                <Card className="luxury-glass !p-10 !rounded-[48px] border-slate-100 shadow-premium">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-12">Procurement Queue</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {materialRequests.filter(m => m.status === 'Requested').map(req => {
                            const project = projects.find(p => p.id === req.project_id);
                            return (
                                <div key={req.id} className="p-10 bg-white rounded-[40px] border border-slate-100 group hover:border-brand-gold transition-all shadow-premium relative overflow-hidden flex flex-col h-full">
                                    <div className="mb-6">
                                        <span className="px-5 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Authorization</span>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mt-6 leading-none">{req.material_name}</h4>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">{project?.title}</p>
                                    </div>
                                    <div className="space-y-4 mb-10 flex-1">
                                        <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Quantity</span> <span className="text-slate-900">{req.quantity}</span></div>
                                        <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Supplier</span> <span className="text-slate-900">{req.vendor || 'Not Specified'}</span></div>
                                        <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Required</span> <span className="text-brand-blue">{req.delivery_date}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => handleActionMaterial(req.id, 'Approved')} className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.03] transition-all">Authorize</button>
                                        <button onClick={() => handleActionMaterial(req.id, 'Rejected')} className="py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-red-50 hover:text-red-500 transition-all">Decline</button>
                                    </div>
                                </div>
                            );
                        })}
                        {materialRequests.filter(m => m.status === 'Requested').length === 0 && (
                            <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100">
                                <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-200 mb-6" />
                                <p className="text-xs font-black text-slate-300 uppercase tracking-[6px]">Queue Fully Authorized</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'ledger' && (
                <Card className="luxury-glass !p-12 rounded-[48px] border-slate-100 shadow-premium bg-white">
                    <div className="flex justify-between items-center mb-16">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Budget Sentinel</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">Fiscal Integrity Mode</span>
                    </div>
                    <div className="space-y-16">
                        {phStats.active.map(p => {
                            const pExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
                            const utilization = p.budgetApproved > 0 ? (pExpenses / p.budgetApproved) * 100 : 0;
                            const isBreached = utilization >= 100;
                            const isWarning = utilization >= 80;
                            
                            return (
                                <div key={p.id} className="relative group">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6">
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{p.title}</h4>
                                            <div className="flex items-center gap-10 mt-3">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sanctioned: <span className="text-slate-900">₹{(p.budgetApproved/1000).toFixed(0)}k</span></p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actual: <span className={isBreached ? 'text-red-600 font-black' : 'text-slate-900'}>₹{(pExpenses/1000).toFixed(0)}k</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-4xl font-display font-black tabular-nums tracking-tighter ${isBreached ? 'text-red-600' : isWarning ? 'text-orange-500' : 'text-slate-300'}`}>
                                                {utilization.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner relative ring-1 ring-slate-200">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${isBreached ? 'bg-red-600 animate-pulse' : isWarning ? 'bg-orange-400' : 'bg-brand-blue'}`} 
                                            style={{ width: `${Math.min(100, Math.max(5, utilization))}%` }}
                                        ></div>
                                        {isBreached && <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-[8px]">Budget Breach Alert</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ProjectHeadDashboard;
