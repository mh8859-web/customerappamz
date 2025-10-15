import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_POSTS, MOCK_FEED_COMMENTS } from '../../services/mockData';
import { Post, FeedComment, Poll } from '../../types';
import CreatePost from '../../components/feed/CreatePost';
import PostCard from '../../components/feed/PostCard';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
// FIX: Import Card component to resolve reference errors.
import Card from '../../components/ui/Card';

const CommunityHub: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    const [comments, setComments] = useState<FeedComment[]>(MOCK_FEED_COMMENTS);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

    if (!user) return null;

    const handleCreatePost = (content: string, mediaFile?: File, addPoll?: boolean) => {
        let mediaUrl: string | undefined;
        let mediaType: 'image' | 'video' | undefined;
        let poll: Poll | undefined;
        const postId = `post-${Date.now()}`;

        if (mediaFile) {
            mediaUrl = URL.createObjectURL(mediaFile);
            mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
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

        const newPost: Post = {
            id: postId,
            authorId: user.id,
            content,
            mediaUrl,
            mediaType,
            likes: [],
            createdAt: new Date().toISOString(),
            poll,
        };

        MOCK_POSTS.unshift(newPost);
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const handleVote = (postId: string, optionId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId && post.poll) {
                    const alreadyVoted = post.poll.options.some(opt => opt.votes.includes(user.id));
                    if (alreadyVoted) return post; // Prevent voting again

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

    const handleLikePost = (postId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const hasLiked = post.likes.includes(user.id);
                    const newLikes = hasLiked
                        ? post.likes.filter(id => id !== user.id)
                        : [...post.likes, user.id];
                    
                    const postInMock = MOCK_POSTS.find(p => p.id === postId);
                    if (postInMock) {
                        postInMock.likes = newLikes;
                    }

                    return { ...post, likes: newLikes };
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

        // Remove post from state and mock data
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        const postIndex = MOCK_POSTS.findIndex(p => p.id === postToDelete);
        if (postIndex > -1) MOCK_POSTS.splice(postIndex, 1);

        // Remove associated comments from state and mock data
        setComments(prev => prev.filter(c => c.postId !== postToDelete));
        // This is inefficient for a real DB, but fine for mock data
        const commentsToRemove = MOCK_FEED_COMMENTS.filter(c => c.postId === postToDelete);
        commentsToRemove.forEach(c => {
            const commentIndex = MOCK_FEED_COMMENTS.findIndex(mc => mc.id === c.id);
            if (commentIndex > -1) MOCK_FEED_COMMENTS.splice(commentIndex, 1);
        });

        setPostToDelete(null); // Close modal
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
                <CreatePost user={user} onCreatePost={handleCreatePost} />
                <div className="space-y-4">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                comments={comments.filter(c => c.postId === post.id)}
                                currentUser={user}
                                onLike={handleLikePost}
                                onAddComment={handleAddComment}
                                onDelete={setPostToDelete}
                                onVote={handleVote}
                            />
                        ))
                    ) : (
                        <Card className="text-center py-12">
                            <h3 className="text-xl font-semibold text-text-primary">Welcome to the Community Hub!</h3>
                            <p className="text-text-secondary mt-2">Be the first to share a project update, design inspiration, or ask a question.</p>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};

export default CommunityHub;
