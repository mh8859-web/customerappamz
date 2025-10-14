import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, BriefcaseIcon, UsersIcon, SettingsIcon, LogOutIcon, LifeBuoyIcon, ClockIcon, CalendarIcon, ClipboardIcon, TrendingUpIcon, CreditCardIcon, UserCircleIcon, LayoutGridIcon, PieChartIcon } from '../icons';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  
  const baseLinkClasses = "flex items-center p-3 my-1 rounded-lg transition-colors duration-200";
  const inactiveLinkClasses = "text-text-primary font-medium hover:bg-secondary";
  const activeLinkClasses = "bg-accent-blue-light text-accent font-semibold";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  const navItems = {
    Admin: [
      { to: '/', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
      { to: '/overview', icon: <TrendingUpIcon className="w-5 h-5" />, label: 'Overview' },
      { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Projects' },
      { to: '/users', icon: <UsersIcon className="w-5 h-5" />, label: 'User Management' },
      { to: '/attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Attendance' },
      { to: '/reports', icon: <PieChartIcon className="w-5 h-5" />, label: 'Financial Reports' },
      { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
      { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Support Tickets' },
      { to: '/settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings' },
    ],
    Designer: [
      { to: '/', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
      { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'My Projects' },
      { to: '/task-board', icon: <LayoutGridIcon className="w-5 h-5" />, label: 'Task Board' },
      { to: '/my-calendar', icon: <CalendarIcon className="w-5 h-5" />, label: 'My Calendar' },
      { to: '/team-calendar', icon: <UsersIcon className="w-5 h-5" />, label: 'Team Calendar' },
      { to: '/daily-work', icon: <ClipboardIcon className="w-5 h-5" />, label: 'Daily Work' },
      { to: '/my-attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'My Attendance' },
      { to: '/leave', icon: <CalendarIcon className="w-5 h-5" />, label: 'Leave' },
      { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
      { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Support' },
    ],
    Customer: [
      { to: '/', icon: <HomeIcon className="w-5 h-5" />, label: 'My Project' },
      { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Project Archive' },
      { to: '/billing', icon: <CreditCardIcon className="w-5 h-5" />, label: 'Billing History' },
      { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
      { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Help & Support' },
    ],
  };

  const userNavItems = user ? navItems[user.role] : [];
  
  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
           onClick={() => setSidebarOpen(false)}>
      </div>
      <div className={`fixed md:relative z-30 md:z-auto inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 bg-surface flex-shrink-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b border-border-color">
            <img 
              src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
              alt="Aura Interiors PM Logo" 
              className="h-10" 
            />
          </div>
          <nav className="flex-1 px-4 py-4">
            {userNavItems.map(item => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClass} onClick={() => setSidebarOpen(false)}>
                {item.icon}
                <span className="ml-4">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-border-color">
            <button onClick={logout} className={`${baseLinkClasses} ${inactiveLinkClasses} w-full`}>
                <LogOutIcon className="w-5 h-5" />
                <span className="ml-4 font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;