import React from 'react';
import Card from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useData } from '../../context/DataContext';

const FinancialReports: React.FC = () => {
    const { projects, milestones, expenses, loading } = useData();
    
    const monthlyData: Record<string, { revenue: number, expenses: number }> = {};

    milestones.filter(m => m.statusDisplay === 'Paid' && m.paidDateDisplay).forEach(m => {
        const month = new Date(m.paidDateDisplay!).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].revenue += m.amountDisplay;
    });

    expenses.forEach(e => {
        const month = new Date(e.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].expenses += e.amount;
    });

    const chartData = Object.keys(monthlyData).map(month => ({
        name: month,
        Revenue: monthlyData[month].revenue,
        Expenses: monthlyData[month].expenses,
    })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    
    const totalRevenue = chartData.reduce((sum, d) => sum + d.Revenue, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.Expenses, 0);
    const netProfit = totalRevenue - totalExpenses;

    if (loading) {
        return <div>Loading financial reports...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-display text-text-primary">Financial Reports</h1>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <p className="text-text-muted">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-400">₹{totalRevenue.toLocaleString()}</p>
                </Card>
                 <Card>
                    <p className="text-text-muted">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-400">₹{totalExpenses.toLocaleString()}</p>
                </Card>
                 <Card>
                    <p className="text-text-muted">Net Profit</p>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-brand-blue' : 'text-red-400'}`}>₹{netProfit.toLocaleString()}</p>
                </Card>
            </div>
            
            <Card>
                <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Revenue vs. Expenses</h2>
                 <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#536471" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#536471" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value)/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #CFD9DE', borderRadius: '12px' }} cursor={{fill: 'rgba(29, 155, 240, 0.1)'}} />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                            <Bar dataKey="Revenue" fill="#1D9BF0" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expenses" fill="#F87171" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default FinancialReports;