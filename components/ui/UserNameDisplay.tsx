import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface UserNameDisplayProps {
  user: User | undefined;
  className?: string;
  textClassName?: string;
  showAvatar?: boolean;
  imageSize?: string;
}

const badgeMap: Record<UserRole, string> = {
  Admin: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Sub-Admin': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  Designer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  Customer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg',
};

const roleDetails: Record<UserRole, { text: string; description: string; }> = {
    Admin: {
        text: 'Official Amaz Company Account',
        description: 'This account is verified because its admin level member account'
    },
    'Sub-Admin': {
        text: 'Official Amaz Company Account',
        description: 'This account is verified because its admin level member account'
    },
    Designer: {
        text: 'Official Amaz Employee Account',
        description: 'This account is verified because its Employee level member account can be used by designer, other team members'
    },
    Customer: {
        text: 'Official Amaz Client Account',
        description: 'This account is verified because its Client account'
    },
};


const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-8 h-8' }) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only add the event listener if the popover is open.
    if (!isPopoverOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
        // If the click is on the badge itself, don't close the popover,
        // as the badge has its own toggle logic.
        if (badgeRef.current && badgeRef.current.contains(event.target as Node)) {
          return;
        }
        
        // If the click is outside the popover, close it.
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setPopoverOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]); // Rerun the effect when the popover's visibility changes.

  if (!user) {
    return <span className={`${className} ${textClassName}`}>Unknown User</span>;
  }

  const badgeUrl = user.verified ? badgeMap[user.role] : null;
  const details = user.verified ? roleDetails[user.role] : null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showAvatar && (
          <img src={user.avatarUrl} alt={user.fullName} className={`${imageSize} rounded-full mr-1.5`} />
      )}
      <span className={textClassName}>{user.fullName}</span>
      {badgeUrl && details && (
        <div className="verified-badge-container flex-shrink-0">
          <div ref={badgeRef}>
            <img 
              src={badgeUrl} 
              alt="Verified User" 
              className="w-4 h-4 cursor-pointer"
              onClick={() => setPopoverOpen(!isPopoverOpen)}
            />
          </div>
          <div 
            ref={popoverRef} 
            className={`verification-popover ${isPopoverOpen ? 'open' : ''}`}
          >
            <div className="p-4">
                <div className="border-b border-border-color pb-3 mb-3">
                     <img 
                        src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                        alt="AMAZ Interiors Logo" 
                        className="h-8"
                    />
                </div>
                <div className="flex items-start gap-2">
                     <img 
                        src={badgeUrl} 
                        alt="Verified Badge" 
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                     />
                     <div>
                        <p className="text-sm text-text-secondary">{details.text}</p>
                        <p className="text-xs text-text-secondary mt-2">{details.description}</p>
                     </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNameDisplay;