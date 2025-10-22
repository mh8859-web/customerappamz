import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SearchIcon, BellIcon, MenuIcon, UserCircleIcon, LogOutIcon, ZapIcon } from '../icons';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';
import UserNameDisplay from '../ui/UserNameDisplay';
import { useData } from '../../context/DataContext';
import { ClockIcon, BriefcaseIcon } from '../icons';

// A simple debounce hook, moved outside the component for performance.
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout, isImpersonating, stopImpersonation, impersonatedUser } = useAuth();
  const { users } = useUsers();
  const { projects, activityLogs } = useData();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ projects: any[], users: any[] }>({ projects: [], users: [] });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const recentActivity = [...activityLogs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  useEffect(() => {
    // Simple unread logic: if there's any activity, show the dot.
    if (activityLogs.length > 0) {
      setHasUnread(true);
    }
  }, [activityLogs]);

  useEffect(() => {
    const savedClockInTime = localStorage.getItem('clockInTime');
    if (savedClockInTime) {
      const time = new Date(savedClockInTime);
      setClockInTime(time);
      setIsClockedIn(true);
    }
  }, []);

  useEffect(() => {
    let timer: number;
    if (isClockedIn && clockInTime) {
      timer = window.setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - clockInTime.getTime();
        const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, clockInTime]);
  
  useEffect(() => {
    if (debouncedSearchQuery.length > 1) {
      const lowercasedQuery = debouncedSearchQuery.toLowerCase();
      const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(lowercasedQuery));
      const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(lowercasedQuery) && (u.role === 'Designer' || u.role === 'Customer'));
      setSearchResults({ projects: filteredProjects, users: filteredUsers });
    } else {
      setSearchResults({ projects: [], users: [] });
    }
  }, [debouncedSearchQuery, users, projects]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClockToggle = () => {
    if (isClockedIn) {
      localStorage.removeItem('clockInTime');
      setIsClockedIn(false);
      setClockInTime(null);
      setElapsedTime('00:00:00');
    } else {
      const now = new Date();
      localStorage.setItem('clockInTime', now.toISOString());
      setIsClockedIn(true);
      setClockInTime(now);
    }
  };
  
  const clearSearch = () => {
      setSearchQuery('');
      setIsSearchFocused(false);
  }

  const handleNotificationsToggle = () => {
    setNotificationsOpen(!isNotificationsOpen);
    setHasUnread(false); // Mark as read when opened
  };

  const renderDesignerClock = () => (
    <div className="flex items-center space-x-2 sm:space-x-3">
        {isClockedIn && (
            <div className="flex items-center space-x-2 bg-secondary px-3 py-1.5 rounded-full">
                <ClockIcon className="w-5 h-5 text-green-600" />
                <span className="font-mono text-sm text-text-primary">{elapsedTime}</span>
            </div>
        )}
        <Button 
            onClick={handleClockToggle} 
            className={`text-sm ${isClockedIn ? '!bg-red-500 hover:!bg-red-600' : ''}`}
        >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md">
      {isImpersonating && (
        <div className="bg-yellow-400 text-yellow-900 font-bold text-sm text-center p-2 flex items-center justify-center gap-4">
          <span>You are viewing as {impersonatedUser?.fullName}.</span>
          <button onClick={stopImpersonation} className="underline hover:text-yellow-800">
            Return to Admin View
          </button>
        </div>
      )}
      <div className="flex items-center justify-between h-20 px-4 md:px-8 border-b border-border-color/50">
        <div className="flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-text-secondary md:hidden mr-4" aria-label="Open sidebar">
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="relative hidden md:block">
            <SearchIcon className="absolute w-5 h-5 text-text-secondary top-1/2 left-4 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search projects or users..." 
              className="w-80 pl-11 pr-4 py-2.5 bg-secondary border-transparent rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click on results
            />
            {isSearchFocused && searchQuery.length > 1 && (
              <div className="absolute top-full mt-2 w-96 bg-surface border border-border-color rounded-2xl shadow-card z-50 overflow-hidden">
                  {searchResults.projects.length > 0 && (
                      <div>
                          <h3 className="text-xs uppercase text-text-secondary p-3 font-bold">Projects</h3>
                          <ul>
                              {searchResults.projects.slice(0, 3).map(project => (
                                  <li key={project.id}>
                                      <Link to={`/projects/${project.id}`} onClick={clearSearch} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors">
                                          <div className="p-2 bg-secondary rounded-full">
                                            <BriefcaseIcon className="w-5 h-5 text-brand-blue"/>
                                          </div>
                                          <div>
                                              <p className="text-sm font-semibold text-text-primary">{project.title}</p>
                                              <p className="text-xs text-text-secondary">{users.find(u => u.id === project.customerId)?.fullName}</p>
                                          </div>
                                      </Link>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
                  {searchResults.users.length > 0 && (
                      <div>
                          <h3 className="text-xs uppercase text-text-secondary p-3 font-bold border-t border-border-color">Users</h3>
                          <ul>
                              {searchResults.users.slice(0, 3).map(userResult => (
                                  <li key={userResult.id}>
                                      <div className="flex items-center gap-3 px-3 py-2">
                                          <img src={userResult.avatarUrl} alt={userResult.fullName} className="w-8 h-8 rounded-full" />
                                          <div>
                                              <UserNameDisplay user={userResult} textClassName="text-sm font-semibold text-text-primary" />
                                              <p className="text-xs text-text-secondary">{userResult.role}</p>
                                          </div>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
                  {searchResults.projects.length === 0 && searchResults.users.length === 0 && (
                      <p className="p-4 text-sm text-text-secondary">No results found.</p>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {user?.role === 'Designer' && !isImpersonating && renderDesignerClock()}

          <div className="relative" ref={notificationsRef}>
            <button onClick={handleNotificationsToggle} className="relative p-2.5 rounded-full hover:bg-secondary transition-colors" aria-label="Notifications">
              <BellIcon className="w-6 h-6 text-text-primary" />
              {hasUnread && <span className="absolute top-1.5 right-1.5 block w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>}
            </button>
            {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border-color rounded-2xl shadow-card z-20 py-2">
                  <h3 className="font-semibold text-text-primary px-4 pb-2 border-b border-border-color">Recent Activity</h3>
                  <div className="max-h-80 overflow-y-auto">
                      {recentActivity.length > 0 ? recentActivity.map(log => {
                          const actor = users.find(u => u.id === log.actorId);
                          const project = projects.find(p => p.id === log.projectId);
                          return (
                              <Link to={`/projects/${log.projectId}`} key={log.id} onClick={() => setNotificationsOpen(false)} className="flex items-start gap-3 p-3 text-sm hover:bg-secondary">
                                  <ZapIcon className="w-4 h-4 text-brand-blue mt-1 flex-shrink-0" />
                                  <p className="text-text-secondary">
                                      <span className="font-semibold text-text-primary">{actor?.fullName || 'System'}</span> {log.details.toLowerCase()}
                                      {project && <span className="text-text-primary font-medium"> on "{project.title}"</span>}
                                  </p>
                              </Link>
                          )
                      }) : (
                          <p className="p-4 text-sm text-text-secondary text-center">No recent activity.</p>
                      )}
                  </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-secondary transition-colors" aria-label="Open user menu">
              <img src={user?.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
            </button>
            
            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border-color rounded-2xl shadow-card z-20 py-2">
                <div className="border-b border-border-color px-2 pb-2 mb-2">
                    <Link to="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary">
                      <img src={user?.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                          <UserNameDisplay user={user} textClassName="font-semibold text-text-primary" />
                          <p className="text-sm text-text-secondary">View Profile</p>
                      </div>
                    </Link>
                </div>
                <Link to="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-secondary text-text-primary font-medium">
                  <UserCircleIcon className="w-5 h-5" />
                  My Account
                </Link>
                <button onClick={() => { logout(); setProfileOpen(false); }} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-secondary text-red-500 font-medium">
                  <LogOutIcon className="w-5 h-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;