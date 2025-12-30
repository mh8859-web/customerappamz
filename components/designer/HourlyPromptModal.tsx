
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ZapIcon, ClockIcon } from '../icons';

interface HourlyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HourlyPromptModal: React.FC<HourlyPromptModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleGoToUpdates = () => {
        navigate('/designer/current-works');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pulse Check">
            <div className="text-center py-4">
                <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <ZapIcon className="w-10 h-10 text-brand-gold animate-pulse" />
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                        <ClockIcon className="w-6 h-6 text-slate-400" />
                    </div>
                </div>
                <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight mb-3">TIME FOR AN UPDATE</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto mb-8 font-medium">
                    It's been over an hour since your last productivity sync. Briefly document your progress to maintain project transparency.
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={handleGoToUpdates} className="w-full !py-4 uppercase tracking-[3px] !text-[11px] !font-black">
                        Update Current Works
                    </Button>
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 hover:text-slate-500 transition-colors py-2">
                        Log Later
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default HourlyPromptModal;
