
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
  // CRITICAL: If isSystemMessage is true, FORCE the System Admin identity
  const isSupportMessage = !!message.isSystemMessage || message.senderId === AMAZ_SUPPORT_USER_ID;
  const isOwnMessage = !isSupportMessage && isOwnMessageProp;

  const systemAdminProfile = { 
    id: AMAZ_SUPPORT_USER_ID,
    fullName: '786786 SYSTEM ADMIN', 
    avatarUrl: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
    role: 'Admin',
    verified: true,
  };

  const senderToDisplay = isSupportMessage ? systemAdminProfile : sender;

  const bubbleClasses = isSupportMessage
    ? 'bg-slate-900 text-white rounded-tl-[4px] border border-brand-gold/30 shadow-gold-glow'
    : isOwnMessage
    ? 'bg-brand-blue text-white rounded-tr-[4px]'
    : 'bg-[#F0F2F5] text-slate-800 rounded-tl-[4px]';

  const alignmentClasses = isOwnMessage ? 'items-end' : 'items-start';
  const verifiedBadgeUrl = 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454359/gold_badge_k0b3zq.svg';

  return (
    <div className={`flex flex-col ${alignmentClasses} animate-in mb-4 w-full px-2`}>
        <div className={`flex items-end gap-2 max-w-[90%] sm:max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isOwnMessage && (
                <img 
                    src={senderToDisplay?.avatarUrl} 
                    className={`w-9 h-9 rounded-full object-cover mb-1 ring-2 ${isSupportMessage ? 'ring-brand-gold/40 shadow-gold-glow' : 'ring-white shadow-md'} border border-slate-100`} 
                    alt="" 
                />
            )}
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {!isOwnMessage && (
                  <div className="mb-1 px-1 flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-[2px] ${isSupportMessage ? 'text-brand-gold' : 'text-slate-400'}`}>
                        {senderToDisplay?.fullName}
                    </span>
                    {isSupportMessage && (
                        <img src={verifiedBadgeUrl} alt="Verified" className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}
                <div className={`px-5 py-4 rounded-[22px] shadow-card ${bubbleClasses} relative overflow-hidden`}>
                    {isSupportMessage && (
                      <>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6 blur-xl"></div>
                      </>
                    )}
                    {message.body && (
                      <p className={`text-[14px] leading-[1.6] font-medium whitespace-pre-wrap ${isSupportMessage ? 'text-slate-100 tracking-wide' : ''}`}>
                        {message.body}
                      </p>
                    )}
                    {message.attachments?.map((att, index) => (
                        <AttachmentPreview key={index} attachment={att} isOwn={isOwnMessage} />
                    ))}
                </div>
            </div>
        </div>
        <p className={`text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 ${isOwnMessage ? 'mr-1' : 'ml-11'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
    </div>
  );
};

export default MessageBubble;
