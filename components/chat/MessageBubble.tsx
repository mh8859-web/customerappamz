
import React from 'react';
import { Message, User } from '../../types';
import { DownloadIcon, FileTextIcon } from '../icons';
import { AMAZ_SUPPORT_USER_ID } from '../../constants';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

const AttachmentPreview: React.FC<{ attachment: Message['attachments'][0]; isOwn: boolean }> = ({ attachment, isOwn }) => {
    if (attachment.type === 'image') {
        return <img src={attachment.url} alt={attachment.name} className="mt-2 rounded-2xl max-w-xs cursor-pointer shadow-sm hover:opacity-90 transition-opacity" onClick={() => window.open(attachment.url, '_blank')} />;
    }
    if (attachment.type === 'video') {
        return <video src={attachment.url} controls className="mt-2 rounded-2xl max-w-xs shadow-sm" />;
    }
    return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={`mt-2 flex items-center gap-3 p-3 rounded-2xl border transition-colors ${isOwn ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
            <FileTextIcon className={`w-6 h-6 ${isOwn ? 'text-white' : 'text-slate-400'}`} />
            <div className="flex-1 overflow-hidden text-left">
                <p className={`text-sm font-bold truncate ${isOwn ? 'text-white' : 'text-slate-800'}`}>{attachment.name}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>Tap to view</p>
            </div>
            <DownloadIcon className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-slate-400'}`} />
        </a>
    );
};


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage: isOwnMessageProp, sender }) => {
  const isSupportMessage = !!message.isSystemMessage;
  const isOwnMessage = !isSupportMessage && isOwnMessageProp;

  // --- FIX: Updated the support user object literal to include all required User interface properties ---
  const senderToDisplay = isSupportMessage 
    ? { 
        id: AMAZ_SUPPORT_USER_ID,
        fullName: 'AMAZ Support', 
        avatarUrl: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
        role: 'Admin',
        email: 'support@amaz.com',
        verified: true,
        verificationRequested: false,
        userId: 'SUPPORT',
      } as User
    : sender;

  const bubbleClasses = isOwnMessage
    ? 'bg-brand-blue text-white rounded-tr-[4px]'
    : 'bg-[#F0F2F5] text-slate-800 rounded-tl-[4px]';

  const alignmentClasses = isOwnMessage ? 'items-end' : 'items-start';

  return (
    <div className={`flex flex-col ${alignmentClasses} animate-in`}>
        <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isOwnMessage && (
                <img src={senderToDisplay?.avatarUrl} className="w-7 h-7 rounded-full object-cover mb-1 ring-1 ring-slate-100" alt="" />
            )}
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-[22px] shadow-sm ${bubbleClasses}`}>
                    {message.body && <p className="text-[14px] leading-[1.4] font-medium whitespace-pre-wrap">{message.body}</p>}
                    {message.attachments?.map((att, index) => (
                        <AttachmentPreview key={index} attachment={att} isOwn={isOwnMessage} />
                    ))}
                </div>
            </div>
        </div>
        <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 ${isOwnMessage ? 'mr-1' : 'ml-10'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
    </div>
  );
};

export default MessageBubble;
