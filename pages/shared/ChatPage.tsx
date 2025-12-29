import React, { useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import ChatComponent from '../../components/chat/ChatComponent';
import { Project } from '../../types';
import { MessageSquareIcon, SearchIcon, ChevronDownIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const ChatPage: React.FC = () => {
  const { projectId: activeProjectId } = useParams();
  const { user } = useAuth();
  const { projects, loading: dataLoading, unreadCounts, markChatAsRead, messages } = useData();
  const { findUserById, loading: usersLoading } = useUsers();

  useEffect(() => {
    if (activeProjectId) {
      markChatAsRead(activeProjectId);
    }
  }, [activeProjectId, markChatAsRead]);

  const conversations: Project[] = React.useMemo(() => {
    if (!user || !projects) return [];
    const activeProjects = projects.filter(p => p.status === 'Active');

    switch (user.role) {
      case 'Admin':
      case 'Sub-Admin':
        return activeProjects;
      case 'Designer':
        return activeProjects.filter(p => p.designerId === user.id);
      case 'Customer':
        return activeProjects.filter(p => p.customerId === user.id);
      default:
        return [];
    }
  }, [user, projects]);
  
  const isLoading = dataLoading || usersLoading;

  if (isLoading || !user) {
      return (
          <div className="flex h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-soft overflow-hidden animate-pulse">
            <div className="w-full md:w-80 border-r border-slate-100 p-6 space-y-4">
              <div className="h-10 bg-slate-50 rounded-full w-1/2 mb-6"></div>
              <div className="h-16 bg-slate-50 rounded-2xl"></div>
              <div className="h-16 bg-slate-50 rounded-2xl"></div>
            </div>
            <div className="flex-1 hidden md:block bg-slate-50/30"></div>
          </div>
      );
  }

  const getChatDetails = (project: Project) => {
      const lastMsg = messages
        .filter(m => m.chatId === project.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      let partnerName = 'Project Team';
      let avatarUrl = 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp';
      
      if (user?.role === 'Customer') {
          const designer = findUserById(project.designerId);
          partnerName = designer?.fullName || 'Designer';
          avatarUrl = designer?.avatarUrl || avatarUrl;
      } else {
          const customer = findUserById(project.customerId);
          partnerName = customer?.fullName || 'Client';
          avatarUrl = customer?.avatarUrl || avatarUrl;
      }

      return { partnerName, avatarUrl, lastMsg: lastMsg?.body || 'Start a conversation...' };
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-[32px] shadow-premium overflow-hidden border border-slate-100 animate-in">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-50 flex flex-col ${activeProjectId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <MessageSquareIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          <div className="relative">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
                placeholder="Search messages..." 
                className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-brand-blue/10 focus:bg-white transition-all outline-none" 
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
          {conversations.map(project => {
            const { partnerName, avatarUrl, lastMsg } = getChatDetails(project);
            const unreadCount = unreadCounts[project.id] || 0;
            const isActive = activeProjectId === project.id;

            return (
              <NavLink
                key={project.id}
                to={`/chat/${project.id}`}
                className={`flex items-center gap-3 p-3 rounded-[20px] mb-1 transition-all duration-200 group ${isActive ? 'bg-brand-blue/5' : 'hover:bg-slate-50'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={avatarUrl} alt={partnerName} className={`w-14 h-14 rounded-full object-cover ring-2 ${isActive ? 'ring-brand-blue/20' : 'ring-transparent'}`}/>
                  {unreadCount > 0 && (
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-brand-blue border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h2 className={`text-[15px] font-bold truncate ${isActive ? 'text-brand-blue' : 'text-slate-900'}`}>{partnerName}</h2>
                    <span className="text-[10px] text-slate-400 font-medium">12:30 PM</span>
                  </div>
                  <p className={`text-xs truncate leading-snug ${unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>
                    {lastMsg}
                  </p>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col bg-white ${activeProjectId ? 'flex' : 'hidden md:flex'}`}>
        {activeProjectId ? (
          <ChatComponent projectId={activeProjectId} currentUser={user} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
            <div className="w-20 h-20 bg-white rounded-full shadow-soft flex items-center justify-center mb-6">
                <MessageSquareIcon className="w-8 h-8 text-brand-blue/40" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Your Inbox</h2>
            <p className="text-slate-400 mt-2 max-w-xs text-sm leading-relaxed">
              Select a conversation to view project updates and chat with your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;