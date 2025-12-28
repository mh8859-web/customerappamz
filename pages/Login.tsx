
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
        setError('Invalid credentials. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };
  
  const formInputClasses = "w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-xl p-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white/20 placeholder:text-white/50 transition-all duration-300";
  
  return (
    <>
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes borderBeam {
          0%, 100% { offset-distance: 0%; }
          50% { offset-distance: 100%; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-kenburns {
          animation: kenburns 20s ease-out forwards;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }
        /* Border Beam Animation */
        .border-beam-container {
          position: relative;
          z-index: 1;
        }
        .border-beam-container::before {
          content: "";
          position: absolute;
          inset: -2px;
          padding: 2px;
          border-radius: 24px; 
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 40%,
            #1D9BF0 50%,
            transparent 60%,
            transparent 100%
          );
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate 4s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1920" 
            alt="Luxury Interior" 
            className="h-full w-full object-cover opacity-60 animate-kenburns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

        <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">
          
          {/* Brand Vision Side */}
          <div className="w-full md:w-1/2 text-center md:text-left space-y-6 animate-fadeIn">
            <div className="inline-block p-4 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/10">
              <img 
                src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                alt="AMAZ Logo" 
                className="h-12 lg:h-16" 
              />
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight">
              Crafting <span className="text-brand-blue">Spaces</span>,<br />
              Inspiring <span className="italic font-light">Living.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md mx-auto md:mx-0 font-light leading-relaxed">
              Welcome to the premium project portal of AMAZ Interiors. Manage your dream transformations with precision and elegance.
            </p>
          </div>

          {/* Login Card Side with Animated Border */}
          <div className="w-full md:w-[420px] animate-slideUp border-beam-container">
            <div className="glass-panel rounded-3xl p-8 lg:p-10 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-display font-semibold text-white">Client & Team Login</h2>
                <p className="text-white/50 text-sm mt-1">Enter your credentials to enter your workspace.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">User Identity</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/40 group-focus-within:text-brand-blue transition-colors">
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
                      placeholder="User ID"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">Secure Key</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/40 group-focus-within:text-brand-blue transition-colors">
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
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-2">
                      <input type="checkbox" id="remember" className="w-4 h-4 rounded border-white/20 bg-white/10 text-brand-blue focus:ring-0 focus:ring-offset-0" />
                      <label htmlFor="remember" className="text-xs text-white/60 cursor-pointer hover:text-white transition-colors">Remember me</label>
                   </div>
                   <button 
                      type="button" 
                      onClick={() => setForgotModalOpen(true)}
                      className="text-xs font-semibold text-brand-blue hover:text-white transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center animate-shake">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full !py-4 !text-base !font-bold !bg-brand-blue hover:!bg-brand-blue-hover !text-white !rounded-xl !shadow-lg !shadow-brand-blue/20" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Authenticating...
                      </div>
                    ) : 'Sign In to Workspace'}
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-white/40">
                  By signing in, you agree to our <a href="#" className="hover:text-white underline">Terms of Service</a> and <a href="#" className="hover:text-white underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Branding */}
        <footer className="absolute bottom-6 left-0 right-0 z-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
            &copy; {new Date().getFullYear()} AMAZ INTERIORS &bull; Luxury Bespoke Management
          </p>
        </footer>
      </div>
    </>
  );
};

export default Login;
