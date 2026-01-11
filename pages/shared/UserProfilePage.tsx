
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import UserProfileHeader from '../../components/profile/UserProfileHeader';
import ProfilePostGrid from '../../components/profile/ProfilePostGrid';
import Card from '../../components/ui/Card';
import { BriefcaseIcon, CalendarIcon, PhoneIcon } from '../../components/icons';

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
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <UserProfileHeader
                user={profileUser}
                postCount={userPosts.length}
                isCurrentUser={isCurrentUser}
            />
            
            {/* Professional Details Section */}
            <Card className="p-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Professional Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm">
                            <CalendarIcon className="w-5 h-5"/>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined Team</p>
                            <p className="text-sm font-bold text-slate-900">{profileUser.joinedDate ? new Date(profileUser.joinedDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-gold shadow-sm">
                            <BriefcaseIcon className="w-5 h-5"/>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                            <p className="text-sm font-bold text-slate-900 line-clamp-1" title={profileUser.experience}>{profileUser.experience || 'Not Listed'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm">
                            <PhoneIcon className="w-5 h-5"/>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</p>
                            <p className="text-sm font-bold text-slate-900">{profileUser.phoneNumber || 'Hidden'}</p>
                        </div>
                    </div>
                </div>
                {profileUser.experience && profileUser.experience.length > 50 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Detailed Bio</p>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{profileUser.experience}"</p>
                    </div>
                )}
            </Card>

            <main>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 px-2">Recent Activity</h3>
                <ProfilePostGrid posts={userPosts} />
            </main>
        </div>
    );
};

export default UserProfilePage;
