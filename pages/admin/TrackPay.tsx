import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { CreditCardIcon, SearchIcon, BriefcaseIcon, DollarSignIcon, UserIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const TrackPay: React.FC = () => {
    const { projects, milestones, loading } = useData();
    const { findUserById } = useUsers();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.status === 'Active')
            .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [projects, searchTerm]);

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-[4px]">Syncing Ledger...</div>;

    return (
        <div className="space-y-10 animate-in">
            <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Track Pay</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-2">Executive Financial Command Center</p>
                </div>
                <div className="relative w-full lg:w-96 group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-gold transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search project titles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all shadow-soft"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map(project => {
                    const customer = findUserById(project.customerId);
                    const pMilestones = milestones.filter(m => m.projectId === project.id);
                    const totalPaid = pMilestones.filter(m => m.statusDisplay === 'Paid').reduce((s, m) => s + m.amountDisplay, 0);
                    const percentPaid = project.budgetDisplay > 0 ? (totalPaid / project.budgetDisplay) * 100 : 0;
                    
                    return (
                        <Card 
                            key={project.id} 
                            onClick={() => navigate(`/admin/track-pay/${project.id}`)}
                            className="group relative overflow-hidden h-full border-slate-100 hover:border-brand-gold/30 hover:shadow-premium transition-all duration-500 cursor-pointer p-8"
                        >
                            {project.isPaymentAlertActive && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-lg">Lock Active</div>
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-brand-gold/10 transition-colors">
                                    <BriefcaseIcon className="w-8 h-8 text-brand-gold" />
                                </div>
                                <h3 className="text-2xl font-display font-black text-slate-900 group-hover:text-brand-gold transition-colors uppercase leading-none tracking-tight">{project.title}</h3>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Client</span>
                                    <UserNameDisplay user={customer} textClassName="font-black text-slate-900" />
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net Value</span>
                                    <span className="font-display font-black text-slate-900">₹{(project.budgetDisplay/100000).toFixed(2)}L</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    <span>Revenue Realized</span>
                                    <span className="text-brand-gold">{Math.round(percentPaid)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 px-0.5 py-0.5 flex items-center overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-brand-gold to-brand-gold-light h-1 rounded-full transition-all duration-1000 shadow-gold-glow" 
                                        style={{ width: `${percentPaid}%` }}
                                    ></div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default TrackPay;