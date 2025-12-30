
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { AMAZ_SUPPORT_USER_ID } from '../../constants';

interface UserNameDisplayProps {
  user: User | undefined;
  className?: string;
  textClassName?: string;
  showAvatar?: boolean;
  imageSize?: string;
}

const badgeUrlMap: Record<UserRole, string> = {
  Admin: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Sub-Admin': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  Designer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  Customer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg',
  Accounts: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Project Head': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Production Head': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Site Head': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
};

const roleDetails: Record<UserRole, { title: string; text: string; }> = {
    Admin: { title: 'Executive', text: 'Official Management Member.' },
    'Sub-Admin': { title: 'Admin', text: 'Privileged oversight access.' },
    Designer: { title: 'Lead Designer', text: 'Creative project lead.' },
    Customer: { title: 'Client', text: 'Verified project owner.' },
    Accounts: { title: 'Auditor', text: 'Finance department.' },
    'Project Head': { title: 'Director', text: 'Strategic oversight.' },
    'Production Head': { title: 'Prod Lead', text: 'Manufacturing lead.' },
    'Site Head': { title: 'Supervisor', text: 'Execution supervisor.' },
};

const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-7 h-7' }) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if ( popoverRef.current && !popoverRef.current.contains(event.target as Node) ) {
            setPopoverOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return <span className="text-xs text-slate-400">Guest</span>;

  // SYSTEM ADMIN DETECTION (786786)
  const isSystemAdmin = user.userId === AMAZ_SUPPORT_USER_ID || user.id === AMAZ_SUPPORT_USER_ID;
  // Use a confirmed working checkmark badge URL
  const supportBadgeUrl = 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg';
  
  const badgeUrl = isSystemAdmin ? supportBadgeUrl : (user.verified ? badgeUrlMap[user.role] : null);
  const details = isSystemAdmin 
    ? { title: 'SYSTEM ADMIN', text: 'Highest authority automated oversight.' } 
    : (user.verified ? roleDetails[user.role] : null);

  const displayName = isSystemAdmin ? '786786 SYSTEM ADMIN' : user.fullName;
  const isTeamMember = !isSystemAdmin && (user.role === 'Admin' || user.role === 'Sub-Admin' || user.role === 'Designer');

  const content = (
    <>
      {showAvatar && (
          <img 
            src={isSystemAdmin ? 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp' : user.avatarUrl} 
            alt="" 
            className={`${imageSize} rounded-lg mr-2 object-cover ring-1 ring-slate-100 shadow-sm`} 
          />
      )}
      <span className={`${textClassName} tracking-tight font-bold`}>{displayName}</span>
      {badgeUrl && (
        <div className="relative inline-flex items-center ml-1.5 h-3.5">
          <button 
            className="flex items-center focus:outline-none opacity-90 hover:opacity-100 transition-opacity" 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPopoverOpen(!isPopoverOpen); }}
          >
            <img src={badgeUrl} alt="Verified" className={isSystemAdmin ? "w-3.5 h-3.5" : "w-3 h-3"} />
          </button>
          {isPopoverOpen && details && (
            <div ref={popoverRef} className="absolute left-0 bottom-full mb-2 w-52 luxury-glass rounded-xl shadow-premium z-[100] p-4 animate-in border border-brand-gold/20">
                <div className="flex flex-col items-center text-center">
                    <img src={badgeUrl} alt="" className="w-6 h-6 mb-2"/>
                    <h4 className={`font-black text-xs uppercase tracking-widest ${isSystemAdmin ? 'text-brand-gold' : 'text-slate-900'}`}>{details.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{details.text}</p>
                </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return isTeamMember ? (
      <Link to={`/profile/${user.id}`} className={`inline-flex items-center ${className} hover:text-brand-blue transition-colors`}>{content}</Link>
  ) : (
    <div className={`inline-flex items-center ${className}`}>{content}</div>
  );
};

export default UserNameDisplay;
