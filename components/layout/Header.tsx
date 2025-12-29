import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SearchIcon, BellIcon, MenuIcon, ChevronDownIcon, UserCircleIcon, LogOutIcon } from '../icons';
import { Link } from 'react-router-dom';
import UserNameDisplay from '../ui/UserNameDisplay';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <header className="sticky top-0 z-40 h-20 px-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-xl bg-brand-blue text-white shadow-button"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
            <input
              type="search"
              placeholder="Search assets..."
              className="w-64 bg-slate-50 border border-transparent rounded-xl py-2 pl-11 pr-4 text-xs focus:ring-1 focus:ring-brand-blue/20 focus:bg-white focus:border-brand-blue/20 transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-brand-blue transition-all relative">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-blue rounded-full border-2 border-white ring-1 ring-brand-blue/10"></span>
          </button>

          <div className="h-6 w-px bg-slate-100 hidden sm:block"></div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-all group"
            >
              <img
                src={user?.avatarUrl}
                alt="Profile"
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-soft"
              />
              <div className="hidden sm:block text-left">
                <p className="text-[13px] font-bold text-slate-800 leading-tight">{user?.fullName.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{user?.role}</p>
              </div>
              <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-modal z-50 py-2 animate-in">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Profile</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{user?.email}</p>
                </div>
                <Link to="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-blue transition-colors">
                  <UserCircleIcon className="w-4 h-4 opacity-70" />
                  My Settings
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-accent-danger hover:bg-red-50 transition-colors">
                  <LogOutIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
  );
};

export default Header;