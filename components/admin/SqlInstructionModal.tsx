import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface SqlInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instructions: string;
  sqlCode: string;
}

const SqlInstructionModal: React.FC<SqlInstructionModalProps> = ({ isOpen, onClose, title, instructions, sqlCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{instructions}</p>
        <div className="relative bg-page-bg p-4 rounded-lg border border-border-color">
          <pre className="text-xs text-text-primary whitespace-pre-wrap overflow-x-auto">
            <code>{sqlCode}</code>
          </pre>
          <Button onClick={handleCopy} className="absolute top-2 right-2 !px-3 !py-1 text-xs">
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="text-right">
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SqlInstructionModal;
