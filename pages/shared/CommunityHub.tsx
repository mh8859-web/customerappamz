import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_POSTS, MOCK_FEED_COMMENTS, MOCK_PROJECTS } from '../../services/mockData';
import { Post, FeedComment, Poll, Project, ReactionType } from '../../types';
import CreatePost from '../../components/feed/CreatePost';
import PostCard from '../../components/feed/PostCard';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ListBulletIcon, Squares2X2Icon, XMarkIcon } from '../../components/icons';

const CommunityHub: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [comments, setComments] = useState<FeedComment[]>(MOCK_FEED_COMMENTS);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [layout, setLayout] = useState<'list' | 'grid'>('list');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const sortedAndFilteredPosts = useMemo(() => {
        return [...posts]
            .filter(p => !activeTag || (p.tags && p.tags.includes(`#${activeTag}`)))
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [posts, activeTag]);

    if (!user) return null;

    const handleCreatePost = (
        content: string, 
        mediaFile?: File, 
        addPoll?: boolean,
        projectId?: string,
        postType?: Post['postType'],
        showcaseDetails?: Post['showcaseDetails'],
        beforeMediaFile?: File
    ) => {
        let mediaUrl: string | undefined;
        let mediaType: 'image' | 'video' | undefined;
        let beforeMediaUrl: string | undefined;
        let poll: Poll | undefined;
        const postId = `post-${Date.now()}`;

        if (mediaFile) {
            mediaUrl = URL.createObjectURL(mediaFile);
            mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
        }

        if (beforeMediaFile) {
            beforeMediaUrl = URL.createObjectURL(beforeMediaFile);
        }

        if (addPoll && mediaFile && mediaType === 'image' && user.role === 'Designer') {
            poll = {
                question: 'What do you think of this design?',
                options: [
                    { id: `${postId}-yes`, text: 'Yes, I like it!', votes: [] },
                    { id: `${postId}-no`, text: 'No, not for me.', votes: [] },
                ]
            };
        }

        const tags = content.match(/#\w+/g) || [];

        const newPost: Post = {
            id: postId,
            authorId: user.id,
            content,
            mediaUrl,
            mediaType,
            reactions: [],
            createdAt: new Date().toISOString(),
            poll,
            isPinned: false,
            projectId,
            postType: postType || 'standard',
            showcaseDetails,
            beforeMediaUrl,
            tags
        };

        MOCK_POSTS.unshift(newPost);
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const handlePinToggle = (postId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const updatedPost = { ...post, isPinned: !post.isPinned };
                    const postInMock = MOCK_POSTS.find(p => p.id === postId);
                    if (postInMock) {
                        postInMock.isPinned = updatedPost.isPinned;
                    }
                    return updatedPost;
                }
                return post;
            })
        );
    };

    const handleVote = (postId: string, optionId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId && post.poll) {
                    const alreadyVoted = post.poll.options.some(opt => opt.votes.includes(user.id));
                    if (alreadyVoted) return post; 

                    const newPoll = {
                        ...post.poll,
                        options: post.poll.options.map(option => 
                            option.id === optionId
                                ? { ...option, votes: [...option.votes, user.id] }
                                : option
                        )
                    };
                    
                    const postInMock = MOCK_POSTS.find(p => p.id === postId);
                    if (postInMock) {
                        postInMock.poll = newPoll;
                    }
                    
                    return { ...post, poll: newPoll };
                }
                return post;
            })
        );
    };

    const handleReact = (postId: string, reaction: ReactionType) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const existingReactionIndex = post.reactions.findIndex(r => r.userId === user.id);
                    let newReactions = [...post.reactions];

                    if (existingReactionIndex > -1) {
                        if (post.reactions[existingReactionIndex].type === reaction) {
                            newReactions.splice(existingReactionIndex, 1);
                        } else {
                            newReactions[existingReactionIndex] = { userId: user.id, type: reaction };
                        }
                    } else {
                        newReactions.push({ userId: user.id, type: reaction });
                    }
                    
                    const postInMock = MOCK_POSTS.find(p => p.id === postId);
                    if (postInMock) {
                        postInMock.reactions = newReactions;
                    }

                    return { ...post, reactions: newReactions };
                }
                return post;
            })
        );
    };

    const handleAddComment = (postId: string, content: string) => {
        const newComment: FeedComment = {
            id: `comment-${Date.now()}`,
            postId,
            authorId: user.id,
            content,
            createdAt: new Date().toISOString(),
        };
        MOCK_FEED_COMMENTS.push(newComment);
        setComments(prev => [...prev, newComment]);
    };
    
    const confirmDeletePost = () => {
        if (!postToDelete) return;
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        const postIndex = MOCK_POSTS.findIndex(p => p.id === postToDelete);
        if (postIndex > -1) MOCK_POSTS.splice(postIndex, 1);
        setComments(prev => prev.filter(c => c.postId !== postToDelete));
        const commentsToRemove = MOCK_FEED_COMMENTS.filter(c => c.postId === postToDelete);
        commentsToRemove.forEach(c => {
            const commentIndex = MOCK_FEED_COMMENTS.findIndex(mc => mc.id === c.id);
            if (commentIndex > -1) MOCK_FEED_COMMENTS.splice(commentIndex, 1);
        });
        setPostToDelete(null);
    };

    const handleTagClick = (tag: string) => {
        setActiveTag(prev => (prev === tag ? null : tag));
    };

    return (
        <>
            <Modal
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                title="Delete Post"
            >
                <p className="text-text-secondary mb-6">Are you sure you want to permanently delete this post? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setPostToDelete(null)}>Cancel</Button>
                    <Button onClick={confirmDeletePost} className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500">Delete</Button>
                </div>
            </Modal>
            <div className="max-w-3xl mx-auto space-y-6">
                <CreatePost user={user} projects={MOCK_PROJECTS} onCreatePost={handleCreatePost} />

                <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                        <button onClick={() => setLayout('list')} className={`p-1.5 rounded-md ${layout === 'list' ? 'bg-surface shadow-sm' : ''}`}><ListBulletIcon className="w-5 h-5"/></button>
                        <button onClick={() => setLayout('grid')} className={`p-1.5 rounded-md ${layout === 'grid' ? 'bg-surface shadow-sm' : ''}`}><Squares2X2Icon className="w-5 h-5"/></button>
                     </div>
                     {activeTag && (
                        <div className="flex items-center gap-2 bg-accent-blue-light text-accent text-sm font-semibold px-3 py-1.5 rounded-lg">
                            <span>Filtering by: #{activeTag}</span>
                            <button onClick={() => setActiveTag(null)} className="bg-accent/20 rounded-full p-0.5"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                     )}
                </div>

                <div className={layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-2' : 'space-y-4'}>
                    {sortedAndFilteredPosts.length > 0 ? (
                        sortedAndFilteredPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                comments={comments.filter(c => c.postId === post.id)}
                                currentUser={user}
                                projects={MOCK_PROJECTS}
                                layout={layout}
                                onReact={handleReact}
                                onAddComment={handleAddComment}
                                onDelete={setPostToDelete}
                                onVote={handleVote}
                                onPinToggle={handlePinToggle}
                                onTagClick={handleTagClick}
                            />
                        ))
                    ) : (
                        <Card className="text-center py-12 col-span-full">
                            <h3 className="text-xl font-semibold text-text-primary">No posts found!</h3>
                            <p className="text-text-secondary mt-2">
                                {activeTag ? `There are no posts with the tag #${activeTag}.` : "Be the first to share something."}
                            </p>
                            {activeTag && <Button variant="secondary" className="mt-4" onClick={() => setActiveTag(null)}>Clear Filter</Button>}
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};

export default CommunityHub;