import React from 'react';
import { Message, User } from '../../types';
import { DownloadIcon, FileTextIcon } from '../icons';
import UserNameDisplay from '../ui/UserNameDisplay';
import { AMAZ_SUPPORT_USER_ID } from '../../constants';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

const AttachmentPreview: React.FC<{ attachment: Message['attachments'][0] }> = ({ attachment }) => {
    if (attachment.type === 'image') {
        return <img src={attachment.url} alt={attachment.name} className="mt-2 rounded-lg max-w-xs cursor-pointer" onClick={() => window.open(attachment.url, '_blank')} />;
    }
    if (attachment.type === 'video') {
        return <video src={attachment.url} controls className="mt-2 rounded-lg max-w-xs" />;
    }
    return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-3 bg-surface p-3 rounded-lg hover:bg-border-color">
            <FileTextIcon className="w-6 h-6 text-text-muted flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-text-headline truncate">{attachment.name}</p>
                <p className="text-xs text-text-muted">Click to download</p>
            </div>
            <DownloadIcon className="w-5 h-5 text-text-muted" />
        </a>
    );
};


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage: isOwnMessageProp, sender }) => {
  // A system message is displayed as the official support user, regardless of the actual sender.
  const isSupportMessage = !!message.isSystemMessage;

  // An "own" message is one sent by the current user AND is not a system message.
  // This makes system messages (like the welcome message) appear on the left for everyone.
  const isOwnMessage = !isSupportMessage && isOwnMessageProp;

  const senderToDisplay = isSupportMessage 
    ? { 
        id: AMAZ_SUPPORT_USER_ID,
        fullName: 'AMAZ INTERIOR SUPPORT', 
        avatarUrl: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
        role: 'Admin', // Base role for styling consistency
        verified: true, // Mark as verified to show a badge
      } as User
    : sender;

  const bubbleClasses = isOwnMessage
    ? 'bg-brand-blue text-white'
    : 'bg-secondary';

  const alignmentClasses = isOwnMessage ? 'items-end' : 'items-start';

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col ${alignmentClasses}`}>
        <div className="flex items-start gap-3 max-w-md">
            {!isOwnMessage && (
                <img src={senderToDisplay?.avatarUrl} alt={senderToDisplay?.fullName} className="w-8 h-8 rounded-full" />
            )}
            <div className={`rounded-xl p-3 ${bubbleClasses}`}>
                 {!isOwnMessage && (
                    <div className="mb-1">
                      <UserNameDisplay user={senderToDisplay} className="text-xs font-bold text-brand-blue" />
                    </div>
                )}
                {message.body && <p className="text-sm whitespace-pre-wrap">{message.body}</p>}
                {message.attachments?.map((att, index) => (
                    <AttachmentPreview key={index} attachment={att} />
                ))}
            </div>
        </div>
        <p className={`text-xs mt-1 px-2 ${isOwnMessage ? 'mr-3' : 'ml-11'}`}>{time}</p>
    </div>
  );
};

export default MessageBubble;