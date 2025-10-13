import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SearchIcon, BellIcon, MenuIcon, ChevronDownIcon, ClockIcon, BriefcaseIcon, UsersIcon } from '../icons';
import Button from '../ui/Button';
import { MOCK_PROJECTS, MOCK_USERS } from '../../services/mockData';
import { Link } from 'react-router-dom';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ projects: any[], users: any[] }>({ projects: [], users: [] });
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    if (searchQuery.length > 1) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filteredProjects = MOCK_PROJECTS.filter(p => p.title.toLowerCase().includes(lowercasedQuery));
      const filteredUsers = MOCK_USERS.filter(u => u.fullName.toLowerCase().includes(lowercasedQuery) && (u.role === 'Designer' || u.role === 'Customer'));
      setSearchResults({ projects: filteredProjects, users: filteredUsers });
    } else {
      setSearchResults({ projects: [], users: [] });
    }
  }, [searchQuery]);

  const handleClockToggle = () => {
    if (isClockedIn) {
      // Clock Out
      setIsClockedIn(false);
      setClockInTime(null);
      setElapsedTime('00:00:00');
      alert('Clocked out!');
    } else {
      // Clock In
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        alert(`Clocked in at location: ${latitude}, ${longitude}`);
        setIsClockedIn(true);
        setClockInTime(new Date());
      }, () => {
        alert('Could not get location. Clocking in without it.');
        setIsClockedIn(true);
        setClockInTime(new Date());
      });
    }
  };
  
  const clearSearch = () => {
      setSearchQuery('');
      setIsSearchFocused(false);
  }

  const renderDesignerClock = () => (
    <div className="flex items-center space-x-2 sm:space-x-3">
        {isClockedIn && (
            <div className="flex items-center space-x-2 bg-primary-bg px-3 py-1.5 rounded-xl">
                <ClockIcon className="w-5 h-5 text-green-400 animate-pulse" />
                <span className="font-mono text-sm text-text-headline">{elapsedTime}</span>
            </div>
        )}
        <Button 
            onClick={handleClockToggle} 
            className={`px-4 py-2 text-sm ${isClockedIn ? 'bg-red-600/80 hover:bg-red-600' : ''}`}
        >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-20 px-4 md:px-8 bg-surface/80 backdrop-blur-md border-b border-border-color">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-text-muted md:hidden mr-4">
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="relative hidden md:block">
          <SearchIcon className="absolute w-5 h-5 text-text-muted top-1/2 left-3 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search projects, users..." 
            className="w-64 pl-10 pr-4 py-2 bg-primary-bg border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)} // Delay to allow click on results
          />
           {isSearchFocused && (searchResults.projects.length > 0 || searchResults.users.length > 0) && (
            <div className="absolute top-full mt-2 w-96 bg-surface border border-border-color rounded-xl shadow-soft z-50 overflow-hidden">
                {searchResults.projects.length > 0 && (
                    <div>
                        <h3 className="text-xs uppercase text-text-muted p-3 font-bold">Projects</h3>
                        <ul>
                            {searchResults.projects.slice(0, 3).map(project => (
                                <li key={project.id}>
                                    <Link to={`/projects/${project.id}`} onClick={clearSearch} className="flex items-center gap-3 px-3 py-2 hover:bg-primary-bg transition-colors">
                                        <BriefcaseIcon className="w-5 h-5 text-accent"/>
                                        <div>
                                            <p className="text-sm font-semibold text-text-headline">{project.title}</p>
                                            <p className="text-xs text-text-muted">{MOCK_USERS.find(u => u.id === project.customerId)?.fullName}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {searchResults.users.length > 0 && (
                     <div>
                        <h3 className="text-xs uppercase text-text-muted p-3 font-bold border-t border-border-color">Users</h3>
                        <ul>
                            {searchResults.users.slice(0, 3).map(user => (
                                <li key={user.id}>
                                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-primary-bg transition-colors cursor-pointer">
                                        <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="text-sm font-semibold text-text-headline">{user.fullName}</p>
                                            <p className="text-xs text-text-muted">{user.role}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
           )}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {user?.role === 'Designer' && renderDesignerClock()}

        <button className="relative p-2 rounded-full hover:bg-primary-bg">
          <BellIcon className="w-6 h-6 text-text-muted" />
          <span className="absolute top-1 right-1 block w-2 h-2 bg-accent rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-3">
          <img src={user?.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
          <div className="hidden md:block">
            <p className="font-semibold text-text-headline">{user?.fullName}</p>
            <p className="text-sm text-text-muted">{user?.role}</p>
          </div>
          <ChevronDownIcon className="w-5 h-5 text-text-muted hidden md:block" />
        </div>
      </div>
    </header>
  );
};

export default Header;