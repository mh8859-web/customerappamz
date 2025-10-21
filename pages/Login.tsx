import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '../components/icons';
import Button from '../components/ui/Button';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // If user is already logged in, redirect them from the login page
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(userId, password);

    setLoading(false);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      if (result.error === 'INVALID_CREDENTIALS') {
        setError('Invalid User ID or Password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const formInputClasses = "w-full bg-page-bg border-2 border-border-color rounded-xl p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all";

  return (
    <div className="flex items-center justify-center min-h-screen bg-page-bg p-4">
      <main className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <img 
            src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
            alt="AMAZ Interiors PM Logo" 
            className="h-16 mx-auto mb-4" 
          />
          <h1 className="text-3xl font-display font-bold text-text-primary leading-tight">
            Sign in to your account
          </h1>
          <p className="text-text-secondary mt-2">
            Welcome back to the AMAZ Interiors Project Portal.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-2xl shadow-card space-y-6">
          
          <div>
            <label htmlFor="userId" className="block text-sm font-semibold text-text-primary mb-2">
              User ID
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              autoComplete="username"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={formInputClasses}
              placeholder="Enter your user ID"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password"
                   className="block text-sm font-semibold text-text-primary mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${formInputClasses} pr-10`}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg text-center">{error}</p>
          )}

          <div>
            <Button type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? (
                 <div className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                 </div>
              ) : 'Sign In'}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default Login;
