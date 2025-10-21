import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Post, User, FeedComment, ReactionType, Project } from '../../types';
import Card from '../ui/Card';
import UserNameDisplay from '../ui/UserNameDisplay';
import { useAppContext } from '../../context/AppContext';
import { ChatBubbleOvalLeftEllipsisIcon, ShareIcon, EllipsisHorizontalIcon, PinIcon, HeartIcon, SparklesIcon, QuestionMarkCircleIcon, HandRaisedIcon } from '../icons';
import CommentSection from './CommentSection';

interface PostCardProps {
    post: Post;
    comments: FeedComment[];
    currentUser: User;
    projects: Project[];
    layout: 'list' | 'grid';
    onReact: (postId: string, reaction: ReactionType) => void;
    onAddComment: (postId: string, content: string) => void;
    onDelete: (postId: string) => void;
    onVote: (postId: string, optionId: string) => void;
    onPinToggle: (postId: string) => void;
    onTagClick: (tag: string) => void;
}

const reactionMap: Record<ReactionType, React.ReactNode> = {
    love: <HeartIcon className="w-5 h-5 text-red-500" solid />,
    idea: <SparklesIcon className="w-5 h-5 text-yellow-500" />,
    thought: <QuestionMarkCircleIcon className="w-5 h-5 text-blue-500" />,
    kudos: <HandRaisedIcon className="w-5 h-5 text-green-500" />,
};

const reactionTooltips: Record<ReactionType, string> = {
    love: 'Love',
    idea: 'Idea',
    thought: 'Thought',
    kudos: 'Kudos',
};

// Fix: Complete the component implementation and export it correctly.
export const PostCard: React.FC<PostCardProps> = ({
    post,
    comments,
    currentUser,
    projects,
    layout,
    onReact,
    onAddComment,
    onDelete,
    onVote,
    onPinToggle,
    onTagClick,
}) => {
    const { findUserById } = useAppContext();
    const author = findUserById(post.authorId);
    const [showComments, setShowComments] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)}y ago`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)}mo ago`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return "Just now";
    };

    const project = useMemo(() => post.projectId ? projects.find(p => p.id === post.projectId) : null, [post.projectId, projects]);

    const userReaction = useMemo(() => post.reactions.find(r => r.userId === currentUser.id), [post.reactions, currentUser.id]);
    
    const reactionCounts = useMemo(() => {
        return post.reactions.reduce((acc, reaction) => {
            acc[reaction.type] = (acc[reaction.type] || 0) + 1;
            return acc;
        }, {} as Record<ReactionType, number>);
    }, [post.reactions]);

    return (
        <Card className={`flex flex-col ${layout === 'grid' ? 'h-full' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img src={author?.avatarUrl} alt={author?.fullName} className="w-10 h-10 rounded-full" />
                    <div>
                        <UserNameDisplay user={author} textClassName="font-semibold text-text-primary" />
                        <p className="text-xs text-text-secondary">{timeAgo(post.createdAt)}</p>
                    </div>
                </div>
                <div className="relative flex items-center" ref={menuRef}>
                    {post.isPinned && <PinIcon className="w-5 h-5 text-yellow-500 mr-2" />}
                    {(post.authorId === currentUser.id || currentUser.role === 'Admin') && (
                        <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-secondary">
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                        </button>
                    )}
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-surface border border-border-color rounded-lg shadow-lg z-10">
                            {currentUser.role === 'Admin' && (
                                <button onClick={() => { onPinToggle(post.id); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-secondary">
                                    {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                                </button>
                            )}
                            {post.authorId === currentUser.id && (
                                <button onClick={() => { onDelete(post.id); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-secondary">
                                    Delete Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 text-sm text-text-primary whitespace-pre-wrap">
                <p>{post.content}</p>
            </div>
            
            {post.tags && post.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {post.tags.map(tag => (
                        <button key={tag} onClick={() => onTagClick(tag.substring(1))} className="text-xs text-brand-blue font-semibold hover:underline">
                            {tag}
                        </button>
                    ))}
                </div>
            )}
            
            {post.mediaUrl && (
                <div className="mt-3 -mx-6">
                    <img src={post.mediaUrl} alt="Post media" className="w-full h-auto" />
                </div>
            )}
            
             <div className="mt-3 flex justify-between items-center text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                    {Object.entries(reactionCounts).map(([type, count]) => (
                        <span key={type} className="flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded-full">
                            {reactionMap[type as ReactionType]}
                            <span className="font-medium">{count}</span>
                        </span>
                    ))}
                </div>
                <span>{comments.length} Comments</span>
            </div>

            <div className="mt-2 pt-2 border-t border-border-color flex justify-around">
                <div className="relative group">
                    <button 
                        onClick={() => onReact(post.id, userReaction?.type || 'love')} 
                        className="flex-1 flex justify-center items-center gap-2 text-sm font-semibold p-2 rounded-lg hover:bg-secondary transition-colors w-full"
                    >
                        {userReaction ? (
                           <> {reactionMap[userReaction.type]} {reactionTooltips[userReaction.type]} </>
                        ) : (
                           <> <HeartIcon className="w-5 h-5"/> Love </>
                        )}
                    </button>
                    <div className="absolute bottom-full mb-1 flex gap-2 bg-surface p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        {Object.keys(reactionMap).map(type => (
                            <button key={type} onClick={() => onReact(post.id, type as ReactionType)} className="p-1.5 hover:bg-secondary rounded-full">
                                {reactionMap[type as ReactionType]}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-2 text-sm font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                    <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5"/> Comment
                </button>
                <button className="flex-1 flex justify-center items-center gap-2 text-sm font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                    <ShareIcon className="w-5 h-5"/> Share
                </button>
            </div>
            
            {showComments && (
                <div className="mt-2">
                    <CommentSection 
                        postId={post.id}
                        comments={comments}
                        currentUser={currentUser}
                        onAddComment={onAddComment}
                    />
                </div>
            )}
        </Card>
    );
};

// No default export as the error suggests.
