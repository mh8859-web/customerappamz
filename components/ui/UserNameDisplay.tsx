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
    Admin: { title: 'Verified Executive', text: 'This identity belongs to AMAZ Management & C-Suite members.' },
    'Sub-Admin': { title: 'Verified Admin', text: 'Administrative personnel with oversight privileges.' },
    Designer: { title: 'Accredited Designer', text: 'Senior creative leads and interior architectural team.' },
    Customer: { title: 'Privileged Client', text: 'Official client of AMAZ Interiors with active project status.' },
    Accounts: { title: 'Financial Auditor', text: 'Verified personnel from the Finance and Audit department.' },
    'Project Head': { title: 'Project Director', text: 'Management lead overseeing project lifecycles.' },
    'Production Head': { title: 'Production Lead', text: 'Manufacturing and procurement oversight specialist.' },
    'Site Head': { title: 'Site Supervisor', text: 'Execution lead for on-site interior works.' },
};

const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-9 h-9' }) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if ( popoverRef.current && !popoverRef.current.contains(event.target as Node) && badgeRef.current && !badgeRef.current.contains(event.target as Node) ) {
            setPopoverOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return <span className={`${className} ${textClassName}`}>Guest Identity</span>;
  }

  const isSupportUser = user.id === AMAZ_SUPPORT_USER_ID;
  const supportBadgeUrl = 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454359/gold_badge_k0b3zq.svg';
  const supportDetails = { title: 'Concierge Support', text: 'Official AMAZ automated concierge and support team.' };

  const displayName = isSupportUser ? 'AMAZ CONCIERGE' : user.fullName;
  const badgeUrl = isSupportUser ? supportBadgeUrl : (user.verified ? badgeUrlMap[user.role] : null);
  const details = isSupportUser ? supportDetails : (user.verified ? roleDetails[user.role] : null);

  const isTeamMember = !isSupportUser && (user.role === 'Admin' || user.role === 'Sub-Admin' || user.role === 'Designer');

  const content = (
    <>
      {showAvatar && (
          <img src={user.avatarUrl} alt={displayName} className={`${imageSize} rounded-xl mr-2 object-cover ring-2 ring-secondary shadow-sm`} />
      )}
      <span className={`${textClassName} tracking-tight`}>{displayName}</span>
      {badgeUrl && details && (
        <div ref={badgeRef} className="verified-badge-container flex-shrink-0 ml-1">
          <button 
            className="focus:outline-none transition-transform active:scale-90" 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPopoverOpen(!isPopoverOpen); }}
          >
            <img src={badgeUrl} alt="V" className="w-3.5 h-3.5" />
          </button>
          <div 
            ref={popoverRef} 
            className={`verification-popover ${isPopoverOpen ? 'open' : ''}`}
          >
            <div className="p-6">
                <div className="flex justify-center mb-5">
                     <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ" className="h-6 opacity-30"/>
                </div>
                <div className="flex flex-col items-center text-center">
                     <div className="bg-secondary p-3 rounded-full mb-4">
                        <img src={badgeUrl} alt="Verified" className="w-8 h-8"/>
                     </div>
                     <h4 className="font-display font-bold text-brand-dark mb-1 text-base">{details.title}</h4>
                     <p className="text-[13px] text-text-secondary font-light leading-relaxed">{details.text}</p>
                     
                     <div className="mt-5 pt-5 border-t border-secondary w-full text-[11px] font-bold text-brand-gold uppercase tracking-[2px]">
                        Identity Authenticated
                     </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isTeamMember) {
      return <Link to={`/profile/${user.id}`} className={`inline-flex items-center ${className} hover:opacity-80 transition-opacity`}>{content}</Link>
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {content}
    </div>
  );
};

export default UserNameDisplay;