import React, { useState } from 'react';
import { User, Project, Post, PostVisibility } from '../../types';
import Card from '../ui/Card';
import { PhotoIcon, VideoCameraIcon, BuildingOffice2Icon, PaintBrushIcon } from '../icons';
import CreatePostModal from './CreatePostModal';

interface CreatePostProps {
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

const CreatePost: React.FC<CreatePostProps> = ({ user, projects, onCreatePost }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <CreatePostModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                projects={projects}
                onCreatePost={onCreatePost}
            />
            <Card className="p-4">
                <div className="flex items-center gap-3 border-b border-border-color pb-3">
                    <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 text-left bg-secondary hover:bg-secondary-hover text-text-secondary px-4 py-2.5 rounded-full transition-colors"
                    >
                        What's on your mind, {user.fullName.split(' ')[0]}?
                    </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                     <button onClick={() => setIsModalOpen(true)} className="flex-1 flex justify-center items-center gap-2 text-sm text-text-secondary font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                        <PhotoIcon className="w-6 h-6 text-green-500" />
                        Photo/Video
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 flex justify-center items-center gap-2 text-sm text-text-secondary font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                        <BuildingOffice2Icon className="w-6 h-6 text-brand-blue" />
                        Showcase
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 flex justify-center items-center gap-2 text-sm text-text-secondary font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                        <PaintBrushIcon className="w-6 h-6 text-purple-500" />
                        Before & After
                    </button>
                </div>
            </Card>
        </>
    );
};

export default CreatePost;