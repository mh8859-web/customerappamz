import React from 'react';
import { Post } from '../../types';
import { HeartIcon, ChatBubbleOvalLeftEllipsisIcon, VideoCameraIcon } from '../icons';

interface ProfilePostGridProps {
    posts: Post[];
}

const ProfilePostGrid: React.FC<ProfilePostGridProps> = ({ posts }) => {
    if (posts.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-text-secondary">This user hasn't posted anything yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
                <div key={post.id} className="relative aspect-square group cursor-pointer bg-secondary">
                    {post.mediaUrl ? (
                         <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <p className="text-xs text-text-secondary line-clamp-4">{post.content}</p>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                        <div className="flex items-center gap-2">
                            <HeartIcon className="w-6 h-6" />
                            <span className="font-semibold">{post.reactions.length}</span>
                        </div>
                    </div>

                    {post.mediaType === 'video' && (
                        <VideoCameraIcon className="absolute top-2 right-2 w-5 h-5 text-white drop-shadow-lg" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProfilePostGrid;