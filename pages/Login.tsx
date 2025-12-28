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
      switch (loginError) {
        case 'INVALID_CREDENTIALS':
          setError('Access Denied. Please verify your User ID and password. If issues persist, ensure your account has been fully registered.');
          break;
        case 'USER_NOT_FOUND':
          setError('The provided User ID was not recognized. Please check your spelling.');
          break;
        case 'EMAIL_NOT_CONFIRMED':
          setError('Account found, but email verification is pending. Please contact your administrator.');
          break;
        case 'SERVER_ERROR':
          setError('System connection error. Please try again in a moment.');
          break;
        default:
          setError('Login failed. Please check your credentials or contact support.');
      }
    }
  };
  
  const formInputClasses = "w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white/10 placeholder:text-white/20 transition-all duration-500";
  
  return (
    <>
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); filter: brightness(0.8); }
          100% { transform: scale(1.1); filter: brightness(0.5); }
        }
        @keyframes border-beam {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        .animate-kenburns {
          animation: kenburns 30s ease-out infinite alternate;
        }
        .glass-panel {
          background: rgba(15, 20, 25, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
        }
        
        .beam-container {
          position: relative;
          border-radius: 24px;
        }
        .beam-path {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          mask-image: linear-gradient(black, black), linear-gradient(black, black);
          mask-clip: content-box, border-box;
          mask-composite: exclude;
          padding: 2px;
        }
        .beam-path::before {
          content: "";
          position: absolute;
          aspect-ratio: 1;
          width: 200px;
          background: linear-gradient(to right, transparent, #1D9BF0, #794ACF, transparent);
          offset-path: rect(0% 100% 100% 0% round 24px);
          animation: border-beam 4s linear infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0D10]">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Interior" 
            className="h-full w-full object-cover animate-kenburns"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0D10] via-transparent to-black/20"></div>
        </div>

        <main className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Brand Vision Side */}
          <div className="text-center lg:text-left space-y-8 animate-fadeIn">
            <div className="inline-flex items-center gap-3 p-2 pr-6 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10">
              <div className="p-2 bg-brand-blue rounded-full shadow-[0_0_15px_rgba(29,155,240,0.5)]">
                <LockIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em]">Official Admin Portal</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-display font-bold text-white leading-[1.05] tracking-tight">
                Design <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-purple-400 text-6xl lg:text-8xl">Authority.</span>
              </h1>
              <p className="text-xl text-white/50 max-w-md mx-auto lg:mx-0 font-light leading-relaxed">
                Elevating interior project oversight through precision engineering and refined luxury management.
              </p>
            </div>
            
            <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
               <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ" className="h-6" />
               <div className="h-6 w-px bg-white/20"></div>
               <span className="text-white font-display font-bold tracking-tighter text-xl italic uppercase">Interior Management</span>
            </div>
          </div>

          {/* Login Card Side */}
          <div className="w-full max-w-[460px] mx-auto animate-slideUp">
            <div className="beam-container">
              <div className="beam-path"></div>
              <div className="glass-panel rounded-[24px] p-8 lg:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
                <div className="mb-10">
                  <h2 className="text-3xl font-display font-bold text-white mb-2">Member Login</h2>
                  <p className="text-white/40 text-sm">Access your bespoke professional workspace.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Identity Profile</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/20 group-focus-within:text-brand-blue transition-colors duration-500">
                        <UserCircleIcon className="w-5 h-5" />
                      </span>
                      <input
                        id="userId"
                        type="text"
                        autoComplete="username"
                        required
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className={`${formInputClasses} !pl-12`}
                        placeholder="User ID or Email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Bespoke Key</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/20 group-focus-within:text-brand-blue transition-colors duration-500">
                        <LockIcon className="w-5 h-5" />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${formInputClasses} !pl-12 !pr-12`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/20 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end px-1">
                     <button 
                        type="button" 
                        onClick={() => setForgotModalOpen(true)}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60 hover:text-white transition-colors"
                      >
                          Recovery Assistance
                      </button>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl text-center animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full !py-4.5 !text-base !font-bold !bg-brand-blue hover:!bg-brand-blue-hover !text-white !rounded-2xl !shadow-[0_20px_40px_-10px_rgba(29,155,240,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Verifying...
                        </div>
                      ) : 'Enter Workspace'}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-10 pt-6 border-t border-white/5 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                    Bespoke Management for Elite Designers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Branding */}
        <footer className="absolute bottom-8 left-0 right-0 z-10 text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-medium">
            &copy; {new Date().getFullYear()} AMAZ INTERIORS &bull; Luxury Bespoke Management &bull; London &middot; Dubai &middot; Mumbai
          </p>
        </footer>
      </div>
    </>
  );
};

export default Login;