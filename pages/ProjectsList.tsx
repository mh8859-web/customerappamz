import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_PROJECTS, MOCK_USERS } from '../services/mockData';
import Card from '../components/ui/Card';
import { Project } from '../types';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const designer = MOCK_USERS.find(u => u.id === project.designerId);
    const customer = MOCK_USERS.find(u => u.id === project.customerId);

    return (
        <Card className="hover:border-accent transition-colors duration-300">
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
                    <p><span className="font-semibold text-text-headline">Customer:</span> {customer?.fullName}</p>
                    <p><span className="font-semibold text-text-headline">Designer:</span> {designer?.fullName || 'Not Assigned'}</p>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-border-color rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>
            </Link>
        </Card>
    );
};

const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
  
  if (!user) return null;
  
  const projectsForUser = MOCK_PROJECTS.filter(p => 
      user.role === 'Admin' || p.designerId === user.id || p.customerId === user.id
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
                    ${activeTab === 'Active' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-headline'}`}
            >
                Active Projects ({activeProjects.length})
            </button>
             <button onClick={() => setActiveTab('Archived')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'Archived' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-headline'}`}
            >
                Archived Projects ({archivedProjects.length})
            </button>
        </nav>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-headline">
        {user.role === 'Customer' ? 'Project Archive' : 'Projects'}
      </h1>
      
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
  );
};

export default ProjectsList;
