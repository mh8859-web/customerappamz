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

// FIX: Added 'Accounts' role to satisfy the 'Record<UserRole, string>' type.
const badgeUrlMap: Record<UserRole, string> = {
  Admin: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Sub-Admin': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  Designer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  Customer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg',
  Accounts: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
};

// FIX: Added 'Accounts' role to satisfy the 'Record<UserRole, { title: string; text: string; }>' type.
const roleDetails: Record<UserRole, { title: string; text: string; }> = {
    Admin: { title: 'Official Amaz Admin', text: 'This Account Is Verified And This Account Belong To Admin, C-Level Members' },
    'Sub-Admin': { title: 'Official Amaz Admin', text: 'This Account Is Verified And This Account Belong To Admin, C-Level Members' },
    Designer: { title: 'Official Amaz Employee', text: 'This Account Is Verified And This Account Belong To Senior Level Designers, Other Team' },
    Customer: { title: 'Official Amaz Client', text: 'This Account Is Verified And This Account Belong To Our Clients' },
    Accounts: { title: 'Official Amaz Finance Team', text: 'This Account Is Verified And This Account Belongs To The Finance Department.' },
};

const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-8 h-8' }) => {
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
    return <span className={`${className} ${textClassName}`}>Unknown User</span>;
  }

  const isSupportUser = user.id === AMAZ_SUPPORT_USER_ID;

  // Define specific properties for the support user
  const supportBadgeUrl = 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454359/gold_badge_k0b3zq.svg';
  const supportDetails = { title: 'Official Amaz Support', text: 'This is official amaz support team' };

  // Determine which user details, badge, and popover to use
  const displayName = isSupportUser ? 'AMAZ INTERIOR SUPPORT' : user.fullName;
  const badgeUrl = isSupportUser ? supportBadgeUrl : (user.verified ? badgeUrlMap[user.role] : null);
  const details = isSupportUser ? supportDetails : (user.verified ? roleDetails[user.role] : null);

  // Team members get a clickable profile link. Customers and Support user do not.
  const isTeamMember = !isSupportUser && (user.role === 'Admin' || user.role === 'Sub-Admin' || user.role === 'Designer');

  const content = (
    <>
      {showAvatar && (
          <img src={user.avatarUrl} alt={displayName} className={`${imageSize} rounded-full mr-1.5`} />
      )}
      <span className={textClassName}>{displayName}</span>
      {badgeUrl && details && (
        <div ref={badgeRef} className="verified-badge-container flex-shrink-0">
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPopoverOpen(!isPopoverOpen); }}>
            <img src={badgeUrl} alt="Verified Badge" className="w-4 h-4" />
          </div>
          <div 
            ref={popoverRef} 
            className={`verification-popover ${isPopoverOpen ? 'open' : ''}`}
          >
            <div className="p-4">
                <div className="border-b border-border-color pb-3 mb-3">
                     <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ Interiors Logo" className="h-8"/>
                </div>
                <div className="flex items-start gap-2">
                     <img src={badgeUrl} alt="Verified Badge" className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                     <div>
                        <p className="font-bold text-sm text-text-primary">{details.title}</p>
                        <p className="text-sm text-text-secondary">{details.text}</p>
                     </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isTeamMember) {
      return <Link to={`/profile/${user.id}`} className={`inline-flex items-center gap-1.5 ${className} hover:underline`}>{content}</Link>
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {content}
    </div>
  );
};

export default UserNameDisplay;