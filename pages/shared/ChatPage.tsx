import React, { useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import ChatComponent from '../../components/chat/ChatComponent';
import { Project } from '../../types';
import { MessageSquareIcon, SearchIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const ChatPage: React.FC = () => {
  const { projectId: activeProjectId } = useParams();
  const { user } = useAuth();
  const { projects, loading: dataLoading, unreadCounts, markChatAsRead } = useData();
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
          <div className="flex h-[calc(100vh-8rem)] bg-surface rounded-3xl shadow-premium overflow-hidden animate-pulse">
            <div className="w-full md:w-80 border-r border-secondary p-6 space-y-4">
              <div className="h-8 bg-secondary rounded-xl w-3/4 mb-6"></div>
              <div className="h-20 bg-secondary rounded-2xl"></div>
              <div className="h-20 bg-secondary rounded-2xl"></div>
              <div className="h-20 bg-secondary rounded-2xl"></div>
            </div>
            <div className="flex-1 hidden md:block bg-secondary/20"></div>
          </div>
      );
  }

  const getChatPartner = (project: Project) => {
      if (user?.role === 'Designer') return findUserById(project.customerId);
      if (user?.role === 'Customer') return findUserById(project.designerId);
      const customer = findUserById(project.customerId);
      const designer = findUserById(project.designerId);
      return { customer, designer };
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-premium overflow-hidden border border-secondary animate-fade-up">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-secondary flex flex-col ${activeProjectId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-secondary/50">
          <h1 className="text-2xl font-display font-bold text-brand-dark">Concierge</h1>
          <p className="text-[11px] uppercase tracking-widest text-brand-gold font-bold mt-1">Direct Team Communication</p>
          
          <div className="relative mt-4">
             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
             <input placeholder="Search conversations..." className="w-full bg-secondary/50 border-none rounded-xl py-2.5 pl-10 text-xs focus:ring-1 focus:ring-brand-gold transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {conversations.map(project => {
            const partner = getChatPartner(project);
            let partnerName = 'Project Chat';
            let avatarUrl = '';
            
            if (partner) {
              if ('customer' in partner) {
                partnerName = `${partner.customer?.fullName.split(' ')[0]} & ${partner.designer?.fullName.split(' ')[0]}`;
                avatarUrl = partner.customer?.avatarUrl || '';
              } else {
                partnerName = partner.fullName;
                avatarUrl = partner.avatarUrl;
              }
            }
            
            const unreadCount = unreadCounts[project.id] || 0;

            return (
              <NavLink
                key={project.id}
                to={`/chat/${project.id}`}
                className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl mb-1 transition-all duration-300 ${isActive ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/20' : 'hover:bg-secondary/60 text-text-primary'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={avatarUrl} alt={partnerName} className={`w-12 h-12 rounded-xl object-cover border-2 ${activeProjectId === project.id ? 'border-brand-gold' : 'border-secondary'}`}/>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-brand-gold text-brand-dark text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h2 className={`font-bold truncate text-[14px] ${activeProjectId === project.id ? 'text-white' : 'text-brand-dark'}`}>{project.title}</h2>
                  <p className={`text-[11px] truncate mt-0.5 ${activeProjectId === project.id ? 'text-white/60' : 'text-text-secondary font-medium'}`}>{partnerName}</p>
                </div>
              </NavLink>
            );
          })}
           {conversations.length === 0 && (
            <div className="p-8 text-center">
                <div className="bg-secondary/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquareIcon className="w-6 h-6 text-text-secondary/40" />
                </div>
                <p className="text-xs text-text-secondary font-medium">No active threads.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Chat Interface */}
      <div className={`flex-1 flex-col bg-secondary/10 ${activeProjectId ? 'flex' : 'hidden md:flex'}`}>
        {activeProjectId ? (
          <ChatComponent projectId={activeProjectId} currentUser={user} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-premium flex items-center justify-center mb-6">
                <MessageSquareIcon className="w-10 h-10 text-brand-gold" />
            </div>
            <h2 className="text-2xl font-display font-bold text-brand-dark">Engagement Portal</h2>
            <p className="text-text-secondary mt-3 max-w-xs font-light leading-relaxed">
              Select a project from the left menu to begin your direct consultation with the AMAZ creative team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;