import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { BriefcaseIcon, DollarSignIcon, UsersIcon, TrendingUpIcon } from '../../components/icons';
import { STAGE_DISPLAY_NAMES } from '../../constants';
import CreateProjectModal from '../../components/admin/CreateProjectModal';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend?: string; }> = ({ title, value, icon, trend }) => (
    <Card className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-brand-blue-light text-brand-blue">
                {icon}
            </div>
            {trend && (
                <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-accent-success/10 text-accent-success">
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-display font-bold text-text-primary mt-1">{value}</h3>
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useUsers();
  const { projects, activityLogs, milestones } = useData();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  const currentProjects = projects.filter(p => p.status === 'Active').length;
  const activeDesigners = users.filter(u => u.role === 'Designer').length;
  const totalRevenue = milestones
    .filter(m => m.statusDisplay === 'Paid')
    .reduce((sum, m) => sum + m.amountDisplay, 0);

  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Executive Workspace</h1>
          <p className="text-text-secondary mt-1">Efficiently managing {projects.length} portfolios.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="w-full md:w-auto">
          + Start New Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Projects" value={currentProjects} icon={<BriefcaseIcon className="w-6 h-6" />} trend="+2 this week" />
          <StatCard title="Total Revenue" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} icon={<DollarSignIcon className="w-6 h-6" />} trend="12% up" />
          <StatCard title="Lead Designers" value={activeDesigners} icon={<UsersIcon className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-display font-bold text-text-primary">Portfolio Tracking</h2>
                <button className="text-brand-blue text-sm font-bold hover:underline" onClick={() => navigate('/projects')}>View All &rarr;</button>
            </div>
            <div className="space-y-4">
                {recentProjects.map(p => (
                    <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-blue font-bold">
                                {p.title.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-text-primary">{p.title}</p>
                                <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wide mt-0.5">{STAGE_DISPLAY_NAMES[p.stage]}</p>
                            </div>
                        </div>
                        <div className="hidden sm:block text-right">
                            <div className="w-32 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                            </div>
                            <p className="text-[10px] text-text-secondary font-bold mt-1.5">{p.progress}% Complete</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card className="lg:col-span-4">
            <h2 className="text-lg font-display font-bold text-text-primary mb-6">Recent Activity</h2>
            <div className="space-y-6">
                {activityLogs.slice(0, 5).map((log, i) => (
                    <div key={log.id} className="flex gap-4">
                        <img 
                            src={users.find(u => u.id === log.actorId)?.avatarUrl} 
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100" 
                            alt="User" 
                        />
                        <div className="flex-1">
                            <p className="text-xs text-text-primary">
                                <span className="font-bold">{users.find(u => u.id === log.actorId)?.fullName.split(' ')[0]}</span> 
                                <span className="text-text-secondary"> {log.action.toLowerCase().replace('_', ' ')}</span>
                            </p>
                            <p className="text-[10px] text-text-secondary mt-1 font-bold">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
      </div>
      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={async () => {}} />
    </div>
  );
};

export default AdminDashboard;