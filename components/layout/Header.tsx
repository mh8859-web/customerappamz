import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SearchIcon, BellIcon, MenuIcon, ChevronDownIcon, UserCircleIcon, LogOutIcon, ChevronDoubleLeftIcon } from '../icons.tsx';
import { Link, useNavigate } from 'react-router-dom';
import UserNameDisplay from '../ui/UserNameDisplay.tsx';

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isImpersonating && (
        <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-semibold">
          Viewing as {impersonatedUser?.fullName}. <button onClick={stopImpersonation} className="ml-2 font-bold underline">Return to Admin</button>
        </div>
      )}
      <header className="sticky top-0 z-10 h-20 px-4 md:px-8 bg-surface/80 backdrop-blur-sm border-b border-border-color/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-text-primary" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="w-6 h-6" />
          </button>
          <button className="hidden md:block text-text-primary p-2 rounded-full hover:bg-secondary" onClick={toggleSidebarCollapse}>
            <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-full hover:bg-secondary text-text-secondary"><BellIcon className="w-6 h-6" /></button>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2">
              <img src={user?.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full" />
              <div className="hidden md:block text-left">
                <UserNameDisplay user={user} showAvatar={false} textClassName='text-sm font-semibold text-text-primary' />
                <p className="text-xs text-text-secondary">{user?.role}</p>
              </div>
              <ChevronDownIcon className="w-5 h-5 text-text-secondary hidden md:block" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border-color rounded-xl shadow-card z-20 py-1">
                <Link to="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-secondary">
                  <UserCircleIcon className="w-5 h-5" /> My Account
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-secondary">
                  <LogOutIcon className="w-5 h-5" /> Logout
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