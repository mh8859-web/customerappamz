import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { InfoIcon } from '../icons';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  // The handleClose function now simply calls onClose without any state resetting logic,
  // as the component is now stateless.
  const handleClose = () => {
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
      <div className="text-center">
        <InfoIcon className="w-16 h-16 text-brand-blue mx-auto mb-4" />
        <p className="text-lg text-text-primary font-semibold">
          No Problem
        </p>
        <p className="mt-2 text-text-secondary">
          Please Contact Your Project Manager They Will Guide You
        </p>
        <div className="mt-6">
          <Button onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;
