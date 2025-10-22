import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface WorkLogPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (summary: string) => void;
}

const WorkLogPromptModal: React.FC<WorkLogPromptModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [summary, setSummary] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!summary.trim()) return;
        onSubmit(summary);
        setSummary('');
    };

    const inputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="End of Day Summary">
            <p className="text-text-secondary mb-4 text-sm">Before you clock out, please provide a brief summary of the work you completed today.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="work-summary" className="sr-only">Work Summary</label>
                    <textarea 
                      id="work-summary"
                      name="summary" 
                      value={summary} 
                      onChange={(e) => setSummary(e.target.value)} 
                      rows={4} 
                      className={inputClasses} 
                      placeholder="e.g., Finalized kitchen layout for 'Project X', sourced materials for 'Project Y'..." 
                      required 
                    />
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <Button type="button" variant="secondary" onClick={onClose}>Clock Out Without Summary</Button>
                  <Button type="submit">Submit & Clock Out</Button>
                </div>
            </form>
        </Modal>
    );
};

export default WorkLogPromptModal;
