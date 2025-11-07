import React from 'react';
import { User } from '../../types';
import UserNameDisplay from '../ui/UserNameDisplay';
import Button from '../ui/Button';

interface UserProfileHeaderProps {
    user: User;
    postCount: number;
    isCurrentUser: boolean;
}

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="text-center md:text-left">
        <span className="font-bold text-text-primary text-lg">{value}</span>
        <span className="text-text-secondary ml-1">{label}</span>
    </div>
);

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
    user,
    postCount,
    isCurrentUser,
}) => {
    return (
        <header className="flex flex-col md:flex-row items-center gap-8 p-4 border-b border-border-color">
            <img 
                src={user.avatarUrl} 
                alt={user.fullName} 
                className="w-32 h-32 rounded-full flex-shrink-0"
            />
            <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <h1 className="text-2xl font-display text-text-primary">{user.fullName}</h1>
                    {isCurrentUser && (
                        <Button variant="secondary">Edit Profile</Button>
                    )}
                </div>
                <div className="flex items-center gap-6">
                    <Stat value={postCount} label="posts" />
                </div>
                <div>
                     <UserNameDisplay user={user} showAvatar={false} />
                     <p className="text-sm text-text-secondary">{user.role}</p>
                </div>
            </div>
        </header>
    );
};

export default UserProfileHeader;