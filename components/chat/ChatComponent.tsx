import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../../types.ts';
import { PaperclipIcon, SendIcon } from '../icons.tsx';
import MessageBubble from './MessageBubble.tsx';
import Card from '../ui/Card.tsx';
import { useUsers } from '../../context/UserContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { createRecord, uploadChatAttachment } from '../../services/api.ts';

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
  const { messages, refetchData } = useData();

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
        console.error("Failed to send message:", error.message);
        alert(`Could not send message: ${error.message}`);
    } else {
        setNewMessage('');
        await refetchData();
    }
  };

  const handleSendTextMessage = async () => {
      await handleSendMessage(newMessage);
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
        alert('Failed to upload attachment. Please try again.');
        return;
    }

    const fileType: 'image' | 'video' | 'file' = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
    const newAttachment = {
        url: publicUrl,
        type: fileType,
        name: file.name
    };
    
    await handleSendMessage(newMessage, [newAttachment]);
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      <div className="p-4 border-t border-border-color">
        {isReadOnly ? (
          <div className="text-center text-sm text-text-secondary">This project is archived. Chat is read-only.</div>
        ) : (
          <div className="flex items-center bg-page-bg rounded-xl p-2 border border-border-color focus-within:ring-2 focus-within:ring-brand-blue">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendTextMessage())}
              placeholder={isUploading ? "Uploading attachment..." : "Type a message..."}
              className="flex-1 bg-transparent px-2 text-text-primary focus:outline-none"
              disabled={isReadOnly || isUploading}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-secondary hover:text-brand-blue transition-colors rounded-full disabled:opacity-50"
              aria-label="Attach file"
              disabled={isReadOnly || isUploading}
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSendTextMessage}
              className="p-2 text-text-secondary hover:text-brand-blue transition-colors rounded-full disabled:opacity-50"
              aria-label="Send message"
              disabled={isReadOnly || isUploading || !newMessage.trim()}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChatComponent;