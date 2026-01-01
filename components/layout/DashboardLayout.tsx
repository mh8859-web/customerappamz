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
        <div className="mb-10 animate-reveal">
            <div className={`rounded-[40px] overflow-hidden shadow-premium relative ${isAwaitingVerification ? 'bg-slate-900' : 'bg-gradient-to-r from-[#E11D48] to-[#BE123C]'} p-8 md:p-12 border border-white/10`}>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8 text-white">
                        <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl ${isAwaitingVerification ? 'bg-brand-gold text-slate-900' : 'bg-white text-[#E11D48]'}`}>
                            {isAwaitingVerification ? <ClockIcon className="w-10 h-10 animate-spin-slow" /> : <AlertTriangleIcon className="w-10 h-10" />}
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight leading-none">
                                {isAwaitingVerification ? 'Awaiting Verification' : 'Immediate Action Required'}
                            </h3>
                            <p className="text-sm font-medium text-white/70 uppercase tracking-[3px] mt-3 font-sans">
                                {isAwaitingVerification 
                                    ? 'PROJECT TEAM IS CONFIRMING YOUR PAYMENT. ACCESS WILL BE RESTORED SOON.' 
                                    : `MANDATORY SETTLEMENT: ${activeMilestone.title}`}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                        {!isAwaitingVerification && (
                            <div className="text-center sm:text-right px-6">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[4px]">DUE AMOUNT</p>
                                <p className="text-4xl md:text-5xl font-display font-extrabold text-white tracking-tighter">₹{activeMilestone.amountDisplay.toLocaleString()}</p>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {isAwaitingVerification ? (
                               <div className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <CheckCircleIcon className="w-5 h-5 text-brand-gold" />
                                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-brand-gold font-display">Notification Sent</span>
                               </div>
                            ) : (
                                <>
                                    <Button 
                                        onClick={handleMarkAsPaid} 
                                        disabled={isVerifying}
                                        variant="secondary" 
                                        className="!flex-1 sm:!flex-none !bg-white/10 !text-white !border-white/20 !rounded-full !px-10 !py-4 !text-[11px] !font-bold uppercase tracking-widest hover:!bg-white/20 transition-all font-display"
                                    >
                                        I Paid
                                    </Button>
                                    <Link to="/customer/dashboard" className="flex-1 sm:flex-none">
                                        <Button className="!w-full !bg-white !text-[#E11D48] hover:!bg-slate-50 !rounded-full !px-12 !py-4 !text-[11px] !font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all font-display">
                                            Pay Now
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
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
                        <span className="text-[10px] font-sans">{link.label}</span>
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
    <div className="flex h-screen bg-page-bg text-text-primary overflow-hidden">
      <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          isCollapsed={isSidebarCollapsed}
          toggleCollapsed={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 relative overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} toggleSidebarCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)} isSidebarCollapsed={isSidebarCollapsed} />
          
          <main className="p-4 md:p-10 flex-1 overflow-y-auto pb-24 md:pb-12 no-scrollbar">
            <div className="max-w-7xl mx-auto w-full">
                {/* Payment Alert now integrated inside main content area */}
                <PaymentAlertBanner />
                <div className="animate-reveal">
                    {children}
                </div>
            </div>
          </main>

          <MobileDock />
      </div>
    </div>
  );
};

export default DashboardLayout;