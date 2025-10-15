import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Post, User, FeedComment, ReactionType, Project } from '../../types';
import Card from '../ui/Card';
import UserNameDisplay from '../ui/UserNameDisplay';
import { useUsers } from '../../context/UserContext';
import { ChatBubbleOvalLeftEllipsisIcon, ShareIcon, EllipsisHorizontalIcon, PinIcon, HeartIcon, SparklesIcon, QuestionMarkCircleIcon, HandRaisedIcon, BriefcaseIcon } from '../icons';
import CommentSection from './CommentSection';
import { Link } from 'react-router-dom';

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

const PostCard: React.FC<PostCardProps> = ({ post, comments, currentUser, projects, layout, onReact, onAddComment, onDelete, onVote, onPinToggle, onTagClick }) => {
    const { findUserById } = useUsers();
    const author = findUserById(post.authorId);
    const [showComments, setShowComments] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    
    const canModify = currentUser.id === post.authorId || currentUser.role === 'Admin';
    const isAdmin = currentUser.role === 'Admin';
    const project = useMemo(() => post.projectId ? projects.find(p => p.id === post.projectId) : null, [post.projectId, projects]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
            setShowOptions(false);
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

    const renderContentWithTags = (content: string) => {
        const parts = content.split(/(#\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('#')) {
                const tag = part.substring(1);
                return <button key={i} onClick={() => onTagClick(tag)} className="font-semibold text-brand-blue hover:underline">{part}</button>;
            }
            return part;
        });
    };
    
    const reactionSummary = useMemo(() => {
        const counts: { [key in ReactionType]?: number } = {};
        post.reactions.forEach(r => {
            counts[r.type] = (counts[r.type] || 0) + 1;
        });
        return (Object.keys(counts) as ReactionType[]).sort((a,b) => counts[b]! - counts[a]!);
    }, [post.reactions]);
    
    const currentUserReaction = post.reactions.find(r => r.userId === currentUser.id);

    if (layout === 'grid') {
        return (
            <div className="relative group aspect-square bg-surface rounded-xl overflow-hidden cursor-pointer">
                {post.mediaUrl ? (
                    <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                ) : (
                    <div className="p-4 text-sm text-text-primary">{post.content.substring(0, 150)}...</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <div className="flex items-center gap-4 text-white font-bold">
                        <div className="flex items-center gap-1.5">
                            <HeartIcon className="w-6 h-6" solid />
                            <span>{post.reactions.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
                            <span>{comments.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <Card className="p-0 flex flex-col">
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <img src={author?.avatarUrl} alt={author?.fullName} className="w-12 h-12 rounded-full" />
                        <div>
                            <UserNameDisplay user={author} textClassName="font-semibold text-text-primary" />
                             <div className="flex items-center gap-2 text-xs text-text-secondary">
                                {post.isPinned && (
                                    <span className="flex items-center gap-1 font-semibold text-text-secondary">
                                        <PinIcon className="w-3.5 h-3.5"/> Pinned
                                    </span>
                                )}
                                <span>{timeAgo(post.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {canModify && (
                         <div className="relative" ref={optionsRef}>
                            <button onClick={() => setShowOptions(!showOptions)} className="p-2 rounded-full hover:bg-secondary">
                                <EllipsisHorizontalIcon className="w-6 h-6 text-text-secondary" />
                            </button>
                            {showOptions && (
                                <div className="absolute top-full right-0 mt-1 bg-surface border border-border-color rounded-xl shadow-card z-10 w-40 py-1">
                                    {isAdmin && (
                                        <button 
                                            onClick={() => { onPinToggle(post.id); setShowOptions(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-secondary flex items-center gap-2 rounded-md m-1"
                                        >
                                           <PinIcon className="w-4 h-4" /> {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => { onDelete(post.id); setShowOptions(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-secondary rounded-md m-1"
                                    >
                                        Delete Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {post.content && <div className="my-3 text-text-primary whitespace-pre-wrap text-[16px] leading-relaxed">{renderContentWithTags(post.content)}</div>}

                {project && (
                    <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-xs bg-secondary px-2 py-1 rounded-md mb-2 hover:bg-secondary-hover">
                        <BriefcaseIcon className="w-3.5 h-3.5"/>
                        <span className="font-semibold">{project.title}</span>
                    </Link>
                )}

                {post.postType === 'showcase' && post.showcaseDetails && (
                    <div className="mt-3 border border-border-color bg-page-bg rounded-xl p-3 text-sm space-y-1">
                        <p><strong className="text-text-secondary">Style:</strong> {post.showcaseDetails.style}</p>
                        <p><strong className="text-text-secondary">Materials:</strong> {post.showcaseDetails.materials}</p>
                        <p><strong className="text-text-secondary">Palette:</strong> {post.showcaseDetails.palette}</p>
                    </div>
                )}
            </div>
            
            {post.mediaUrl && post.postType !== 'before_after' && (
                <div className="bg-secondary">
                     <img src={post.mediaUrl} alt="Post content" className="w-full max-h-[70vh] object-contain" />
                </div>
            )}

            {post.postType === 'before_after' && post.beforeMediaUrl && post.mediaUrl && (
                <div className="grid grid-cols-2">
                    <div className="relative"><img src={post.beforeMediaUrl} className="w-full h-full object-cover"/><span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-semibold">Before</span></div>
                    <div className="relative"><img src={post.mediaUrl} className="w-full h-full object-cover"/><span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-semibold">After</span></div>
                </div>
            )}

            <div className="px-4 sm:px-5 pt-3 pb-2">
                <div className="flex justify-between items-center text-text-secondary text-sm">
                    {post.reactions.length > 0 && (
                        <div className="flex items-center gap-1">
                            {reactionSummary.slice(0, 3).map(type => <span key={type}>{reactionMap[type]}</span>)}
                            <span className="font-medium text-text-primary ml-1">{post.reactions.length}</span>
                        </div>
                    )}
                     {comments.length > 0 && (
                        <button onClick={() => setShowComments(!showComments)} className="hover:underline ml-auto">
                            {comments.length} comment{comments.length > 1 ? 's' : ''}
                        </button>
                    )}
                </div>

                <div className="border-t border-border-color my-2"></div>

                <div className="grid grid-cols-3 -mx-2">
                    <div className="relative" onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
                        <button
                            onClick={() => onReact(post.id, currentUserReaction?.type || 'love')}
                            className={`flex justify-center items-center gap-2 py-2 rounded-lg font-semibold transition-colors w-full ${
                                currentUserReaction ? 'text-brand-blue' : 'text-text-secondary hover:bg-secondary'
                            }`}
                        >
                            {currentUserReaction ? reactionMap[currentUserReaction.type] : <HeartIcon className="w-5 h-5"/>}
                            {currentUserReaction ? reactionTooltips[currentUserReaction.type] : 'React'}
                        </button>
                        {showReactions && (
                             <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface p-1.5 rounded-full shadow-card flex gap-1.5 border border-border-color">
                                {(Object.keys(reactionMap) as ReactionType[]).map(type => (
                                    <button key={type} onClick={() => onReact(post.id, type)} className="p-1.5 rounded-full hover:bg-secondary scale-100 hover:scale-125 transition-transform">
                                        {reactionMap[type]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                     <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex justify-center items-center gap-2 py-2 rounded-lg font-semibold text-text-secondary hover:bg-secondary transition-colors w-full"
                    >
                        <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                        Comment
                    </button>
                     <button
                        className="flex justify-center items-center gap-2 py-2 rounded-lg font-semibold text-text-secondary hover:bg-secondary transition-colors w-full"
                    >
                        <ShareIcon className="w-5 h-5" />
                        Share
                    </button>
                </div>
                
                {showComments && (
                    <div className="pt-2">
                        <CommentSection
                            postId={post.id}
                            comments={comments}
                            currentUser={currentUser}
                            onAddComment={onAddComment}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default PostCard;