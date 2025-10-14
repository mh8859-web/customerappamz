import React, { useState, useRef, MouseEvent } from 'react';
import Modal from '../ui/Modal';
import { Design, User, Comment } from '../../types';
import Button from '../ui/Button';
import { useUsers } from '../../context/UserContext';

interface DesignAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: Design;
  currentUser: User;
  onSave: (designId: string, comments: Comment[]) => void;
}

const DesignAnnotationModal: React.FC<DesignAnnotationModalProps> = ({ isOpen, onClose, design, currentUser, onSave }) => {
  const [comments, setComments] = useState<Comment[]>(design.comments || []);
  const [newComment, setNewComment] = useState<{ x: number, y: number, text: string } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { findUserById } = useUsers();

  const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
    if (newComment) return; // Only one new comment at a time

    const rect = imageRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setNewComment({ x, y, text: '' });
    }
  };

  const handleSaveComment = () => {
    if (newComment && newComment.text.trim() !== '') {
      // FIX: Added the `status: 'Open'` property to satisfy the `Comment` type.
      const commentToAdd: Comment = {
        id: `comment-${Date.now()}`,
        authorId: currentUser.id,
        createdAt: new Date().toISOString(),
        status: 'Open',
        ...newComment
      };
      setComments(prev => [...prev, commentToAdd]);
      setNewComment(null);
    }
  };
  
  const handleSaveAndClose = () => {
    onSave(design.id, comments);
    onClose();
  }

  const CommentMarker: React.FC<{ comment: Comment | { x: number, y: number } }> = ({ comment }) => {
    const author = 'authorId' in comment ? findUserById(comment.authorId) : null;
    return (
        <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-accent border-2 border-white shadow-lg cursor-pointer group"
            style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
        >
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-primary-bg p-2 rounded-lg text-xs text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-soft">
                {author && (
                    <div className="flex items-center gap-2 mb-1">
                        <img src={author.avatarUrl} alt={author.fullName} className="w-5 h-5 rounded-full" />
                        <span className="font-bold text-text-headline">{author.fullName}</span>
                    </div>
                )}
                <p className="text-text-muted">{'text' in comment ? comment.text : 'Loading...'}</p>
            </div>
        </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Annotate Design: v${design.version}`}>
      <div className="relative" style={{ minHeight: '50vh' }}>
        <img
          ref={imageRef}
          src={design.fileUrl}
          alt={`Design v${design.version}`}
          className="w-full h-auto rounded-lg cursor-crosshair"
          onClick={handleImageClick}
        />
        {comments.map(comment => (
          <CommentMarker key={comment.id} comment={comment} />
        ))}
        {newComment && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${newComment.x}%`, top: `${newComment.y}%` }}
          >
            <div className="relative">
                <div className="w-6 h-6 rounded-full bg-accent border-2 border-white animate-pulse"></div>
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-surface p-3 rounded-lg z-20 shadow-soft">
                    <textarea
                        value={newComment.text}
                        onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                        placeholder="Add your comment..."
                        className="w-full bg-primary-bg border border-border-color rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        rows={3}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="secondary" onClick={() => setNewComment(null)} className="!px-3 !py-1 text-xs">Cancel</Button>
                        <Button onClick={handleSaveComment} className="!px-3 !py-1 text-xs">Save</Button>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
       <div className="flex justify-end pt-4 mt-4 border-t border-border-color">
          <Button onClick={handleSaveAndClose}>Save & Close</Button>
        </div>
    </Modal>
  );
};

export default DesignAnnotationModal;