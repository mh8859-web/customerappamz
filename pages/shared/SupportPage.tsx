

import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { MOCK_SUPPORT_TICKETS, MOCK_USERS, MOCK_PROJECTS } from '../../services/mockData';

const SupportPage: React.FC = () => {
    const { user } = useAuth();

    const AdminView = () => (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">All Support Tickets</h2>
            
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {MOCK_SUPPORT_TICKETS.map(ticket => {
                    const submitter = MOCK_USERS.find(u => u.id === ticket.submittedBy);
                    const project = MOCK_PROJECTS.find(p => p.id === ticket.projectId);
                    return (
                        <div key={ticket.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-text-headline flex-1 pr-2">{ticket.subject}</p>
                                <span className="text-xs font-semibold text-accent">{ticket.status}</span>
                            </div>
                            <p className="text-text-muted"><strong className="text-text-headline/80">Project:</strong> {project?.title}</p>
                            <p className="text-text-muted"><strong className="text-text-headline/80">From:</strong> {submitter?.fullName}</p>
                            <p className="text-xs text-text-muted/70 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                        <tr>
                            <th className="px-6 py-3">Subject</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Submitted By</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_SUPPORT_TICKETS.map(ticket => {
                            const submitter = MOCK_USERS.find(u => u.id === ticket.submittedBy);
                            const project = MOCK_PROJECTS.find(p => p.id === ticket.projectId);
                            return (
                                <tr key={ticket.id} className="border-b border-border-color">
                                    <td className="px-6 py-4 font-medium text-text-headline">{ticket.subject}</td>
                                    <td className="px-6 py-4">{project?.title}</td>
                                    <td className="px-6 py-4">{submitter?.fullName}</td>
                                    <td className="px-6 py-4">{ticket.status}</td>
                                    <td className="px-6 py-4">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    const CustomerView = () => (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Submit a Support Ticket</h2>
            <form className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-text-headline">Subject</label>
                    {/* FIX: Standardized focus ring color for UI consistency */}
                    <input type="text" placeholder="e.g., Question about my invoice" className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-headline">Message</label>
                    {/* FIX: Standardized focus ring color for UI consistency */}
                    <textarea rows={5} placeholder="Please describe your issue in detail..." className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent"></textarea>
                </div>
                <Button type="submit" className="w-full">Submit Ticket</Button>
            </form>
        </Card>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Help & Support</h1>
            {user?.role === 'Admin' ? <AdminView /> : <CustomerView />}
        </div>
    );
};

export default SupportPage;