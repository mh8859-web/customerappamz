
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { updateRecord, createRecord } from '../../services/api';
import { DollarSignIcon, CreditCardIcon, PieChartIcon, ClockIcon, ZapIcon, CheckCircleIcon, AlertTriangleIcon, TrendingUpIcon, FileTextIcon, UserGroupIcon, PackageIcon, XMarkIcon, MegaphoneIcon, ChevronDownIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { Project, Milestone, Expense, Product, AttendanceLog, User } from '../../types';

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
    const location = useLocation();
    const { projects, milestones, expenses, products, attendanceLogs, refetchData, loading } = useData();
    const { users, findUserById, loading: usersLoading } = useUsers();
    const [activeSection, setActiveSection] = useState<'sentinel' | 'audit' | 'payroll' | 'gp'>('sentinel');
    const [pushingAlertId, setPushingAlertId] = useState<string | null>(null);

    // Sync active tab with URL query parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'sentinel' || tab === 'audit' || tab === 'payroll' || tab === 'gp') {
            setActiveSection(tab);
        }
    }, [location]);
    
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

    const designersPayroll = useMemo(() => {
        const designers = users.filter(u => u.role === 'Designer');
        return designers.map(d => {
            const logs = attendanceLogs.filter(l => l.designerId === d.id);
            const daysWorked = new Set(logs.map(l => new Date(l.clockIn).toDateString())).size;
            return { ...d, daysWorked };
        });
    }, [users, attendanceLogs]);

    const handlePushPaymentAlert = async (projectId: string, milestoneTitle: string) => {
        if (!window.confirm(`Trigger high-priority payment alert for this project? This will display a persistent warning on the client's app.`)) return;
        
        setPushingAlertId(projectId);
        try {
            await updateRecord('projects', projectId, { is_payment_alert_active: true });
            await createRecord('messages', {
                chat_id: projectId,
                body: `URGENT NOTICE: Milestone "${milestoneTitle}" is pending settlement. Please clear dues to prevent project delays. Technical access limited.`,
                sender_id: '786786',
                is_system_message: true
            });
            await refetchData();
            alert("Payment nudge pushed successfully.");
        } finally {
            setPushingAlertId(null);
        }
    };

    const handleVerifyPayment = async (m: Milestone) => {
        if (!window.confirm(`Verify payment receipt of ₹${m.amountDisplay.toLocaleString()}?`)) return;
        
        await updateRecord('milestones', m.id, {
            status_display: 'Paid',
            paid_date_display: new Date().toISOString(),
        });
        
        await updateRecord('projects', m.projectId, { is_payment_alert_active: false });
        await refetchData();
    };

    const handleAuditExpense = async (id: string, status: 'Approved' | 'Rejected') => {
        await updateRecord('expenses', id, { status });
        await refetchData();
    };

    const handleProcessSalary = (designer: User, days: number) => {
        const amount = days * 1000; // Standard base calculation
        if (window.confirm(`Process salary payout of ₹${amount.toLocaleString()} for ${designer.fullName}? (${days} working days log identified)`)) {
            alert(`Salary disbursed for ${designer.fullName}. Digital receipt generated.`);
        }
    };

    if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-[6px]">Initializing Financial Nerve Center...</div>;

    const activeProjects = projects.filter(p => p.status === 'Active');
    const auditQueue = expenses.filter(e => e.status === 'Pending');
    const poQueue = products.filter(p => p.status === 'Pending');

    return (
        <div className="space-y-10 pb-16">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase">Accounts HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-2">Centralized Audit & Payroll Terminal</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" className="!rounded-full !px-8 !py-4 shadow-soft">
                        <FileTextIcon className="w-5 h-5 mr-2 text-brand-gold" /> Tax Vault (GST)
                    </Button>
                    <Button variant="gold" className="!rounded-full !px-8 !py-4 shadow-gold-glow">
                        <ZapIcon className="w-5 h-5 mr-2" /> Annual Reports
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <FinancialStat title="Total Receivables" value={`₹${(finStats.totalAR / 100000).toFixed(1)}L`} subValue="Pending Collection" icon={<CreditCardIcon className="w-7 h-7" />} color="#EF4444" />
                <FinancialStat title="Revenue Realized" value={`₹${(finStats.totalPaid / 100000).toFixed(1)}L`} subValue="Cleared Capital" icon={<DollarSignIcon className="w-7 h-7" />} color="#10B981" />
                <FinancialStat title="Vendor Payables" value={`₹${(finStats.pendingPayables / 1000).toFixed(0)}k`} subValue="Audit Queue" icon={<TrendingUpIcon className="w-7 h-7" />} color="#F59E0B" />
                <FinancialStat title="Avg. Project GP" value={`${finStats.avgMargin.toFixed(1)}%`} subValue="Margin Efficiency" icon={<PieChartIcon className="w-7 h-7" />} color="#2563EB" />
            </div>

            {/* Sub-Navigation Tabs (Visible on dashboard) */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-[24px] w-fit gap-2 overflow-x-auto max-w-full no-scrollbar">
                <button onClick={() => setActiveSection('sentinel')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSection === 'sentinel' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>10/40/45 Sentinel</button>
                <button onClick={() => setActiveSection('audit')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSection === 'audit' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>Vendor Audit <span className="ml-2 bg-brand-gold text-slate-900 px-1.5 py-0.5 rounded-full text-[9px]">{auditQueue.length}</span></button>
                <button onClick={() => setActiveSection('payroll')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSection === 'payroll' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>Salary & Payroll</button>
                <button onClick={() => setActiveSection('gp')} className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSection === 'gp' ? 'bg-white text-brand-blue shadow-card' : 'text-slate-400 hover:text-slate-600'}`}>Project GP%</button>
            </div>

            {/* Content Area */}
            <div className="animate-in">
                {activeSection === 'sentinel' && (
                    <Card className="luxury-glass p-0 overflow-hidden rounded-[40px] border-slate-100 shadow-premium">
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Active Project Collection</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">10% Token</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">40% Material</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">45% Install</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">Push Nudge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {activeProjects.map(project => {
                                        const pMilestones = milestones.filter(m => m.projectId === project.id);
                                        const steps = [
                                            pMilestones.find(m => m.title.includes('10%')),
                                            pMilestones.find(m => m.title.includes('40%')),
                                            pMilestones.find(m => m.title.includes('45%'))
                                        ];
                                        const nextActionable = steps.find(s => s?.statusDisplay === 'Completed');
                                        
                                        return (
                                            <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900 uppercase tracking-wide">{project.title}</p>
                                                    <UserNameDisplay user={findUserById(project.customerId)} showAvatar={true} textClassName="text-[10px] font-bold text-slate-400 uppercase mt-1" imageSize="w-5 h-5" />
                                                </td>
                                                {steps.map((m, i) => (
                                                    <td key={i} className="px-8 py-6 text-center">
                                                        {m ? (
                                                            <button 
                                                                onClick={() => m.statusDisplay === 'Completed' ? handleVerifyPayment(m) : null}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto ${
                                                                    m.statusDisplay === 'Paid' ? 'bg-accent-success text-white' :
                                                                    m.statusDisplay === 'Completed' ? 'bg-brand-gold text-slate-900 animate-pulse' :
                                                                    'bg-slate-100 text-slate-300'
                                                                }`}
                                                            >
                                                                {m.statusDisplay === 'Paid' ? <CheckCircleIcon className="w-6 h-6" /> : <DollarSignIcon className="w-5 h-5" />}
                                                            </button>
                                                        ) : <span className="text-[10px] text-slate-200">--</span>}
                                                    </td>
                                                ))}
                                                <td className="px-8 py-6 text-right">
                                                    {nextActionable && (
                                                        <button 
                                                            disabled={pushingAlertId === project.id}
                                                            onClick={() => handlePushPaymentAlert(project.id, nextActionable.title)}
                                                            className={`p-3 rounded-xl transition-all ${project.isPaymentAlertActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                            title="Send Urgent Payment Warning to Client"
                                                        >
                                                            <MegaphoneIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeSection === 'payroll' && (
                    <Card className="luxury-glass p-0 overflow-hidden rounded-[40px] border-slate-100 shadow-premium">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Monthly Salary Distribution Hub</h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Cycle</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[3px]">Member Identity</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[3px] text-center">Verified Attendance</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[3px] text-center">Base Remuneration</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[3px] text-right">Payout Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {designersPayroll.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <UserNameDisplay user={d} showAvatar={true} textClassName="font-black text-slate-900 uppercase tracking-wide" imageSize="w-10 h-10" />
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xl font-display font-black text-brand-blue tabular-nums">{d.daysWorked}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Days Logged</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-display font-black text-slate-900 tabular-nums">₹{(d.daysWorked * 1000).toLocaleString()}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto Calculated</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button onClick={() => handleProcessSalary(d, d.daysWorked)} className="!rounded-full !px-8 !py-3 !bg-slate-900 !text-[10px] font-black uppercase tracking-widest shadow-button hover:scale-105 transition-transform">Disburse Payout</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeSection === 'audit' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        <Card className="luxury-glass !p-10 rounded-[40px]">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Payables Audit (Site Vouchers)</h3>
                            <div className="space-y-4">
                                {auditQueue.map(e => (
                                    <div key={e.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center group hover:shadow-premium transition-all">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{e.description}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{e.category} &bull; {new Date(e.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="font-display font-black text-slate-900">₹{e.amount.toLocaleString()}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAuditExpense(e.id, 'Approved')} className="w-10 h-10 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Approve Payment"><CheckCircleIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleAuditExpense(e.id, 'Rejected')} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Void Expense"><XMarkIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {auditQueue.length === 0 && <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No pending site audits.</div>}
                            </div>
                        </Card>
                        <Card className="luxury-glass !p-10 rounded-[40px]">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Inventory Invoices (Vendor PO)</h3>
                            <div className="space-y-4">
                                {poQueue.map(p => (
                                    <div key={p.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center group hover:shadow-premium transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-all"><PackageIcon className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{p.supplier}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="font-display font-black text-slate-900">₹{(p.cost * p.quantity).toLocaleString()}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => alert("PO Approval Sync Logic")} className="w-10 h-10 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Authorize Vendor Payout"><CheckCircleIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {poQueue.length === 0 && <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No pending vendor payouts.</div>}
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
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Project Financial Integrity</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Contract Value</th>
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
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tight text-sm">{p.title}</td>
                                                <td className="px-8 py-6 font-display font-black text-slate-500 text-xs">₹{(p.budgetDisplay/100000).toFixed(2)}L</td>
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
            </div>
        </div>
    );
};

export default AccountsDashboard;
