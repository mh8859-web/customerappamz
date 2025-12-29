import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  HomeIcon, BriefcaseIcon, UsersIcon, SettingsIcon, LogOutIcon, 
  ClockIcon, PieChartIcon, MessageSquareIcon, LayoutGridIcon, 
  CreditCardIcon, ClipboardIcon, CalendarIcon, LifeBuoyIcon,
  ChevronDoubleLeftIcon, PhotoIcon, DownloadIcon, UserCircleIcon, 
  TrendingUpIcon, InfoIcon
} from '../icons';

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
  
  const baseLinkClasses = "flex items-center px-4 py-3 my-0.5 rounded-xl font-semibold text-[13px] transition-all duration-300 group relative";
  const inactiveLinkClasses = "text-text-secondary hover:bg-slate-50 hover:text-brand-blue";
  const activeLinkClasses = "active-nav-link";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses} ${isCollapsed ? 'justify-center' : ''}`;

  const navItems = useMemo(() => {
    if (!user) return { main: [], secondary: [] };
    
    const items: Record<string, { main: any[], secondary: any[] }> = {
      Admin: {
        main: [
          { to: '/admin/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/admin/overview', icon: <TrendingUpIcon className="w-5 h-5" />, label: 'Overview' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Messages' },
          { to: '/project-wall', icon: <PhotoIcon className="w-5 h-5" />, label: 'Project Wall' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Projects' },
          { to: '/admin/users', icon: <UsersIcon className="w-5 h-5" />, label: 'User Management' },
          { to: '/admin/attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Attendance' },
          { to: '/admin/reports', icon: <PieChartIcon className="w-5 h-5" />, label: 'Financial Reports' },
          { to: '/downloads', icon: <DownloadIcon className="w-5 h-5" />, label: 'Downloads' },
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
          { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Support Tickets' },
        ],
        secondary: [
          { to: '/admin/settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      },
      'Sub-Admin': {
        main: [
          { to: '/admin/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/admin/overview', icon: <TrendingUpIcon className="w-5 h-5" />, label: 'Operations' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Messages' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Projects' },
          { to: '/admin/users', icon: <UsersIcon className="w-5 h-5" />, label: 'Team' },
          { to: '/admin/attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Attendance' },
          { to: '/admin/reports', icon: <PieChartIcon className="w-5 h-5" />, label: 'Financials' },
          { to: '/downloads', icon: <DownloadIcon className="w-5 h-5" />, label: 'Downloads' },
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
          { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Support' },
        ],
        secondary: [
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      },
      Designer: {
        main: [
          { to: '/designer/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Workspace' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'My Designs' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Team Chat' },
          { to: '/designer/task-board', icon: <LayoutGridIcon className="w-5 h-5" />, label: 'Task Board' },
          { to: '/designer/daily-work', icon: <ClipboardIcon className="w-5 h-5" />, label: 'Work Diary' },
          { to: '/designer/my-attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Attendance' },
          { to: '/designer/leave', icon: <CalendarIcon className="w-5 h-5" />, label: 'Leave' },
          { to: '/downloads', icon: <DownloadIcon className="w-5 h-5" />, label: 'Downloads' },
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
          { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Support' },
        ],
        secondary: [
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      },
      Customer: {
        main: [
          { to: '/customer/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'My Home' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'History' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Messages' },
          { to: '/customer/billing', icon: <CreditCardIcon className="w-5 h-5" />, label: 'Billing' },
          { to: '/downloads', icon: <DownloadIcon className="w-5 h-5" />, label: 'Downloads' },
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
          { to: '/support', icon: <LifeBuoyIcon className="w-5 h-5" />, label: 'Help & Support' },
        ],
        secondary: [
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      }
    };

    // Use Admin as fallback for Heads if not explicitly defined to ensure they always see menus
    return items[user.role] || items['Admin'];
  }, [user]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside 
        className={`fixed md:relative z-50 md:z-auto inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col shadow-soft`}
      >
        {/* Logo Section */}
        <div className={`flex items-center h-20 px-6 border-b border-slate-50 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <img 
                src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                alt="AMAZ" 
                className="h-5" 
              />
              <span className="text-[9px] font-bold text-brand-gold uppercase tracking-[3px] mt-1">Modular</span>
            </div>
          )}
          <button onClick={toggleCollapsed} className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-brand-blue transition-colors">
             <ChevronDoubleLeftIcon className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-3 overflow-y-auto pt-6 custom-scrollbar pb-6">
          <div className="space-y-0.5">
            {navItems.main.map(item => (
              <NavLink 
                end 
                key={item.to} 
                to={item.to} 
                className={getNavLinkClass} 
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex-shrink-0 opacity-70 group-[.active-nav-link]:opacity-100">{item.icon}</div>
                {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                {(item.label === 'Messages' || item.label === 'Chat') && totalUnreadCount > 0 && !isCollapsed && (
                    <span className="ml-auto bg-brand-blue text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {totalUnreadCount}
                    </span>
                )}
              </NavLink>
            ))}
          </div>

          {!isCollapsed && <div className="my-4 border-t border-slate-50 mx-2" />}

          <div className="space-y-0.5">
            {navItems.secondary.map(item => (
              <NavLink 
                end 
                key={item.to} 
                to={item.to} 
                className={getNavLinkClass} 
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex-shrink-0 opacity-60 group-[.active-nav-link]:opacity-100">{item.icon}</div>
                {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className={`p-4 mt-auto border-t border-slate-50 ${isCollapsed ? 'flex justify-center' : ''}`}>
           <button onClick={logout} className={`${baseLinkClasses} text-slate-400 hover:bg-red-50 hover:text-accent-danger w-full`}>
              <LogOutIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 font-bold">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;