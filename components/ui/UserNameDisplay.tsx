
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../../types';

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
  Accounts: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  'Project Head': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg', 
  'Production Head': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  'Site Head': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
};

const roleDetails: Record<UserRole, { title: string; text: string; }> = {
    Admin: { title: 'Executive', text: 'Official Management Member.' },
    'Sub-Admin': { title: 'Admin', text: 'Privileged oversight access.' },
    Designer: { title: 'Architect', text: 'Creative project lead.' },
    Customer: { title: 'Client', text: 'Verified project owner.' },
    Accounts: { title: 'Financial Auditor', text: 'Accounts & Audit head.' },
    'Project Head': { title: 'PROJECT HEAD', text: 'Portfolio Strategy & Team Lead.' },
    'Production Head': { title: 'Production Lead', text: 'Factory & Sourcing lead.' },
    'Site Head': { title: 'Execution Head', text: 'Site operations supervisor.' },
};

const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-7 h-7' }) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return <span className="text-slate-400 italic">Unknown Entity</span>;

  const isPH = user.role === 'Project Head';
  const badgeUrl = badgeUrlMap[user.role] || badgeUrlMap.Customer;
  const details = roleDetails[user.role] || roleDetails.Customer;

  return (
    <div className={`inline-flex items-center gap-2 relative ${className}`} ref={popoverRef}>
      {showAvatar && (
        <img 
          src={user.avatarUrl || 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp'} 
          alt="" 
          className={`${imageSize} rounded-full object-cover border border-slate-100 shadow-sm`}
        />
      )}
      
      <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setPopoverOpen(!isPopoverOpen)}>
        <span className={`${textClassName} group-hover:text-brand-blue transition-colors`}>{user.fullName}</span>
        <img src={badgeUrl} alt="Verified" className={`w-3.5 h-3.5 ${isPH ? 'grayscale opacity-60' : ''}`} />
      </div>

      {isPopoverOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-64 bg-white rounded-2xl shadow-modal border border-slate-100 p-4 z-50 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-50">
                <img 
                  src={user.avatarUrl || 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp'} 
                  className="w-10 h-10 rounded-full object-cover" 
                  alt="" 
                />
                <div>
                    <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isPH ? 'text-slate-500' : 'text-brand-blue'}`}>{user.role}</p>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">{details.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{details.text}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50">
                <Link 
                    to={`/profile/${user.id}`} 
                    className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                    onClick={() => setPopoverOpen(false)}
                >
                    View Global Profile &rarr;
                </Link>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserNameDisplay;