import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { LockIcon, UserCircleIcon, EyeIcon, EyeOffIcon } from '../components/icons';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { success, error: loginError } = await login(userId, password);
    
    setLoading(false);
    
    if (success) {
      navigate('/');
    } else {
      if (loginError === 'USER_NOT_FOUND') {
        setError('User ID not found. Please check and try again.');
      } else if (loginError === 'INVALID_PASSWORD') {
        setError('Incorrect password. If you have forgotten it, please ask an administrator to reset it for you in the Supabase dashboard.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <img 
              src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
              alt="Aura Interiors PM Logo" 
              className="h-12 mx-auto mb-4" 
            />
            <h1 className="text-3xl font-bold text-text-headline">Welcome Back</h1>
            <p className="text-text-muted">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="bg-surface/80 backdrop-blur-sm border border-border-color rounded-xl p-8 shadow-soft space-y-6">
          
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-text-headline">User ID</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircleIcon className="w-5 h-5 text-text-muted" />
              </span>
              <input
                id="userId"
                name="userId"
                type="text"
                autoComplete="username"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-primary-bg border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter your user ID"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-text-headline">Password</label>
            <div className="relative mt-1">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockIcon className="w-5 h-5 text-text-muted" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-primary-bg border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-headline"
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
          
          <div className="text-center">
            <a href="#" className="text-sm text-accent hover:text-accent-hover">Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;