import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
// FIX: Import ReactionType to resolve TypeScript error.
import { Post, ReactionType } from '../../types';
import CreatePost from '../../components/feed/CreatePost';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useUsers } from '../../context/UserContext';
import CommunityFeed from './CommunityFeed';
import { useData } from '../../context/DataContext';
import { createRecord, updateRecord, deleteRecord } from '../../services/api';
import CommunitySidebar from '../../components/feed/CommunitySidebar';
import CommunityTrending from '../../components/feed/CommunityTrending';

const CommunityHub: React.FC = () => {
    const { user } = useAuth();
    const { users, loading: usersLoading } = useUsers();
    const { posts, feedComments, projects, refetchData, loading: dataLoading } = useData();
    
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const { sortedAndFilteredPosts, popularTags } = useMemo(() => {
        if (!user) return { sortedAndFilteredPosts: [], popularTags: [] };

        const tagCounts: Record<string, number> = {};
        posts.forEach(post => {
            post.tags?.forEach(tag => {
                const cleanTag = tag.replace('#', '');
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
            });
        });
        const popularTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);


        const canUserSeePost = (post: Post): boolean => {
            if (user.role === 'Admin') return true;
            
            switch (post.visibility) {
                case 'everyone':
                    return true;
                case 'team_only':
                    return user.role === 'Designer' || user.role === 'Sub-Admin';
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

        const filtered = posts.filter(p => {
            const tagMatch = !activeTag || (p.tags && p.tags.includes(`#${activeTag}`));
            const visibilityMatch = canUserSeePost(p);
            return tagMatch && visibilityMatch;
        });

        const sorted = [...filtered].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        return { sortedAndFilteredPosts: sorted, popularTags };
    }, [posts, activeTag, user, projects]);

    if (usersLoading || dataLoading || !user) {
        return null;
    }
    
    // All API interaction functions remain the same
    const handleCreatePost = async (
        content: string, mediaFile?: File, addPoll?: boolean, projectId?: string,
        postType?: Post['postType'], showcaseDetails?: Post['showcaseDetails'],
        beforeMediaFile?: File, visibility?: Post['visibility']
    ) => {
        let mediaUrl: string | undefined;
        let beforeMediaUrl: string | undefined;
        if (mediaFile) mediaUrl = URL.createObjectURL(mediaFile);
        if (beforeMediaFile) beforeMediaUrl = URL.createObjectURL(beforeMediaFile);

        const newPostData = {
            author_id: user.id, content, media_url: mediaUrl,
            media_type: mediaFile?.type.startsWith('image/') ? 'image' : 'video',
            before_media_url: beforeMediaUrl, reactions: [], is_pinned: false,
            project_id: projectId || null, post_type: postType || 'standard',
            showcase_details: showcaseDetails, tags: content.match(/#\w+/g) || [],
            visibility: visibility || 'everyone',
        };
        await createRecord('posts', newPostData);
        await refetchData();
    };

    const handlePinToggle = async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (post) {
            await updateRecord('posts', postId, { is_pinned: !post.isPinned });
            await refetchData();
        }
    };
    
    const handleVote = (postId: string, optionId: string) => {};

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
        await refetchData();
    };

    const handleAddComment = async (postId: string, content: string) => {
        const newComment = { post_id: postId, author_id: user.id, content };
        await createRecord('feed_comments', newComment);
        await refetchData();
    };
    
    const confirmDeletePost = async () => {
        if (!postToDelete) return;
        const { error } = await deleteRecord('posts', postToDelete);
        if (error) alert('Failed to delete post. Please try again.');
        await refetchData();
        setPostToDelete(null);
    };

    const handleTagClick = (tag: string) => {
        setActiveTag(prev => (prev === tag ? null : tag));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Modal isOpen={!!postToDelete} onClose={() => setPostToDelete(null)} title="Delete Post">
                <p className="text-text-secondary mb-6">Are you sure you want to permanently delete this post? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setPostToDelete(null)}>Cancel</Button>
                    <Button onClick={confirmDeletePost} className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500">Delete</Button>
                </div>
            </Modal>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
              {/* Left Sidebar */}
              <div className="hidden lg:block lg:col-span-3">
                <CommunitySidebar 
                  user={user} 
                  popularTags={popularTags} 
                  activeTag={activeTag}
                  onTagClick={handleTagClick} 
                />
              </div>

              {/* Main Feed Content */}
              <div className="col-span-1 lg:col-span-6 space-y-4">
                  <CreatePost user={user} projects={projects} onCreatePost={handleCreatePost} />
                  <CommunityFeed
                      posts={sortedAndFilteredPosts}
                      comments={feedComments}
                      currentUser={user}
                      projects={projects}
                      layout="list" // Force list layout for a more modern feed
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

              {/* Right Sidebar */}
              <div className="hidden lg:block lg:col-span-3">
                <CommunityTrending projects={projects} />
              </div>
            </div>
        </>
    );
};

export default CommunityHub;