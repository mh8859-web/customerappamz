import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../../types';
import { MOCK_MESSAGES } from '../../services/mockData';
import { PaperclipIcon, SendIcon } from '../icons';
import MessageBubble from './MessageBubble';
import Card from '../ui/Card';
import { useUsers } from '../../context/UserContext';

interface ChatComponentProps {
  projectId: string;
  currentUser: User;
  isReadOnly?: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ projectId, currentUser, isReadOnly = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { findUserById } = useUsers();

  useEffect(() => {
    // Filter messages for the current project and sort them by date
    const projectMessages = MOCK_MESSAGES
      .filter(m => m.chatId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setMessages(projectMessages);
  }, [projectId]);

  useEffect(() => {
    // Scroll to the bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || isReadOnly) return;

    const messageToSend: Message = {
      id: `msg-${Date.now()}`,
      chatId: projectId,
      senderId: currentUser.id,
      body: newMessage,
      createdAt: new Date().toISOString(),
    };
    
    // In a real app, this would be an API call.
    MOCK_MESSAGES.push(messageToSend);
    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload the file to a server and get a URL.
    // Here we'll just simulate it.
    // FIX: Explicitly type `fileType` to match the Message attachment type.
    const fileType: 'image' | 'video' | 'file' = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
    const newAttachment = {
        url: URL.createObjectURL(file),
        type: fileType,
        name: file.name
    };

    const messageToSend: Message = {
        id: `msg-${Date.now()}`,
        chatId: projectId,
        senderId: currentUser.id,
        body: `Shared a file: ${file.name}`,
        attachments: [newAttachment],
        createdAt: new Date().toISOString(),
    };

    MOCK_MESSAGES.push(messageToSend);
    setMessages(prev => [...prev, messageToSend]);
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
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
          <div className="text-center text-sm text-text-muted">This project is archived. Chat is read-only.</div>
        ) : (
          <div className="flex items-center bg-primary-bg rounded-xl p-2 border border-border-color focus-within:ring-2 focus-within:ring-accent">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-2 text-text-headline focus:outline-none"
              disabled={isReadOnly}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-muted hover:text-accent transition-colors rounded-full"
              aria-label="Attach file"
              disabled={isReadOnly}
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSendMessage}
              className="p-2 text-text-muted hover:text-accent transition-colors rounded-full"
              aria-label="Send message"
              disabled={isReadOnly}
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