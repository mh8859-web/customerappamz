import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SearchIcon, BellIcon, MenuIcon, ChevronDownIcon, UserCircleIcon, LogOutIcon, ChevronDoubleLeftIcon } from '../icons';
import { Link, useNavigate } from 'react-router-dom';
import UserNameDisplay from '../ui/UserNameDisplay';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, toggleSidebarCollapse, isSidebarCollapsed }) => {
  const { user, logout, isImpersonating, stopImpersonation, impersonatedUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isImpersonating && (
        <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-semibold">
          You are currently viewing as {impersonatedUser?.fullName}. 
          <button onClick={stopImpersonation} className="ml-2 font-bold underline">Return to Admin View</button>
        </div>
      )}
      <header className="sticky top-0 z-10 h-20 px-4 md:px-8 bg-surface/80 backdrop-blur-sm border-b border-border-color/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-primary"
            onClick={() => setSidebarOpen(true)}
            aria-controls="sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            className="hidden md:block text-text-primary p-2 rounded-full hover:bg-secondary"
            onClick={toggleSidebarCollapse}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="relative hidden lg:block">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="search"
              placeholder="Search projects, users..."
              className="w-80 bg-secondary border-2 border-transparent rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-full hover:bg-secondary text-text-secondary hover:text-text-primary transition-colors">
            <BellIcon className="w-6 h-6" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2"
            >
              <img
                src={user?.avatarUrl}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="hidden md:block text-left">
                <UserNameDisplay user={user} showAvatar={false} textClassName='text-sm font-semibold text-text-primary' />
                <p className="text-xs text-text-secondary">{user?.role}</p>
              </div>
              <ChevronDownIcon className="w-5 h-5 text-text-secondary hidden md:block" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border-color rounded-xl shadow-card z-20 py-1">
                <Link to="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-secondary">
                  <UserCircleIcon className="w-5 h-5" />
                  My Account
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-secondary">
                  <LogOutIcon className="w-5 h-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;