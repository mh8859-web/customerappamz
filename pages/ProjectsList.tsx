
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { Project } from '../types';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';
import Button from '../components/ui/Button';
import CreateProjectModal from '../components/admin/CreateProjectModal';
import SyncQuotesModal from '../components/admin/SyncQuotesModal';
import { useData } from '../context/DataContext';
import { createRecord, uploadProjectFile } from '../services/api';
import { RefreshIcon, MapPinIcon, BriefcaseIcon } from '../components/icons';
import { AMAZ_SUPPORT_USER_ID } from '../constants';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const { findUserById } = useUsers();
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    return (
        <Card className="group relative overflow-hidden h-full border-luxury hover:border-brand-gold/40">
            <div className="absolute top-0 right-0 p-6">
                <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                    project.status === 'Active' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                    project.status === 'Completed' ? 'bg-brand-gold/20 text-brand-gold' :
                    'bg-zinc-200 text-zinc-500'}`}>{project.status}</span>
            </div>
            
            <Link to={`/projects/${project.id}`} className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-page-bg flex items-center justify-center mb-4 group-hover:bg-brand-gold/10 transition-colors">
                        <BriefcaseIcon className="w-8 h-8 text-brand-gold" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-brand-dark group-hover:text-brand-gold transition-colors">{project.title}</h3>
                    <div className="flex items-center gap-2 text-text-secondary mt-2 text-sm">
                        <MapPinIcon className="w-4 h-4 text-brand-gold opacity-60" />
                        {project.address}
                    </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm border-b border-border-luxury pb-3">
                        <span className="text-text-secondary font-medium">Owner</span>
                        <UserNameDisplay user={customer} textClassName="font-bold text-brand-dark" />
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border-luxury pb-3">
                        <span className="text-text-secondary font-medium">Lead Creative</span>
                        <UserNameDisplay user={designer} textClassName="font-bold text-brand-dark" />
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary uppercase tracking-[0.1em] mb-2">
                        <span>Phase Completion</span>
                        <span className="text-brand-gold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-page-bg rounded-full h-2 px-0.5 py-0.5 flex items-center overflow-hidden">
                        <div className="bg-gradient-to-r from-brand-gold to-brand-gold-light h-1 rounded-full transition-all duration-1000 shadow-gold-glow" style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>
            </Link>
        </Card>
    );
};

const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const { projects, refetchData } = useData();
  const { findUserById } = useUsers();
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setSyncModalOpen] = useState(false);
  const navigate = useNavigate();
  
  if (!user) return null;

  const handleCreateProject = async (projectData: any, quoteFile: File) => {
    // 1. Create Project Entry first to get ID
    const { data: newProject, error: projectError } = await createRecord('projects', {
        title: projectData.title,
        description: projectData.description,
        customer_id: projectData.customerId,
        designer_id: projectData.designerId,
        admin_id: projectData.adminId,
        address: projectData.address,
        budget_display: projectData.budgetDisplay,
        area_sqft: projectData.areaSqft,
        start_date: projectData.startDate,
        status: 'Active',
        stage: 'design_phase',
        progress: 0,
        revenue_display: 0
    });

    if (projectError) throw projectError;

    // 2. Upload the Quote PDF using the new Project ID
    const quoteUrl = await uploadProjectFile(newProject.id, quoteFile);
    if (!quoteUrl) throw new Error("Document upload failed. Please try again.");

    // 3. Create Quote Record
    const { error: quoteError } = await createRecord('quotes', {
        project_id: newProject.id,
        version: 'Initial',
        file_url: quoteUrl,
        uploaded_by: user.id
    });

    if (quoteError) throw quoteError;

    // 4. AUTOMATED WELCOME MESSAGE - Updated to requested version
    const currentDate = new Date().toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

    const welcomeBody = `This project is Officially Started ${currentDate} From Now You Can Access Your Amaz High Tech Account For Perfect Communication and Clear Updates. We Care About Your Experience So Enjoy Every Moments!!! This Is Your Life's Best Moment Congratulations!!!! Your Dream Home Process Is Started!! Uhh!!`;

    const { error: msgError } = await createRecord('messages', {
        chat_id: newProject.id,
        body: welcomeBody,
        sender_id: user.id, 
        is_system_message: true 
    });

    if (msgError) {
        console.error("Welcome Message Error:", msgError);
    }

    // 5. Global refresh to update all UIs
    await refetchData();
  };

  const projectsForUser = projects.filter(p => 
      user.role === 'Admin' || user.role === 'Sub-Admin' || p.designerId === user.id || p.customerId === user.id
  );

  const activeProjects = projectsForUser.filter(p => p.status === 'Active');
  const archivedProjects = projectsForUser.filter(p => p.status === 'Completed');

  const projectsToDisplay = user.role === 'Customer'
    ? (activeTab === 'Active' ? activeProjects : archivedProjects)
    : projectsForUser;
    
  return (
    <div className="space-y-12 animate-luxury-reveal">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
            <h1 className="text-5xl font-display font-light text-brand-dark tracking-tight leading-tight">Master <span className="font-bold block lg:inline">Portfolio</span></h1>
            <p className="text-text-secondary mt-2 text-lg italic font-light">Overseeing architectural excellence across the AMAZ ecosystem.</p>
        </div>
        {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
            <div className="flex flex-wrap gap-4">
                <Button variant="secondary" onClick={() => setSyncModalOpen(true)} className="flex items-center gap-3">
                    <RefreshIcon className="w-5 h-5 text-brand-gold" /> Sync Assets
                </Button>
                <Button variant="gold" onClick={() => setCreateModalOpen(true)}>+ Initiate New Project</Button>
            </div>
        )}
      </div>

      {user.role === 'Customer' && (
        <div className="flex gap-10 border-b border-border-luxury">
            <button onClick={() => setActiveTab('Active')} className={`pb-4 text-sm font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'Active' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-text-secondary hover:text-brand-dark'}`}>Active ({activeProjects.length})</button>
            <button onClick={() => setActiveTab('Archived')} className={`pb-4 text-sm font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'Archived' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-text-secondary hover:text-brand-dark'}`}>Archived ({archivedProjects.length})</button>
        </div>
      )}

      {projectsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsToDisplay.map(project => (
              <ProjectCard key={project.id} project={project} />
              ))}
          </div>
      ) : (
          <Card className="text-center py-24 bg-page-bg/50 border-dashed border-zinc-300">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <BriefcaseIcon className="w-10 h-10 text-zinc-300" />
              </div>
              <h3 className="text-2xl font-display font-bold text-zinc-500">No projects found</h3>
              <p className="text-zinc-400 mt-2">The portfolio is currently waiting for new inspiration.</p>
          </Card>
      )}

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateProject} />
      <SyncQuotesModal isOpen={isSyncModalOpen} onClose={() => setSyncModalOpen(false)} onSyncComplete={refetchData} />
    </div>
  );
};

export default ProjectsList;
