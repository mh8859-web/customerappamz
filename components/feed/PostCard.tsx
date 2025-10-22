import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Post, User, FeedComment, ReactionType, Project } from '../../types';
import Card from '../ui/Card';
import UserNameDisplay from '../ui/UserNameDisplay';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext'; // Import useAuth for follow system
import { ChatBubbleOvalLeftEllipsisIcon, ShareIcon, EllipsisHorizontalIcon, PinIcon, HeartIcon, SparklesIcon, QuestionMarkCircleIcon, HandRaisedIcon, BriefcaseIcon, GlobeAltIcon, UserGroupIcon, ThumbUpIcon, PaintBrushIcon, BuildingOffice2Icon } from '../icons';
import CommentSection from './CommentSection';
import { Link } from 'react-router-dom';
import ReactionPicker from './ReactionPicker';
import Button from '../ui/Button'; // Import Button for the follow button

const reactionMap: Record<ReactionType, React.ReactNode> = {
    love: <HeartIcon className="w-5 h-5 text-red-500" solid />,
    idea: <SparklesIcon className="w-5 h-5 text-yellow-500" solid />,
    thought: <QuestionMarkCircleIcon className="w-5 h-5 text-blue-500" solid />,
    kudos: <HandRaisedIcon className="w-5 h-5 text-green-500" solid />,
};

const reactionTooltips: Record<ReactionType, string> = {
    love: 'Love',
    idea: 'Brilliant',
    thought: 'Hmm',
    kudos: 'Kudos',
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

const PostCard: React.FC<PostCardProps> = ({ post, comments, currentUser, projects, layout, onReact, onAddComment, onDelete, onVote, onPinToggle, onTagClick }) => {
    const { findUserById } = useUsers();
    const { following, toggleFollow } = useAuth(); // Get follow state and function
    const author = findUserById(post.authorId);
    const [showComments, setShowComments] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    
    const canModify = currentUser.id === post.authorId || currentUser.role === 'Admin';
    const isAdmin = currentUser.role === 'Admin';
    const project = useMemo(() => post.projectId ? projects.find(p => p.id === post.projectId) : null, [post.projectId, projects]);

    const isFollowingAuthor = author ? following.has(author.id) : false;
    const isTeamMember = author && (author.role === 'Admin' || author.role === 'Sub-Admin' || author.role === 'Designer');
    const showFollowButton = isTeamMember && author?.id !== currentUser.id;

    const visibilityDetails = useMemo(() => {
        switch(post.visibility) {
            case 'everyone': return { icon: <GlobeAltIcon className="w-3.5 h-3.5"/>, text: 'Visible to Everyone' };
            case 'team_only': return { icon: <UserGroupIcon className="w-3.h-3.5"/>, text: 'Visible to Team Only' };
            case 'project_members': return { icon: <BriefcaseIcon className="w-3.5 h-3.5"/>, text: `Visible to members of ${project?.title || 'Project'}` };
            default: return null;
        }
    }, [post.visibility, project]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) setShowOptions(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        post.reactions.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
        return (Object.keys(counts) as ReactionType[]).sort((a,b) => counts[b]! - counts[a]!);
    }, [post.reactions]);
    
    const currentUserReaction = post.reactions.find(r => r.userId === currentUser.id);

    return (
        <Card className="p-0 flex flex-col">
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Link to={isTeamMember ? `/profile/${author?.id}` : '#'} className={isTeamMember ? '' : 'pointer-events-none'}>
                           <img src={author?.avatarUrl} alt={author?.fullName} className="w-12 h-12 rounded-full" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <UserNameDisplay user={author} textClassName="font-semibold text-text-primary" />
                                {showFollowButton && (
                                    <>
                                        <span className="text-text-secondary">&middot;</span>
                                        <button onClick={() => author && toggleFollow(author.id)} className={`text-sm font-semibold ${isFollowingAuthor ? 'text-text-secondary' : 'text-brand-blue'}`}>
                                            {isFollowingAuthor ? 'Following' : 'Follow'}
                                        </button>
                                    </>
                                )}
                            </div>
                             <div className="flex items-center gap-2 text-xs text-text-secondary">
                                {post.isPinned && <span className="flex items-center gap-1 font-semibold text-text-secondary"><PinIcon className="w-3.5 h-3.5"/> Pinned</span>}
                                <span>{timeAgo(post.createdAt)}</span>
                                {visibilityDetails && <span className="flex items-center gap-1" title={visibilityDetails.text}>&middot;{visibilityDetails.icon}</span>}
                            </div>
                        </div>
                    </div>
                    {canModify && (
                         <div className="relative" ref={optionsRef}>
                            <button onClick={() => setShowOptions(!showOptions)} className="p-2 rounded-full hover:bg-secondary"><EllipsisHorizontalIcon className="w-6 h-6 text-text-secondary" /></button>
                            {showOptions && (
                                <div className="absolute top-full right-0 mt-1 bg-surface border border-border-color rounded-xl shadow-card z-10 w-40 py-1">
                                    {isAdmin && <button onClick={() => { onPinToggle(post.id); setShowOptions(false); }} className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-secondary flex items-center gap-2 rounded-md m-1"><PinIcon className="w-4 h-4" /> {post.isPinned ? 'Unpin Post' : 'Pin Post'}</button>}
                                    <button onClick={() => { onDelete(post.id); setShowOptions(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-secondary rounded-md m-1">Delete Post</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {post.content && <div className="my-3 text-text-primary whitespace-pre-wrap text-[16px] leading-relaxed">{renderContentWithTags(post.content)}</div>}

                {project && (
                    <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-xs bg-secondary px-2 py-1 rounded-md mb-2 hover:bg-secondary-hover">
                        <BriefcaseIcon className="w-3.5 h-3.5"/><span className="font-semibold">{project.title}</span>
                    </Link>
                )}
                 {post.postType === 'showcase' && <span className="inline-flex items-center gap-2 text-xs bg-brand-blue/10 text-brand-blue font-semibold px-2 py-1 rounded-md mb-2 ml-2"><BuildingOffice2Icon className="w-3.5 h-3.5"/>Showcase</span>}
                 {post.postType === 'before_after' && <span className="inline-flex items-center gap-2 text-xs bg-purple-500/10 text-purple-500 font-semibold px-2 py-1 rounded-md mb-2 ml-2"><PaintBrushIcon className="w-3.5 h-3.5"/>Before & After</span>}
            </div>
            
            {post.mediaUrl && post.postType !== 'before_after' && (
                <div className="bg-secondary -mx-px"><img src={post.mediaUrl} alt="Post content" className="w-full max-h-[70vh] object-contain" /></div>
            )}

            {post.postType === 'before_after' && post.beforeMediaUrl && post.mediaUrl && (
                <div className="grid grid-cols-2 -mx-px"><div className="relative"><img src={post.beforeMediaUrl} className="w-full h-full object-cover"/><span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-semibold">Before</span></div><div className="relative"><img src={post.mediaUrl} className="w-full h-full object-cover"/><span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-semibold">After</span></div></div>
            )}
            
             {post.postType === 'showcase' && post.showcaseDetails && (
                <div className="border-t border-b border-border-color bg-page-bg/50 px-5 py-3 text-sm grid grid-cols-3 gap-2">
                    <p><strong className="text-text-secondary font-medium">Style:</strong> {post.showcaseDetails.style}</p>
                    <p><strong className="text-text-secondary font-medium">Materials:</strong> {post.showcaseDetails.materials}</p>
                    <p><strong className="text-text-secondary font-medium">Palette:</strong> {post.showcaseDetails.palette}</p>
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
                     {comments.length > 0 && <button onClick={() => setShowComments(!showComments)} className="hover:underline ml-auto">{comments.length} comment{comments.length > 1 ? 's' : ''}</button>}
                </div>

                <div className="border-t border-border-color my-2"></div>

                <div className="grid grid-cols-3 -mx-2">
                    <ReactionPicker onSelect={(reaction) => onReact(post.id, reaction)}>
                        <button
                            className={`flex justify-center items-center gap-2 py-2 rounded-lg font-semibold transition-colors w-full ${
                                currentUserReaction ? 'text-brand-blue' : 'text-text-secondary hover:bg-secondary'
                            }`}
                        >
                            {currentUserReaction ? reactionMap[currentUserReaction.type] : <ThumbUpIcon className="w-5 h-5"/>}
                            {currentUserReaction ? reactionTooltips[currentUserReaction.type] : 'Like'}
                        </button>
                    </ReactionPicker>
                     <button onClick={() => setShowComments(!showComments)} className="flex justify-center items-center gap-2 py-2 rounded-lg font-semibold text-text-secondary hover:bg-secondary transition-colors w-full"><ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />Comment</button>
                     <button className="flex justify-center items-center gap-2 py-2 rounded-lg font-semibold text-text-secondary hover:bg-secondary transition-colors w-full"><ShareIcon className="w-5 h-5" />Share</button>
                </div>
                
                {showComments && <div className="pt-2"><CommentSection postId={post.id} comments={comments} currentUser={currentUser} onAddComment={onAddComment}/></div>}
            </div>
        </Card>
    );
};

export default PostCard;