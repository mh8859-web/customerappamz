
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseIcon, CheckCircleIcon, MessageSquareIcon, CalendarIcon, MegaphoneIcon } from '../../components/icons';
import Button from '../../components/ui/Button';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
// import CommunityFeedWidget from '../../components/dashboard/CommunityFeedWidget'; // Hidden

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
      <h1 className="text-3xl font-bold font-display text-text-primary">Welcome back, {user.fullName.split(' ')[0]}</h1>
      
      {latestAnnouncement && (
        <Card className="!p-4 bg-brand-blue/10 border-brand-blue/30 flex items-start gap-3">
            <MegaphoneIcon className="w-5 h-5 text-brand-blue flex-shrink-0 mt-1"/>
            <div>
                <h3 className="font-bold text-brand-blue">Announcement from {findUserById(latestAnnouncement.authorId)?.fullName}</h3>
                <p className="text-sm text-text-primary">{latestAnnouncement.content}</p>
            </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
            <>
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </>
        ) : (
            <>
                <Card>
                    <div className="flex items-center text-text-secondary mb-2"><BriefcaseIcon className="w-5 h-5 mr-2"/> Assigned Projects</div>
                    <p className="text-4xl font-bold font-display text-text-primary">{assignedProjects.length}</p>
                </Card>
                <Card>
                    <div className="flex items-center text-text-secondary mb-2"><CheckCircleIcon className="w-5 h-5 mr-2"/> Awaiting Approval</div>
                    <p className="text-4xl font-bold font-display text-text-primary">{awaitingApproval.length}</p>
                </Card>
                <Card>
                    <div className="flex items-center text-text-secondary mb-2"><MessageSquareIcon className="w-5 h-5 mr-2"/> Tasks This Month</div>
                    <p className="text-4xl font-bold font-display text-text-primary">{tasksCompletedThisMonth}</p>
                </Card>
                <Card>
                    <div className="flex items-center text-text-secondary mb-2"><CalendarIcon className="w-5 h-5 mr-2"/> Leave Balance</div>
                    <p className="text-4xl font-bold font-display text-text-primary">{remainingLeave} <span className="text-lg">days</span></p>
                </Card>
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Assigned Projects</h2>
          {isLoading ? (
              <div className="space-y-4">
                  <div className="h-16 bg-secondary rounded-xl animate-pulse-fast"></div>
                  <div className="h-16 bg-secondary rounded-xl animate-pulse-fast"></div>
              </div>
          ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {assignedProjects.map(project => (
                  <Link to={`/projects/${project.id}`} key={project.id} className="block bg-page-bg p-4 rounded-xl hover:bg-secondary transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-text-primary">{project.title}</p>
                      <p className="text-sm text-text-secondary capitalize">{project.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="w-full bg-border-color rounded-full h-2.5">
                      <div className="bg-brand-blue h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </Link>
                ))}
              </div>
          )}
        </Card>
        
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Today's Tasks</h2>
                {isLoading ? <div className="h-20 bg-secondary rounded-xl animate-pulse-fast"></div> : (
                    <ul className="space-y-3">
                      {tasksDueToday.slice(0, 3).map(task => (
                        <li key={task.id} className="flex justify-between items-center bg-page-bg p-3 rounded-xl">
                          <div>
                            <p className="text-text-primary text-sm">{task.title}</p>
                            <p className="text-xs text-text-secondary">{projects.find(p=>p.id === task.projectId)?.title}</p>
                          </div>
                        </li>
                      ))}
                      {tasksDueToday.length === 0 && <p className="text-sm text-text-secondary">No tasks due today.</p>}
                    </ul>
                )}
            </Card>
            <Card>
              <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Awaiting Customer Approval</h2>
               {isLoading ? <div className="h-16 bg-secondary rounded-xl animate-pulse-fast"></div> : (
                  <ul className="space-y-3">
                    {awaitingApproval.slice(0, 2).map(design => (
                       <li key={design.id} className="text-text-primary text-sm bg-page-bg p-3 rounded-xl">
                         v{design.version} for {projects.find(p => p.id === design.projectId)?.title}
                       </li>
                    ))}
                    {awaitingApproval.length === 0 && <p className="text-sm text-text-secondary">All clear!</p>}
                  </ul>
               )}
            </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
