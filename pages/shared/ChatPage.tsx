import React, { useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import ChatComponent from '../../components/chat/ChatComponent';
import { Project, User } from '../../types';
import { MessageSquareIcon } from '../../components/icons';
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
        return activeProjects; // Admins see all active project chats
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
          <div className="flex h-[calc(100vh-8rem)] bg-surface rounded-2xl shadow-card overflow-hidden animate-pulse">
            <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border-color p-4 space-y-3">
              <div className="h-10 bg-secondary rounded-lg w-3/4 mb-4"></div>
              <div className="h-16 bg-secondary rounded-lg"></div>
              <div className="h-16 bg-secondary rounded-lg"></div>
              <div className="h-16 bg-secondary rounded-lg"></div>
            </div>
            <div className="flex-1 hidden md:block"></div>
          </div>
      );
  }

  const getChatPartner = (project: Project) => {
      if (user?.role === 'Designer') return findUserById(project.customerId);
      if (user?.role === 'Customer') return findUserById(project.designerId);
      // For Admins, show both
      const customer = findUserById(project.customerId);
      const designer = findUserById(project.designerId);
      return { customer, designer };
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-surface rounded-2xl shadow-card overflow-hidden">
      {/* Left Sidebar: Chat List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border-color flex-col ${activeProjectId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border-color flex-shrink-0">
          <h1 className="text-xl font-bold font-display text-text-primary">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(project => {
            const partner = getChatPartner(project);
            let partnerName = 'Chat';
            let avatarUrl = '';
            
            if (partner) {
              if ('customer' in partner) {
                const customerName = partner.customer?.fullName.split(' ')[0];
                const designerName = partner.designer?.fullName.split(' ')[0];
                
                if (customerName && designerName) {
                  partnerName = `${customerName} / ${designerName}`;
                } else {
                  partnerName = customerName || designerName || project.title;
                }
  
                avatarUrl = partner.customer?.avatarUrl || '';
              } else {
                partnerName = partner.fullName || 'Chat';
                avatarUrl = partner.avatarUrl || '';
              }
            }
            
            const unreadCount = unreadCounts[project.id] || 0;

            return (
              <NavLink
                key={project.id}
                to={`/chat/${project.id}`}
                className={({ isActive }) => `flex items-start gap-3 p-3 border-b border-border-color transition-colors ${isActive ? 'bg-secondary' : 'hover:bg-page-bg'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={avatarUrl} alt={partnerName} className="w-10 h-10 rounded-full"/>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-brand-blue text-white text-xs flex items-center justify-center border-2 border-surface">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h2 className="font-semibold text-text-primary truncate">{project.title}</h2>
                  <p className="text-sm text-text-secondary truncate">{partnerName}</p>
                </div>
              </NavLink>
            );
          })}
           {conversations.length === 0 && (
            <div className="p-4 text-center text-sm text-text-secondary">No active project conversations.</div>
          )}
        </div>
      </div>

      {/* Right Content: Chat Window or Placeholder */}
      <div className={`flex-1 flex-col ${activeProjectId ? 'flex' : 'hidden md:flex'}`}>
        {activeProjectId ? (
          <ChatComponent projectId={activeProjectId} currentUser={user} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquareIcon className="w-16 h-16 text-border-color mb-4" />
            <h2 className="text-2xl font-bold font-display text-text-primary">Select a conversation</h2>
            <p className="text-text-secondary mt-2 max-w-sm">
              Choose a project from the list to view messages or start a new conversation with the project team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;