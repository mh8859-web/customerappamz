import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { adminUpdateUserPassword } from '../../services/api';
import { supabase } from '../../services/supabaseClient';

interface SqlInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SqlInstructionModal: React.FC<SqlInstructionModalProps> = ({ isOpen, onClose }) => {
  const [targetUserId, setTargetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !newPassword.trim()) {
      setStatus('error');
      setMessage('User ID and New Password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long.');
      return;
    }
    
    setStatus('loading');
    setMessage('');
    
    try {
      // Step 1: Find the user's UUID from their custom user_id
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('user_id', targetUserId.trim())
        .single();

      if (findError || !user) {
        throw new Error('User not found with the provided User ID.');
      }
      
      // Step 2: Use the UUID to call the password change function
      const { error: updateError } = await adminUpdateUserPassword(user.id, newPassword);
      
      if (updateError) {
        throw new Error(updateError.message);
      }

      setStatus('success');
      setMessage(`Successfully changed password for ${user.full_name}.`);

    } catch (err) {
      setStatus('error');
      setMessage(`Operation failed: ${(err as Error).message}`);
    }
  };
  
  const handleClose = () => {
      onClose();
      // Reset state after modal closes
      setTimeout(() => {
          setTargetUserId('');
          setNewPassword('');
          setStatus('idle');
          setMessage('');
      }, 300);
  }

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Advanced Admin Actions">
        <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-sm text-yellow-700">
            <strong>Warning:</strong> These actions directly modify user data and should be used with extreme caution.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="font-semibold text-text-primary">Reset User Password</h3>
            <p className="text-xs text-text-secondary mb-2">Change the password for any user by providing their login User ID.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Target User ID</label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className={formInputClasses}
              placeholder="e.g., 786786"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={formInputClasses}
              placeholder="Enter a strong new password"
              required
            />
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${
                status === 'success' ? 'bg-green-500/10 text-green-700' :
                status === 'error' ? 'bg-red-500/10 text-red-700' : ''
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={status === 'loading'}>
              Cancel
            </Button>
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Executing...' : 'Execute Action'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default SqlInstructionModal;