import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ProjectTemplate } from '../../types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Omit<ProjectTemplate, 'id'>) => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState([{ title: '', amountPercentage: '' }]);

  const handleMilestoneChange = (index: number, field: 'title' | 'amountPercentage', value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', amountPercentage: '' }]);
  };

  const removeMilestone = (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMilestones = milestones.map(m => ({
        title: m.title,
        amountPercentage: parseInt(m.amountPercentage, 10) || 0
    })).filter(m => m.title && m.amountPercentage > 0);

    onCreate({ name, description, milestones: formattedMilestones });
  };
  
  const inputClasses = "w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project Template">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-headline mb-1">Template Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
        </div>
         <div>
          <label className="block text-sm font-medium text-text-headline mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputClasses} required />
        </div>
        
        <div>
            <h3 className="text-md font-semibold text-text-headline mb-2">Standard Milestones</h3>
            <div className="space-y-2">
                {milestones.map((m, index) => (
                    <div key={index} className="flex items-center gap-2 bg-primary-bg p-2 rounded-lg">
                        <input 
                            type="text" 
                            placeholder="Milestone Title" 
                            value={m.title}
                            onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                            className={inputClasses}
                        />
                        <div className="relative">
                            <input 
                                type="number" 
                                placeholder="%" 
                                value={m.amountPercentage}
                                onChange={(e) => handleMilestoneChange(index, 'amountPercentage', e.target.value)}
                                className={`${inputClasses} w-24 pr-6`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
                        </div>
                        <button type="button" onClick={() => removeMilestone(index)} className="text-red-400 hover:text-red-300 p-1">&times;</button>
                    </div>
                ))}
            </div>
            <Button type="button" variant="secondary" onClick={addMilestone} className="w-full mt-2 !py-2 text-sm">Add Milestone</Button>
        </div>

        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create Template</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTemplateModal;
