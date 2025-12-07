import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { BuildingOffice2Icon, CalendarIcon, AlertTriangleIcon } from '../../components/icons';
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

const SiteHeadDashboard: React.FC = () => {
    const { projects, siteVisits, loading: dataLoading } = useData();
    const { findUserById } = useUsers();

    const executionProjects = projects.filter(p => p.stage === 'execution');
    const upcomingVisits = siteVisits.filter(s => new Date(s.scheduledAt) >= new Date() && s.status === 'Scheduled');

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-display text-text-primary">Site Head Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Sites In Execution" value={executionProjects.length} color="#1D9BF0" icon={<BuildingOffice2Icon className="w-6 h-6" />} />
                <StatCard title="Upcoming Site Visits" value={upcomingVisits.length} color="#794ACF" icon={<CalendarIcon className="w-6 h-6" />} />
                <StatCard title="Open Snags" value="0" color="#F97316" icon={<AlertTriangleIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Active Execution Sites</h2>
                    {executionProjects.length > 0 ? (
                        <div className="space-y-3">
                            {executionProjects.map(project => {
                                const designer = findUserById(project.designerId);
                                return (
                                    <Link to={`/projects/${project.id}`} key={project.id} className="block bg-page-bg p-4 rounded-xl hover:bg-secondary transition-colors">
                                        <p className="font-semibold text-text-primary">{project.title}</p>
                                        <div className="text-sm text-text-secondary mt-1">Lead Designer: <UserNameDisplay user={designer} showAvatar={false} textClassName="text-sm" /></div>
                                        <div className="mt-2 w-full bg-border-color rounded-full h-2">
                                            <div className="bg-brand-blue h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : <p className="text-sm text-text-secondary text-center py-4">No sites are currently in the execution phase.</p>}
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Upcoming Site Visits</h2>
                    {upcomingVisits.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingVisits.map(visit => {
                                const project = projects.find(p => p.id === visit.projectId);
                                return (
                                     <div key={visit.id} className="bg-page-bg p-4 rounded-xl">
                                        <p className="font-semibold text-text-primary">{project?.title}</p>
                                        <p className="text-sm text-text-secondary">{new Date(visit.scheduledAt).toLocaleString()}</p>
                                     </div>
                                )
                            })}
                        </div>
                    ) : <p className="text-sm text-text-secondary text-center py-4">No site visits are scheduled.</p>}
                </Card>
            </div>
        </div>
    );
};

export default SiteHeadDashboard;
