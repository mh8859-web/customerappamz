
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  HomeIcon, BriefcaseIcon, UsersIcon, SettingsIcon, LogOutIcon, 
  ClockIcon, PieChartIcon, MessageSquareIcon, LayoutGridIcon, 
  CreditCardIcon, ClipboardIcon, CalendarIcon, LifeBuoyIcon,
  ChevronDoubleLeftIcon, PhotoIcon, DownloadIcon, UserCircleIcon, 
  TrendingUpIcon, InfoIcon, ZapIcon
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
  
  const baseLinkClasses = "flex items-center px-4 py-3.5 my-1 rounded-xl font-bold text-[13px] transition-all duration-300 group relative";
  const inactiveLinkClasses = "text-slate-500 hover:bg-white hover:text-brand-blue hover:shadow-sm";
  const activeLinkClasses = "bg-white text-brand-blue shadow-sm ring-1 ring-slate-200/50";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses} ${isCollapsed ? 'justify-center' : ''}`;

  const navItems = useMemo(() => {
    if (!user) return { main: [], secondary: [] };
    
    const items: Record<string, { main: any[], secondary: any[] }> = {
      Admin: {
        main: [
          { to: '/admin/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/admin/overview', icon: <TrendingUpIcon className="w-5 h-5" />, label: 'Overview' },
          { to: '/admin/work-tracking', icon: <ZapIcon className="w-5 h-5" />, label: 'Designer Pulse' },
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
      Designer: {
        main: [
          { to: '/designer/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Workspace' },
          { to: '/designer/current-works', icon: <ZapIcon className="w-5 h-5" />, label: 'Current Works' },
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
    return items[user.role] || items['Admin'];
  }, [user]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside 
        className={`fixed md:relative z-50 md:z-auto inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-24' : 'w-72'} bg-slate-50 border-r border-slate-200 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        <div className={`flex items-center h-24 px-8 border-b border-slate-200/60 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <img 
                src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                alt="AMAZ" 
                className="h-6" 
              />
              <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-[4px] mt-1.5 opacity-80">Modular Studio</span>
            </div>
          )}
          <button onClick={toggleCollapsed} className="hidden md:flex p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 transition-all shadow-sm">
             <ChevronDoubleLeftIcon className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 overflow-y-auto pt-8 custom-scrollbar pb-8">
          <div className="space-y-1">
            {navItems.main.map(item => (
              <NavLink 
                end 
                key={item.to} 
                to={item.to} 
                className={getNavLinkClass} 
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-blue'}`}>
                      {item.icon}
                    </div>
                    {!isCollapsed && <span className="ml-3.5 truncate">{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <div className="absolute left-[-1rem] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-gold rounded-r-full shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
                    )}
                    {(item.label === 'Messages' || item.label === 'Chat') && totalUnreadCount > 0 && !isCollapsed && (
                        <span className="ml-auto bg-brand-blue text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-lg">
                            {totalUnreadCount}
                        </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
          {!isCollapsed && <div className="my-6 border-t border-slate-200/60 mx-4" />}
          <div className="space-y-1">
            {navItems.secondary.map(item => (
              <NavLink 
                end 
                key={item.to} 
                to={item.to} 
                className={getNavLinkClass} 
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-blue'}`}>
                      {item.icon}
                    </div>
                    {!isCollapsed && <span className="ml-3.5 truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className={`p-6 mt-auto border-t border-slate-200/60 bg-slate-100/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
           <button onClick={logout} className={`${baseLinkClasses} !bg-white/80 border border-slate-200/50 text-slate-500 hover:!bg-red-50 hover:!text-accent-danger hover:!border-red-100 w-full shadow-sm`}>
              <LogOutIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3.5 font-black uppercase tracking-widest text-[11px]">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
