import React from 'react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Milestone } from '../../types';
import Button from '../../components/ui/Button';
import { DownloadIcon } from '../../components/icons';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';

const BillingHistory: React.FC = () => {
    const { user } = useAuth();
    const { milestones, projects, loading } = useData();
    const { findUserById } = useUsers();

    if (!user || loading) return null;

    const myProjectIds = projects.filter(p => p.customerId === user.id).map(p => p.id);
    const myMilestones = milestones
        .filter(m => myProjectIds.includes(m.projectId))
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    const generateInvoiceHTML = (milestone: Milestone) => {
        const project = projects.find(p => p.id === milestone.projectId);
        const designer = findUserById(project?.designerId || '');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${milestone.id.slice(0, 8)}</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-100 font-sans p-8">
                <div class="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-lg">
                    <div class="flex justify-between items-center border-b pb-6 mb-8">
                        <div>
                            <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ Logo" class="h-12"/>
                        </div>
                        <div class="text-right">
                            <h1 class="text-3xl font-bold text-gray-800">INVOICE</h1>
                            <p class="text-gray-500">#${milestone.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h2>
                            <p class="font-bold text-gray-800">${user.fullName}</p>
                            <p class="text-gray-600">${user.email}</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice Details</h2>
                            <p><strong class="text-gray-600">Date Issued:</strong> ${new Date().toLocaleDateString()}</p>
                            <p><strong class="text-gray-600">Date Due:</strong> ${new Date(milestone.dueDate).toLocaleDateString()}</p>
                            <p><strong class="text-gray-600">Status:</strong> <span class="font-semibold ${milestone.statusDisplay === 'Paid' ? 'text-green-500' : 'text-yellow-500'}">${milestone.statusDisplay}</span></p>
                        </div>
                    </div>
                    <div>
                        <table class="w-full text-left">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="p-4 text-sm font-semibold text-gray-600 uppercase">Description</th>
                                    <th class="p-4 text-sm font-semibold text-gray-600 uppercase text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b">
                                    <td class="p-4">
                                        <p class="font-medium text-gray-800">Project: ${project?.title}</p>
                                        <p class="text-sm text-gray-500">Milestone: ${milestone.title}</p>
                                    </td>
                                    <td class="p-4 text-right font-medium text-gray-800">₹${milestone.amountDisplay.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="flex justify-end mt-8">
                        <div class="w-full max-w-xs text-right">
                            <div class="flex justify-between py-2">
                                <span class="text-gray-600">Subtotal</span>
                                <span class="font-medium text-gray-800">₹${milestone.amountDisplay.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between py-2 border-t font-bold text-xl text-gray-800">
                                <span>Total Due</span>
                                <span>₹${milestone.amountDisplay.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrintInvoice = (milestone: Milestone) => {
        const invoiceHtml = generateInvoiceHTML(milestone);
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(invoiceHtml);
        printWindow?.document.close();
        setTimeout(() => printWindow?.print(), 500);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-display text-text-headline">Billing History</h1>
            <Card>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {myMilestones.map((milestone: Milestone) => {
                         const project = projects.find(p => p.id === milestone.projectId);
                         return (
                            <div key={milestone.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-text-headline">{milestone.title}</p>
                                        <p className="text-xs text-text-muted">{project?.title}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        milestone.statusDisplay === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                        milestone.statusDisplay === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {milestone.statusDisplay}
                                    </span>
                                </div>
                                <div className="border-t border-border-color mt-2 pt-2 space-y-1">
                                    <p className="text-text-muted"><strong className="text-text-headline/80">Amount:</strong> ₹{milestone.amountDisplay.toLocaleString()}</p>
                                    <p className="text-text-muted"><strong className="text-text-headline/80">Due Date:</strong> {new Date(milestone.dueDate).toLocaleDateString()}</p>
                                    {milestone.paidDateDisplay && <p className="text-text-muted"><strong className="text-text-headline/80">Paid On:</strong> {new Date(milestone.paidDateDisplay).toLocaleDateString()}</p>}
                                </div>
                                <Button variant="secondary" onClick={() => handlePrintInvoice(milestone)} className="w-full mt-3 py-1.5 text-xs flex items-center justify-center gap-2">
                                    <DownloadIcon className="w-4 h-4"/> Download Invoice
                                </Button>
                            </div>
                         )
                    })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                            <tr>
                                <th scope="col" className="px-6 py-3">Milestone</th>
                                <th scope="col" className="px-6 py-3">Project</th>
                                <th scope="col" className="px-6 py-3">Due Date</th>
                                <th scope="col" className="px-6 py-3">Amount</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Invoice</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myMilestones.map((milestone: Milestone) => {
                                const project = projects.find(p => p.id === milestone.projectId);
                                return (
                                    <tr key={milestone.id} className="border-b border-border-color">
                                        <td className="px-6 py-4 font-medium text-text-headline">{milestone.title}</td>
                                        <td className="px-6 py-4 text-text-muted">{project?.title}</td>
                                        <td className="px-6 py-4">{new Date(milestone.dueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">₹{milestone.amountDisplay.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                milestone.statusDisplay === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                                milestone.statusDisplay === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {milestone.statusDisplay}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button variant="secondary" onClick={() => handlePrintInvoice(milestone)} className="!p-2">
                                                <DownloadIcon className="w-4 h-4" />
                                            </Button>
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

export default BillingHistory;