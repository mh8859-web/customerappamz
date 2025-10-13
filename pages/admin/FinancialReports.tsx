import React from 'react';
import Card from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { MOCK_PROJECTS, MOCK_MILESTONES, MOCK_EXPENSES } from '../../services/mockData';

const FinancialReports: React.FC = () => {
    
    const monthlyData: Record<string, { revenue: number, expenses: number }> = {};

    MOCK_MILESTONES.filter(m => m.statusDisplay === 'Paid').forEach(m => {
        const month = new Date(m.paidDateDisplay!).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].revenue += m.amountDisplay;
    });

    MOCK_EXPENSES.forEach(e => {
        const month = new Date(e.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].expenses += e.amount;
    });

    const chartData = Object.keys(monthlyData).map(month => ({
        name: month,
        Revenue: monthlyData[month].revenue,
        Expenses: monthlyData[month].expenses,
    })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    
    const projectProfitabilityData = MOCK_PROJECTS.map(p => {
        const revenue = MOCK_MILESTONES.filter(m => m.projectId === p.id && m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);
        const expenses = MOCK_EXPENSES.filter(e => e.projectId === p.id).reduce((sum, e) => sum + e.amount, 0);
        return {
            name: p.title,
            profit: Math.max(0, revenue - expenses), // Don't show negative profit in pie chart
        }
    }).filter(p => p.profit > 0);
    
    const COLORS = ['#4FD1C5', '#81E6D9', '#2C7A7B', '#319795', '#4A5568'];
    const totalRevenue = chartData.reduce((sum, d) => sum + d.Revenue, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.Expenses, 0);
    const netProfit = totalRevenue - totalExpenses;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-text-headline">Financial Reports</h1>

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
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-accent' : 'text-red-400'}`}>₹{netProfit.toLocaleString()}</p>
                </Card>
            </div>
            
            <Card>
                <h2 className="text-xl font-semibold text-text-headline mb-4">Revenue vs. Expenses</h2>
                 <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value)/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568', borderRadius: '12px' }} cursor={{fill: 'rgba(79, 209, 197, 0.1)'}} />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                            <Bar dataKey="Revenue" fill="#4FD1C5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expenses" fill="#F56565" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

             <Card>
                <h2 className="text-xl font-semibold text-text-headline mb-4">Profitability by Project</h2>
                 <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={projectProfitabilityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="profit"
                                nameKey="name"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {projectProfitabilityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568', borderRadius: '12px' }} formatter={(value) => `₹${Number(value).toLocaleString()}`}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
};

export default FinancialReports;
