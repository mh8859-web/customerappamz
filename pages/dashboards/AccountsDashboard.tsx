
import React, { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { updateRecord, createRecord } from '../../services/api';
// Added missing PackageIcon and XMarkIcon to icons import
import { DollarSignIcon, CreditCardIcon, PieChartIcon, ClockIcon, ZapIcon, CheckCircleIcon, AlertTriangleIcon, TrendingUpIcon, FileTextIcon, UserGroupIcon, PackageIcon, XMarkIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { Project, Milestone, Expense, Product } from '../../types';

const FinancialStat: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; color: string }> = ({ title, value, subValue, icon, color }) => (
    <Card className="!p-8 luxury-glass border-slate-100 flex items-start gap-6 shadow-premium group hover:border-brand-gold/20 transition-all">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500" style={{ backgroundColor: `${color}10`, color }}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-1.5">{title}</p>
            <p className="text-3xl font-display font-black text-slate-900 tabular-nums leading-none tracking-tighter">{value}</p>
            {subValue && <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 tracking-widest">{subValue}</p>}
        </div>
    </Card>
);

const AccountsDashboard: React.FC = () => {
    const { projects, milestones, expenses, products, workLogs, refetchData, loading } = useData();
    const { findUserById, loading: usersLoading } = useUsers();
    const [activeSection, setActiveSection] = useState<'sentinel' | 'audit' | 'aging' | 'gp'>('sentinel');
    
    const isLoading = loading || usersLoading;

    // --- FINANCIAL NERVE CENTER LOGIC ---
    const finStats = useMemo(() => {
        const totalAR = milestones.filter(m => m.statusDisplay === 'Completed').reduce((s, m) => s + m.amountDisplay, 0);
        const totalPaid = milestones.filter(m => m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
        
        const totalExpenses = expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
        const pendingPayables = expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);

        const activeProjectMargins = projects.filter(p => p.status === 'Active').map(p => {
            const projectMilestones = milestones.filter(m => m.projectId === p.id && m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
            const projectExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
            return projectMilestones > 0 ? ((projectMilestones - projectExpenses) / projectMilestones) * 100 : 0;
        });

        const avgMargin = activeProjectMargins.length > 0 ? activeProjectMargins.reduce((a, b) => a + b, 0) / activeProjectMargins.length : 0;

        return { totalAR, totalPaid, totalExpenses, pendingPayables, avgMargin };
    }, [milestones, expenses, projects]);

    const handleVerifyPayment = async (m: Milestone) => {
        if (!window.confirm(`Verify and settle payment of ₹${m.amountDisplay.toLocaleString()} for ${m.title}?`)) return;
        
        try {
            await updateRecord('milestones', m.id, {
                status_display: 'Paid',
                paid_date_display: new Date().toISOString(),
            });
            
            await createRecord('messages', {
                chat_id: m.projectId,
                body: `FINANCIAL NOC: Payment for "${m.title}" has been verified and cleared by Accounts. Procurement for the next phase is now authorized.`,
                sender_id: '786786', // System ID
                is_system_message: true
            });
            
            await refetchData();
        } catch (e) {
            alert("Verification synchronization failed.");
        }
    };

    const handleAuditExpense = async (id: string, status: 'Approved' | 'Rejected') => {
        await updateRecord('expenses', id, { status });
        await refetchData();
    };

    if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-[6px]">Initializing Financial Nerve Center...</div>;

    const activeProjects = projects.filter(p => p.status === 'Active');
    const auditQueue = expenses.filter(e => e.status === 'Pending');
    const poQueue = products.filter(p => p.status === 'Pending');

    return (
        <div className="space-y-10 pb-16">
            {/* Header: Financial Command */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase">Accounts HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-2">Centralized Project Audit & Ledger Terminal</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" className="!rounded-full !px-8 !py-4 shadow-soft">
                        <FileTextIcon className="w-5 h-5 mr-2 text-brand-gold" /> Tax Vault (GST)
                    </Button>
                    <Button variant="gold" className="!rounded-full !px-8 !py-4">
                        <ZapIcon className="w-5 h-5 mr-2" /> Financial Reports
                    </Button>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <FinancialStat title="Total Receivables (AR)" value={`₹${(finStats.totalAR / 100000).toFixed(1)}L`} subValue="Pending Milestone Payouts" icon={<CreditCardIcon className="w-7 h-7" />} color="#EF4444" />
                <FinancialStat title="Revenue Realized" value={`₹${(finStats.totalPaid / 100000).toFixed(1)}L`} subValue="Cleared Project Capital" icon={<DollarSignIcon className="w-7 h-7" />} color="#10B981" />
                <FinancialStat title="Accounts Payable (AP)" value={`₹${(finStats.pendingPayables / 1000).toFixed(0)}k`} subValue="Vendor & Site Audit Queue" icon={<TrendingUpIcon className="w-7 h-7" />} color="#F59E0B" />
                <FinancialStat title="Avg. Project GP %" value={`${finStats.avgMargin.toFixed(1)}%`} subValue="Portfolio Gross Profit" icon={<PieChartIcon className="w-7 h-7" />} color="#2563EB" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-[24px] w-fit gap-2">
                <button onClick={() => setActiveSection('sentinel')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeSection === 'sentinel' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>10/40/45/5 Sentinel</button>
                <button onClick={() => setActiveSection('audit')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeSection === 'audit' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>Vendor & Site Audit <span className="ml-2 bg-brand-gold text-slate-900 px-1.5 py-0.5 rounded-full text-[9px]">{auditQueue.length + poQueue.length}</span></button>
                <button onClick={() => setActiveSection('gp')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeSection === 'gp' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>Gross Margin Tracker</button>
                <button onClick={() => setActiveSection('aging')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeSection === 'aging' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>Aging (AR) Report</button>
            </div>

            {/* Main Interface */}
            <div className="animate-in">
                {activeSection === 'sentinel' && (
                    <Card className="luxury-glass p-0 overflow-hidden rounded-[40px] border-slate-100 shadow-premium">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Active Project Board</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">10% Token</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">40% Material</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">45% Install</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">5% NOC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {activeProjects.map(project => {
                                        const pMilestones = milestones.filter(m => m.projectId === project.id);
                                        const steps = [
                                            pMilestones.find(m => m.title.includes('10%')),
                                            pMilestones.find(m => m.title.includes('40%')),
                                            pMilestones.find(m => m.title.includes('45%')),
                                            pMilestones.find(m => m.title.includes('5%'))
                                        ];

                                        return (
                                            <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900 uppercase tracking-wide">{project.title}</p>
                                                    <UserNameDisplay user={findUserById(project.customerId)} showAvatar={true} textClassName="text-[10px] font-bold text-slate-400 uppercase mt-1" imageSize="w-5 h-5" />
                                                </td>
                                                {steps.map((m, i) => (
                                                    <td key={i} className="px-8 py-6 text-center">
                                                        {m ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <button 
                                                                    onClick={() => m.statusDisplay === 'Completed' ? handleVerifyPayment(m) : null}
                                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                                        m.statusDisplay === 'Paid' ? 'bg-accent-success text-white shadow-lg' :
                                                                        m.statusDisplay === 'Completed' ? 'bg-brand-gold text-slate-900 animate-pulse-fast cursor-pointer hover:scale-110' :
                                                                        'bg-slate-100 text-slate-300'
                                                                    }`}
                                                                >
                                                                    {m.statusDisplay === 'Paid' ? <CheckCircleIcon className="w-6 h-6" /> : <DollarSignIcon className="w-5 h-5" />}
                                                                </button>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">₹{(m.amountDisplay/1000).toFixed(0)}k</span>
                                                            </div>
                                                        ) : <span className="text-[10px] text-slate-200">--</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeSection === 'audit' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        <Card className="luxury-glass !p-10 rounded-[40px]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Purchase Order (PO) Audit</h3>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{poQueue.length} Pending</span>
                            </div>
                            <div className="space-y-4">
                                {poQueue.map(p => (
                                    <div key={p.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:shadow-premium transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-all"><PackageIcon className="w-6 h-6" /></div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor: {p.supplier}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="font-display font-black text-slate-900 tabular-nums">₹{p.cost.toLocaleString()}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => alert("PO Approval Sync Logic")} className="w-10 h-10 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"><CheckCircleIcon className="w-5 h-5"/></button>
                                                <button onClick={() => alert("PO Rejection Logic")} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><XMarkIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="luxury-glass !p-10 rounded-[40px]">
                             <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Site Expense Auditor</h3>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{auditQueue.length} Vouchers</span>
                            </div>
                            <div className="space-y-4">
                                {auditQueue.map(e => (
                                    <div key={e.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:shadow-premium transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><FileTextIcon className="w-6 h-6" /></div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm truncate max-w-[140px]">{e.description}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="font-display font-black text-slate-900 tabular-nums">₹{e.amount.toLocaleString()}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAuditExpense(e.id, 'Approved')} className="w-10 h-10 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"><CheckCircleIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleAuditExpense(e.id, 'Rejected')} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><XMarkIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {activeSection === 'gp' && (
                    <Card className="luxury-glass p-0 overflow-hidden rounded-[40px] border-slate-100 shadow-premium">
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Project Performance</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Contract Value</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Billed Revenue</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Actual Expenses</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">GP Margin %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {projects.map(p => {
                                        const billed = milestones.filter(m => m.projectId === p.id && m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
                                        const pExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
                                        const gp = billed - pExpenses;
                                        const margin = billed > 0 ? (gp / billed) * 100 : 0;
                                        
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tight text-sm">{p.title}</td>
                                                <td className="px-8 py-6 font-display font-black text-slate-500 text-xs">₹{(p.budgetDisplay/100000).toFixed(2)}L</td>
                                                <td className="px-8 py-6 font-display font-black text-accent-success text-sm">₹{(billed/1000).toFixed(0)}k</td>
                                                <td className="px-8 py-6 font-display font-black text-accent-danger text-sm">₹{(pExpenses/1000).toFixed(0)}k</td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`px-4 py-2 rounded-2xl font-display font-black text-sm ${margin > 25 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeSection === 'aging' && (
                    <div className="space-y-8">
                         <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[40px] flex items-center gap-8">
                            <div className="w-16 h-16 bg-red-500 rounded-[24px] flex items-center justify-center text-white shadow-lg animate-pulse"><AlertTriangleIcon className="w-8 h-8" /></div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Critical AR Aging Warning</h3>
                                <p className="text-sm font-bold text-red-600 uppercase tracking-widest mt-1">Total ₹{(finStats.totalAR/1000).toFixed(0)}k is locked in overdue milestones.</p>
                            </div>
                         </div>
                         <div className="grid gap-6">
                            {milestones.filter(m => m.statusDisplay === 'Completed').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(m => {
                                const proj = projects.find(p => p.id === m.projectId);
                                const diff = new Date().getTime() - new Date(m.dueDate).getTime();
                                const days = Math.floor(diff / (1000 * 3600 * 24));
                                return (
                                    <div key={m.id} className="p-8 bg-white border border-slate-100 rounded-[40px] flex flex-col md:flex-row justify-between items-center group hover:shadow-premium transition-all">
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all font-display font-black">{days}d</div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase tracking-wide text-xl">{m.title}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{proj?.title} &bull; Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12 mt-6 md:mt-0">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">UNSETTLED</p>
                                                <p className="text-4xl font-display font-black text-slate-900 tracking-tighter">₹{m.amountDisplay.toLocaleString()}</p>
                                            </div>
                                            <Button onClick={() => handleVerifyPayment(m)} className="!rounded-full !px-10 !py-5 !bg-slate-900 !text-[11px] font-black uppercase tracking-widest">Verify Settlement</Button>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsDashboard;
