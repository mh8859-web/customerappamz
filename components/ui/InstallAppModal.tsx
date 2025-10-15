import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { DownloadIcon } from '../icons';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            setDeferredPrompt(null);
            onClose();
        } else {
            setShowInstructions(true);
        }
    };
    
    // Reset view when modal is re-opened
    useEffect(() => {
      if(isOpen) {
        setShowInstructions(false);
      }
    }, [isOpen]);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    const Instructions = () => (
        <div className="text-sm text-text-secondary space-y-3">
            <p>To install the app on your device, please follow these instructions:</p>
            {isIOS ? (
                <ol className="list-decimal list-inside space-y-2">
                    <li>Tap the <span className="font-bold">Share</span> button in Safari.</li>
                    <li>Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.</li>
                    <li>Confirm by tapping <span className="font-bold">"Add"</span>.</li>
                </ol>
            ) : (
                 <ol className="list-decimal list-inside space-y-2">
                    <li>Tap the <span className="font-bold">three dots</span> menu icon in Chrome.</li>
                    <li>Tap <span className="font-bold">"Install app"</span> or <span className="font-bold">"Add to Home Screen"</span>.</li>
                    <li>Follow the on-screen instructions.</li>
                </ol>
            )}
        </div>
    );


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Install Our App">
           <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-blue/10 mb-4">
                    <DownloadIcon className="h-6 w-6 text-brand-blue" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-text-primary">Get the Full Experience</h3>
                <div className="mt-2 px-4 text-sm text-text-secondary">
                    <p>
                        Install the AMAZ Interiors app on your device for quick access and a native app feel.
                    </p>
                </div>
                
                {showInstructions && <div className="mt-4 p-4 bg-page-bg rounded-lg text-left border border-border-color"><Instructions /></div>}

                <div className="mt-6 flex flex-col gap-2">
                    <Button
                        onClick={handleInstallClick}
                        className="w-full"
                    >
                        {deferredPrompt ? 'Install App' : 'Show Instructions'}
                    </Button>
                     <Button variant="secondary" onClick={onClose} className="w-full">
                        Not Now
                    </Button>
                </div>
           </div>
        </Modal>
    );
};

export default InstallAppModal;