
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Project, Milestone } from '../../types';
import Card from '../../components/ui/Card';
import PaymentModal from '../../components/customer/PaymentReminderModal';
import TestimonialFlow from '../../components/dashboard/TestimonialFlow';
// --- FIX: Added FileTextIcon to imports ---
import { DownloadIcon, MegaphoneIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon } from '../../components/icons';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { useData } from '../../context/DataContext';

const CustomerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { findUserById, loading: usersLoading } = useUsers();
    const { projects, milestones, announcements, refetchData, loading: dataLoading } = useData();
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

    const isLoading = usersLoading || dataLoading;

    const { project, projectMilestones, designer, admin } = useMemo(() => {
        if (!user) return { project: null, projectMilestones: [], designer: null, admin: null };
        const myProject = projects.find(p => p.customerId === user.id && p.status === 'Active');
        const projectMilestonesData = myProject ? milestones.filter(m => m.projectId === myProject.id) : [];
        const projectDesigner = myProject ? findUserById(myProject.designerId) : null;
        const projectAdmin = myProject ? findUserById(myProject.adminId) : null;
        return { project: myProject, projectMilestones: projectMilestonesData, designer: projectDesigner, admin: projectAdmin };
    }, [user, projects, milestones, findUserById]);
    
    const overdueMilestone = useMemo(() => {
        return projectMilestones.find(m => m.statusDisplay === 'Completed');
    }, [projectMilestones]);

    const completedProject = useMemo(() => {
        if (!user) return null;
        return projects.find(p => p.customerId === user.id && p.status === 'Completed' && p.stage === 'completed');
    }, [user, projects]);
    
    const latestAnnouncement = announcements
      .filter(a => a.target === 'Customers' || a.target === 'All')
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    useEffect(() => {
        if (overdueMilestone) {
            setSelectedMilestone(overdueMilestone);
            setPaymentModalOpen(true);
        }
    }, [overdueMilestone]);
    
    const handlePayNow = (milestone: Milestone) => {
        setSelectedMilestone(milestone);
        setPaymentModalOpen(true);
    };

    const handlePaymentComplete = async (milestoneId: string) => {
        // In a real app, this would be an API call
        // For now, we simulate and refetch
        const milestone = projectMilestones.find(m => m.id === milestoneId);
        if (milestone) {
            milestone.statusDisplay = 'Paid';
            milestone.paidDateDisplay = new Date().toISOString().split('T')[0];
            await refetchData(); // refetch to simulate update
        }
    };
    
    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse-fast">
                <div className="h-8 bg-secondary rounded w-1/2"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-40 bg-secondary rounded-2xl"></div>
                        <div className="h-32 bg-secondary rounded-2xl"></div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="h-32 bg-secondary rounded-2xl"></div>
                        <div className="h-24 bg-secondary rounded-2xl"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (completedProject) {
        return <TestimonialFlow project={completedProject} />;
    }

    if (!project) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold font-display text-text-primary">Welcome, {user?.fullName}!</h1>
                <p className="text-text-secondary mt-2">You do not have any active projects at the moment.</p>
                <Button className="mt-4" onClick={() => window.location.hash = '/projects'}>View Projects History</Button>
            </div>
        );
    }
    
    const totalPaid = projectMilestones.filter(m => m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);

    return (
        <>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                milestone={selectedMilestone}
                onPaymentSuccess={handlePaymentComplete}
            />
            <div className="space-y-8">
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Dashboard Portal</h1>
                 
                 {/* URGE PAYMENT: Overdue Milestone Alert */}
                 {overdueMilestone && (
                    <Card className="!p-8 bg-red-600 border-none rounded-[32px] shadow-button ring-4 ring-red-500/20 animate-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-6 text-white">
                                <div className="w-16 h-16 rounded-2xl bg-white text-red-600 flex items-center justify-center shadow-lg animate-pulse">
                                    <AlertTriangleIcon className="w-9 h-9" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Payment Milestone Due</h3>
                                    <p className="text-sm font-bold text-white/80 uppercase tracking-[2px] mt-1">Pending: {overdueMilestone.title}</p>
                                </div>
                            </div>
                            <div className="text-center md:text-right text-white">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[3px]">Requested Amount</p>
                                <p className="text-4xl font-display font-black">₹{overdueMilestone.amountDisplay.toLocaleString()}</p>
                            </div>
                            <Button 
                                onClick={() => handlePayNow(overdueMilestone)} 
                                className="!bg-white !text-red-600 hover:!bg-slate-100 !rounded-full !px-12 !py-5 !font-black uppercase tracking-[4px] shadow-lg active:scale-95 transition-all"
                            >
                                PAY NOW
                            </Button>
                        </div>
                    </Card>
                 )}

                 {latestAnnouncement && (
                    <Card className="!p-6 bg-brand-blue/5 border-brand-blue/10 flex items-start gap-4">
                        <MegaphoneIcon className="w-6 h-6 text-brand-blue flex-shrink-0 mt-1"/>
                        <div>
                            <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest mb-1">AMAZ Broadcast</h3>
                            <p className="text-sm text-slate-700 font-medium">{latestAnnouncement.content}</p>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="luxury-glass">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-[10px] font-black text-brand-gold uppercase tracking-[3px]">Active Commision</span>
                                    <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight mt-1 uppercase">{project.title}</h2>
                                </div>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">Phase: {project.stage.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{project.description}</p>
                            <Link to={`/projects/${project.id}`}>
                                <Button className="!rounded-full !px-8 !bg-slate-900 !text-[11px] uppercase !font-black tracking-widest shadow-button">Access Project Terminal &rarr;</Button>
                            </Link>
                        </Card>
                         <Card className="luxury-glass">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] mb-8">Financial Health</h2>
                             <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563EB" strokeWidth="3" strokeDasharray={`${(totalPaid / project.budgetDisplay) * 100}, 100`} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-display font-black text-slate-900">{Math.round((totalPaid / project.budgetDisplay) * 100)}%</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Settled</span>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Capital Settled</p>
                                        <p className="text-2xl font-display font-black text-slate-900">₹{(totalPaid/100000).toFixed(2)}L</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Allocation</p>
                                        <p className="text-2xl font-display font-black text-slate-900">₹{(project.budgetDisplay/100000).toFixed(2)}L</p>
                                    </div>
                                </div>
                             </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <Card className="luxury-glass">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] mb-6">Creative Team</h2>
                            <div className="space-y-6">
                                {designer && (
                                    <div className="flex items-center gap-4">
                                        <img src={designer.avatarUrl} alt={designer.fullName} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-soft" />
                                        <div>
                                            <UserNameDisplay user={designer} textClassName="font-black text-slate-900 text-sm" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lead Architect</p>
                                        </div>
                                    </div>
                                )}
                                {admin && (
                                     <div className="flex items-center gap-4">
                                        <img src={admin.avatarUrl} alt={admin.fullName} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-soft" />
                                        <div>
                                            <UserNameDisplay user={admin} textClassName="font-black text-slate-900 text-sm" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Relationship Manager</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                         <Card className="luxury-glass">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] mb-6">Asset Repository</h2>
                            <div className="space-y-3">
                                <Button variant="secondary" className="w-full !justify-start !py-4 !px-6 !text-[11px] !font-black uppercase tracking-widest flex gap-3 border-slate-100 hover:bg-slate-50">
                                    <FileTextIcon className="w-5 h-5 text-brand-blue"/> Detailed Quote
                                </Button>
                                <Button variant="secondary" className="w-full !justify-start !py-4 !px-6 !text-[11px] !font-black uppercase tracking-widest flex gap-3 border-slate-100 hover:bg-slate-50">
                                    <DownloadIcon className="w-5 h-5 text-brand-gold"/> Official Bill
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerDashboard;
