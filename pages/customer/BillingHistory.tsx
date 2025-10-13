import React from 'react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { MOCK_MILESTONES, MOCK_PROJECTS } from '../../services/mockData';
import { Milestone } from '../../types';
import Button from '../../components/ui/Button';
import { DownloadIcon } from '../../components/icons';

const BillingHistory: React.FC = () => {
    const { user } = useAuth();
    if (!user) return null;

    const myProjectIds = MOCK_PROJECTS.filter(p => p.customerId === user.id).map(p => p.id);
    const myMilestones = MOCK_MILESTONES
        .filter(m => myProjectIds.includes(m.projectId))
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Billing History</h1>
            <Card>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {myMilestones.map((milestone: Milestone) => {
                         const project = MOCK_PROJECTS.find(p => p.id === milestone.projectId);
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
                                <Button variant="secondary" className="w-full mt-3 py-1.5 text-xs flex items-center justify-center gap-2">
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
                                const project = MOCK_PROJECTS.find(p => p.id === milestone.projectId);
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
                                            <Button variant="secondary" className="!p-2">
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
