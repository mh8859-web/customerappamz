import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface UserNameDisplayProps {
  user: User | undefined;
  className?: string;
  textClassName?: string;
  showAvatar?: boolean;
  imageSize?: string;
}

// FIX: Add 'Sub-Admin' to cover all UserRole types.
const badgeMap: Record<UserRole, string> = {
  Admin: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  'Sub-Admin': 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454354/customer1_ihbcst.svg',
  Designer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  Customer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg',
};

// FIX: Add 'Sub-Admin' to cover all UserRole types.
const roleDetails: Record<UserRole, { text: string; }> = {
    Admin: {
        text: 'Official Amaz Company Account',
    },
    'Sub-Admin': {
        text: 'Official Amaz Company Account',
    },
    Designer: {
        text: 'Official Amaz Employee Account',
    },
    Customer: {
        text: 'Official Amaz Client Account',
    },
};


const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-8 h-8' }) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
            badgeRef.current && !badgeRef.current.contains(event.target as Node)
        ) {
            setPopoverOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        <div ref={badgeRef} className="verified-badge-container flex-shrink-0">
          <img 
            src={badgeUrl} 
            alt="Verified User" 
            className="w-4 h-4 cursor-pointer"
            onClick={() => setPopoverOpen(!isPopoverOpen)}
          />
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
                     <p className="text-sm text-text-secondary">{details.text}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNameDisplay;
