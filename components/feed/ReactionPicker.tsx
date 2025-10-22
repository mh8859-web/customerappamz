import React, { useState } from 'react';
import { ReactionType } from '../../types';
import { HeartIcon, SparklesIcon, QuestionMarkCircleIcon, HandRaisedIcon } from '../icons';

interface ReactionPickerProps {
    children: React.ReactElement;
    onSelect: (reaction: ReactionType) => void;
}

const reactionMap: Record<ReactionType, React.ReactNode> = {
    love: <HeartIcon className="w-8 h-8 text-red-500" solid />,
    idea: <SparklesIcon className="w-8 h-8 text-yellow-500" solid />,
    thought: <QuestionMarkCircleIcon className="w-8 h-8 text-blue-500" solid />,
    kudos: <HandRaisedIcon className="w-8 h-8 text-green-500" solid />,
};

const ReactionPicker: React.FC<ReactionPickerProps> = ({ children, onSelect }) => {
    const [showPicker, setShowPicker] = useState(false);
    let timer: number;

    const handleMouseEnter = () => {
        timer = window.setTimeout(() => {
            setShowPicker(true);
        }, 300); // Small delay to prevent accidental triggers
    };

    const handleMouseLeave = () => {
        clearTimeout(timer);
        setShowPicker(false);
    };

    const handleSelect = (reaction: ReactionType) => {
        onSelect(reaction);
        setShowPicker(false);
    };

    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {showPicker && (
                <div 
                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface p-1.5 rounded-full shadow-card flex gap-1.5 border border-border-color z-10"
                >
                    {(Object.keys(reactionMap) as ReactionType[]).map(type => (
                        <button 
                            key={type} 
                            onClick={() => handleSelect(type)} 
                            className="p-1 rounded-full hover:bg-secondary transform hover:scale-125 transition-transform"
                            title={type.charAt(0).toUpperCase() + type.slice(1)}
                        >
                            {reactionMap[type]}
                        </button>
                    ))}
                </div>
            )}
            {children}
        </div>
    );
};

export default ReactionPicker;