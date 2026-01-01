
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
import { createRecord, uploadProjectFile, deleteProject } from '../services/api';
import { RefreshIcon, MapPinIcon, BriefcaseIcon, TrashIcon } from '../components/icons';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const { user } = useAuth();
    const { refetchData } = useData();
    const { findUserById } = useUsers();
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`PERMANENTLY PURGE PROJECT: "${project.title}"?`)) {
            const { error } = await deleteProject(project.id);
            if (error) alert(error.message);
            else await refetchData();
        }
    };

    return (
        <Card className="group relative overflow-hidden h-full border-luxury hover:border-brand-gold/40">
            <div className="absolute top-0 right-0 p-6 flex items-center gap-3">
                <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                    project.status === 'Active' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                    project.status === 'Completed' ? 'bg-brand-gold/20 text-brand-gold' :
                    'bg-zinc-200 text-zinc-500'}`}>{project.status}</span>
                {user?.role === 'Admin' && (
                    <button onClick={handleDelete} className="p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Purge Portfolio">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
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
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setSyncModalOpen] = useState(false);
  
  if (!user) return null;

  const handleCreateProject = async (projectData: any, quoteFile: File) => {
    // 1. PROJECT INITIALIZATION
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

    // 2. DOCUMENT UPLOAD (project_files)
    const quoteUrl = await uploadProjectFile(newProject.id, quoteFile);
    if (quoteUrl) {
        await createRecord('quotes', {
            project_id: newProject.id,
            version: 'Initial Proposal',
            file_url: quoteUrl,
            uploaded_by: user.id
        });
    }

    // 3. MANDATORY 10/40/45/5 PAYMENT PLAN
    const budget = projectData.budgetDisplay;
    const paymentSteps = [
        { title: '10% - TOKEN ADVANCE ON CONFIRMATION', pct: 0.10, offset: 0 },
        { title: '40% - ADVANCE FOR MATERIALS', pct: 0.40, offset: 15 },
        { title: '45% - ON SITE INSTALLATION', pct: 0.45, offset: 45 },
        { title: '5% - ON COMPLETION (SETTLEMENT)', pct: 0.05, offset: 75 }
    ];

    for (const step of paymentSteps) {
        const dueDate = new Date(projectData.startDate);
        dueDate.setDate(dueDate.getDate() + step.offset);
        await createRecord('milestones', {
            project_id: newProject.id,
            title: step.title,
            amount_display: Math.round(budget * step.pct),
            due_date: dueDate.toISOString().split('T')[0],
            status_display: 'Pending'
        });
    }

    // 4. AUTOMATED WELCOME
    await createRecord('messages', {
        chat_id: newProject.id,
        body: `Welcome to AMAZ High Tech Interiors! Your project is Officially Started. Your 10/40/45/5 mandatory payment schedule is active. Let's create your masterpiece.`,
        sender_id: user.id,
        is_system_message: true
    });

    await refetchData();
  };

  const projectsForUser = projects.filter(p => 
      user.role === 'Admin' || user.role === 'Sub-Admin' || p.designerId === user.id || p.customerId === user.id
  );

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase">Master Portfolio</h1>
            <p className="text-slate-400 mt-2 text-lg font-bold uppercase tracking-[4px]">Architectural Excellence System</p>
        </div>
        {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
            <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setSyncModalOpen(true)} className="!rounded-full !px-8 hover:border-brand-gold/40">
                  <RefreshIcon className="w-5 h-5 mr-2 text-brand-gold" /> Sync Quotes
                </Button>
                <Button variant="gold" onClick={() => setCreateModalOpen(true)} className="!rounded-full !px-10 shadow-gold-glow">+ Initiate Project</Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsForUser.filter(p => p.status === 'Active').map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
      </div>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateProject} />
      <SyncQuotesModal isOpen={isSyncModalOpen} onClose={() => setSyncModalOpen(false)} onSyncComplete={refetchData} />
    </div>
  );
};

export default ProjectsList;
