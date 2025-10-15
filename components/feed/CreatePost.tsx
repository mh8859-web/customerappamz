import React, { useState } from 'react';
import { User } from '../../types';
import Card from '../ui/Card';
import { PhotoIcon, VideoCameraIcon } from '../icons';
import CreatePostModal from './CreatePostModal';

interface CreatePostProps {
  user: User;
  onCreatePost: (content: string, mediaFile?: File, addPoll?: boolean) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ user, onCreatePost }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <CreatePostModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                onCreatePost={(content, mediaFile, addPoll) => {
                    onCreatePost(content, mediaFile, addPoll);
                    setIsModalOpen(false);
                }}
            />
            <Card>
                <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 text-left bg-secondary hover:bg-secondary-hover text-text-secondary px-4 py-2.5 rounded-full transition-colors"
                    >
                        Share a project update or inspiration...
                    </button>
                </div>
                <div className="mt-4 pt-3 border-t border-border-color flex justify-around">
                     <button onClick={() => setIsModalOpen(true)} className="flex-1 flex justify-center items-center gap-2 text-sm text-text-secondary font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                        <PhotoIcon className="w-6 h-6 text-green-500" />
                        Photo
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 flex justify-center items-center gap-2 text-sm text-text-secondary font-semibold p-2 rounded-lg hover:bg-secondary transition-colors">
                        <VideoCameraIcon className="w-6 h-6 text-red-500" />
                        Video
                    </button>
                </div>
            </Card>
        </>
    );
};

export default CreatePost;