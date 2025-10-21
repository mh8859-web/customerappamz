import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Post, FeedComment, Poll, Project, ReactionType, User, PostVisibility, Status } from '../../types';
import CreatePost from '../../components/feed/CreatePost';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { ListBulletIcon, Squares2X2Icon, XMarkIcon, PhotoIcon } from '../../components/icons';
import { useUsers } from '../../context/UserContext';
import CommunityFeed from './CommunityFeed';
import { useData } from '../../context/DataContext';
import { createRecord, updateRecord, deleteRecord } from '../../services/api';
import ViewStatusModal from '../../components/feed/ViewStatusModal';

const CommunityHub: React.FC = () => {
    const { user } = useAuth();
    const { users, loading: usersLoading } = useUsers();
    const { posts, feedComments, projects, statuses, refetchData, loading: dataLoading } = useData();
    
    // Post state
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [layout, setLayout] = useState<'list' | 'grid'>('list');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    // Status state
    const [isCreateStatusModalOpen, setCreateStatusModalOpen] = useState(false);
    const [viewingUserStatuses, setViewingUserStatuses] = useState<{user: User, statuses: Status[]} | null>(null);
    const [newStatusMediaFile, setNewStatusMediaFile] = useState<File | null>(null);
    const [newStatusMediaPreview, setNewStatusMediaPreview] = useState<string | null>(null);
    const [newStatusContent, setNewStatusContent] = useState('');
    const [isUploadingStatus, setIsUploadingStatus] = useState(false);
    const statusFileInputRef = useRef<HTMLInputElement>(null);

    const twentyFourHoursAgo = useMemo(() => new Date().getTime() - (24 * 60 * 60 * 1000), []);

    const activeStatuses = useMemo(() => 
        statuses.filter(s => new Date(s.createdAt).getTime() > twentyFourHoursAgo),
    [statuses, twentyFourHoursAgo]);

    const statusesByUser = useMemo(() => {
        return activeStatuses.reduce((acc, status) => {
            if (!acc[status.authorId]) {
                acc[status.authorId] = [];
            }
            acc[status.authorId].push(status);
            acc[status.authorId].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return acc;
        }, {} as { [key: string]: Status[] });
    }, [activeStatuses]);


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

    if (usersLoading || dataLoading || !user) {
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
        await refetchData();
    };

    const handlePinToggle = async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (post) {
            await updateRecord('posts', postId, { is_pinned: !post.isPinned });
            await refetchData();
        }
    };

    const handleVote = (postId: string, optionId: string) => {
        // Voting logic would go here
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
        await refetchData();
    };

    const handleAddComment = async (postId: string, content: string) => {
        const newComment = {
            post_id: postId,
            author_id: user.id,
            content,
        };
        await createRecord('feed_comments', newComment);
        await refetchData();
    };
    
    const confirmDeletePost = async () => {
        if (!postToDelete) return;
        const { error } = await deleteRecord('posts', postToDelete);
        if (error) {
            alert('Failed to delete post. Please try again.');
        }
        await refetchData();
        setPostToDelete(null);
    };

    const handleTagClick = (tag: string) => {
        setActiveTag(prev => (prev === tag ? null : tag));
    };
    
    // --- Status Handlers ---

    const handleViewUserStatuses = (userId: string) => {
        const userToView = users.find(u => u.id === userId);
        if (userToView && statusesByUser[userId]) {
            setViewingUserStatuses({
                user: userToView,
                statuses: statusesByUser[userId]
            });
        }
    };
    
    const handleStatusFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setNewStatusMediaFile(file);
            setNewStatusMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveStatusMedia = () => {
        setNewStatusMediaFile(null);
        setNewStatusMediaPreview(null);
        if (statusFileInputRef.current) statusFileInputRef.current.value = "";
    };

    const handleCreateStatus = async () => {
        if (!newStatusMediaFile) return;
        setIsUploadingStatus(true);

        const mediaUrl = URL.createObjectURL(newStatusMediaFile);

        const newStatus = {
            author_id: user.id,
            media_url: mediaUrl,
            media_type: newStatusMediaFile.type.startsWith('image/') ? 'image' : 'video',
            content: newStatusContent,
        };
        
        const { error } = await createRecord('statuses', newStatus);

        setIsUploadingStatus(false);
        if (error) {
            alert('Failed to post status.');
        } else {
            setCreateStatusModalOpen(false);
            handleRemoveStatusMedia();
            setNewStatusContent('');
            await refetchData();
        }
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
            
             <Modal isOpen={isCreateStatusModalOpen} onClose={() => setCreateStatusModalOpen(false)} title="Create a new Status">
              <div>
                {newStatusMediaPreview ? (
                    <div className="relative">
                        <img src={newStatusMediaPreview} alt="Status preview" className="rounded-lg w-full max-h-96 object-contain bg-black" />
                         <button onClick={handleRemoveStatusMedia} className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => statusFileInputRef.current?.click()}
                        className="w-full h-64 bg-secondary border-2 border-dashed border-border-color rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue"
                    >
                        <PhotoIcon className="w-12 h-12 text-text-secondary" />
                        <p className="mt-2 text-text-secondary">Click to upload an image or video</p>
                        <input type="file" ref={statusFileInputRef} onChange={handleStatusFileChange} className="hidden" accept="image/*,video/*" />
                    </div>
                )}
                
                <textarea
                    value={newStatusContent}
                    onChange={(e) => setNewStatusContent(e.target.value)}
                    placeholder="Add a caption... (optional)"
                    className="w-full mt-4 bg-secondary border border-transparent rounded-lg p-2 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    rows={2}
                />

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleCreateStatus} disabled={!newStatusMediaFile || isUploadingStatus}>
                        {isUploadingStatus ? 'Posting...' : 'Post Status'}
                    </Button>
                </div>
              </div>
            </Modal>
            
            {viewingUserStatuses && (
                <ViewStatusModal 
                    isOpen={!!viewingUserStatuses}
                    onClose={() => setViewingUserStatuses(null)}
                    statuses={viewingUserStatuses.statuses}
                    author={viewingUserStatuses.user}
                />
            )}
            
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-surface rounded-2xl p-4 shadow-card">
                  <div className="flex items-center space-x-4 overflow-x-auto pb-2 -mb-2">
                    <div className="flex-shrink-0 text-center w-20">
                      <button 
                        onClick={() => setCreateStatusModalOpen(true)}
                        className="w-16 h-16 rounded-full bg-secondary border-2 border-dashed border-border-color flex items-center justify-center text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
                      >
                        <span className="text-3xl font-light">+</span>
                      </button>
                      <p className="text-xs mt-2 font-semibold">Your Status</p>
                    </div>
                    {Object.keys(statusesByUser).map(userId => {
                      const userWithStatus = users.find(u => u.id === userId);
                      if (!userWithStatus) return null;
                      return (
                        <div key={userId} className="flex-shrink-0 text-center w-20 cursor-pointer" onClick={() => handleViewUserStatuses(userId)}>
                          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                            <img src={userWithStatus.avatarUrl} alt={userWithStatus.fullName} className="w-full h-full rounded-full object-cover border-2 border-surface" />
                          </div>
                          <p className="text-xs mt-2 truncate">{userWithStatus.fullName.split(' ')[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
