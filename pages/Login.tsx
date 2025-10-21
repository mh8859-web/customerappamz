import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon } from '../components/icons';

const InitializingLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-page-bg">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-brand-blue rounded-full animate-spin"></div>
  </div>
);

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await login(userId, password);
    
    setIsSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
        if (result.error === 'INVALID_CREDENTIALS') {
            setError('Invalid User ID or Password. Please try again.');
        } else {
            setError('An unknown error occurred. Please try again later.');
        }
    }
  };

  if (loading) {
    return <InitializingLoader />;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  const formInputClasses = "w-full bg-secondary border-2 border-transparent rounded-xl p-4 pl-12 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface placeholder:text-text-secondary/80 transition-all";

  return (
    <div className="flex min-h-screen bg-page-bg">
        <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-secondary">
             <div className="max-w-md text-left">
                <img 
                    src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                    alt="AMAZ Interiors PM Logo" 
                    className="h-16 mb-8" 
                />
                <h1 className="text-5xl font-display font-bold text-text-primary leading-tight">
                    Connect, Collaborate, and Create Beautiful Spaces.
                </h1>
                <p className="text-lg text-text-secondary mt-4">
                    The central hub for clients, designers, and project managers.
                </p>
             </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
             <main className="w-full max-w-sm mx-auto">
                 <h2 className="text-3xl font-display font-semibold text-text-primary text-center mb-8">
                    Sign In
                </h2>
                
                 {error && (
                    <div className="bg-red-500/10 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <UserIcon className="absolute w-5 h-5 text-text-secondary top-1/2 left-4 -translate-y-1/2"/>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="User ID"
                            className={formInputClasses}
                            required
                        />
                    </div>
                    <div className="relative">
                         <LockIcon className="absolute w-5 h-5 text-text-secondary top-1/2 left-4 -translate-y-1/2"/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className={`${formInputClasses} pr-12`}
                            required
                        />
                         <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-secondary hover:text-text-primary"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    <Button type="submit" className="w-full !py-3 !text-base" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
             </main>
        </div>
    </div>
  );
};

export default Login;