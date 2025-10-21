import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { createRecord } from '../../services/api';

const SupportPage: React.FC = () => {
    const { user, findUserById, supportTickets, projects, status, refetchAllData } = useAppContext();
    
    // State for the customer form
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    if (status !== 'authenticated' || !user) {
        return <div>Loading support...</div>;
    }

    const myActiveProject = projects.find(p => (p.customerId === user.id || p.designerId === user.id) && p.status === 'Active');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim() || !myActiveProject) {
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        const newTicket = {
            submitted_by: user.id,
            project_id: myActiveProject.id,
            subject,
            message,
            status: 'Open'
        };

        const { error } = await createRecord('support_tickets', newTicket);

        setIsSubmitting(false);
        if (error) {
            setSubmitStatus('error');
        } else {
            setSubmitStatus('success');
            setSubject('');
            setMessage('');
            await refetchAllData(); // Refresh to show the new ticket if the user is an admin
        }
    };


    const AdminView = () => (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">All Support Tickets</h2>
            
            <div className="md:hidden space-y-3">
                {supportTickets.map(ticket => {
                    const submitter = findUserById(ticket.submittedBy);
                    const project = projects.find(p => p.id === ticket.projectId);
                    return (
                        <div key={ticket.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-text-headline flex-1 pr-2">{ticket.subject}</p>
                                <span className="text-xs font-semibold text-brand-blue">{ticket.status}</span>
                            </div>
                            <p className="text-text-muted"><strong className="text-text-headline/80">Project:</strong> {project?.title}</p>
                            <p className="text-text-muted"><strong className="text-text-headline/80">From:</strong> {submitter?.fullName}</p>
                            <p className="text-xs text-text-muted/70 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                    );
                })}
            </div>

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
                        {supportTickets.map(ticket => {
                            const submitter = findUserById(ticket.submittedBy);
                            const project = projects.find(p => p.id === ticket.projectId);
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

    const NonAdminView = () => (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Submit a Support Ticket</h2>
            {submitStatus === 'success' && (
                <div className="bg-green-500/10 text-green-700 p-4 rounded-lg mb-4 text-sm">
                    Your ticket has been submitted successfully! Our team will get back to you shortly.
                </div>
            )}
             {submitStatus === 'error' && (
                <div className="bg-red-500/10 text-red-700 p-4 rounded-lg mb-4 text-sm">
                    There was an error submitting your ticket. Please fill out all fields and try again.
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-text-headline">Subject</label>
                    <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Question about my invoice" 
                        className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" 
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-headline">Message</label>
                    <textarea 
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your issue in detail..." 
                        className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    ></textarea>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
            </form>
        </Card>
    );
    

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Help & Support</h1>
            {user?.role === 'Admin' ? <AdminView /> : <NonAdminView />}
        </div>
    );
};

export default SupportPage;
