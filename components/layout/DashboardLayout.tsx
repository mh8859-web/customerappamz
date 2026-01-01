
import React, { useState, ReactNode, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { HomeIcon, BriefcaseIcon, MessageSquareIcon, UserCircleIcon, AlertTriangleIcon } from '../icons';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const PaymentAlertBanner = () => {
    const { user } = useAuth();
    const { projects, milestones } = useData();

    const activeProject = useMemo(() => {
        if (!user || user.role !== 'Customer') return null;
        return projects.find(p => p.customerId === user.id && p.status === 'Active');
    }, [user, projects]);

    const overdueMilestone = useMemo(() => {
        if (!activeProject) return null;
        // Find if any milestone marked "Completed" (Invoiced) is not yet "Paid"
        return milestones.find(m => m.projectId === activeProject.id && m.statusDisplay === 'Completed');
    }, [activeProject, milestones]);

    const showAlert = activeProject?.isPaymentAlertActive || !!overdueMilestone;

    if (!showAlert) return null;

    return (
        <div className="bg-red-600 text-white py-3 px-6 flex items-center justify-between animate-pulse-slow relative z-[60] shadow-lg">
            <div className="flex items-center gap-3">
                <AlertTriangleIcon className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-[3px]">Mandatory Settlement Required: Project Phase On Hold</span>
            </div>
            <Link to="/customer/dashboard" className="bg-white text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                View Invoice
            </Link>
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
