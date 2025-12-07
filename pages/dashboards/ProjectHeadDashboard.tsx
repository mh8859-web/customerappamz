import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { BriefcaseIcon, CheckCircleIcon, CalendarIcon, UsersIcon } from '../../components/icons';
import Button from '../../components/ui/Button';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="flex items-center p-5">
        <div className={`p-3 rounded-xl`} style={{ backgroundColor: `${color}20`, color }}>
           {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold font-display text-text-primary">{value}</p>
        </div>
    </Card>
);

const ProjectHeadDashboard: React.FC = () => {
    const { projects, designs, leaveRequests, loading: dataLoading } = useData();
    const { users, loading: usersLoading } = useUsers();

    const isLoading = dataLoading || usersLoading;

    const activeProjects = projects.filter(p => p.status === 'Active');
    const activeDesigners = users.filter(u => u.role === 'Designer');
    const designsForReview = designs.filter(d => d.submittedForReview && !d.approved);
    const pendingLeaveRequests = leaveRequests.filter(l => l.status === 'Pending');

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-display text-text-primary">Project Head Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Projects" value={activeProjects.length} color="#1D9BF0" icon={<BriefcaseIcon className="w-6 h-6" />} />
                <StatCard title="Active Designers" value={activeDesigners.length} color="#F97316" icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard title="Designs for Review" value={designsForReview.length} color="#E0245E" icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard title="Pending Leave" value={pendingLeaveRequests.length} color="#794ACF" icon={<CalendarIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Design Approval Queue</h2>
                    {isLoading ? <p>Loading...</p> : designsForReview.length > 0 ? (
                        <div className="space-y-3">
                            {designsForReview.map(design => {
                                const project = projects.find(p => p.id === design.projectId);
                                return (
                                    <Link to={`/projects/${project?.id}`} key={design.id} className="block bg-page-bg p-4 rounded-xl hover:bg-secondary transition-colors">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-text-primary">v{design.version} for "{project?.title}"</p>
                                            <Button variant="secondary" className="!py-1 !px-3 !text-xs">Review</Button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : <p className="text-sm text-text-secondary text-center py-4">No designs are currently awaiting review. Great job, team!</p>}
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Team Workload</h2>
                     {isLoading ? <p>Loading...</p> : (
                         <div className="space-y-3">
                            {activeDesigners.map(designer => {
                                const projectCount = activeProjects.filter(p => p.designerId === designer.id).length;
                                return (
                                    <div key={designer.id} className="flex items-center justify-between bg-page-bg p-3 rounded-xl">
                                        <UserNameDisplay user={designer} showAvatar={true} imageSize="w-8 h-8" textClassName="font-semibold text-text-primary text-sm" />
                                        <p className="text-sm font-mono text-brand-blue">{projectCount} Project{projectCount !== 1 ? 's' : ''}</p>
                                    </div>
                                );
                            })}
                         </div>
                     )}
                </Card>
            </div>
        </div>
    );
};

export default ProjectHeadDashboard;
