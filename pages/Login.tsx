import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { LockIcon, UserCircleIcon, EyeIcon, EyeOffIcon } from '../components/icons';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isForgotModalOpen, setForgotModalOpen] = useState(false);

  useEffect(() => {
    // If auth has finished loading and we have a user, redirect away from login.
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { success, error: loginError } = await login(userId, password);
    
    setIsSubmitting(false);
    
    if (success) {
      // The redirect will be handled by the useEffect or the ProtectedRoute
      navigate('/');
    } else {
      if (loginError === 'INVALID_CREDENTIALS') {
        setError('Invalid User ID or password. Please check your credentials and try again.');
      } else if (loginError === 'PROFILE_FETCH_FAILED') {
        setError('Could not retrieve your user profile after login. Please try again or contact support.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };
  
  const formInputClasses = "w-full bg-secondary border-2 border-transparent rounded-xl p-4 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface placeholder:text-text-secondary/80 transition-all";

  // Render nothing if we are still loading and a user might exist.
  // This prevents a "flash" of the login form for already authenticated users.
  if (loading) {
    return null;
  }
  
  return (
    <>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      <div className="flex items-center justify-center min-h-screen bg-page-bg p-4">
        <main className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-16">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <img 
              src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
              alt="AMAZ Interiors PM Logo" 
              className="h-16 mx-auto md:mx-0 mb-4" 
            />
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-text-primary leading-tight">
              Connect, Collaborate, and Create Beautiful Spaces.
            </h1>
          </div>

          <div className="w-full md:w-1/2 max-w-md">
            <div className="bg-surface rounded-2xl p-8 shadow-card">
              <form onSubmit={handleLogin} className="space-y-4">
                
                <div>
                  <label htmlFor="userId" className="sr-only">User ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <UserCircleIcon className="w-5 h-5 text-text-secondary" />
                    </span>
                    <input
                      id="userId"
                      type="text"
                      autoComplete="username"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className={`${formInputClasses} !pl-12`}
                      placeholder="User ID"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password"className="sr-only">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <LockIcon className="w-5 h-5 text-text-secondary" />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${formInputClasses} !pl-12 !pr-12`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-secondary hover:text-text-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                    <button 
                        type="button" 
                        onClick={() => setForgotModalOpen(true)}
                        className="text-sm font-medium text-brand-blue hover:text-brand-blue-hover"
                    >
                        Forgot Password?
                    </button>
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <div>
                  <Button type="submit" className="w-full !py-3.5 !text-lg !font-bold" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Login;