
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseIcon, CheckCircleIcon, MessageSquareIcon, CalendarIcon, MegaphoneIcon } from '../../components/icons';
import Button from '../../components/ui/Button';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import AttendanceWidget from '../../components/designer/AttendanceWidget';

const SkeletonStatCard = () => (
    <Card className="animate-pulse-fast">
        <div className="h-5 bg-secondary rounded w-3/4 mb-2"></div>
        <div className="h-10 bg-secondary rounded w-1/2"></div>
    </Card>
);

const DesignerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { findUserById, loading: usersLoading } = useUsers();
  const { projects, tasks, designs, leaveRequests, announcements, loading: dataLoading } = useData();
  const navigate = useNavigate();
  
  const isLoading = usersLoading || dataLoading;

  if (!user) return null;

  const assignedProjects = projects.filter(p => p.designerId === user.id);
  const tasksDueToday = tasks.filter(t => t.assigneeId === user.id && t.status !== 'Done');
  const awaitingApproval = designs.filter(d => 
    assignedProjects.some(p => p.id === d.projectId) && d.submittedForReview && !d.approved
  );
  
  const thisMonth = new Date().getMonth();
  
  const tasksCompletedThisMonth = tasks.filter(t => 
    t.assigneeId === user.id &&
    t.status === 'Done' &&
    new Date(t.dueDate).getMonth() === thisMonth
  ).length;

  const approvedLeave = leaveRequests.filter(l => l.designerId === user.id && l.status === 'Approved').length;
  const remainingLeave = 12 - approvedLeave;
  
  const latestAnnouncement = announcements
    .filter(a => a.target === 'Designers' || a.target === 'All')
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <h1 className="text-4xl font-black font-display text-slate-900 tracking-tight leading-none uppercase">
            STUDIO <span className="text-brand-gold">WORKSPACE</span>
          </h1>
          
          {latestAnnouncement && (
            <Card className="!p-6 bg-brand-blue/5 border-brand-blue/10 flex items-start gap-4">
                <MegaphoneIcon className="w-6 h-6 text-brand-blue flex-shrink-0"/>
                <div>
                    <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest mb-1">Executive Broadcast</h3>
                    <p className="text-sm text-slate-600 font-medium">{latestAnnouncement.content}</p>
                </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="luxury-glass">
                <div className="flex items-center text-slate-400 mb-3 text-[10px] font-black uppercase tracking-widest"><BriefcaseIcon className="w-4 h-4 mr-2 text-brand-blue"/> Portfolio Active</div>
                <p className="text-4xl font-black font-display text-slate-900">{assignedProjects.length}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Commits</span>
                    <span className="text-[10px] font-bold text-brand-blue uppercase">View Details</span>
                </div>
            </Card>
            <Card className="luxury-glass">
                <div className="flex items-center text-slate-400 mb-3 text-[10px] font-black uppercase tracking-widest"><CheckCircleIcon className="w-4 h-4 mr-2 text-accent-warning"/> Feedback Loop</div>
                <p className="text-4xl font-black font-display text-slate-900">{awaitingApproval.length}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Required</span>
                    <span className="text-[10px] font-bold text-brand-gold uppercase">Pending Review</span>
                </div>
            </Card>
          </div>

          <Card className="luxury-glass border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] mb-6">Active Commissions</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {assignedProjects.map(project => (
                <Link to={`/projects/${project.id}`} key={project.id} className="block group bg-slate-50 hover:bg-white p-6 rounded-[24px] border border-transparent hover:border-slate-200 transition-all duration-300 hover:shadow-premium">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-black text-slate-900 text-lg group-hover:text-brand-blue transition-colors">{project.title}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{project.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-2xl font-display font-black text-slate-300 group-hover:text-brand-gold transition-colors">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-brand-blue h-full rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <AttendanceWidget />
            
            <Card className="luxury-glass border-slate-100">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] mb-6">Today's Schedule</h2>
                <div className="space-y-4">
                  {tasksDueToday.slice(0, 4).map(task => (
                    <div key={task.id} className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="w-1.5 h-auto bg-brand-gold rounded-full"></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{task.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{projects.find(p=>p.id === task.projectId)?.title}</p>
                      </div>
                    </div>
                  ))}
                  {tasksDueToday.length === 0 && <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-10">No items on registry</p>}
                </div>
                <Button variant="ghost" onClick={() => navigate('/designer/task-board')} className="w-full mt-6 !text-[10px] !font-black uppercase tracking-widest">
                  View Full Board &rarr;
                </Button>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
