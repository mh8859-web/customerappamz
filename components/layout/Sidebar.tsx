import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { HomeIcon, BriefcaseIcon, UsersIcon, SettingsIcon, LogOutIcon, LifeBuoyIcon, ClockIcon, CalendarIcon, ClipboardIcon, TrendingUpIcon, CreditCardIcon, UserCircleIcon, LayoutGridIcon, PieChartIcon, UserGroupIcon, DownloadIcon, PhotoIcon, InfoIcon, MessageSquareIcon, ChevronDoubleLeftIcon } from '../icons.tsx';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, isCollapsed, toggleCollapsed }) => {
  const { user, logout } = useAuth();
  const { unreadCounts } = useData();
  
  const totalUnreadCount = useMemo(() => 
    Object.values(unreadCounts).reduce((sum, count) => sum + count, 0), 
    [unreadCounts]
  );
  
  const baseLinkClasses = "flex items-center p-3 my-1 rounded-full font-semibold transition-colors duration-200 group";
  const inactiveLinkClasses = "text-text-primary hover:bg-secondary";
  const activeLinkClasses = "bg-secondary text-text-primary";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses} ${isCollapsed ? 'justify-center' : ''}`;

  const getMessagesNavItem = (unreadCount: number) => ({
    to: '/chat',
    icon: <MessageSquareIcon className="w-6 h-6 flex-shrink-0" />,
    label: (
        <div className="flex justify-between items-center w-full">
            <span>Messages</span>
            {unreadCount > 0 && (
                <span className="bg-brand-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                </span>
            )}
        </div>
    )
  });

  const navItems = useMemo(() => {
    if (!user) return {};
    const roles = {
      Admin: [
        { to: '/admin/dashboard', icon: <HomeIcon className="w-6 h-6 flex-shrink-0" />, label: 'Dashboard' },
        { to: '/admin/overview', icon: <TrendingUpIcon className="w-6 h-6 flex-shrink-0" />, label: 'Overview' },
        getMessagesNavItem(totalUnreadCount),
        { to: '/project-wall', icon: <PhotoIcon className="w-6 h-6 flex-shrink-0" />, label: 'Project Wall' },
        { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6 flex-shrink-0" />, label: 'Projects' },
        { to: '/admin/users', icon: <UsersIcon className="w-6 h-6 flex-shrink-0" />, label: 'User Management' },
        { to: '/admin/attendance', icon: <ClockIcon className="w-6 h-6 flex-shrink-0" />, label: 'Attendance' },
        { to: '/admin/reports', icon: <PieChartIcon className="w-6 h-6 flex-shrink-0" />, label: 'Financial Reports' },
        { to: '/downloads', icon: <DownloadIcon className="w-6 h-6 flex-shrink-0" />, label: 'Downloads' },
        { to: '/account', icon: <UserCircleIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Account' },
        { to: '/support', icon: <LifeBuoyIcon className="w-6 h-6 flex-shrink-0" />, label: 'Support Tickets' },
        { to: '/admin/settings', icon: <SettingsIcon className="w-6 h-6 flex-shrink-0" />, label: 'Settings' },
        { to: '/about', icon: <InfoIcon className="w-6 h-6 flex-shrink-0" />, label: 'About' },
      ],
      Designer: [
        { to: '/designer/dashboard', icon: <HomeIcon className="w-6 h-6 flex-shrink-0" />, label: 'Dashboard' },
        getMessagesNavItem(totalUnreadCount),
        { to: '/project-wall', icon: <PhotoIcon className="w-6 h-6 flex-shrink-0" />, label: 'Project Wall' },
        { to: '/projects', icon: <BriefcaseIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Projects' },
        { to: '/designer/task-board', icon: <LayoutGridIcon className="w-6 h-6 flex-shrink-0" />, label: 'Task Board' },
        { to: '/designer/my-calendar', icon: <CalendarIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Calendar' },
        { to: '/designer/team-calendar', icon: <UserGroupIcon className="w-6 h-6 flex-shrink-0" />, label: 'Team Calendar' },
        { to: '/designer/daily-work', icon: <ClipboardIcon className="w-6 h-6 flex-shrink-0" />, label: 'Daily Work' },
        { to: '/designer/my-attendance', icon: <ClockIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Attendance' },
        { to: '/designer/leave', icon: <CalendarIcon className="w-6 h-6 flex-shrink-0" />, label: 'Leave' },
        { to: '/account', icon: <UserCircleIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Account' },
        { to: '/about', icon: <InfoIcon className="w-6 h-6 flex-shrink-0" />, label: 'About' },
      ],
      Customer: [
        { to: '/customer/dashboard', icon: <HomeIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Project' },
        getMessagesNavItem(totalUnreadCount),
        { to: '/project-wall', icon: <PhotoIcon className="w-6 h-6 flex-shrink-0" />, label: 'Project Wall' },
        { to: '/account', icon: <UserCircleIcon className="w-6 h-6 flex-shrink-0" />, label: 'My Account' },
        { to: '/about', icon: <InfoIcon className="w-6 h-6 flex-shrink-0" />, label: 'About' },
      ],
    };
    return roles;
  }, [user, totalUnreadCount]);

  const userNavItems = user ? (navItems[user.role] || []) : [];
  
  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside 
        className={`fixed md:relative z-30 md:z-auto inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-72'} bg-surface flex-shrink-0 transition-all duration-300 ease-in-out border-r border-border-color/50 flex flex-col`}
      >
        <div className={`flex items-center h-20 px-6 flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="Logo" className={`${isCollapsed ? 'h-8' : 'h-10'}`} />
        </div>
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {userNavItems.map(item => (
            <NavLink end key={item.to} to={item.to} className={getNavLinkClass} onClick={() => setSidebarOpen(false)}>
              {item.icon}
              {!isCollapsed && <span className="ml-4 text-base w-full">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={`px-2 py-4 border-t border-border-color/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button onClick={handleLogout} className={`${baseLinkClasses} ${inactiveLinkClasses} w-full ${isCollapsed ? 'justify-center' : ''}`}>
              <LogOutIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="ml-4 font-semibold text-base">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;