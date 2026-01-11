
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Project, Milestone } from '../../types';
import Card from '../../components/ui/Card';
import PaymentModal from '../../components/customer/PaymentReminderModal';
import TestimonialFlow from '../../components/dashboard/TestimonialFlow';
import { DownloadIcon, MegaphoneIcon, CreditCardIcon, AlertTriangleIcon, FileTextIcon, SparklesIcon, CheckCircleIcon, ZapIcon, BellIcon } from '../../components/icons';
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
    
    // Friendly reminder logic
    const friendlyMilestone = useMemo(() => {
        if (!project?.friendlyReminderMilestoneId) return null;
        return projectMilestones.find(m => m.id === project.friendlyReminderMilestoneId);
    }, [project, projectMilestones]);

    const overdueMilestone = useMemo(() => {
        const invoiced = projectMilestones.find(m => m.statusDisplay === 'Completed');
        if (invoiced) return invoiced;

        if (project && projectMilestones.length > 0) {
            const tokenMilestone = projectMilestones.find(m => m.title.includes('10%'));
            if (tokenMilestone && tokenMilestone.statusDisplay === 'Pending') {
                return tokenMilestone;
            }
        }
        return null;
    }, [projectMilestones, project]);

    const completedProject = useMemo(() => {
        if (!user) return null;
        // --- FIX: Corrected 'Completed' to 'completed' to match ProjectStage type ---
        return projects.find(p => p.customerId === user.id && p.status === 'Completed' && p.stage === 'completed');
    }, [user, projects]);
    
    const latestAnnouncement = announcements
      .filter(a => a.target === 'Customers' || a.target === 'All')
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    const handlePayNow = (milestone: Milestone) => {
        setSelectedMilestone(milestone);
        setPaymentModalOpen(true);
    };

    const handlePaymentComplete = async (milestoneId: string) => {
        await refetchData(); 
        setPaymentModalOpen(false);
    };
    
    if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Waking Portals...</div>;

    if (completedProject) return <TestimonialFlow project={completedProject} />;

    if (!project) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-black text-slate-900 uppercase">Welcome, {user?.fullName}</h1>
                <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-sm">Your creative journey hasn't started yet.</p>
                <Link to="/support"><Button className="mt-8 !rounded-full !px-10">Contact Support</Button></Link>
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
            <div className="space-y-8 pb-12">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Dashboard Portal</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-1.5">Project Synchronization Active</p>
                    </div>
                </div>

                {/* Friendly Notification Banner */}
                {friendlyMilestone && !project.isPaymentAlertActive && (
                    <Card className="!p-8 bg-brand-gold/10 border-brand-gold/30 rounded-[32px] animate-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-brand-gold text-slate-900 flex items-center justify-center shadow-lg">
                                    <BellIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Dream Home Care</h3>
                                    <p className="text-sm text-slate-700 font-medium mt-1">
                                        Delay works may affect! Its your dream home we care. <br/> 
                                        Please pay this current threshold <span className="font-bold">({friendlyMilestone.title})</span> as per planned.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">THRESHOLD AMOUNT</p>
                                    <p className="text-2xl font-display font-black text-slate-900 tabular-nums">₹{friendlyMilestone.amountDisplay.toLocaleString()}</p>
                                </div>
                                <Button 
                                    onClick={() => handlePayNow(friendlyMilestone)}
                                    className="!bg-slate-900 !text-white !rounded-full !px-10 !py-3 !text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-button"
                                >
                                    Proceed Settlement
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
                 
                 {overdueMilestone && project.isPaymentAlertActive && (
                    <Card className="!p-10 bg-red-600 border-none rounded-[40px] shadow-button ring-[12px] ring-red-500/10 animate-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse"></div>
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center gap-8 text-white">
                                <div className="w-20 h-20 rounded-[28px] bg-white text-red-600 flex items-center justify-center shadow-2xl animate-bounce-slow">
                                    <AlertTriangleIcon className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Immediate Action Required</h3>
                                    <p className="text-sm font-black text-white/80 uppercase tracking-[3px] mt-3">MANDATORY SETTLEMENT: {overdueMilestone.title}</p>
                                    <div className="mt-4 flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl w-fit border border-white/10">
                                        <ZapIcon className="w-4 h-4 text-brand-gold" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">High-Priority Nudge from Accounts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="text-center md:text-right text-white">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[4px]">DUE AMOUNT</p>
                                    <p className="text-5xl font-display font-black tracking-tighter">₹{overdueMilestone.amountDisplay.toLocaleString()}</p>
                                </div>
                                <Button 
                                    onClick={() => handlePayNow(overdueMilestone)} 
                                    className="!bg-white !text-red-600 hover:!bg-slate-50 !rounded-full !px-16 !py-6 !font-black uppercase tracking-[6px] shadow-2xl active:scale-95 transition-all text-sm"
                                >
                                    PAY NOW
                                </Button>
                            </div>
                        </div>
                    </Card>
                 )}

                 {latestAnnouncement && (
                    <Card className="!p-6 bg-brand-blue/5 border-brand-blue/10 flex items-start gap-4 luxury-glass rounded-[32px]">
                        <MegaphoneIcon className="w-6 h-6 text-brand-blue flex-shrink-0 mt-1"/>
                        <div>
                            <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-[4px] mb-1">AMAZ Global Broadcast</h3>
                            <p className="text-sm text-slate-700 font-bold">{latestAnnouncement.content}</p>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="luxury-glass border-slate-100 rounded-[40px] p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="text-[10px] font-black text-brand-gold uppercase tracking-[4px]">Active Project</span>
                                    <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight mt-2 uppercase">{project.title}</h2>
                                </div>
                                <span className="px-5 py-2 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">Stage: {project.stage.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">{project.description}</p>
                            <Link to={`/projects/${project.id}`}>
                                <Button className="!rounded-full !px-12 !py-5 !bg-slate-900 !text-[12px] uppercase !font-black tracking-[4px] shadow-button hover:scale-105 transition-all">Enter Terminal Interface &rarr;</Button>
                            </Link>
                        </Card>
                        
                        <Card className="luxury-glass border-slate-100 rounded-[40px] p-10">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[5px] mb-10">Financial Evolution</h2>
                             <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray={`${(totalPaid / (project.budgetDisplay || 1)) * 100}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-display font-black text-slate-900">{Math.round((totalPaid / (project.budgetDisplay || 1)) * 100)}%</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Settled</span>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-12 w-full">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Capital Cleared</p>
                                        <p className="text-3xl font-display font-black text-slate-900 tracking-tight">₹{(totalPaid/100000).toFixed(2)}L</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Contract Value</p>
                                        <p className="text-3xl font-display font-black text-slate-900 tracking-tight">₹{(project.budgetDisplay/100000).toFixed(2)}L</p>
                                    </div>
                                </div>
                             </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <Card className="luxury-glass border-slate-100 rounded-[40px] p-8">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Executive Team</h2>
                            <div className="space-y-8">
                                {designer && (
                                    <div className="flex items-center gap-5 group">
                                        <div className="relative">
                                            <img src={designer.avatarUrl} alt={designer.fullName} className="w-16 h-16 rounded-[24px] object-cover ring-4 ring-white shadow-soft transition-all group-hover:scale-110" />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center border-2 border-white"><SparklesIcon className="w-3 h-3 text-white" /></div>
                                        </div>
                                        <div>
                                            <UserNameDisplay user={designer} textClassName="font-black text-slate-900 text-lg" />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mt-1">Architect</p>
                                        </div>
                                    </div>
                                )}
                                {admin && (
                                     <div className="flex items-center gap-5 group">
                                        <div className="relative">
                                            <img src={admin.avatarUrl} alt={admin.fullName} className="w-16 h-16 rounded-[24px] object-cover ring-4 ring-white shadow-soft transition-all group-hover:scale-110" />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center border-2 border-white"><CheckCircleIcon className="w-3 h-3 text-white" /></div>
                                        </div>
                                        <div>
                                            <UserNameDisplay user={admin} textClassName="font-black text-slate-900 text-lg" />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mt-1">Portfolio Manager</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                         <Card className="luxury-glass border-slate-100 rounded-[40px] p-8">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-8">Project Resources</h2>
                            <div className="space-y-4">
                                <Link to="/customer/billing" className="block">
                                    <Button variant="secondary" className="w-full !justify-start !py-5 !px-8 !text-[11px] !font-black uppercase tracking-[3px] flex gap-4 border-slate-100 hover:bg-slate-50 !rounded-2xl transition-all">
                                        <CreditCardIcon className="w-6 h-6 text-brand-blue"/> Invoices & Bills
                                    </Button>
                                </Link>
                                <Link to="/downloads" className="block">
                                    <Button variant="secondary" className="w-full !justify-start !py-5 !px-8 !text-[11px] !font-black uppercase tracking-[3px] flex gap-4 border-slate-100 hover:bg-slate-50 !rounded-2xl transition-all">
                                        <DownloadIcon className="w-6 h-6 text-brand-gold"/> Tech Drawings
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerDashboard;