import React, { useState } from 'react';
import { Project } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CheckCircleIcon, MicIcon, VideoIcon } from '../icons';

interface TestimonialFlowProps {
    project: Project;
}

const Balloon: React.FC<{delay: number}> = ({delay}) => (
    <div 
        className="absolute bottom-[-10rem] w-12 h-16 bg-accent rounded-full opacity-70 animate-rise"
        style={{
            left: `${Math.random() * 90}%`,
            animationDelay: `${delay}s`,
            filter: `hue-rotate(${Math.random() * 180}deg)`
        }}
    ></div>
);

const TestimonialFlow: React.FC<TestimonialFlowProps> = ({ project }) => {
    const [submitted, setSubmitted] = useState(false);
    const [view, setView] = useState<'celebration' | 'form'>('celebration');

    if (submitted) {
        return (
             <div className="flex flex-col items-center justify-center text-center h-full">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
                <h1 className="text-3xl font-bold text-text-headline">Thank You!</h1>
                <p className="text-text-muted mt-2">Your feedback is invaluable to us. We enjoyed working with you on "{project.title}".</p>
            </div>
        );
    }
    
    if (view === 'celebration') {
        return (
             <Card className="text-center relative overflow-hidden">
                <style>{`
                    @keyframes rise {
                        0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
                        90% { opacity: 0.7; }
                        100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
                    }
                    .animate-rise {
                        animation: rise 10s infinite ease-in;
                    }
                `}</style>
                {[...Array(10)].map((_, i) => <Balloon key={i} delay={i * Math.random()} />)}
                <div className="mb-4 text-6xl">🎉</div>
                <h1 className="text-3xl font-bold text-text-headline">Project "{project.title}" is Complete!</h1>
                <p className="text-text-muted mt-2 mb-6">Congratulations on your new space! We loved bringing your vision to life.</p>
                <Button onClick={() => setView('form')}>Leave a Testimonial</Button>
             </Card>
        );
    }

    return (
        <Card className="text-center">
            <h1 className="text-3xl font-bold text-text-headline">Share Your Experience</h1>
            <p className="text-text-muted mt-2 mb-6">Your feedback helps us grow. In exchange for a testimonial, we have a complimentary gift for you!</p>
            
            <div className="bg-primary-bg p-6 rounded-xl border border-border-color">
                <h2 className="text-xl font-semibold text-text-headline">Submit a Testimonial</h2>
                <p className="text-sm text-text-muted mt-1 mb-4">Share your thoughts with a voice note or a short video.</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => setSubmitted(true)} className="flex items-center gap-2">
                        <MicIcon className="w-5 h-5" />
                        Record Voice
                    </Button>
                    <Button onClick={() => setSubmitted(true)} className="flex items-center gap-2">
                        <VideoIcon className="w-5 h-5" />
                        Record Video
                    </Button>
                </div>
            </div>

            <button onClick={() => setSubmitted(true)} className="text-sm text-text-muted mt-6 hover:text-text-headline">
                Maybe later
            </button>
        </Card>
    );
};

export default TestimonialFlow;