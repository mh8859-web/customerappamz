import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_POSTS, MOCK_FEED_COMMENTS, MOCK_PROJECTS } from '../../services/mockData';
import { Post, FeedComment, Poll, Project, ReactionType, User, PostVisibility } from '../../types';
import CreatePost from '../../components/feed/CreatePost';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { ListBulletIcon, Squares2X2Icon, XMarkIcon } from '../../components/icons';
import { useUsers } from '../../context/UserContext';
import CommunityFeed from './CommunityFeed';

const CommunityHub: React.FC = () => {
    const { user } = useAuth();
    const { users, loading: usersLoading } = useUsers();
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [comments, setComments] = useState<FeedComment[]>(MOCK_FEED_COMMENTS);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [layout, setLayout] = useState<'list' | 'grid'>('list');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    // Hydrate mock data with real user IDs once users are loaded
    useEffect(() => {
        if (!usersLoading && users.length > 0) {
            const admin = users.find(u => u.role === 'Admin');
            const designer = users.find(u => u.role === 'Designer');
            const customer = users.find(u => u.role === 'Customer');
            
            const hydrateId = (placeholder: string) => {
                if (placeholder === 'ADMIN_1' && admin) return admin.id;
                if (placeholder === 'DESIGNER_1' && designer) return designer.id;
                if (placeholder === 'CUSTOMER_1' && customer) return customer.id;
                return placeholder;
            };

            setPosts(prevPosts => prevPosts.map(p => ({ ...p, authorId: hydrateId(p.authorId) })));
            setComments(prevComments => prevComments.map(c => ({ ...c, authorId: hydrateId(c.authorId) })));
        }
    }, [usersLoading, users]);


    const sortedAndFilteredPosts = useMemo(() => {
        if (!user) return [];

        const canUserSeePost = (post: Post): boolean => {
            if (user.role === 'Admin') return true;
            
            switch (post.visibility) {
                case 'everyone':
                    return true;
                case 'team_only':
                    return user.role === 'Designer';
                case 'project_members': {
                    if (!post.projectId) return false;
                    const project = MOCK_PROJECTS.find(p => p.id === post.projectId);
                    if (!project) return false;
                    return user.id === project.customerId || user.id === project.designerId;
                }
                default:
                    return true;
            }
        };

        return [...posts]
            .filter(p => {
                const tagMatch = !activeTag || (p.tags && p.tags.includes(`#${activeTag}`));
                const visibilityMatch = canUserSeePost(p);
                return tagMatch && visibilityMatch;
            })
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [posts, activeTag, user]);

    if (usersLoading || !user) {
        return null;
    }

    const handleCreatePost = (
        content: string, 
        mediaFile?: File, 
        addPoll?: boolean,
        projectId?: string,
        postType?: Post['postType'],
        showcaseDetails?: Post['showcaseDetails'],
        beforeMediaFile?: File,
        visibility?: PostVisibility
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
            tags,
            visibility: visibility || 'everyone',
        };
        
        MOCK_POSTS.unshift(newPost); // Persist to mock data
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const handlePinToggle = (postId: string) => {
        const postIndex = MOCK_POSTS.findIndex(p => p.id === postId);
        if(postIndex > -1) MOCK_POSTS[postIndex].isPinned = !MOCK_POSTS[postIndex].isPinned;

        setPosts(prevPosts =>
            prevPosts.map(post => 
                post.id === postId ? { ...post, isPinned: !post.isPinned } : post
            )
        );
    };

    const handleVote = (postId: string, optionId: string) => {
        // Implementation for voting
    };

    const handleReact = (postId: string, reaction: ReactionType) => {
        const postIndex = MOCK_POSTS.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const existingReactionIndex = MOCK_POSTS[postIndex].reactions.findIndex(r => r.userId === user.id);
        
        if (existingReactionIndex > -1) {
            if (MOCK_POSTS[postIndex].reactions[existingReactionIndex].type === reaction) {
                MOCK_POSTS[postIndex].reactions.splice(existingReactionIndex, 1);
            } else {
                MOCK_POSTS[postIndex].reactions[existingReactionIndex].type = reaction;
            }
        } else {
            MOCK_POSTS[postIndex].reactions.push({ userId: user.id, type: reaction });
        }
        
        setPosts([...MOCK_POSTS]);
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
        const postIndex = MOCK_POSTS.findIndex(p => p.id === postToDelete);
        if(postIndex > -1) MOCK_POSTS.splice(postIndex, 1);
        
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        setComments(prev => prev.filter(c => c.postId !== postToDelete));
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
                        <div className="flex items-center gap-2 bg-brand-blue/10 text-brand-blue text-sm font-semibold px-3 py-1.5 rounded-lg">
                            <span>Filtering by: #{activeTag}</span>
                            <button onClick={() => setActiveTag(null)} className="bg-brand-blue/20 rounded-full p-0.5"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                     )}
                </div>

                <CommunityFeed
                    posts={sortedAndFilteredPosts}
                    comments={comments}
                    currentUser={user}
                    projects={MOCK_PROJECTS}
                    layout={layout}
                    activeTag={activeTag}
                    onReact={handleReact}
                    onAddComment={handleAddComment}
                    onDelete={setPostToDelete}
                    onVote={handleVote}
                    onPinToggle={handlePinToggle}
                    onTagClick={handleTagClick}
                    onClearFilter={() => setActiveTag(null)}
                />
            </div>
        </>
    );
};

export default CommunityHub;