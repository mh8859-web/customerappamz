import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, BriefcaseIcon, UsersIcon, SettingsIcon, LogOutIcon, LifeBuoyIcon, ClockIcon, CalendarIcon, ClipboardIcon, TrendingUpIcon, CreditCardIcon, UserCircleIcon, LayoutGridIcon, PieChartIcon, ChatBubbleOvalLeftEllipsisIcon, UserGroupIcon, DownloadIcon, PhotoIcon, TrashIcon } from '../icons';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  
  const baseLinkClasses = "flex items-center p-3 my-1 rounded-full font-semibold transition-colors duration-200 group";
  const inactiveLinkClasses = "text-text-primary hover:bg-secondary";
  const activeLinkClasses = "bg-secondary text-text-primary";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  const navItems = {
    Admin: [
      { to: '/', icon: <HomeIcon className="w-6 h-6" />, label: 'Dashboard' },
      { to: '/overview', icon: <TrendingUpIcon className="w-6 h-6" />, label: 'Overview' },
      { to: '/hub', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />, label: 'Community Hub' },
      { to: '/project-wall', icon: <PhotoIcon className="w-6 h-6" />, label: 'Project Wall' },
      { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6" />, label: 'Projects' },
      { to: '/users', icon: <UsersIcon className="w-6 h-6" />, label: 'User Management' },
      { to: '/attendance', icon: <ClockIcon className="w-6 h-6" />, label: 'Attendance' },
      { to: '/reports', icon: <PieChartIcon className="w-6 h-6" />, label: 'Financial Reports' },
      { to: '/downloads', icon: <DownloadIcon className="w-6 h-6" />, label: 'Downloads' },
      { to: '/account', icon: <UserCircleIcon className="w-6 h-6" />, label: 'My Account' },
      { to: '/support', icon: <LifeBuoyIcon className="w-6 h-6" />, label: 'Support Tickets' },
      { to: '/settings', icon: <SettingsIcon className="w-6 h-6" />, label: 'Settings' },
      { to: '/cache', icon: <TrashIcon className="w-6 h-6" />, label: 'Cache' },
    ],
    Designer: [
      { to: '/', icon: <HomeIcon className="w-6 h-6" />, label: 'Dashboard' },
      { to: '/hub', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />, label: 'Community Hub' },
      { to: '/project-wall', icon: <PhotoIcon className="w-6 h-6" />, label: 'Project Wall' },
      { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6" />, label: 'My Projects' },
      { to: '/task-board', icon: <LayoutGridIcon className="w-6 h-6" />, label: 'Task Board' },
      { to: '/my-calendar', icon: <CalendarIcon className="w-6 h-6" />, label: 'My Calendar' },
      { to: '/team-calendar', icon: <UserGroupIcon className="w-6 h-6" />, label: 'Team Calendar' },
      { to: '/daily-work', icon: <ClipboardIcon className="w-6 h-6" />, label: 'Daily Work' },
      { to: '/my-attendance', icon: <ClockIcon className="w-6 h-6" />, label: 'My Attendance' },
      { to: '/leave', icon: <CalendarIcon className="w-6 h-6" />, label: 'Leave' },
      { to: '/downloads', icon: <DownloadIcon className="w-6 h-6" />, label: 'Downloads' },
      { to: '/account', icon: <UserCircleIcon className="w-6 h-6" />, label: 'My Account' },
      { to: '/support', icon: <LifeBuoyIcon className="w-6 h-6" />, label: 'Support' },
    ],
    Customer: [
      { to: '/', icon: <HomeIcon className="w-6 h-6" />, label: 'My Project' },
      { to: '/hub', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />, label: 'Community Hub' },
      { to: '/project-wall', icon: <PhotoIcon className="w-6 h-6" />, label: 'Project Wall' },
      { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6" />, label: 'Project Archive' },
      { to: '/billing', icon: <CreditCardIcon className="w-6 h-6" />, label: 'Billing History' },
      { to: '/downloads', icon: <DownloadIcon className="w-6 h-6" />, label: 'Downloads' },
      { to: '/account', icon: <UserCircleIcon className="w-6 h-6" />, label: 'My Account' },
      { to: '/support', icon: <LifeBuoyIcon className="w-6 h-6" />, label: 'Help & Support' },
    ],
  };

  const userNavItems = user ? navItems[user.role] : [];
  
  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
           onClick={() => setSidebarOpen(false)}>
      </div>
      <div className={`fixed md:relative z-30 md:z-auto inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-72 bg-surface flex-shrink-0 transition-transform duration-300 ease-in-out border-r border-border-color/50`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center h-20 px-6">
            <img 
              src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
              alt="AMAZ Interiors PM Logo" 
              className="h-10" 
            />
          </div>
          <nav className="flex-1 px-4 py-4">
            {userNavItems.map(item => (
              <NavLink end key={item.to} to={item.to} className={getNavLinkClass} onClick={() => setSidebarOpen(false)}>
                {item.icon}
                <span className="ml-4 text-base">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="px-4 py-4">
            <button onClick={logout} className={`${baseLinkClasses} ${inactiveLinkClasses} w-full`}>
                <LogOutIcon className="w-6 h-6" />
                <span className="ml-4 font-semibold text-base">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;