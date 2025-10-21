import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Post, FeedComment, Poll, Project, ReactionType, User, PostVisibility } from '../../types';
import CreatePost from '../../components/feed/CreatePost';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { ListBulletIcon, Squares2X2Icon, XMarkIcon } from '../../components/icons';
import CommunityFeed from './CommunityFeed';
import { createRecord, updateRecord, deleteRecord } from '../../services/api';

const CommunityHub: React.FC = () => {
    const { user, users, posts, feedComments, projects, refetchAllData, status } = useAppContext();
    
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [layout, setLayout] = useState<'list' | 'grid'>('list');
    const [activeTag, setActiveTag] = useState<string | null>(null);

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
                    const project = projects.find(p => p.id === post.projectId);
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
    }, [posts, activeTag, user, projects]);

    if (status !== 'authenticated' || !user) {
        return null;
    }

    const handleCreatePost = async (
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
        let beforeMediaUrl: string | undefined;

        // In a real app, file uploads would be more robust
        if (mediaFile) {
            mediaUrl = URL.createObjectURL(mediaFile);
        }
        if (beforeMediaFile) {
            beforeMediaUrl = URL.createObjectURL(beforeMediaFile);
        }

        const newPostData = {
            author_id: user.id,
            content,
            media_url: mediaUrl,
            media_type: mediaFile?.type.startsWith('image/') ? 'image' : 'video',
            before_media_url: beforeMediaUrl,
            reactions: [],
            is_pinned: false,
            project_id: projectId || null,
            post_type: postType || 'standard',
            showcase_details: showcaseDetails,
            tags: content.match(/#\w+/g) || [],
            visibility: visibility || 'everyone',
        };
        
        await createRecord('posts', newPostData);
        await refetchAllData();
    };

    const handlePinToggle = async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (post) {
            await updateRecord('posts', postId, { is_pinned: !post.isPinned });
            await refetchAllData();
        }
    };

    const handleVote = (postId: string, optionId: string) => {
        // Voting logic would go here, updating the `poll` JSONB field.
    };

    const handleReact = async (postId: string, reaction: ReactionType) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const currentReactions = post.reactions || [];
        const existingReactionIndex = currentReactions.findIndex(r => r.userId === user.id);
        let updatedReactions;

        if (existingReactionIndex > -1) {
            if (currentReactions[existingReactionIndex].type === reaction) {
                updatedReactions = currentReactions.filter(r => r.userId !== user.id);
            } else {
                updatedReactions = currentReactions.map(r => r.userId === user.id ? { ...r, type: reaction } : r);
            }
        } else {
            updatedReactions = [...currentReactions, { userId: user.id, type: reaction }];
        }
        
        await updateRecord('posts', postId, { reactions: updatedReactions });
        await refetchAllData();
    };

    const handleAddComment = async (postId: string, content: string) => {
        const newComment = {
            post_id: postId,
            author_id: user.id,
            content,
        };
        await createRecord('feed_comments', newComment);
        await refetchAllData();
    };
    
    const confirmDeletePost = async () => {
        if (!postToDelete) return;
        const { error } = await deleteRecord('posts', postToDelete);
        if (error) {
            alert('Failed to delete post. Please try again.');
        }
        await refetchAllData();
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
                <CreatePost user={user} projects={projects} onCreatePost={handleCreatePost} />

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
                    comments={feedComments}
                    currentUser={user}
                    projects={projects}
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
