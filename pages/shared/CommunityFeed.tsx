import React from 'react';
import { Post, FeedComment, User, Project, ReactionType } from '../../types';
import PostCard from '../../components/feed/PostCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface CommunityFeedProps {
  posts: Post[];
  comments: FeedComment[];
  currentUser: User;
  projects: Project[];
  layout: 'list' | 'grid';
  activeTag: string | null;
  onReact: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  onVote: (postId: string, optionId: string) => void;
  onPinToggle: (postId: string) => void;
  onTagClick: (tag: string) => void;
  onClearFilter: () => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  comments,
  currentUser,
  projects,
  layout,
  activeTag,
  onReact,
  onAddComment,
  onDelete,
  onVote,
  onPinToggle,
  onTagClick,
  onClearFilter
}) => {
  return (
    <div className={layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-2' : 'space-y-4'}>
      {posts.length > 0 ? (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            comments={comments.filter(c => c.postId === post.id)}
            currentUser={currentUser}
            projects={projects}
            layout={layout}
            onReact={onReact}
            onAddComment={onAddComment}
            onDelete={onDelete}
            onVote={onVote}
            onPinToggle={onPinToggle}
            onTagClick={onTagClick}
          />
        ))
      ) : (
        <Card className="text-center py-12 col-span-full">
          <h3 className="text-xl font-semibold text-text-primary">No posts found!</h3>
          <p className="text-text-secondary mt-2">
            {activeTag ? `There are no posts with the tag #${activeTag}.` : "Be the first to share something."}
          </p>
          {activeTag && <Button variant="secondary" className="mt-4" onClick={onClearFilter}>Clear Filter</Button>}
        </Card>
      )}
    </div>
  );
};

export default CommunityFeed;