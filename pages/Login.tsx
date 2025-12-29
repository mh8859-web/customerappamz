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
      navigate('/');
    } else {
      if (loginError === 'INVALID_CREDENTIALS') {
        setError('Invalid User ID or password.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };
  
  const formInputClasses = "w-full bg-secondary/50 border border-border-color/30 rounded-2xl p-4 text-base text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-surface placeholder:text-text-secondary/50 transition-all duration-300";
  
  return (
    <>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      <div className="flex min-h-screen bg-[#FDFCFB]">
        {/* Left Side: Visual Inspiration */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-dark">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Interior" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-80"></div>
          <div className="relative z-10 p-20 flex flex-col justify-end h-full text-white">
            <img 
              src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
              alt="AMAZ Logo" 
              className="h-12 w-fit mb-8 brightness-0 invert" 
            />
            <h1 className="text-5xl font-display font-light leading-tight tracking-tight">
              Crafting <span className="text-brand-gold font-normal italic underline decoration-1 underline-offset-8">Excellence</span> <br/>In Every Space.
            </h1>
            <p className="mt-6 text-lg text-white/60 font-light max-w-md">
              The premier ecosystem for luxury interior project management. Experience seamless collaboration between vision and execution.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <main className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md animate-fade-up">
            <div className="lg:hidden mb-10 text-center">
               <img 
                src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                alt="AMAZ Logo" 
                className="h-12 mx-auto mb-4" 
              />
            </div>
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-display font-semibold text-brand-dark">Welcome back</h2>
              <p className="text-text-secondary mt-2 font-light">Please enter your credentials to access the portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary ml-1">User ID</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary transition-colors group-focus-within:text-brand-gold">
                    <UserCircleIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className={`${formInputClasses} !pl-12`}
                    placeholder="Enter your ID"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary ml-1">Password</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary transition-colors group-focus-within:text-brand-gold">
                    <LockIcon className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${formInputClasses} !pl-12 !pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-secondary hover:text-brand-gold transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                  <button 
                      type="button" 
                      onClick={() => setForgotModalOpen(true)}
                      className="text-sm font-medium text-brand-gold hover:text-brand-gold-dark transition-colors"
                  >
                      Forgot Access?
                  </button>
              </div>

              {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

              <Button type="submit" className="w-full !py-4 !text-base !bg-brand-dark hover:!bg-brand-dark/90 !rounded-2xl !shadow-lg hover:shadow-xl !font-bold tracking-wide" disabled={isSubmitting}>
                {isSubmitting ? 'Authenticating...' : 'Sign Into Portal'}
              </Button>
            </form>

            <footer className="mt-12 text-center">
              <p className="text-xs text-text-secondary font-light">
                Secure enterprise access. Protected by AMAZ Security Protocol.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
};

export default Login;