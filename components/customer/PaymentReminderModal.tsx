import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Milestone } from '../../types';
import { AlertTriangleIcon, CheckCircleIcon, DownloadIcon } from '../icons';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  onPaymentSuccess: (milestoneId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, milestone, onPaymentSuccess }) => {
  const [paymentState, setPaymentState] = useState<'prompt' | 'processing' | 'success'>('prompt');
  
  const handlePayNow = () => {
    if (!milestone) return;
    setPaymentState('processing');
    setTimeout(() => {
        onPaymentSuccess(milestone.id);
        setPaymentState('success');
    }, 1500); // Simulate API call
  };

  const handleClose = () => {
    onClose();
    // Reset state for next time
    setTimeout(() => setPaymentState('prompt'), 300);
  }

  if (!isOpen || !milestone) {
    return null;
  }

  const renderContent = () => {
    switch (paymentState) {
        case 'prompt':
            return (
                 <div className="text-center">
                    <AlertTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-text-headline">
                    Action Required for Milestone: "{milestone.title}"
                    </h3>
                    <p className="text-text-muted my-2">
                    This milestone is marked as complete. Please proceed with the payment of 
                    <span className="font-bold text-brand-blue"> ₹{milestone.amountDisplay.toLocaleString()} </span>
                    to continue.
                    </p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Button variant="secondary" onClick={handleClose}>
                            Pay Later
                        </Button>
                        <Button onClick={handlePayNow}>
                            Pay Now
                        </Button>
                    </div>
                </div>
            );
        case 'processing':
            return (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
                    <p className="text-text-headline mt-4">Processing payment securely...</p>
                </div>
            );
        case 'success':
            return (
                <div className="text-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-text-headline">
                       Payment Successful!
                    </h3>
                    <p className="text-text-muted my-2">
                        Thank you! We've received your payment of 
                        <span className="font-bold text-brand-blue"> ₹{milestone.amountDisplay.toLocaleString()} </span>
                        for the "{milestone.title}" milestone.
                    </p>
                     <div className="mt-6 flex flex-col items-center gap-4">
                         <Button onClick={() => alert('Downloading receipt...')} className="flex items-center gap-2">
                             <DownloadIcon className="w-5 h-5" /> Download Receipt
                         </Button>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                    </div>
                </div>
            );
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Milestone Payment">
        {renderContent()}
    </Modal>
  );
};

export default PaymentModal;