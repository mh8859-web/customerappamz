import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import UserProfileHeader from '../../components/profile/UserProfileHeader';
import ProfilePostGrid from '../../components/profile/ProfilePostGrid';

const UserProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { findUserById, loading: usersLoading } = useUsers();
    const { posts, loading: dataLoading } = useData();
    const { user: currentUser } = useAuth();

    const profileUser = useMemo(() => findUserById(userId || ''), [userId, findUserById]);
    
    const userPosts = useMemo(() => {
        return posts
            .filter(post => post.authorId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [posts, userId]);

    const isLoading = usersLoading || dataLoading;

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto animate-pulse">
                <div className="flex items-center gap-8 p-4 border-b border-border-color">
                    <div className="w-32 h-32 bg-secondary rounded-full"></div>
                    <div className="space-y-4 flex-1">
                        <div className="h-8 bg-secondary rounded w-1/2"></div>
                        <div className="h-6 bg-secondary rounded w-1/4"></div>
                        <div className="h-10 bg-secondary rounded-lg w-32"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!profileUser) {
        return <div className="text-center text-text-primary">User not found.</div>;
    }
    
    // Customers do not have public profiles
    if (profileUser.role === 'Customer') {
         return <div className="text-center text-text-primary">This user's profile is private.</div>;
    }

    const isCurrentUser = currentUser?.id === profileUser.id;

    return (
        <div className="max-w-4xl mx-auto">
            <UserProfileHeader
                user={profileUser}
                postCount={userPosts.length}
                isCurrentUser={isCurrentUser}
            />
            <main className="mt-8">
                <ProfilePostGrid posts={userPosts} />
            </main>
        </div>
    );
};

export default UserProfilePage;