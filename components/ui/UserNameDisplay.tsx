import React from 'react';
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
  Designer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760454350/designers_kux2yk.svg',
  Customer: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg',
};

const tooltipTextMap: Record<UserRole, string> = {
    Admin: 'This account is verified because it is an official AMAZ Interiors account.',
    Designer: 'This account is verified because it is an official AMAZ Interiors employee account.',
    Customer: 'This account is verified because it is an official AMAZ Interiors client account.',
};


const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ user, className = '', textClassName = '', showAvatar = false, imageSize = 'w-8 h-8' }) => {
  if (!user) {
    return <span className={className}>Unknown User</span>;
  }

  const badgeUrl = user.verified ? badgeMap[user.role] : null;
  const tooltipText = user.verified ? tooltipTextMap[user.role] : '';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showAvatar && (
          <img src={user.avatarUrl} alt={user.fullName} className={`${imageSize} rounded-full mr-1.5`} />
      )}
      <span className={textClassName}>{user.fullName}</span>
      {badgeUrl && (
        <div className="verified-badge-container flex-shrink-0">
          <img 
            src={badgeUrl} 
            alt="Verified User" 
            className="w-4 h-4"
          />
          <span className="verified-tooltip">{tooltipText}</span>
        </div>
      )}
    </div>
  );
};

export default UserNameDisplay;