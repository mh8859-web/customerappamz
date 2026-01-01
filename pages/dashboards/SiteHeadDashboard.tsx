
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { BuildingOffice2Icon, CalendarIcon, AlertTriangleIcon, ZapIcon, ClockIcon, MapPinIcon, ChevronRightIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="!p-8 luxury-glass border-slate-100 flex items-start gap-6 shadow-premium group hover:border-brand-gold/20 transition-all">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-lg`} style={{ backgroundColor: `${color}15`, color }}>
           {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-1.5">{title}</p>
            <p className="text-4xl font-display font-black text-slate-900 tabular-nums leading-none tracking-tighter">{value}</p>
        </div>
    </Card>
);

const SiteHeadDashboard: React.FC = () => {
    const { projects, siteVisits, loading: dataLoading } = useData();
    const { findUserById, users } = useUsers();

    const executionProjects = useMemo(() => projects.filter(p => p.stage === 'Site Work' || p.stage === 'Installation'), [projects]);
    const upcomingVisits = useMemo(() => siteVisits.filter(s => new Date(s.scheduledAt) >= new Date() && s.status === 'Scheduled'), [siteVisits]);

    if (dataLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">Synchronizing Field Assets...</div>;

    return (
        <div className="space-y-10 pb-20 animate-reveal">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">Execution HQ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-3 flex items-center gap-2">
                        <ZapIcon className="w-4 h-4 text-brand-gold" />
                        Site Operations Control Panel
                    </p>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard title="Active Sites" value={executionProjects.length} color="#2563EB" icon={<BuildingOffice2Icon className="w-7 h-7" />} />
                <StatCard title="Scheduled Visits" value={upcomingVisits.length} color="#F59E0B" icon={<CalendarIcon className="w-7 h-7" />} />
                <StatCard title="Field Manpower" value={users.filter(u => u.role === 'Site Head').length} color="#10B981" icon={<ZapIcon className="w-7 h-7" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Active Projects List */}
                <Card className="lg:col-span-8 luxury-glass !p-0 overflow-hidden !rounded-[48px] border-slate-100 shadow-premium">
                    <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <BuildingOffice2Icon className="w-5 h-5 text-brand-blue" />
                            Site Execution Registry
                        </h2>
                    </div>
                    <div className="p-8 space-y-4">
                        {executionProjects.length > 0 ? (
                            executionProjects.map(project => {
                                const designer = findUserById(project.designerId);
                                return (
                                    <Link to={`/projects/${project.id}`} key={project.id} className="block group bg-white p-6 rounded-[32px] border border-slate-100 hover:border-brand-gold/20 transition-all hover:shadow-premium">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-brand-blue transition-colors">{project.title}</h4>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 text-slate-400"><MapPinIcon className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-widest">{project.address}</span></div>
                                                    <div className="h-3 w-px bg-slate-100"></div>
                                                    <UserNameDisplay user={designer} showAvatar={true} textClassName="text-[10px] font-black text-slate-500 uppercase tracking-widest" imageSize="w-6 h-6" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-display font-black text-slate-900">{project.progress}%</span>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[4px]">Stage Evolution</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden ring-1 ring-slate-50">
                                            <div className="bg-brand-blue h-full rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </Link>
                                )
                            })
                        ) : (
                            <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[5px] text-xs">No active execution sites logged.</div>
                        )}
                    </div>
                </Card>

                {/* Logistics & Schedule Column */}
                <div className="lg:col-span-4 space-y-10">
                    <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium bg-slate-900">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[5px] mb-8">Site Visit Agenda</h3>
                        <div className="space-y-4">
                            {upcomingVisits.map(visit => {
                                const project = projects.find(p => p.id === visit.projectId);
                                return (
                                     <div key={visit.id} className="bg-white/5 p-5 rounded-[28px] border border-white/5 group hover:border-brand-gold/30 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-slate-900 transition-all">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{new Date(visit.scheduledAt).toLocaleDateString()}</p>
                                                <p className="text-xs font-black text-white uppercase tracking-widest mt-1">{new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-white uppercase tracking-tight text-sm truncate">{project?.title}</p>
                                     </div>
                                )
                            })}
                            {upcomingVisits.length === 0 && (
                                <p className="text-center text-white/20 font-black uppercase tracking-widest text-[9px] py-10">Agenda Clear</p>
                            )}
                        </div>
                    </Card>

                    <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Quick Actions</h3>
                        <div className="space-y-4">
                            <button className="w-full bg-slate-50 hover:bg-slate-100 p-5 rounded-2xl flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-3"><ClockIcon className="w-5 h-5 text-brand-blue" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Shift Logs</span></div>
                                <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition-colors" />
                            </button>
                            <button className="w-full bg-slate-50 hover:bg-slate-100 p-5 rounded-2xl flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-3"><AlertTriangleIcon className="w-5 h-5 text-accent-danger" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Site Snags</span></div>
                                <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition-colors" />
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SiteHeadDashboard;
