import React from 'react';
import { User } from '../../types';
import Card from '../ui/Card';
import UserNameDisplay from '../ui/UserNameDisplay';

interface CommunitySidebarProps {
  user: User;
  popularTags: string[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ user, popularTags, activeTag, onTagClick }) => {
  return (
    <div className="space-y-4 sticky top-24">
      <Card className="text-center">
        <img src={user.avatarUrl} alt={user.fullName} className="w-20 h-20 rounded-full mx-auto" />
        <div className="mt-3">
            <UserNameDisplay user={user} className="justify-center" textClassName="font-bold text-lg text-text-primary" />
        </div>
        <p className="text-sm text-text-secondary mt-1">{user.role}</p>
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Trending Topics</h3>
        <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
                <button 
                    key={tag}
                    onClick={() => onTagClick(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        activeTag === tag
                            ? 'bg-brand-blue text-white font-semibold'
                            : 'bg-secondary hover:bg-secondary-hover'
                    }`}
                >
                    #{tag}
                </button>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default CommunitySidebar;