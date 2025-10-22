import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { Post } from '../../types';
import UserNameDisplay from '../ui/UserNameDisplay';

// A simplified, condensed post view for the widget
const MiniPost: React.FC<{ post: Post }> = ({ post }) => {
    const { findUserById } = useUsers();
    const author = findUserById(post.authorId);

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    return (
        <Link to="/hub" className="block bg-page-bg p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-start gap-3">
                <img src={author?.avatarUrl} alt={author?.fullName} className="w-8 h-8 rounded-full" />
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <UserNameDisplay user={author} showAvatar={false} textClassName="text-sm font-semibold text-text-primary" />
                        <span className="text-xs text-text-secondary">{timeAgo(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1 truncate">
                        {post.content ? (post.content.length > 80 ? `${post.content.substring(0, 80)}...` : post.content) : 'View post for media...'}
                    </p>
                </div>
            </div>
        </Link>
    );
};


const CommunityFeedWidget: React.FC = () => {
    const { posts, projects } = useData();
    const { user } = useAuth();

    // The same visibility logic from CommunityHub.tsx
    const visiblePosts = React.useMemo(() => {
        if (!user) return [];

        const canUserSeePost = (post: Post): boolean => {
            if (user.role === 'Admin' || user.role === 'Sub-Admin') return true;
            
            switch (post.visibility) {
                case 'everyone':
                    return true;
                case 'team_only':
                    return user.role === 'Designer';
                case 'project_members': {
                    if (!post.projectId) return false;
                    const project = projects.find(p => p.id === post.projectId);
                    if (!project) return false;
                    return user.id === project.customerId || user.id === project.designerId;
                }
                default:
                    return true;
            }
        };

        return posts
            .filter(canUserSeePost)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .slice(0, 3); // Show the latest 3 posts
    }, [posts, user, projects]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold font-display text-text-primary">Community Hub</h2>
                <Link to="/hub">
                    <Button variant="secondary" className="!px-4 !text-sm">View All</Button>
                </Link>
            </div>
            {visiblePosts.length > 0 ? (
                <div className="space-y-3">
                    {visiblePosts.map(post => <MiniPost key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-sm text-text-secondary">No recent posts in the community hub.</p>
                </div>
            )}
        </Card>
    );
};

export default CommunityFeedWidget;