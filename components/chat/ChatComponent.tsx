import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../../types';
import { PaperclipIcon, SendIcon, InfoIcon, PhoneIcon, VideoCameraIcon } from '../icons';
import MessageBubble from './MessageBubble';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import { createRecord, uploadChatAttachment } from '../../services/api';

interface ChatComponentProps {
  projectId: string;
  currentUser: User;
  isReadOnly?: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ projectId, currentUser, isReadOnly = false }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { findUserById } = useUsers();
  const { messages, refetchData, projects } = useData();

  const activeProject = projects.find(p => p.id === projectId);
  
  const chatPartner = React.useMemo(() => {
    if (!activeProject) return null;
    return currentUser.role === 'Customer' 
        ? findUserById(activeProject.designerId) 
        : findUserById(activeProject.customerId);
  }, [activeProject, currentUser, findUserById]);

  const projectMessages = messages
    .filter(m => m.chatId === projectId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [projectMessages]);

  const handleSendMessage = async (body: string, attachments?: Message['attachments']) => {
    if ((!body.trim() && !attachments) || isReadOnly) return;

    const messageToSend = {
      chat_id: projectId,
      body: body,
      attachments: attachments || null,
    };
    
    const { error } = await createRecord('messages', messageToSend);

    if (error) {
        alert(`Could not send: ${error.message}`);
    } else {
        setNewMessage('');
        await refetchData();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || isUploading) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const publicUrl = await uploadChatAttachment(projectId, currentUser.id, file);
    setIsUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = ""; 

    if (!publicUrl) {
        alert('Upload failed.');
        return;
    }

    const fileType: 'image' | 'video' | 'file' = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
    await handleSendMessage('', [{ url: publicUrl, type: fileType, name: file.name }]);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Messenger Style Header */}
      <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
              <div className="relative">
                <img src={chatPartner?.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-accent-success border-2 border-white rounded-full"></span>
              </div>
              <div>
                  <h3 className="font-bold text-slate-900 leading-none">{chatPartner?.fullName || 'Project Team'}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{chatPartner?.role || 'Team'}</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-full transition-all"><PhoneIcon className="w-5 h-5" /></button>
              <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-full transition-all"><VideoCameraIcon className="w-5 h-5" /></button>
              <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-full transition-all"><InfoIcon className="w-5 h-5" /></button>
          </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-slate-50/20">
        {projectMessages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwnMessage={msg.senderId === currentUser.id}
            sender={findUserById(msg.senderId)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Pill Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        {!isReadOnly ? (
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
                    placeholder={isUploading ? "Uploading..." : "Type a message..."}
                    className="w-full bg-slate-100 border-none rounded-full py-3 px-6 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all"
                />
            </div>

            <button 
              onClick={() => handleSendMessage(newMessage)}
              disabled={!newMessage.trim() && !isUploading}
              className={`p-3 rounded-full transition-all shadow-button ${newMessage.trim() ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              <SendIcon className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-2">Read Only Archive</p>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;