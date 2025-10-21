import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { updateUserPassword } from '../../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        setStatus('error');
        setMessage('Password must be at least 6 characters long.');
        return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    setStatus('loading');
    setMessage('');
    
    const { error } = await updateUserPassword(newPassword);

    if (error) {
      setStatus('error');
      setMessage(`Failed to update password: ${error.message}`);
    } else {
      setStatus('success');
      setMessage('Your password has been updated successfully!');
    }
  };
  
  const handleClose = () => {
      onClose();
      // Reset state after modal closes for security
      setTimeout(() => {
          setNewPassword('');
          setConfirmPassword('');
          setStatus('idle');
          setMessage('');
      }, 300);
  }

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface placeholder:text-text-secondary/80";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      {status === 'success' ? (
        <div>
          <p className="text-center text-green-600">{message}</p>
          <div className="mt-4 text-center">
             <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={formInputClasses}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={formInputClasses}
              required
            />
          </div>
          {status === 'error' && <p className="text-sm text-red-500">{message}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={status === 'loading'}>
              Cancel
            </Button>
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ChangePasswordModal;