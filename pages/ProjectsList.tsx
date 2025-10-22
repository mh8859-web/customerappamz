import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { Project, Quote } from '../types';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import Button from '../components/ui/Button';
import CreateProjectModal from '../components/admin/CreateProjectModal';
import { useData } from '../context/DataContext';
import { createRecord, uploadProjectFile } from '../services/api';
import { AMAZ_SUPPORT_USER_ID } from '../constants';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const { findUserById } = useUsers();
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    return (
        <Card className="hover:border-brand-blue transition-colors duration-300">
            <Link to={`/projects/${project.id}`} className="block">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-headline mb-2">{project.title}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                        project.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                        project.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-300'}`}>{project.status}</span>
                </div>
                <p className="text-sm text-text-muted mb-4">{project.address}</p>
                <div className="text-sm space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-headline">Customer:</span>
                        <UserNameDisplay user={customer} textClassName="text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-headline">Designer:</span>
                        {designer ? <UserNameDisplay user={designer} textClassName="text-sm" /> : 'Not Assigned'}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
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
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  
  if (!user) return null;
  
  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'revenueDisplay' | 'progress'>, quoteFile: File) => {
    // 1. Create project record to get an ID for file path
    const projectToCreate = {
        ...newProjectData,
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
    
    // 4. Send automated welcome message to chat
    const supportMessage = `Welcome to your new project, "${newProject.title}"! Your assigned designer and our team will be in touch shortly. You can view your project details and track progress here.`;
    await createRecord('messages', {
        chat_id: newProject.id,
        sender_id: AMAZ_SUPPORT_USER_ID,
        body: supportMessage,
    });
    
    // 5. Refresh data and navigate
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
                    ${activeTab === 'Active' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-muted hover:text-text-headline'}`}
            >
                Active Projects ({activeProjects.length})
            </button>
             <button onClick={() => setActiveTab('Archived')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'Archived' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-muted hover:text-text-headline'}`}
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-text-headline">
                {user.role === 'Customer' ? 'Project Archive' : 'Projects'}
            </h1>
            {user.role === 'Admin' && (
                <Button onClick={() => setCreateModalOpen(true)}>+ Create New Project</Button>
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
                <p className="text-text-muted">No {user.role === 'Customer' && activeTab.toLowerCase()} projects found.</p>
            </Card>
        )}
      </div>
    </>
  );
};

export default ProjectsList;