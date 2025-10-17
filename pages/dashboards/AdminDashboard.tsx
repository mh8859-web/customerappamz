import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { BriefcaseIcon, DollarSignIcon, UsersIcon, CheckCircleIcon, MegaphoneIcon } from '../../components/icons';
import { STAGE_DISPLAY_NAMES } from '../../constants';
import CreateProjectModal from '../../components/admin/CreateProjectModal';
import { Project, Quote, Announcement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import { createRecord } from '../../services/api';

const DashboardLoader: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-9 bg-secondary rounded w-1/3"></div>
      <div className="h-11 bg-secondary rounded-xl w-48"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="h-24 bg-surface rounded-2xl shadow-card"></div>
      <div className="h-24 bg-surface rounded-2xl shadow-card"></div>
      <div className="h-24 bg-surface rounded-2xl shadow-card"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-80 bg-surface rounded-2xl shadow-card"></div>
      <div className="h-80 bg-surface rounded-2xl shadow-card"></div>
    </div>
  </div>
);

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useUsers();
  const { projects, activityLogs, milestones, announcements, loading, refetchData } = useData();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  
  const formInputClasses = "w-full bg-secondary border-2 border-transparent rounded-xl p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface placeholder:text-text-secondary/80 transition-all";

  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress'>) => {
    const projectToCreate = {
        ...newProjectData,
        revenue_display: 0,
        progress: 10,
        status: 'Active',
        stage: 'design_phase',
    };

    const { data: newProject, error: projectError } = await createRecord('projects', projectToCreate);

    if (projectError) {
        alert(`Failed to create project: ${projectError.message}`);
        return;
    }

    const initialQuote = {
        project_id: newProject.id,
        version: 'initial',
        file_url: 'dummy.pdf', // Mock file URL
        uploaded_by: newProject.admin_id,
    };
    
    await createRecord('quotes', initialQuote);
    
    await refetchData();
    setCreateModalOpen(false);
    navigate(`/projects/${newProject.id}`);
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.trim() || !user) return;
    const newAnnouncement = {
      author_id: user.id,
      content: announcement,
      target: 'Designers', // For now, target designers. This could be a dropdown.
    };

    await createRecord('announcements', newAnnouncement);
    await refetchData();
    setAnnouncement('');
    alert('Announcement sent!');
  };

  if (loading) return <DashboardLoader />;

  const currentProjects = projects.filter(p => p.status === 'Active').length;
  const activeDesigners = users.filter(u => u.role === 'Designer').length;

  const thisMonthRevenue = milestones
    .filter(m => m.statusDisplay === 'Paid' && new Date(m.paidDateDisplay || '').getMonth() === new Date().getMonth())
    .reduce((sum, m) => sum + m.amountDisplay, 0);

  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  
  const designerActivity = activityLogs.filter(log => users.find(u => u.id === log.actorId)?.role === 'Designer').slice(0, 4);

  const revenueData = [
    { name: 'Jan', revenue: 40000 }, { name: 'Feb', revenue: 30000 },
    { name: 'Mar', revenue: 50000 }, { name: 'Apr', revenue: 45000 },
    { name: 'May', revenue: 60000 }, { name: 'Jun', revenue: 75000 },
  ];

  return (
    <>
      <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateProject}
      />
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold font-display text-text-primary">Admin Dashboard</h1>
          <Button onClick={() => setCreateModalOpen(true)}>+ Create New Project</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Active Projects" value={currentProjects} color="#1D9BF0" icon={<BriefcaseIcon className="w-6 h-6" />} />
          <StatCard title="This Month Revenue" value={`₹${thisMonthRevenue.toLocaleString()}`} color="#00BA7C" icon={<DollarSignIcon className="w-6 h-6" />} />
          <StatCard title="Active Designers" value={activeDesigners} color="#F97316" icon={<UsersIcon className="w-6 h-6" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Revenue Trend</h2>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#536471" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #CFD9DE', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{fill: '#1D9BF0', fillOpacity: 0.1}}/>
                        <Bar dataKey="revenue" fill="#1D9BF0" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </Card>
          <Card>
              <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Live Designer Activity</h2>
              <ul className="space-y-4">
                  {designerActivity.map(log => (
                      <li key={log.id} className="text-sm">
                          <p className="text-text-primary font-medium">{users.find(u => u.id === log.actorId)?.fullName}</p>
                          <p className="text-text-secondary">{log.action.replace('_', ' ')} on {projects.find(p=> p.id === log.projectId)?.title}</p>
                          <p className="text-xs text-text-secondary/70">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </li>
                  ))}
              </ul>
          </Card>
        </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                  <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Recently Created Projects</h2>
                  <div className="space-y-3">
                      {recentProjects.map(p => (
                          <div key={p.id} className="bg-page-bg p-4 rounded-xl flex justify-between items-center">
                              <div>
                                  <p className="font-semibold text-text-primary">{p.title}</p>
                                  <p className="text-sm text-text-secondary">{users.find(u => u.id === p.customerId)?.fullName}</p>
                              </div>
                              <Button variant="secondary" className="!px-4 !text-sm">Assign</Button>
                          </div>
                      ))}
                  </div>
              </Card>
              <div className="space-y-6">
                  <Card>
                    <h2 className="text-xl font-semibold font-display text-text-primary mb-4 flex items-center gap-2"><MegaphoneIcon className="w-5 h-5"/> Company Announcements</h2>
                    <textarea 
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Send an announcement to your team..."
                        className={formInputClasses}
                        rows={3}
                    />
                    <Button onClick={handleSendAnnouncement} className="w-full mt-2" disabled={!announcement.trim()}>Send Announcement</Button>
                  </Card>
              </div>
          </div>
      </div>
    </>
  );
};

export default AdminDashboard;
