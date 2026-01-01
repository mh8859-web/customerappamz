import React, { useState, ReactNode, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { HomeIcon, BriefcaseIcon, MessageSquareIcon, UserCircleIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon } from '../icons';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { updateRecord, createRecord } from '../../services/api';
import Button from '../ui/Button';

const PaymentAlertBanner = () => {
    const { user } = useAuth();
    const { projects, milestones, refetchData } = useData();
    const [isVerifying, setIsVerifying] = useState(false);

    const activeProject = useMemo(() => {
        if (!user || user.role !== 'Customer') return null;
        return projects.find(p => p.customerId === user.id && p.status === 'Active');
    }, [user, projects]);

    const activeMilestone = useMemo(() => {
        if (!activeProject) return null;
        // Priority check for milestones needing payment
        return milestones.find(m => m.projectId === activeProject.id && (m.statusDisplay === 'Completed' || m.statusDisplay === 'Verifying'));
    }, [activeProject, milestones]);

    const handleMarkAsPaid = async () => {
        if (!activeMilestone || isVerifying) return;
        setIsVerifying(true);
        try {
            await updateRecord('milestones', activeMilestone.id, { status_display: 'Verifying' });
            await createRecord('messages', {
                chat_id: activeProject!.id,
                body: `PAYMENT NOTIFICATION: Client has marked milestone "${activeMilestone.title}" as settled. Awaiting verification from Accounts.`,
                sender_id: user!.id,
                is_system_message: true
            });
            await refetchData();
        } finally {
            setIsVerifying(false);
        }
    };

    if (!activeMilestone) return null;

    const isAwaitingVerification = activeMilestone.statusDisplay === 'Verifying';

    return (
        <div className="p-4 md:p-6 bg-page-bg relative z-[60]">
            <div className={`max-w-6xl mx-auto rounded-[32px] overflow-hidden shadow-premium animate-in ${isAwaitingVerification ? 'bg-slate-900' : 'bg-gradient-to-r from-red-600 to-red-500'} p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5`}>
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center flex-shrink-0 ${isAwaitingVerification ? 'bg-brand-gold text-slate-900' : 'bg-white text-red-600 shadow-xl'}`}>
                        {isAwaitingVerification ? <ClockIcon className="w-8 h-8 animate-spin-slow" /> : <AlertTriangleIcon className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tight text-white">
                            {isAwaitingVerification ? 'AWAITING VERIFICATION' : 'IMMEDIATE ACTION REQUIRED'}
                        </h3>
                        <p className="text-xs font-medium text-white/70 uppercase tracking-widest mt-1.5 font-sans">
                            {isAwaitingVerification 
                                ? 'Project team is confirming your payment. access will be restored soon.' 
                                : `MANDATORY SETTLEMENT: ${activeMilestone.title}`}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {isAwaitingVerification ? (
                       <div className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                            <CheckCircleIcon className="w-5 h-5 text-brand-gold" />
                            <span className="text-[11px] font-bold uppercase tracking-[2px] text-brand-gold font-display">Notification Sent</span>
                       </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="flex-1 flex flex-col justify-center items-center sm:items-end px-6">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[2px]">DUE AMOUNT</p>
                                <p className="text-3xl font-display font-extrabold text-white">₹{activeMilestone.amountDisplay.toLocaleString()}</p>
                            </div>
                            <Button 
                                onClick={handleMarkAsPaid} 
                                disabled={isVerifying}
                                variant="secondary" 
                                className="!bg-white/10 !text-white !border-white/20 !rounded-full !px-8 !py-4 !text-[11px] !font-bold uppercase tracking-widest hover:!bg-white/20 transition-all font-display"
                            >
                                I Paid
                            </Button>
                            <Link to="/customer/dashboard" className="w-full sm:w-auto">
                                <Button className="!w-full !bg-white !text-red-600 hover:!bg-slate-50 !rounded-full !px-10 !py-4 !text-[11px] !font-bold uppercase tracking-widest shadow-lg transition-all font-display">
                                    Pay Now
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MobileDock = () => {
    const location = useLocation();
    const links = [
        { to: '/', icon: <HomeIcon className="w-6 h-6" />, label: 'Home' },
        { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6" />, label: 'Projects' },
        { to: '/chat', icon: <MessageSquareIcon className="w-6 h-6" />, label: 'Chat' },
        { to: '/account', icon: <UserCircleIcon className="w-6 h-6" />, label: 'Profile' },
    ];

    return (
        <div className="md:hidden mobile-dock border-t border-slate-100 bg-white/95 backdrop-blur-md h-20 flex justify-around items-center px-4 fixed bottom-0 left-0 right-0 z-40 shadow-soft">
            {links.map(link => {
                const isActive = link.to === '/' ? location.pathname.includes('/dashboard') || location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                    <NavLink 
                        key={link.to} 
                        to={link.to} 
                        className={`p-2 flex flex-col items-center gap-0.5 transition-all duration-200 ${
                            isActive ? 'text-brand-blue scale-110 font-bold' : 'text-slate-400'
                        }`}
                    >
                        {link.icon}
                        <span className="text-[10px]">{link.label}</span>
                    </NavLink>
                );
            })}
        </div>
    );
};

const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-page-bg text-text-primary overflow-hidden">
      <PaymentAlertBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
            isCollapsed={isSidebarCollapsed}
            toggleCollapsed={() => setSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex flex-col flex-1 relative overflow-hidden">
            <Header setSidebarOpen={setSidebarOpen} toggleSidebarCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)} isSidebarCollapsed={isSidebarCollapsed} />
            <main className="p-4 md:p-8 flex-1 overflow-y-auto pb-24 md:pb-8 no-scrollbar">
            <div className="max-w-6xl mx-auto w-full animate-in">
                {children}
            </div>
            </main>
            <MobileDock />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;