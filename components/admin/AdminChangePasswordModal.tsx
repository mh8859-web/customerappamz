import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { adminUpdateUserPassword } from '../../services/api';
import { User } from '../../types';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({ isOpen, onClose, user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
        setStatus('error');
        setMessage('Password must be at least 6 characters long.');
        return;
    }
    setStatus('loading');
    setMessage('');
    
    const { error } = await adminUpdateUserPassword(user.id, newPassword);

    if (error) {
      setStatus('error');
      setMessage(`Failed to update password: ${error.message}`);
    } else {
      setStatus('success');
      setMessage(`Password for ${user.fullName} has been updated successfully!`);
    }
  };
  
  const handleClose = () => {
      onClose();
      setTimeout(() => {
          setNewPassword('');
          setStatus('idle');
          setMessage('');
      }, 300);
  }

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface";

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Change Password for ${user.fullName}`}>
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
              placeholder="Enter new password"
              required
              autoFocus
            />
          </div>
          {status === 'error' && <p className="text-sm text-red-500">{message}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={status === 'loading'}>
              Cancel
            </Button>
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Updating...' : 'Set New Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AdminChangePasswordModal;