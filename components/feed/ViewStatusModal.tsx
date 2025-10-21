import React, { useState, useEffect } from 'react';
import { Status, User } from '../../types';
import { XMarkIcon } from '../icons';
import UserNameDisplay from '../ui/UserNameDisplay';

interface ViewStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    statuses: Status[];
    author: User;
}

const ViewStatusModal: React.FC<ViewStatusModalProps> = ({ isOpen, onClose, statuses, author }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!isOpen || isPaused) return;

        const timer = setTimeout(() => {
            if (currentIndex < statuses.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onClose();
            }
        }, 5000); // 5 seconds per status

        return () => clearTimeout(timer);
    }, [isOpen, currentIndex, statuses.length, onClose, isPaused]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [statuses, author]);

    if (!isOpen || !statuses.length) return null;

    const currentStatus = statuses[currentIndex];

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };
    
    const goToNext = () => {
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-0 md:p-4" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onMouseLeave={() => setIsPaused(false)}>
            <div className="relative w-full max-w-md h-full md:h-[90vh] bg-black md:rounded-xl overflow-hidden flex flex-col">
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {statuses.map((_, index) => (
                        <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                           {(index < currentIndex) && <div className="h-full bg-white"></div>}
                           {(index === currentIndex) && <div className="h-full bg-white animate-progress"></div>}
                        </div>
                    ))}
                </div>
                 <style>{`
                    @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                    .animate-progress {
                        animation: progress 5s linear;
                        animation-play-state: ${isPaused ? 'paused' : 'running'};
                    }
                `}</style>
                
                 <div className="absolute top-5 left-4 right-4 z-20 flex items-center justify-between">
                    <UserNameDisplay user={author} showAvatar={true} textClassName="text-white font-semibold" imageSize="w-8 h-8"/>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    {currentStatus.mediaType === 'image' ? (
                        <img src={currentStatus.mediaUrl} alt="Status" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <video src={currentStatus.mediaUrl} autoPlay controls={isPaused} className="max-w-full max-h-full" />
                    )}
                </div>

                {currentStatus.content && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
                        <p className="text-white text-center text-lg">{currentStatus.content}</p>
                    </div>
                )}
                
                <div className="absolute inset-y-0 left-0 w-1/3 z-30" onClick={goToPrev}></div>
                <div className="absolute inset-y-0 right-0 w-1/3 z-30" onClick={goToNext}></div>
            </div>
        </div>
    );
};

export default ViewStatusModal;
