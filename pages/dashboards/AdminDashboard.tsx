import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_PROJECTS, MOCK_ACTIVITY_LOGS, MOCK_MILESTONES, MOCK_TASKS, MOCK_QUOTES, MOCK_ANNOUNCEMENTS } from '../../services/mockData';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { BriefcaseIcon, DollarSignIcon, UsersIcon, CheckCircleIcon, MegaphoneIcon } from '../../components/icons';
import { STAGE_DISPLAY_NAMES } from '../../constants';
import CreateProjectModal from '../../components/admin/CreateProjectModal';
import { Project, Quote, Announcement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 bg-accent-blue-light rounded-xl">
           {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    </Card>
);


const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleCreateProject = (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress'>) => {
    // In a real app, this would be an API call.
    // Here, we just add it to our mock data.
    const projectToAdd: Project = {
        ...newProject,
        id: `proj-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revenueDisplay: 0,
        progress: 10,
        status: 'Active',
        stage: 'design_phase',
    };
    MOCK_PROJECTS.push(projectToAdd);

    // Create initial quote
    const initialQuote: Quote = {
        id: `quote-${Date.now()}`,
        projectId: projectToAdd.id,
        version: 'initial',
        fileUrl: 'dummy.pdf', // Mock file URL
        uploadedBy: projectToAdd.adminId,
        createdAt: new Date().toISOString(),
    };
    MOCK_QUOTES.push(initialQuote);

    setCreateModalOpen(false);
    navigate(`/projects/${projectToAdd.id}`);
  };

  const handleSendAnnouncement = () => {
    if (!announcement.trim() || !user) return;
    const newAnnouncement: Announcement = {
      id: `announce-${Date.now()}`,
      authorId: user.id,
      content: announcement,
      target: 'Designers', // For now, target designers. This could be a dropdown.
      createdAt: new Date().toISOString(),
    };
    MOCK_ANNOUNCEMENTS.unshift(newAnnouncement);
    setAnnouncement('');
    alert('Announcement sent!');
  };

  if (usersLoading) {
    return <div>Loading dashboard...</div>;
  }

  const totalProjects = MOCK_PROJECTS.length;
  const currentProjects = MOCK_PROJECTS.filter(p => p.status === 'Active').length;
  const activeDesigners = users.filter(u => u.role === 'Designer').length;
  const activeCustomers = users.filter(u => u.role === 'Customer').length;

  const thisMonthRevenue = MOCK_MILESTONES
    .filter(m => m.statusDisplay === 'Paid' && new Date(m.paidDateDisplay || '').getMonth() === new Date().getMonth())
    .reduce((sum, m) => sum + m.amountDisplay, 0);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastMonthRevenue = MOCK_MILESTONES
    .filter(m => m.statusDisplay === 'Paid' && new Date(m.paidDateDisplay || '').getMonth() === lastMonth.getMonth())
    .reduce((sum, m) => sum + m.amountDisplay, 0);

  const averageProjectValue = MOCK_PROJECTS.length > 0 ? MOCK_PROJECTS.reduce((sum, p) => sum + p.budgetDisplay, 0) / MOCK_PROJECTS.length : 0;
  
  const recentProjects = [...MOCK_PROJECTS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  
  const designerActivity = MOCK_ACTIVITY_LOGS.filter(log => users.find(u => u.id === log.actorId)?.role === 'Designer').slice(0, 4);

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
          <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
          <Button onClick={() => setCreateModalOpen(true)}>+ Create New Project</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Projects" value={totalProjects} icon={<BriefcaseIcon className="w-6 h-6 text-accent" />} />
          <StatCard title="Current Projects" value={currentProjects} icon={<BriefcaseIcon className="w-6 h-6 text-accent" />} />
          <StatCard title="Active Designers" value={activeDesigners} icon={<UsersIcon className="w-6 h-6 text-accent" />} />
          <StatCard title="Active Customers" value={activeCustomers} icon={<UsersIcon className="w-6 h-6 text-accent" />} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="This Month Revenue" value={`₹${thisMonthRevenue.toLocaleString()}`} icon={<DollarSignIcon className="w-6 h-6 text-accent" />} />
          <StatCard title="Last Month Revenue" value={`₹${lastMonthRevenue.toLocaleString()}`} icon={<DollarSignIcon className="w-6 h-6 text-accent" />} />
          <StatCard title="Avg. Project Value" value={`₹${Math.round(averageProjectValue/1000)}k`} icon={<BriefcaseIcon className="w-6 h-6 text-accent" />} />
          <StatCard title="Pending Approvals" value="3" icon={<CheckCircleIcon className="w-6 h-6 text-accent" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Revenue Trend</h2>
            <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#65676B" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #DADDE1', borderRadius: '8px' }} cursor={{fill: '#1877F2', fillOpacity: 0.1}}/>
                        <Bar dataKey="revenue" fill="#1877F2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </Card>
          <Card>
              <h2 className="text-xl font-semibold text-text-primary mb-4">Live Designer Activity</h2>
              <ul className="space-y-4">
                  {designerActivity.map(log => (
                      <li key={log.id} className="text-sm">
                          <p className="text-text-primary font-medium">{users.find(u => u.id === log.actorId)?.fullName}</p>
                          <p className="text-text-secondary">{log.action.replace('_', ' ')} on {MOCK_PROJECTS.find(p=> p.id === log.projectId)?.title}</p>
                          <p className="text-xs text-text-secondary/70">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </li>
                  ))}
              </ul>
          </Card>
        </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">Recently Created Projects</h2>
                  <div className="space-y-3">
                      {recentProjects.map(p => (
                          <div key={p.id} className="bg-page-bg p-3 rounded-xl flex justify-between items-center">
                              <div>
                                  <p className="font-semibold text-text-primary">{p.title}</p>
                                  <p className="text-sm text-text-secondary">{users.find(u => u.id === p.customerId)?.fullName}</p>
                              </div>
                              <Button variant="secondary" className="px-3 py-1 text-xs">Assign</Button>
                          </div>
                      ))}
                  </div>
              </Card>
              <div className="space-y-6">
                  <Card>
                    <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2"><MegaphoneIcon className="w-5 h-5"/> Company Announcements</h2>
                    <textarea 
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Send an announcement to your team..."
                        className="w-full bg-page-bg border border-border-color rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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