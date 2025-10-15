import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { success, error: resetError } = await sendPasswordReset(userId);

    setLoading(false);
    if (success) {
      setMessage('If an account exists for that User ID, a password reset link has been sent to the associated email address.');
      setUserId('');
    } else {
      setError(resetError || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after transition
    setTimeout(() => {
        setUserId('');
        setMessage('');
        setError('');
        setLoading(false);
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
        {!message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Enter your User ID below. We will send a password reset link to the email address associated with your account.
                </p>
                <div>
                    <label htmlFor="reset-userId" className="sr-only">User ID</label>
                    <input
                        id="reset-userId"
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface"
                        placeholder="Your User ID"
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </div>
            </form>
        ) : (
            <div>
                <p className="text-sm text-green-600 bg-green-500/10 p-4 rounded-lg">{message}</p>
                <div className="text-right mt-4">
                     <Button onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </div>
        )}
    </Modal>
  );
};

export default ForgotPasswordModal;