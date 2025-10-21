import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '../../services/supabaseClient';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setStatus('error');
      setMessage('Failed to send reset link. Please check the email and try again.');
      console.error('Password reset error:', error);
    } else {
      setStatus('success');
      setMessage('A password reset link has been sent to your email address.');
    }
  };
  
  const handleClose = () => {
      onClose();
      // Reset state after modal closes
      setTimeout(() => {
          setEmail('');
          setStatus('idle');
          setMessage('');
      }, 300);
  }

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface placeholder:text-text-secondary/80";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
      {status === 'success' ? (
        <div>
          <p className="text-center text-green-600">{message}</p>
          <div className="mt-4 text-center">
             <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-text-secondary">Enter the email address associated with your account, and we'll email you a link to reset your password.</p>
          <div>
            <label htmlFor="reset-email" className="sr-only">Email address</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={formInputClasses}
              required
            />
          </div>
          {status === 'error' && <p className="text-sm text-red-500">{message}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={status === 'loading'}>
              Cancel
            </Button>
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
