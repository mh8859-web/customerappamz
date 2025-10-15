import React, { useState, useRef, useEffect } from 'react';
import { User, Post, Project } from '../../types';
import Button from '../ui/Button';
import { PhotoIcon, XMarkIcon } from '../icons';
import UserNameDisplay from '../ui/UserNameDisplay';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  projects: Project[];
  onCreatePost: (
    content: string, 
    mediaFile?: File, 
    addPoll?: boolean,
    projectId?: string,
    postType?: Post['postType'],
    showcaseDetails?: Post['showcaseDetails'],
    beforeMediaFile?: File
  ) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, user, projects, onCreatePost }) => {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [addPoll, setAddPoll] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New state for advanced features
    const [postType, setPostType] = useState<Post['postType']>('standard');
    const [projectId, setProjectId] = useState<string>('');
    const [showcaseDetails, setShowcaseDetails] = useState({ style: '', materials: '', palette: ''});
    const [beforeMediaFile, setBeforeMediaFile] = useState<File | null>(null);
    const [beforeMediaPreview, setBeforeMediaPreview] = useState<string | null>(null);
    const beforeFileInputRef = useRef<HTMLInputElement>(null);

    const isDesignerOrAdmin = user.role === 'Designer' || user.role === 'Admin';

    useEffect(() => {
        if (!isOpen) {
            // Full reset on close
            setContent('');
            setMediaFile(null);
            setMediaPreview(null);
            setAddPoll(false);
            setPostType('standard');
            setProjectId('');
            setShowcaseDetails({ style: '', materials: '', palette: ''});
            setBeforeMediaFile(null);
            setBeforeMediaPreview(null);
        }
    }, [isOpen]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'after' | 'before') => {
        const file = event.target.files?.[0];
        if (file) {
            if (type === 'after') {
                setMediaFile(file);
                setMediaPreview(URL.createObjectURL(file));
            } else {
                setBeforeMediaFile(file);
                setBeforeMediaPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleRemoveMedia = (type: 'after' | 'before') => {
        if (type === 'after') {
            setMediaFile(null);
            setMediaPreview(null);
            setAddPoll(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            setBeforeMediaFile(null);
            setBeforeMediaPreview(null);
            if (beforeFileInputRef.current) beforeFileInputRef.current.value = "";
        }
    };

    const handleSubmit = () => {
        try {
            if (content.trim() || mediaFile) {
                onCreatePost(content, mediaFile || undefined, addPoll, projectId, postType, showcaseDetails, beforeMediaFile || undefined);
            }
        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Sorry, there was an error creating your post.");
        } finally {
            onClose(); // Always close the modal after attempting to post
        }
    };

    const inputClasses = "w-full bg-page-bg/80 border border-border-color rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface placeholder:text-text-secondary/80";
    
    if (!isOpen) {
      return null;
    }

    return (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
          onClick={onClose}
        >
            <div 
                className="bg-surface rounded-xl shadow-card w-full max-w-lg transform transition-all flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative flex justify-center items-center border-b border-border-color p-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-text-primary">Create Post</h2>
                    <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 bg-secondary hover:bg-secondary-hover rounded-full p-2">
                        <XMarkIcon className="w-5 h-5 text-text-primary" />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto">
                     <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
                        <div>
                            <UserNameDisplay user={user} textClassName="font-semibold text-text-primary"/>
                            {isDesignerOrAdmin && (
                                <select value={projectId} onChange={e => setProjectId(e.target.value)} className="text-xs bg-transparent -ml-1 focus:outline-none">
                                    <option value="">Link to a project... (optional)</option>
                                    {projects.filter(p => p.status === 'Active').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Share a project update or inspiration...`}
                        className="w-full bg-transparent py-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                    />

                    {isDesignerOrAdmin && (
                        <div className="mb-3">
                            <label className="text-sm font-semibold">Post Type</label>
                            <div className="flex gap-2 mt-1">
                                {(['standard', 'showcase', 'before_after'] as const).map(type => (
                                    <button key={type} onClick={() => setPostType(type)} className={`px-3 py-1 text-xs rounded-full ${postType === type ? 'bg-accent text-white' : 'bg-secondary hover:bg-secondary-hover'}`}>
                                        {type.replace('_', ' & ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {postType === 'showcase' && (
                        <div className="space-y-2 p-3 bg-page-bg rounded-lg mb-3">
                            <input type="text" placeholder="Style (e.g., Modern, Japandi)" value={showcaseDetails.style} onChange={e => setShowcaseDetails({...showcaseDetails, style: e.target.value})} className={inputClasses}/>
                            <input type="text" placeholder="Key Materials (e.g., Oak, Marble)" value={showcaseDetails.materials} onChange={e => setShowcaseDetails({...showcaseDetails, materials: e.target.value})} className={inputClasses}/>
                            <input type="text" placeholder="Color Palette (e.g., Neutral, Earth Tones)" value={showcaseDetails.palette} onChange={e => setShowcaseDetails({...showcaseDetails, palette: e.target.value})} className={inputClasses}/>
                        </div>
                    )}
                    
                    {postType === 'before_after' && (
                         <div className="grid grid-cols-2 gap-2 mb-3">
                             <div className="relative border border-border-color rounded-lg p-2">
                                <label className="text-sm font-semibold">Before</label>
                                <input type="file" accept="image/*" ref={beforeFileInputRef} onChange={e => handleFileChange(e, 'before')} className="text-xs mt-1" />
                                {beforeMediaPreview && <button onClick={() => handleRemoveMedia('before')} className="absolute top-1 right-1 bg-black bg-opacity-40 text-white rounded-full p-0.5"><XMarkIcon className="w-4 h-4" /></button>}
                             </div>
                             <div className="relative border border-border-color rounded-lg p-2">
                                <label className="text-sm font-semibold">After</label>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => handleFileChange(e, 'after')} className="text-xs mt-1" />
                                 {mediaPreview && <button onClick={() => handleRemoveMedia('after')} className="absolute top-1 right-1 bg-black bg-opacity-40 text-white rounded-full p-0.5"><XMarkIcon className="w-4 h-4" /></button>}
                             </div>
                         </div>
                    )}

                    {mediaPreview && postType !== 'before_after' && (
                        <div className="mb-2 relative border border-border-color rounded-lg p-2">
                            <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-60 w-full object-contain" />
                            <button onClick={() => handleRemoveMedia('after')} className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-1">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    {mediaFile?.type.startsWith('image/') && user.role === 'Designer' && postType !== 'before_after' && (
                        <div className="my-2">
                             <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                                <input type="checkbox" checked={addPoll} onChange={(e) => setAddPoll(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                                Add a "Yes/No" poll to get feedback
                            </label>
                        </div>
                    )}

                    {postType !== 'before_after' && (
                        <div className="border border-border-color rounded-lg p-3 flex justify-between items-center">
                            <span className="text-sm font-semibold text-text-primary">Add to your post</span>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-secondary">
                                 <PhotoIcon className="w-6 h-6 text-green-500" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-divider-color flex-shrink-0">
                    <Button onClick={handleSubmit} disabled={!content.trim() && !mediaFile} className="w-full">
                        Post
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;