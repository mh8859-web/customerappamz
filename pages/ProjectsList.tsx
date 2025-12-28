import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import Card from '../components/ui/Card.tsx';
import { Project, Quote } from '../types.ts';
import { useUsers } from '../context/UserContext.tsx';
import UserNameDisplay from '../components/ui/UserNameDisplay.tsx';
import Button from '../components/ui/Button.tsx';
import CreateProjectModal from '../components/admin/CreateProjectModal.tsx';
import SyncQuotesModal from '../components/admin/SyncQuotesModal.tsx';
import { useData } from '../context/DataContext.tsx';
import { createRecord, uploadProjectFile } from '../services/api.ts';
import { AMAZ_SUPPORT_USER_ID } from '../constants.ts';
import { RefreshIcon } from '../components/icons.tsx';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const { findUserById } = useUsers();
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    return (
        <Card className="hover:border-brand-blue transition-colors duration-300">
            <Link to={`/projects/${project.id}`} className="block">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-primary mb-2">{project.title}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                        project.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                        project.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-300'}`}>{project.status}</span>
                </div>
                <p className="text-sm text-text-secondary mb-4">{project.address}</p>
                <div className="text-sm space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">Customer:</span>
                        <UserNameDisplay user={customer} textClassName="text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">Designer:</span>
                        {designer ? <UserNameDisplay user={designer} textClassName="text-sm" /> : 'Not Assigned'}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-border-color rounded-full h-2">
                        <div className="bg-brand-blue h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>
            </Link>
        </Card>
    );
};

const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const { projects, refetchData } = useData();
  const { users } = useUsers();
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setSyncModalOpen] = useState(false); 
  const navigate = useNavigate();
  
  if (!user) return null;
  
  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress'>, quoteFile: File) => {
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
    if (!quoteUrl) {
        alert('Project created, but failed to upload quote. Please upload it manually.');
    } else {
        const initialQuote = {
            project_id: newProject.id,
            version: 'initial',
            file_url: quoteUrl,
            uploaded_by: newProject.admin_id,
        };
        await createRecord('quotes', initialQuote);
    }
    
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
        sender_id: newProjectData.adminId,
        body: supportMessage,
        is_system_message: true,
    });
    
    await refetchData();
    setCreateModalOpen(false);
    navigate(`/projects/${newProject.id}`);
  };

  const projectsForUser = projects.filter(p => 
      user.role === 'Admin' || user.role === 'Sub-Admin' || p.designerId === user.id || p.customerId === user.id
  );

  const activeProjects = projectsForUser.filter(p => p.status === 'Active');
  const archivedProjects = projectsForUser.filter(p => p.status === 'Completed');

  const projectsToDisplay = user.role === 'Customer'
    ? (activeTab === 'Active' ? activeProjects : archivedProjects)
    : projectsForUser;
    
  const renderTabs = () => (
    <div className="border-b border-border-color mb-6">
        <nav className="-mb-px flex space-x-6">
            <button onClick={() => setActiveTab('Active')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'Active' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
                Active Projects ({activeProjects.length})
            </button>
             <button onClick={() => setActiveTab('Archived')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'Archived' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
                Archived Projects ({archivedProjects.length})
            </button>
        </nav>
    </div>
  );

  return (
    <>
      <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateProject}
      />
      
      <SyncQuotesModal
          isOpen={isSyncModalOpen}
          onClose={() => setSyncModalOpen(false)}
          onSyncComplete={refetchData}
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-3xl font-bold font-display text-text-primary">
                {user.role === 'Customer' ? 'Project Archive' : 'Projects'}
            </h1>
            {user.role === 'Admin' && (
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setSyncModalOpen(true)} className="flex items-center gap-2">
                        <RefreshIcon className="w-5 h-5" /> Sync from Quote App
                    </Button>
                    <Button onClick={() => setCreateModalOpen(true)}>+ Create New Project</Button>
                </div>
            )}
        </div>
        
        {user.role === 'Customer' && renderTabs()}

        {projectsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectsToDisplay.map(project => (
                <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        ) : (
            <Card className="text-center py-12">
                <p className="text-text-secondary">No {user.role === 'Customer' && activeTab.toLowerCase()} projects found.</p>
            </Card>
        )}
      </div>
    </>
  );
};

export default ProjectsList;