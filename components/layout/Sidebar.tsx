
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  HomeIcon, BriefcaseIcon, UsersIcon, SettingsIcon, LogOutIcon, 
  ClockIcon, PieChartIcon, MessageSquareIcon, LayoutGridIcon, 
  CreditCardIcon, ClipboardIcon, CalendarIcon, LifeBuoyIcon,
  ChevronDoubleLeftIcon, PhotoIcon, DownloadIcon, UserCircleIcon, 
  TrendingUpIcon, InfoIcon, ZapIcon, DollarSignIcon, PackageIcon,
  ShieldCheckIcon, BuildingIcon, SearchIcon
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
          { to: '/admin/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Executive Home' },
          { to: '/admin/overview', icon: <TrendingUpIcon className="w-5 h-5" />, label: 'Strategic Overview' },
          { to: '/admin/work-tracking', icon: <ZapIcon className="w-5 h-5" />, label: 'Designer Pulse' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Global Messages' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Master Portfolio' },
          { to: '/admin/track-pay', icon: <CreditCardIcon className="w-5 h-5" />, label: 'Payment Sentinel' },
          { to: '/admin/reports', icon: <PieChartIcon className="w-5 h-5" />, label: 'Financial Audit' },
          { to: '/admin/attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Attendance HQ' },
          { to: '/admin/salary-allocation', icon: <DollarSignIcon className="w-5 h-5" />, label: 'Payroll Setup' },
          { to: '/admin/users', icon: <UsersIcon className="w-5 h-5" />, label: 'Identity Index' },
        ],
        secondary: [
          { to: '/admin/settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'System Settings' },
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'System Intel' },
        ]
      },
      'Sub-Admin': {
        main: [
          { to: '/admin/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/admin/overview', icon: <TrendingUpIcon className="w-5 h-5" />, label: 'Operations' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Team Chat' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Active Projects' },
          { to: '/admin/track-pay', icon: <CreditCardIcon className="w-5 h-5" />, label: 'Track Payments' },
          { to: '/admin/attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Field Attendance' },
          { to: '/admin/users', icon: <UsersIcon className="w-5 h-5" />, label: 'Directory' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'Profile' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      },
      'Project Head': {
        main: [
          { to: '/project-head/dashboard', icon: <LayoutGridIcon className="w-5 h-5" />, label: 'Command Center' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Portfolios' },
          { to: '/project-head/dashboard?tab=registry', icon: <ZapIcon className="w-5 h-5" />, label: 'Site Registry' },
          { to: '/project-head/dashboard?tab=approvals', icon: <ShieldCheckIcon className="w-5 h-5" />, label: 'Material Queue' },
          { to: '/project-head/dashboard?tab=ledger', icon: <DollarSignIcon className="w-5 h-5" />, label: 'Budget Sentinel' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Global Channel' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'Profile' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'Guidelines' },
        ]
      },
      'Production Head': {
        main: [
          { to: '/production-head/dashboard', icon: <BuildingIcon className="w-5 h-5" />, label: 'Logistics Master' },
          { to: '/projects', icon: <PackageIcon className="w-5 h-5" />, label: 'Sourcing List' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Supply Chat' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'Profile' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'Factory Specs' },
        ]
      },
      'Site Head': {
        main: [
          { to: '/site-head/dashboard', icon: <ZapIcon className="w-5 h-5" />, label: 'Execution HQ' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Active Sites' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Site Comms' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'Logbook Profile' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'Compliance' },
        ]
      },
      Accounts: {
        main: [
          { to: '/accounts/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Financial HQ' },
          { to: '/admin/reports', icon: <PieChartIcon className="w-5 h-5" />, label: 'Fiscal Audit' },
          { to: '/admin/track-pay', icon: <CreditCardIcon className="w-5 h-5" />, label: 'Collection Hub' },
          { to: '/admin/salary-allocation', icon: <DollarSignIcon className="w-5 h-5" />, label: 'Payroll setup' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Settings' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      },
      Designer: {
        main: [
          { to: '/designer/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Workspace' },
          { to: '/designer/current-works', icon: <ZapIcon className="w-5 h-5" />, label: 'Current Works' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'My Designs' },
          { to: '/designer/task-board', icon: <LayoutGridIcon className="w-5 h-5" />, label: 'Registry' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Team Chat' },
          { to: '/designer/my-attendance', icon: <ClockIcon className="w-5 h-5" />, label: 'Attendance' },
          { to: '/designer/daily-work', icon: <ClipboardIcon className="w-5 h-5" />, label: 'Daily Work' },
          { to: '/designer/leave', icon: <CalendarIcon className="w-5 h-5" />, label: 'Leave' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'My Account' },
          { to: '/about', icon: <InfoIcon className="w-5 h-5" />, label: 'About' },
        ]
      },
      Customer: {
        main: [
          { to: '/customer/dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'My Home' },
          { to: '/projects', icon: <BriefcaseIcon className="w-5 h-5" />, label: 'History' },
          { to: '/customer/billing', icon: <CreditCardIcon className="w-5 h-5" />, label: 'Ledger' },
          { to: '/chat', icon: <MessageSquareIcon className="w-5 h-5" />, label: 'Messages' },
        ],
        secondary: [
          { to: '/account', icon: <UserCircleIcon className="w-5 h-5" />, label: 'Settings' },
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
        className={`fixed md:relative z-50 md:z-auto inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-24' : 'w-72'} bg-slate-50 border-r border-slate-200 transition-all duration-500 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        <div className={`flex items-center h-24 px-8 border-b border-slate-200/60 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ" className="h-6" />
              <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-[4px] mt-1.5 opacity-80">Modular Studio</span>
            </div>
          )}
          <button onClick={toggleCollapsed} className="hidden md:flex p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-blue transition-all">
             <ChevronDoubleLeftIcon className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 overflow-y-auto pt-8 custom-scrollbar pb-8">
          <div className="space-y-1">
            <p className={`px-4 mb-2 text-[9px] font-black uppercase tracking-[3px] text-slate-400 ${isCollapsed ? 'hidden' : 'block'}`}>Core Navigation</p>
            {navItems.main.map(item => (
              <NavLink 
                key={item.label} 
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
                      <div className="absolute left-[-1rem] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-gold rounded-r-full"></div>
                    )}
                    {(item.label === 'Global Messages' || item.label === 'Team Chat' || item.label === 'Global Channel' || item.label === 'Supply Chat') && totalUnreadCount > 0 && !isCollapsed && (
                        <span className="ml-auto bg-brand-blue text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                            {totalUnreadCount}
                        </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
            
            <div className="h-4"></div>
            <p className={`px-4 mb-2 text-[9px] font-black uppercase tracking-[3px] text-slate-400 ${isCollapsed ? 'hidden' : 'block'}`}>System & Identity</p>
            {navItems.secondary.map(item => (
              <NavLink 
                key={item.label} 
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
           <button onClick={logout} className={`${baseLinkClasses} !bg-white/80 border border-slate-200/50 text-slate-500 hover:!text-accent-danger w-full shadow-sm`}>
              <LogOutIcon className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3.5 font-black uppercase tracking-widest text-[11px]">Secure Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
