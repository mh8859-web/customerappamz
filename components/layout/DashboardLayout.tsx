import React, { useState, ReactNode, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { HomeIcon, BriefcaseIcon, MessageSquareIcon, UserCircleIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon } from '../icons';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { updateRecord, createRecord } from '../../services/api';
// --- FIX: Added missing Button import ---
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
        <div className={`${isAwaitingVerification ? 'bg-slate-900' : 'bg-red-600'} text-white py-4 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 animate-in relative z-[60] shadow-premium border-b border-white/10`}>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAwaitingVerification ? 'bg-brand-gold text-slate-900' : 'bg-white text-red-600 shadow-lg'}`}>
                    {isAwaitingVerification ? <ClockIcon className="w-6 h-6 animate-spin-slow" /> : <AlertTriangleIcon className="w-6 h-6" />}
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[3px]">
                        {isAwaitingVerification ? 'Awaiting Verification' : 'Immediate Action Required'}
                    </h3>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
                        {isAwaitingVerification 
                            ? 'Project Team is confirming your settlement. Full access restored shortly.' 
                            : `Mandatory Settlement: ${activeMilestone.title}`}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {isAwaitingVerification ? (
                   <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                        <CheckCircleIcon className="w-4 h-4 text-brand-gold" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">Notification Sent</span>
                   </div>
                ) : (
                    <>
                        <Button 
                            onClick={handleMarkAsPaid} 
                            disabled={isVerifying}
                            variant="secondary" 
                            className="!bg-white/10 !text-white !border-white/20 !rounded-full !px-6 !py-2 !text-[10px] !font-black uppercase tracking-widest hover:!bg-white/20"
                        >
                            I Paid
                        </Button>
                        <Link to="/customer/dashboard">
                            <Button className="!bg-white !text-red-600 hover:!bg-slate-50 !rounded-full !px-8 !py-2.5 !text-[10px] !font-black uppercase tracking-widest shadow-lg">
                                Pay Now
                            </Button>
                        </Link>
                    </>
                )}
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
        <div className="md:hidden mobile-dock border-t border-slate-100 bg-white/95 backdrop-blur-md h-20 flex justify-around items-center px-4 fixed bottom-0 left-0 right-0 z-40 shadow-[0_-10px_25px_-12px_rgba(0,0,0,0.08)]">
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
            <Header 
            setSidebarOpen={setSidebarOpen} 
            toggleSidebarCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
            />
            
            <main className="p-4 md:p-8 flex-1 overflow-y-auto pb-24 md:pb-8">
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