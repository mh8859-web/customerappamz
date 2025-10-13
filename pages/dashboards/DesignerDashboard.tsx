import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_DESIGNS, MOCK_SITE_VISITS, MOCK_LEAVE_REQUESTS, MOCK_ANNOUNCEMENTS, MOCK_USERS } from '../../services/mockData';
import Card from '../../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseIcon, CheckCircleIcon, MessageSquareIcon, CalendarIcon, MegaphoneIcon } from '../../components/icons';
import Button from '../../components/ui/Button';

const DesignerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const assignedProjects = MOCK_PROJECTS.filter(p => p.designerId === user.id);
  const tasksDueToday = MOCK_TASKS.filter(t => t.assigneeId === user.id && t.status !== 'Done');
  const awaitingApproval = MOCK_DESIGNS.filter(d => 
    assignedProjects.some(p => p.id === d.projectId) && d.submittedForReview && !d.approved
  );
  
  const thisMonth = new Date().getMonth();
  
  const tasksCompletedThisMonth = MOCK_TASKS.filter(t => 
    t.assigneeId === user.id &&
    t.status === 'Done' &&
    new Date(t.dueDate).getMonth() === thisMonth
  ).length;

  const approvedLeave = MOCK_LEAVE_REQUESTS.filter(l => l.designerId === user.id && l.status === 'Approved').length;
  // Assuming a total of 12 leave days per year for this mock
  const remainingLeave = 12 - approvedLeave;
  
  const latestAnnouncement = MOCK_ANNOUNCEMENTS
    .filter(a => a.target === 'Designers' || a.target === 'All')
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-headline">Welcome back, {user.fullName.split(' ')[0]}</h1>
      
      {latestAnnouncement && (
        <Card className="!p-4 bg-accent/10 border-accent/30 flex items-start gap-3">
            <MegaphoneIcon className="w-5 h-5 text-accent flex-shrink-0 mt-1"/>
            <div>
                <h3 className="font-bold text-accent">Announcement from {MOCK_USERS.find(u => u.id === latestAnnouncement.authorId)?.fullName}</h3>
                <p className="text-sm text-text-headline">{latestAnnouncement.content}</p>
            </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center text-accent mb-2"><BriefcaseIcon className="w-5 h-5 mr-2"/> Assigned Projects</div>
          <p className="text-4xl font-bold text-text-headline">{assignedProjects.length}</p>
        </Card>
        <Card>
          <div className="flex items-center text-accent mb-2"><CheckCircleIcon className="w-5 h-5 mr-2"/> Awaiting Approval</div>
          <p className="text-4xl font-bold text-text-headline">{awaitingApproval.length}</p>
        </Card>
        <Card>
          <div className="flex items-center text-accent mb-2"><MessageSquareIcon className="w-5 h-5 mr-2"/> Tasks This Month</div>
          <p className="text-4xl font-bold text-text-headline">{tasksCompletedThisMonth}</p>
        </Card>
        <Card>
          <div className="flex items-center text-accent mb-2"><CalendarIcon className="w-5 h-5 mr-2"/> Leave Balance</div>
          <p className="text-4xl font-bold text-text-headline">{remainingLeave} <span className="text-lg">days</span></p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-text-headline mb-4">Assigned Projects</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {assignedProjects.map(project => (
              <Link to={`/projects/${project.id}`} key={project.id} className="block bg-primary-bg p-4 rounded-xl hover:bg-border-color transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-text-headline">{project.title}</p>
                  <p className="text-sm text-accent">{project.stage.replace(/_/g, ' ')}</p>
                </div>
                <div className="w-full bg-border-color rounded-full h-2.5">
                  <div className="bg-accent h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold text-text-headline mb-4">Today's Tasks</h2>
                <ul className="space-y-3">
                  {tasksDueToday.slice(0, 3).map(task => (
                    <li key={task.id} className="flex justify-between items-center bg-primary-bg p-3 rounded-xl">
                      <div>
                        <p className="text-text-headline text-sm">{task.title}</p>
                        <p className="text-xs text-text-muted">{MOCK_PROJECTS.find(p=>p.id === task.projectId)?.title}</p>
                      </div>
                    </li>
                  ))}
                  {tasksDueToday.length === 0 && <p className="text-sm text-text-muted">No tasks due today.</p>}
                </ul>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-text-headline mb-4">Awaiting Customer Approval</h2>
              <ul className="space-y-3">
                {awaitingApproval.slice(0, 2).map(design => (
                   <li key={design.id} className="text-text-headline text-sm bg-primary-bg p-3 rounded-xl">
                     v{design.version} for {MOCK_PROJECTS.find(p => p.id === design.projectId)?.title}
                   </li>
                ))}
                {awaitingApproval.length === 0 && <p className="text-sm text-text-muted">All clear!</p>}
              </ul>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
