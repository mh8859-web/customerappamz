
import React from 'react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Milestone } from '../../types';
import Button from '../../components/ui/Button';
import { DownloadIcon, FileTextIcon, InfoIcon } from '../../components/icons';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';

const BillingHistory: React.FC = () => {
    const { user } = useAuth();
    const { milestones, projects, loading } = useData();
    const { findUserById } = useUsers();

    if (!user || loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synchronizing Ledger...</div>;

    const myProjects = projects.filter(p => p.customerId === user.id);
    const myProjectIds = myProjects.map(p => p.id);
    
    // Milestones from DB
    const myMilestones = milestones
        .filter(m => myProjectIds.includes(m.projectId))
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    const handlePrintInvoice = (milestone: Milestone) => {
        const project = projects.find(p => p.id === milestone.projectId);
        const invoiceHtml = `
            <html>
            <head><title>Invoice ${milestone.id}</title><script src="https://cdn.tailwindcss.com"></script></head>
            <body class="bg-gray-100 p-12">
                <div class="max-w-4xl mx-auto bg-white p-16 shadow-2xl rounded-lg">
                    <div class="flex justify-between border-b pb-8 mb-8">
                        <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" class="h-12"/>
                        <div class="text-right"><h1 class="text-3xl font-black">INVOICE</h1><p>#${milestone.id.slice(0,8)}</p></div>
                    </div>
                    <div class="grid grid-cols-2 gap-12 mb-12">
                        <div><p class="text-xs font-bold text-gray-400 uppercase mb-2">Billed To</p><p class="font-bold">${user.fullName}</p></div>
                        <div class="text-right"><p class="text-xs font-bold text-gray-400 uppercase mb-2">Details</p><p>Project: ${project?.title}</p><p>Due: ${new Date(milestone.dueDate).toLocaleDateString()}</p></div>
                    </div>
                    <table class="w-full mb-12 text-left">
                        <thead class="bg-gray-50 border-b"><tr><th class="p-4 uppercase text-xs">Description</th><th class="p-4 uppercase text-xs text-right">Amount</th></tr></thead>
                        <tbody><tr class="border-b"><td class="p-4 font-bold">${milestone.title}</td><td class="p-4 text-right font-mono">₹${milestone.amountDisplay.toLocaleString()}</td></tr></tbody>
                    </table>
                    <div class="text-right"><p class="text-xs text-gray-400 uppercase mb-1">Grand Total</p><p class="text-4xl font-black">₹${milestone.amountDisplay.toLocaleString()}</p></div>
                </div>
            </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win?.document.write(invoiceHtml);
        win?.document.close();
        setTimeout(() => win?.print(), 500);
    };

    return (
        <div className="space-y-10 pb-12">
            <div>
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Billing Terminal</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-1.5">Official Financial Records & Ledger</p>
            </div>

            <Card className="luxury-glass border-slate-100 rounded-[40px] p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Milestone / Service</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Commission</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Schedule</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">Valuation</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">Assets</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myMilestones.map((milestone: Milestone) => {
                                const project = projects.find(p => p.id === milestone.projectId);
                                return (
                                    <tr key={milestone.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-wide">{milestone.title}</td>
                                        <td className="px-8 py-6 text-slate-400 font-bold uppercase tracking-widest text-[11px]">{project?.title}</td>
                                        <td className="px-8 py-6 text-slate-500 font-medium">{new Date(milestone.dueDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-6 text-right font-display font-black text-slate-900 text-base">₹{milestone.amountDisplay.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] border ${
                                                milestone.statusDisplay === 'Paid' ? 'bg-accent-success/5 text-accent-success border-accent-success/20' :
                                                milestone.statusDisplay === 'Completed' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20' :
                                                'bg-slate-50 text-slate-400 border-slate-200'
                                            }`}>
                                                {milestone.statusDisplay}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="secondary" onClick={() => handlePrintInvoice(milestone)} className="!p-2.5 !rounded-xl ml-auto border-slate-200 hover:border-brand-gold transition-all">
                                                <DownloadIcon className="w-5 h-5 text-brand-gold" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {myMilestones.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <InfoIcon className="w-12 h-12 text-slate-200" />
                                            <p className="text-slate-400 font-bold uppercase tracking-[4px] text-sm">No official milestones generated in ledger.</p>
                                            <p className="text-xs text-slate-300 max-w-sm">Please contact your relationship manager to finalize your 10/40/45/5 payment plan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default BillingHistory;
