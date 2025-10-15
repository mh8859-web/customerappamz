import React, { useState, useRef, useEffect } from 'react';
import { Post, User, FeedComment } from '../../types';
import Card from '../ui/Card';
import UserNameDisplay from '../ui/UserNameDisplay';
import { useUsers } from '../../context/UserContext';
import { ThumbUpIcon, ChatBubbleOvalLeftEllipsisIcon, ShareIcon, EllipsisHorizontalIcon } from '../icons';
import CommentSection from './CommentSection';

interface PostCardProps {
    post: Post;
    comments: FeedComment[];
    currentUser: User;
    onLike: (postId: string) => void;
    onAddComment: (postId: string, content: string) => void;
    onDelete: (postId: string) => void;
    onVote: (postId: string, optionId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, comments, currentUser, onLike, onAddComment, onDelete, onVote }) => {
    const { findUserById } = useUsers();
    const author = findUserById(post.authorId);
    const [showComments, setShowComments] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    
    const hasLiked = post.likes.includes(currentUser.id);
    const canDelete = currentUser.id === post.authorId || currentUser.role === 'Admin';

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
    
    const PollComponent = () => {
        if (!post.poll) return null;

        const userVote = post.poll.options.find(opt => opt.votes.includes(currentUser.id));
        const totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

        return (
            <div className="mt-3">
                <p className="font-semibold text-text-primary mb-3">{post.poll.question}</p>
                <div className="space-y-2">
                    {post.poll.options.map(option => {
                        const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                        
                        if (userVote) {
                            const isUserChoice = userVote.id === option.id;
                            return (
                                <div key={option.id} className="relative bg-secondary p-2.5 rounded-lg text-sm font-semibold">
                                    <div 
                                        className={`absolute top-0 left-0 h-full rounded-lg ${isUserChoice ? 'bg-accent/30' : 'bg-secondary-hover'}`}
                                        style={{ width: `${percentage}%`}}
                                    ></div>
                                    <div className="relative flex justify-between">
                                        <span>{option.text}</span>
                                        <span>{percentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => onVote(post.id, option.id)}
                                    className="w-full text-left bg-secondary hover:bg-secondary-hover p-2.5 rounded-lg text-sm font-semibold text-text-primary transition-colors"
                                >
                                    {option.text}
                                </button>
                            );
                        }
                    })}
                </div>
            </div>
        )
    };

    return (
        <Card className="p-0">
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <img src={author?.avatarUrl} alt={author?.fullName} className="w-10 h-10 rounded-full" />
                        <div>
                            <UserNameDisplay user={author} textClassName="font-semibold text-text-primary" />
                            <p className="text-xs text-text-secondary">{timeAgo(post.createdAt)}</p>
                        </div>
                    </div>

                    {canDelete && (
                         <div className="relative" ref={optionsRef}>
                            <button onClick={() => setShowOptions(!showOptions)} className="p-2 rounded-full hover:bg-secondary">
                                <EllipsisHorizontalIcon className="w-6 h-6 text-text-secondary" />
                            </button>
                            {showOptions && (
                                <div className="absolute top-full right-0 mt-1 bg-surface border border-border-color rounded-lg shadow-card z-10 w-40">
                                    <button 
                                        onClick={() => {
                                            onDelete(post.id);
                                            setShowOptions(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-secondary"
                                    >
                                        Delete Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {post.content && <p className="my-3 text-text-primary whitespace-pre-wrap">{post.content}</p>}
            </div>
            
            {post.mediaUrl && (
                <div className="bg-page-bg -mx-0">
                    {post.mediaType === 'image' ? (
                        <img src={post.mediaUrl} alt="Post content" className="w-full max-h-[600px] object-contain" />
                    ) : (
                        <video src={post.mediaUrl} controls className="w-full" />
                    )}
                </div>
            )}
            
            {post.poll && <div className="p-4"><PollComponent/></div>}

            <div className="p-3">
                <div className="flex justify-between items-center text-text-secondary text-sm">
                    {post.likes.length > 0 && (
                        <span className="flex items-center gap-1.5">
                            <span className="bg-accent rounded-full p-0.5">
                               <ThumbUpIcon className="w-3 h-3 text-white" solid/>
                            </span>
                            {post.likes.length}
                        </span>
                    )}
                     {comments.length > 0 && (
                        <button onClick={() => setShowComments(!showComments)} className="hover:underline ml-auto">
                            {comments.length} comment{comments.length > 1 ? 's' : ''}
                        </button>
                    )}
                </div>

                <div className="border-t border-border-color my-2"></div>

                <div className="grid grid-cols-3 gap-1">
                    <button
                        onClick={() => onLike(post.id)}
                        className={`flex justify-center items-center gap-2 p-2 rounded-lg font-semibold transition-colors ${
                            hasLiked ? 'text-accent' : 'text-text-secondary hover:bg-secondary'
                        }`}
                    >
                        <ThumbUpIcon className="w-5 h-5" solid={hasLiked} />
                        Like
                    </button>
                     <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex justify-center items-center gap-2 p-2 rounded-lg font-semibold text-text-secondary hover:bg-secondary transition-colors"
                    >
                        <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                        Comment
                    </button>
                     <button
                        className="flex justify-center items-center gap-2 p-2 rounded-lg font-semibold text-text-secondary hover:bg-secondary transition-colors"
                    >
                        <ShareIcon className="w-5 h-5" />
                        Share
                    </button>
                </div>
                
                {showComments && (
                    <>
                        <div className="border-t border-border-color my-2"></div>
                        <CommentSection
                            postId={post.id}
                            comments={comments}
                            currentUser={currentUser}
                            onAddComment={onAddComment}
                        />
                    </>
                )}
            </div>
        </Card>
    );
};

export default PostCard;