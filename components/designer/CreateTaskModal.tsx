
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Project, User } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentUser: User | null;
  onCreate: (task: { title: string; projectId: string; description: string; dueDate: string; assigneeId: string }) => Promise<void>;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, projects, currentUser, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    description: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', projectId: '', description: '', dueDate: '' });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId || !currentUser) return;

    setIsSubmitting(true);
    await onCreate({
      ...formData,
      assigneeId: currentUser.id, // Auto-assign to self
    });
    setIsSubmitting(false);
    onClose();
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Task Title</label>
          <input 
            type="text" 
            name="title"
            value={formData.title} 
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g. Finalize Kitchen Plans"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Project Reference</label>
          <select 
            name="projectId" 
            value={formData.projectId} 
            onChange={handleChange} 
            className={inputClasses} 
            required
          >
            <option value="">Select Project...</option>
            {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Due Date</label>
                <input 
                    type="date" 
                    name="dueDate"
                    value={formData.dueDate} 
                    onChange={handleChange}
                    className={inputClasses}
                    required
                />
            </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Description</label>
          <textarea 
            name="description"
            value={formData.description} 
            onChange={handleChange}
            rows={3}
            className={inputClasses}
            placeholder="Details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">Cancel</button>
          <Button type="submit" disabled={isSubmitting} className="!rounded-xl !text-[10px] font-black uppercase tracking-widest !py-3 !px-6">
            {isSubmitting ? 'Creating...' : 'Add to Board'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
