import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { HomeIcon, BriefcaseIcon, MessageSquareIcon, UserCircleIcon } from '../icons';
import { NavLink, useLocation } from 'react-router-dom';

const MobileDock = () => {
    const location = useLocation();
    
    const links = [
        { to: '/', icon: <HomeIcon className="w-6 h-6" />, label: 'Home' },
        { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6" />, label: 'Projects' },
        { to: '/chat', icon: <MessageSquareIcon className="w-6 h-6" />, label: 'Chat' },
        { to: '/account', icon: <UserCircleIcon className="w-6 h-6" />, label: 'Profile' },
    ];

    return (
        <div className="md:hidden mobile-dock">
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
    <div className="flex h-screen bg-page-bg text-text-primary overflow-hidden">
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
  );
};

export default DashboardLayout;