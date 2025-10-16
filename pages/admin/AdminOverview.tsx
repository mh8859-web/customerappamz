import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MOCK_PROJECTS, MOCK_MILESTONES, MOCK_EXPENSES, MOCK_LEAVE_REQUESTS, MOCK_PROJECT_TEMPLATES } from '../../services/mockData';
import { User, LeaveRequest, ProjectTemplate } from '../../types';
import { DollarSignIcon, BriefcaseIcon, UsersIcon, CheckCircleIcon, FilePlusIcon } from '../../components/icons';
import CreateTemplateModal from '../../components/admin/CreateTemplateModal';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

const Financials: React.FC = () => {
    const activeProjects = MOCK_PROJECTS.filter(p => p.status === 'Active');

    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Financial Oversight</h2>
            <div className="space-y-4">
                {activeProjects.map(project => {
                    const expenses = MOCK_EXPENSES.filter(e => e.projectId === project.id).reduce((sum, e) => sum + e.amount, 0);
                    const billed = MOCK_MILESTONES.filter(m => m.projectId === project.id && m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);
                    const profit = billed - expenses;
                    const profitability = project.budgetDisplay > 0 ? (expenses / project.budgetDisplay) * 100 : 0;

                    return (
                        <div key={project.id} className="bg-primary-bg p-4 rounded-xl">
                            <h3 className="font-bold text-text-headline">{project.title}</h3>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                    <p className="text-text-muted">Budget</p>
                                    <p className="font-semibold text-text-headline">{formatCurrency(project.budgetDisplay)}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted">Expenses</p>
                                    <p className="font-semibold text-red-400">{formatCurrency(expenses)}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted">Billed</p>
                                    <p className="font-semibold text-green-400">{formatCurrency(billed)}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted">Profit</p>
                                    <p className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(profit)}</p>
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-xs text-text-muted mb-1">Budget Utilization</p>
                                <div className="w-full bg-border-color rounded-full h-2">
                                    <div className={`h-2 rounded-full ${profitability > 85 ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${profitability}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const TeamManagement: React.FC = () => {
    const { users } = useUsers();
    const designers = users.filter(u => u.role === 'Designer');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
    
    const handleLeaveRequest = (requestId: string, status: 'Approved' | 'Rejected') => {
        setLeaveRequests(prev => prev.map(req => req.id === requestId ? {...req, status} : req));
        // Also update the source mock data
        const index = MOCK_LEAVE_REQUESTS.findIndex(req => req.id === requestId);
        if(index > -1) MOCK_LEAVE_REQUESTS[index].status = status;
    };
    
    const pendingLeave = leaveRequests.filter(req => req.status === 'Pending');

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-text-headline mb-4">Designer Workload</h2>
                <div className="space-y-3">
                    {designers.map(designer => {
                        const projectCount = MOCK_PROJECTS.filter(p => p.designerId === designer.id && p.status === 'Active').length;
                        return (
                            <div key={designer.id} className="flex items-center justify-between bg-primary-bg p-3 rounded-xl">
                                <UserNameDisplay user={designer} showAvatar={true} imageSize="w-8 h-8" textClassName="font-semibold text-text-headline" />
                                <p className="text-sm font-mono text-accent">{projectCount} Active Project{projectCount !== 1 ? 's' : ''}</p>
                            </div>
                        );
                    })}
                </div>
            </Card>
            <Card>
                <h2 className="text-xl font-bold text-text-headline mb-4">Leave Requests</h2>
                {pendingLeave.length > 0 ? (
                    <div className="space-y-3">
                        {pendingLeave.map(req => {
                            const designer = users.find(u => u.id === req.designerId);
                            return (
                                <div key={req.id} className="bg-primary-bg p-3 rounded-xl">
                                    <div className="flex items-center justify-between">
                                       <div>
                                            <p className="font-semibold text-text-headline">{designer?.fullName}</p>
                                            <p className="text-sm text-text-muted">{req.startDate} to {req.endDate}</p>
                                       </div>
                                       <div className="flex gap-2">
                                            <Button onClick={() => handleLeaveRequest(req.id, 'Approved')} className="!px-3 !py-1 text-xs">Approve</Button>
                                            <Button onClick={() => handleLeaveRequest(req.id, 'Rejected')} variant="secondary" className="!px-3 !py-1 text-xs !border-red-500/50 hover:!bg-red-500/20 text-red-400">Reject</Button>
                                       </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-text-muted">No pending leave requests.</p>
                )}
            </Card>
        </div>
    );
};

const ClientDirectory: React.FC = () => {
    const { users } = useUsers();
    const clients = users.filter(u => u.role === 'Customer');

    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Client Directory</h2>
            <div className="space-y-3">
                {clients.map(client => {
                    const clientProjects = MOCK_PROJECTS.filter(p => p.customerId === client.id);
                    const totalValue = clientProjects.reduce((sum, p) => sum + p.budgetDisplay, 0);
                    return (
                        <div key={client.id} className="flex items-center justify-between bg-primary-bg p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <img src={client.avatarUrl} alt={client.fullName} className="w-8 h-8 rounded-full" />
                                <div>
                                    <UserNameDisplay user={client} textClassName="text-text-headline font-semibold"/>
                                    <p className="text-xs text-text-muted">{clientProjects.length} Project{clientProjects.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-text-muted text-right">Lifetime Value</p>
                                <p className="font-bold text-accent text-right">{formatCurrency(totalValue)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const ProjectTemplates: React.FC = () => {
    const [isCreateTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
    const [templates, setTemplates] = useState(MOCK_PROJECT_TEMPLATES);

    const handleCreateTemplate = (template: Omit<ProjectTemplate, 'id'>) => {
        const newTemplate: ProjectTemplate = {
            id: `template-${Date.now()}`,
            ...template,
        };
        MOCK_PROJECT_TEMPLATES.push(newTemplate);
        setTemplates(prev => [...prev, newTemplate]);
        setCreateTemplateModalOpen(false);
    };
    
    return (
        <>
            <CreateTemplateModal
                isOpen={isCreateTemplateModalOpen}
                onClose={() => setCreateTemplateModalOpen(false)}
                onCreate={handleCreateTemplate}
            />
            <Card>
                <h2 className="text-xl font-bold text-text-headline mb-4">Project Templates</h2>
                <p className="text-sm text-text-muted mb-4">Standardize your workflow by creating projects from templates.</p>
                <div className="space-y-3">
                    {templates.map(template => (
                         <div key={template.id} className="bg-primary-bg p-3 rounded-xl">
                            <p className="font-semibold text-text-headline">{template.name}</p>
                            <p className="text-xs text-text-muted">{template.description}</p>
                        </div>
                    ))}
                </div>
                <Button onClick={() => setCreateTemplateModalOpen(true)} className="w-full mt-4 flex items-center justify-center gap-2"><FilePlusIcon className="w-5 h-5"/>Create New Template</Button>
            </Card>
        </>
    )
}

const AdminOverview: React.FC = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-text-headline">Strategic Overview</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Financials />
                </div>
                <div className="space-y-6">
                   <TeamManagement />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ClientDirectory />
                </div>
                <div>
                    <ProjectTemplates />
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;