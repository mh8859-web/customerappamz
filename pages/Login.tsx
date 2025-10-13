import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const success = await login(uniqueId, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-surface/80 backdrop-blur-sm rounded-xl shadow-soft border border-border-color">
        <div className="text-center">
          <img 
            src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
            alt="Aura Interiors PM Logo" 
            className="h-12 mx-auto" 
          />
          <p className="mt-2 text-text-muted">Interior Project Management</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="uniqueId" className="block text-sm font-medium text-text-headline mb-2">
              Email / Unique ID
            </label>
            <div className="relative">
              <MailIcon className="absolute w-5 h-5 text-text-muted top-1/2 left-3 -translate-y-1/2" />
              <input
                id="uniqueId"
                name="uniqueId"
                type="text"
                autoComplete="email"
                required
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-primary-bg border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Your Id"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-text-headline mb-2">
              Password
            </label>
            <div className="relative">
              <LockIcon className="absolute w-5 h-5 text-text-muted top-1/2 left-3 -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-primary-bg border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted hover:text-text-headline"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-accent-hover hover:text-accent">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;