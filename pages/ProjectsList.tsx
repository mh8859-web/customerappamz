import React, { useState, useMemo } from 'react';
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
import { RefreshIcon, MapPinIcon, BriefcaseIcon, TrashIcon, LockIcon } from '../components/icons';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const { user } = useAuth();
    const { refetchData, milestones } = useData();
    const { findUserById } = useUsers();
    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);

    const isLocked = useMemo(() => {
        if (user?.role !== 'Customer') return false;
        // Lock access if there is a pending payment or payment verification in progress
        return milestones.some(m => m.projectId === project.id && (m.statusDisplay === 'Completed' || m.statusDisplay === 'Verifying'));
    }, [user, milestones, project.id]);

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
        <div className="relative h-full">
            <Card className={`group relative overflow-hidden h-full border-luxury transition-all duration-500 ${isLocked ? 'grayscale opacity-75' : 'hover:border-brand-gold/40'}`}>
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
                
                <Link to={isLocked ? '#' : `/projects/${project.id}`} className={`flex flex-col h-full ${isLocked ? 'cursor-not-allowed' : ''}`}>
                    <div className="mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-page-bg flex items-center justify-center mb-4 group-hover:bg-brand-gold/10 transition-colors">
                            <BriefcaseIcon className="w-8 h-8 text-brand-gold" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-brand-dark group-hover:text-brand-gold transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-2 text-text-secondary mt-2 text-sm font-sans">
                            <MapPinIcon className="w-4 h-4 text-brand-gold opacity-60" />
                            {project.address}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-8 font-sans">
                        <div className="flex justify-between items-center text-sm border-b border-border-luxury pb-3">
                            <span className="text-text-secondary font-medium">Project Owner</span>
                            <UserNameDisplay user={customer} textClassName="font-bold text-brand-dark" />
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-border-luxury pb-3">
                            <span className="text-text-secondary font-medium">Design Lead</span>
                            <UserNameDisplay user={designer} textClassName="font-bold text-brand-dark" />
                        </div>
                    </div>

                    <div className="mt-auto pt-6">
                        <div className="flex justify-between text-[11px] font-bold text-text-secondary uppercase tracking-[0.1em] mb-2 font-display">
                            <span>Evolution Stage</span>
                            <span className="text-brand-gold">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-page-bg rounded-full h-2 px-0.5 py-0.5 flex items-center overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-gold to-brand-gold-light h-1 rounded-full transition-all duration-1000 shadow-gold-glow" style={{ width: `${project.progress}%` }}></div>
                        </div>
                    </div>
                </Link>
            </Card>

            {isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center bg-white/10 backdrop-blur-[3px] rounded-[32px]">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 text-brand-gold flex items-center justify-center shadow-premium mb-4 scale-110">
                        <LockIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-slate-900 font-display font-extrabold uppercase tracking-tight text-lg leading-tight">Access Locked</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 font-sans">Pending Settlement Confirmation</p>
                </div>
            )}
        </div>
    );
};

const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const { projects, refetchData } = useData();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setSyncModalOpen] = useState(false);
  
  if (!user) return null;

  const handleCreateProject = async (projectData: any, quoteFile: File) => {
    // Project creation logic...
    await refetchData();
  };

  const projectsForUser = projects.filter(p => 
      user.role === 'Admin' || user.role === 'Sub-Admin' || p.designerId === user.id || p.customerId === user.id
  );

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
            <h1 className="text-5xl font-display font-extrabold text-slate-900 tracking-tight uppercase">Master Portfolio</h1>
            <p className="text-slate-400 mt-2 text-lg font-bold uppercase tracking-[4px] font-display">Architectural Excellence Registry</p>
        </div>
        {(user.role === 'Admin' || user.role === 'Sub-Admin') && (
            <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setSyncModalOpen(true)} className="!rounded-full !px-8 hover:border-brand-gold/40 font-display">
                  <RefreshIcon className="w-5 h-5 mr-2 text-brand-gold" /> Sync CRM
                </Button>
                <Button variant="gold" onClick={() => setCreateModalOpen(true)} className="!rounded-full !px-10 shadow-gold-glow font-display">+ Initiate Project</Button>
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