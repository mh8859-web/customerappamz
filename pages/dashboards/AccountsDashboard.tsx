import React, { useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { updateRecord } from '../../services/api';
import { DollarSignIcon, CreditCardIcon, PieChartIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="flex items-center p-5">
        <div className={`p-3 rounded-xl`} style={{ backgroundColor: `${color}20`, color }}>
           {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold font-display text-text-primary">{value}</p>
        </div>
    </Card>
);

const AccountsDashboard: React.FC = () => {
    const { projects, milestones, expenses, refetchData, loading } = useData();
    const { findUserById, loading: usersLoading } = useUsers();
    
    const isLoading = loading || usersLoading;

    const financialData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        
        const outstandingPayments = milestones
            .filter(m => m.statusDisplay === 'Completed')
            .reduce((sum, m) => sum + m.amountDisplay, 0);

        const ytdRevenue = milestones
            .filter(m => m.statusDisplay === 'Paid' && m.paidDateDisplay && new Date(m.paidDateDisplay).getFullYear() === currentYear)
            .reduce((sum, m) => sum + m.amountDisplay, 0);
        
        const ytdExpenses = expenses
            .filter(e => new Date(e.date).getFullYear() === currentYear)
            .reduce((sum, e) => sum + e.amount, 0);
            
        const ytdProfit = ytdRevenue - ytdExpenses;

        const pendingMilestones = milestones
            .filter(m => m.statusDisplay === 'Completed')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            
        return { outstandingPayments, ytdRevenue, ytdExpenses, ytdProfit, pendingMilestones };
    }, [milestones, expenses]);

    const handleMarkAsPaid = async (milestoneId: string) => {
        if (window.confirm('Are you sure you want to mark this milestone as paid?')) {
            await updateRecord('milestones', milestoneId, {
                status_display: 'Paid',
                paid_date_display: new Date().toISOString(),
            });
            await refetchData();
        }
    };
    
    if (isLoading) {
        return <div>Loading financial data...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-display text-text-primary">Accounts Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Outstanding Payments" value={`₹${financialData.outstandingPayments.toLocaleString()}`} color="#F97316" icon={<CreditCardIcon className="w-6 h-6" />} />
                <StatCard title="Revenue (YTD)" value={`₹${financialData.ytdRevenue.toLocaleString()}`} color="#00BA7C" icon={<DollarSignIcon className="w-6 h-6" />} />
                <StatCard title="Profit (YTD)" value={`₹${financialData.ytdProfit.toLocaleString()}`} color="#1D9BF0" icon={<PieChartIcon className="w-6 h-6" />} />
            </div>

            <Card>
                <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Pending Payments</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase">
                            <tr>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Milestone</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Due Date</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financialData.pendingMilestones.map(milestone => {
                                const project = projects.find(p => p.id === milestone.projectId);
                                const customer = findUserById(project?.customerId || '');
                                return (
                                    <tr key={milestone.id} className="border-t border-border-color">
                                        <td className="px-4 py-3 font-medium text-text-primary">{project?.title}</td>
                                        <td className="px-4 py-3">{milestone.title}</td>
                                        <td className="px-4 py-3"><UserNameDisplay user={customer} /></td>
                                        <td className="px-4 py-3 font-mono">₹{milestone.amountDisplay.toLocaleString()}</td>
                                        <td className="px-4 py-3">{new Date(milestone.dueDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button onClick={() => handleMarkAsPaid(milestone.id)} className="!py-1.5 !px-3 !text-xs">
                                                Mark as Paid
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {financialData.pendingMilestones.length === 0 && (
                        <div className="text-center py-8 text-text-secondary">All payments are up to date!</div>
                    )}
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Project Financial Summary</h2>
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase">
                            <tr>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Budget</th>
                                <th className="px-4 py-3">Billed</th>
                                <th className="px-4 py-3">Expenses</th>
                                <th className="px-4 py-3">Net Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => {
                                const billed = milestones.filter(m => m.projectId === project.id && m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
                                const projectExpenses = expenses.filter(e => e.projectId === project.id).reduce((s, e) => s + e.amount, 0);
                                const profit = billed - projectExpenses;
                                return (
                                    <tr key={project.id} className="border-t border-border-color">
                                        <td className="px-4 py-3 font-medium text-text-primary">{project.title}</td>
                                        <td className="px-4 py-3 font-mono">₹{project.budgetDisplay.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-green-500">₹{billed.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-red-500">₹{projectExpenses.toLocaleString()}</td>
                                        <td className={`px-4 py-3 font-mono font-semibold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            ₹{profit.toLocaleString()}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AccountsDashboard;