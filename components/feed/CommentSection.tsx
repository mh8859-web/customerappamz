import React, { useState } from 'react';
import { FeedComment, User } from '../../types';
import { useUsers } from '../../context/UserContext';
import UserNameDisplay from '../ui/UserNameDisplay';

interface CommentSectionProps {
    postId: string;
    comments: FeedComment[];
    currentUser: User;
    onAddComment: (postId: string, content: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments, currentUser, onAddComment }) => {
    const { findUserById } = useUsers();
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(postId, newComment);
            setNewComment('');
        }
    };
    
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return "Just now";
    };


    return (
        <div className="space-y-4 pt-2 border-t border-border-color">
            {/* New Comment Input */}
            <div className="flex items-start gap-2">
                <img src={currentUser.avatarUrl} alt="You" className="w-8 h-8 rounded-full" />
                <form onSubmit={handleSubmit} className="flex-1">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-secondary border border-transparent text-text-primary placeholder:text-text-secondary/80 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </form>
            </div>

            {/* Existing Comments */}
            <div className="space-y-3">
                {comments.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(comment => {
                    const author = findUserById(comment.authorId);
                    return (
                        <div key={comment.id} className="flex items-start gap-2">
                            <img src={author?.avatarUrl} alt={author?.fullName} className="w-8 h-8 rounded-full" />
                            <div>
                                <div className="bg-secondary px-3 py-2 rounded-xl">
                                    <UserNameDisplay user={author} textClassName="font-semibold text-text-primary text-sm" />
                                    <p className="text-sm text-text-primary whitespace-pre-wrap">{comment.content}</p>
                                </div>
                                <span className="text-xs text-text-secondary ml-2">{timeAgo(comment.createdAt)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CommentSection;