
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { DollarSignIcon, CalendarIcon } from '../icons';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (milestone: { title: string; amountDisplay: number; dueDate: string }) => Promise<void>;
}

const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ title: '', amount: '', date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;
    
    setIsSubmitting(true);
    await onAdd({
      title: formData.title,
      amountDisplay: parseFloat(formData.amount),
      dueDate: formData.date
    });
    setIsSubmitting(false);
    setFormData({ title: '', amount: '', date: '' });
    onClose();
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Payment Milestone">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Milestone Identity</label>
          <input 
            type="text" 
            placeholder="e.g. Civil Work Completion"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className={inputClasses}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Allocation (₹)</label>
            <div className="relative">
                <DollarSignIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gold" />
                <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className={`${inputClasses} pl-12`}
                    required
                />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Date</label>
            <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className={`${inputClasses} pl-12`}
                    required
                />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={onClose} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
          <Button type="submit" disabled={isSubmitting} className="!px-10 !py-4 !rounded-2xl !bg-slate-900 !text-[11px] !font-black uppercase tracking-widest">Provision Milestone</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMilestoneModal;
