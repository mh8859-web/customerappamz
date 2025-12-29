
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { BriefcaseIcon, DollarSignIcon, UsersIcon } from '../../components/icons';
import { STAGE_DISPLAY_NAMES, AMAZ_SUPPORT_USER_ID } from '../../constants';
import CreateProjectModal from '../../components/admin/CreateProjectModal';
import { Project, Quote } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import { createRecord, uploadProjectFile } from '../../services/api';
// import CommunityFeedWidget from '../../components/dashboard/CommunityFeedWidget'; // Hidden

const SkeletonCard = () => (
    <Card className="flex items-center p-5 animate-pulse-fast">
        <div className="p-3 rounded-xl bg-secondary h-12 w-12"></div>
        <div className="ml-4 space-y-2">
            <div className="h-4 bg-secondary rounded w-24"></div>
            <div className="h-8 bg-secondary rounded w-32"></div>
        </div>
    </Card>
);

const SkeletonList = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-secondary p-4 rounded-xl h-16 animate-pulse-fast"></div>
    ))}
  </div>
);

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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { projects, activityLogs, milestones, refetchData, loading: dataLoading } = useData();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  const isLoading = usersLoading || dataLoading;
  
  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress'>, quoteFile: File) => {
    // 1. Map frontend camelCase to backend snake_case and create project record
    const projectToCreate = {
        title: newProjectData.title,
        description: newProjectData.description,
        customer_id: newProjectData.customerId,
        designer_id: newProjectData.designerId,
        admin_id: newProjectData.adminId,
        address: newProjectData.address,
        budget_display: newProjectData.budgetDisplay,
        area_sqft: newProjectData.areaSqft,
        start_date: newProjectData.startDate,
        revenue_display: 0,
        progress: 10,
        status: 'Active',
        stage: 'design_phase',
    };

    const { data: newProject, error: projectError } = await createRecord('projects', projectToCreate);

    if (projectError || !newProject) {
        alert(`Failed to create project: ${projectError?.message}`);
        return;
    }

    // 2. Upload the quote file
    const quoteUrl = await uploadProjectFile(newProject.id, quoteFile);
    if (!quoteUrl) {
        alert('Project created, but failed to upload quote. Please upload it manually.');
    } else {
        // 3. Create the quote record with the file URL
        const initialQuote = {
            project_id: newProject.id,
            version: 'initial',
            file_url: quoteUrl,
            uploaded_by: newProject.admin_id,
        };
        await createRecord('quotes', initialQuote);
    }
    
    // 4. Send personalized welcome message to all parties from the official support user
    const customer = users.find(u => u.id === newProjectData.customerId);
    const designer = users.find(u => u.id === newProjectData.designerId);
    const admin = users.find(u => u.id === newProjectData.adminId);

    const supportMessage = `🎉 Welcome to your new project, "${newProject.title}"! We're excited to start.

- Client: ${customer?.fullName || 'N/A'}
- Designer: ${designer?.fullName || 'N/A'}
- Project Admin: ${admin?.fullName || 'N/A'}

Everyone has been added to this chat. Let's create something amazing!`;

    await createRecord('messages', {
        chat_id: newProject.id,
        sender_id: newProjectData.adminId, // Explicitly set sender to satisfy RLS
        body: supportMessage,
        is_system_message: true,
    });

    // 5. Refresh data and navigate
    await refetchData();
    setCreateModalOpen(false);
    navigate(`/projects/${newProject.id}`);
  };

  const currentProjects = projects.filter(p => p.status === 'Active').length;
  const activeDesigners = users.filter(u => u.role === 'Designer').length;

  const thisMonthRevenue = milestones
    .filter(m => m.statusDisplay === 'Paid' && new Date(m.paidDateDisplay || '').getMonth() === new Date().getMonth())
    .reduce((sum, m) => sum + m.amountDisplay, 0);

  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  
  const designerActivity = activityLogs.filter(log => users.find(u => u.id === log.actorId)?.role === 'Designer').slice(0, 4);

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
            {isLoading ? (
                <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </>
            ) : (
                <>
                    <StatCard title="Active Projects" value={currentProjects} color="#1D9BF0" icon={<BriefcaseIcon className="w-6 h-6" />} />
                    <StatCard title="This Month Revenue" value={`₹${thisMonthRevenue.toLocaleString()}`} color="#00BA7C" icon={<DollarSignIcon className="w-6 h-6" />} />
                    <StatCard title="Active Designers" value={activeDesigners} color="#F97316" icon={<UsersIcon className="w-6 h-6" />} />
                </>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-3">
              <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Live Designer Activity</h2>
              {isLoading ? <SkeletonList /> : (
                <ul className="space-y-4">
                    {designerActivity.map(log => (
                        <li key={log.id} className="text-sm">
                            <p className="text-text-primary font-medium">{users.find(u => u.id === log.actorId)?.fullName}</p>
                            <p className="text-text-secondary">{log.action.replace('_', ' ')} on {projects.find(p=> p.id === log.projectId)?.title}</p>
                            <p className="text-xs text-text-secondary/70">{new Date(log.createdAt).toLocaleTimeString()}</p>
                        </li>
                    ))}
                </ul>
              )}
          </Card>
        </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-3">
                  <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Recently Created Projects</h2>
                  {isLoading ? <SkeletonList /> : (
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
                  )}
              </Card>
          </div>
      </div>
    </>
  );
};

export default AdminDashboard;
