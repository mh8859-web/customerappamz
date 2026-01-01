
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { PackageIcon, DollarSignIcon, BuildingOffice2Icon, ZapIcon, TrendingUpIcon, PieChartIcon } from '../../components/icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="!p-8 luxury-glass border-slate-100 flex items-start gap-6 shadow-premium group hover:border-brand-gold/20 transition-all">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-lg`} style={{ backgroundColor: `${color}15`, color }}>
           {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-1.5">{title}</p>
            <p className="text-4xl font-display font-black text-slate-900 tabular-nums leading-none tracking-tighter">{value}</p>
        </div>
    </Card>
);

const ProductionHeadDashboard: React.FC = () => {
    const { projects, products, loading: dataLoading } = useData();

    const totalSourcedValue = useMemo(() => products.reduce((sum, p) => sum + (p.cost * p.quantity), 0), [products]);
    const uniqueSuppliers = useMemo(() => new Set(products.map(p => p.supplier)).size, [products]);

    if (dataLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Syncing Logistics Ledger...</div>;

    return (
        <div className="space-y-10 pb-20 animate-reveal">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">Logistics Master</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-3 flex items-center gap-2">
                        <PackageIcon className="w-4 h-4 text-brand-gold" />
                        Master Sourcing & Factory Terminal
                    </p>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard title="Procurement Value" value={`₹${(totalSourcedValue / 100000).toFixed(1)}L`} color="#10B981" icon={<DollarSignIcon className="w-7 h-7" />} />
                <StatCard title="Active Sourcing" value={products.filter(p => p.status === 'Pending').length} color="#2563EB" icon={<PackageIcon className="w-7 h-7" />} />
                <StatCard title="Verified Vendors" value={uniqueSuppliers} color="#F59E0B" icon={<BuildingOffice2Icon className="w-7 h-7" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sourcing Master List */}
                <Card className="lg:col-span-8 luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium">
                    <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <TrendingUpIcon className="w-5 h-5 text-brand-blue" />
                            Inventory Procurement Feed
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[3px]">Product Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[3px]">Supplier</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[3px] text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[3px] text-right">Net Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map(product => {
                                    const project = projects.find(p => p.id === product.projectId);
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{product.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Project: {project?.title}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{product.supplier}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                    product.status === 'Delivered' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' :
                                                    product.status === 'Ordered' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20' :
                                                    'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>{product.status}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right font-display font-black text-slate-900 text-base">
                                                ₹{(product.cost * product.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {products.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[5px] text-xs">No logistics records found.</div>}
                    </div>
                </Card>

                {/* Project Allocation Analytics */}
                <Card className="lg:col-span-4 luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium bg-slate-900">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[5px] mb-8">Factory Bandwidth</h3>
                    <div className="space-y-6">
                        {projects.filter(p => p.status === 'Active').slice(0, 4).map(p => {
                            const pValue = products.filter(prod => prod.projectId === p.id).reduce((s, prod) => s + (prod.cost * prod.quantity), 0);
                            return (
                                <div key={p.id} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[11px] font-black text-white uppercase tracking-tight truncate pr-4">{p.title}</p>
                                        <p className="text-[11px] font-display font-black text-brand-gold">₹{(pValue/1000).toFixed(0)}k</p>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-brand-gold h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (pValue/p.budgetDisplay)*100)}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProductionHeadDashboard;
