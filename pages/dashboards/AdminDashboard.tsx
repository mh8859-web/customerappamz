import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { BriefcaseIcon, DollarSignIcon, UsersIcon } from '../../components/icons.tsx';
import { STAGE_DISPLAY_NAMES, AMAZ_SUPPORT_USER_ID } from '../../constants.ts';
import CreateProjectModal from '../../components/admin/CreateProjectModal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useUsers } from '../../context/UserContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { createRecord, uploadProjectFile } from '../../services/api.ts';

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
  const { users, loading: usersLoading } = useUsers();
  const { projects, activityLogs, milestones, refetchData, loading: dataLoading } = useData();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  const isLoading = usersLoading || dataLoading;
  
  const handleCreateProject = async (newProjectData: any, quoteFile: File) => {
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

    const quoteUrl = await uploadProjectFile(newProject.id, quoteFile);
    if (quoteUrl) {
        await createRecord('quotes', {
            project_id: newProject.id,
            version: 'initial',
            file_url: quoteUrl,
            uploaded_by: newProject.admin_id,
        });
    }
    
    await refetchData();
    setCreateModalOpen(false);
    navigate(`/projects/${newProject.id}`);
  };

  const currentProjects = projects.filter(p => p.status === 'Active').length;
  const activeDesigners = users.filter(u => u.role === 'Designer').length;
  const thisMonthRevenue = milestones
    .filter(m => m.statusDisplay === 'Paid' && new Date(m.paidDateDisplay || '').getMonth() === new Date().getMonth())
    .reduce((sum, m) => sum + m.amountDisplay, 0);

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
          <Button onClick={() => setCreateModalOpen(true)}>+ Create Project</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Active Projects" value={currentProjects} color="#1D9BF0" icon={<BriefcaseIcon className="w-6 h-6" />} />
            <StatCard title="Monthly Revenue" value={`₹${thisMonthRevenue.toLocaleString()}`} color="#00BA7C" icon={<DollarSignIcon className="w-6 h-6" />} />
            <StatCard title="Active Designers" value={activeDesigners} color="#F97316" icon={<UsersIcon className="w-6 h-6" />} />
        </div>

        <Card>
            <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Designer Activity</h2>
            <ul className="space-y-4">
                {activityLogs.slice(0, 5).map(log => (
                    <li key={log.id} className="text-sm border-b border-border-color pb-2 last:border-0">
                        <p className="text-text-primary font-medium">{users.find(u => u.id === log.actorId)?.fullName}</p>
                        <p className="text-text-secondary">{log.details}</p>
                    </li>
                ))}
            </ul>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;