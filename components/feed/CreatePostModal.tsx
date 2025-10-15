import React, { useState, useRef } from 'react';
import { User } from '../../types';
import Button from '../ui/Button';
import { PhotoIcon, XMarkIcon } from '../icons';
import UserNameDisplay from '../ui/UserNameDisplay';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onCreatePost: (content: string, mediaFile?: File, addPoll?: boolean) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, user, onCreatePost }) => {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [addPoll, setAddPoll] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setAddPoll(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleSubmit = () => {
        if (content.trim() || mediaFile) {
            onCreatePost(content, mediaFile || undefined, addPoll);
            // Reset state for next time
            setContent('');
            handleRemoveMedia();
        }
    };
    
    const handleClose = () => {
        // Reset state on close without saving
        setContent('');
        handleRemoveMedia();
        onClose();
    };

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
          onClick={handleClose}
        >
            <div 
                className="bg-surface rounded-xl shadow-card w-full max-w-lg transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative flex justify-center items-center border-b border-border-color p-4">
                    <h2 className="text-xl font-bold text-text-primary">Create Post</h2>
                    <button onClick={handleClose} className="absolute right-3 top-1/2 -translate-y-1/2 bg-secondary hover:bg-secondary-hover rounded-full p-2">
                        <XMarkIcon className="w-5 h-5 text-text-primary" />
                    </button>
                </div>
                
                <div className="p-4">
                     <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
                        <div>
                            <UserNameDisplay user={user} textClassName="font-semibold text-text-primary"/>
                        </div>
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Share a project update or inspiration...`}
                        className="w-full bg-transparent py-4 text-lg placeholder:text-text-secondary focus:outline-none resize-none"
                        rows={5}
                        autoFocus
                    />

                    {mediaPreview && (
                        <div className="mb-2 relative border border-border-color rounded-lg p-2">
                             {mediaFile?.type.startsWith('image/') ? (
                                <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-72 w-full object-contain" />
                            ) : (
                                <video src={mediaPreview} controls className="rounded-lg max-h-72 w-full" />
                            )}
                            <button onClick={handleRemoveMedia} className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-1">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    {mediaFile?.type.startsWith('image/') && user.role === 'Designer' && (
                        <div className="my-2">
                             <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                                <input type="checkbox" checked={addPoll} onChange={(e) => setAddPoll(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                                Add a "Yes/No" poll to get feedback
                            </label>
                        </div>
                    )}

                    <div className="border border-border-color rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm font-semibold text-text-primary">Add to your post</span>
                        <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-secondary">
                             <PhotoIcon className="w-6 h-6 text-green-500" />
                        </button>
                    </div>

                    <Button onClick={handleSubmit} disabled={!content.trim() && !mediaFile} className="w-full mt-4">
                        Post
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;