
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { LockIcon, UserCircleIcon, EyeIcon, EyeOffIcon, SparklesIcon, ShieldCheckIcon } from '../components/icons';
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

  // Auto-redirect if already logged in and loading is finished
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    
    try {
        const { success, error: loginError } = await login(userId, password);
        
        if (success) {
          // Force immediate navigation to root. 
          // ProtectedRoute will handle the split-second loading transition.
          navigate('/', { replace: true });
        } else {
          setIsSubmitting(false);
          if (loginError === 'INVALID_CREDENTIALS') {
            setError('Invalid Identity ID or Secure Key.');
          } else {
            setError('An unexpected system error occurred.');
          }
        }
    } catch (err) {
        setIsSubmitting(false);
        setError('Connection Fault. Please try again.');
    }
  };
  
  const formInputClasses = "w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-base text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold focus:bg-white placeholder:text-slate-400 transition-all duration-500 shadow-inner";
  
  return (
    <>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      <div className="flex min-h-screen bg-page-bg overflow-hidden">
        
        {/* Left Side: Dramatic Luxury Showcase with Ken Burns Animation */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-dark overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=90&w=2000" 
              alt="Luxury Interior" 
              className="absolute inset-0 w-full h-full object-cover animate-ken-burns opacity-90"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
          
          <div className="relative z-10 p-20 flex flex-col justify-between h-full w-full">
            <div className="flex items-center gap-4 animate-in">
               <div className="p-3 bg-white rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                 <img 
                  src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                  alt="AMAZ Logo" 
                  className="h-8" 
                />
               </div>
               <div className="h-8 w-px bg-white/20"></div>
               <span className="text-[11px] font-bold uppercase tracking-[6px] text-brand-gold-light">Studio Modular</span>
            </div>

            <div className="max-w-xl animate-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-px w-12 bg-brand-gold"></div>
                 <span className="text-xs font-bold uppercase tracking-[4px] text-brand-gold">Excellence Defined</span>
              </div>
              <h1 className="text-7xl font-display font-light leading-[1] tracking-tighter text-white mb-8">
                The New <br/>
                <span className="font-bold italic text-brand-gold-light">Standard</span> <br/>
                of Living.
              </h1>
              <p className="text-xl text-white/70 font-light leading-relaxed max-w-sm border-l-2 border-brand-gold/30 pl-6">
                Bespoke architectural management for the world's most distinguished interiors.
              </p>
            </div>

            <div className="flex items-center gap-8 text-white/30 text-[10px] font-bold uppercase tracking-[3px]">
              <span className="hover:text-brand-gold transition-colors cursor-default">Privacy</span>
              <span className="hover:text-brand-gold transition-colors cursor-default">Security</span>
              <span className="hover:text-brand-gold transition-colors cursor-default">Terms</span>
            </div>
          </div>
        </div>

        {/* Right Side: High-End Auth Portal */}
        <main className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.03),transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.03),transparent_50%)]"></div>
          
          <div className="w-full max-w-[460px] relative">
            {/* The Login Card */}
            <div className="luxury-glass p-10 sm:p-12 rounded-[40px] shadow-premium animate-in border border-luxury relative">
              {/* Gold Accent Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent_70%)] rounded-tr-[40px]"></div>
              
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 rounded-full mb-4 border border-brand-gold/20">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Client Portal</span>
                </div>
                <h2 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight uppercase">MY ACCOUNT</h2>
                <p className="text-slate-500 mt-4 text-xs font-black leading-relaxed uppercase tracking-[2px]">ACCESS YOUR PROJECTS LIVE UPDATES HERE AMAZ INTERIORS.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-extrabold uppercase tracking-[2px] text-slate-400 ml-1 group-focus-within:text-brand-gold transition-colors">Identification ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400 group-focus-within:text-brand-gold transition-all duration-500">
                      <UserCircleIcon className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className={`${formInputClasses} !pl-14`}
                      placeholder="e.g. AMZ-9901"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 group">
                  <label className="text-[10px] font-extrabold uppercase tracking-[2px] text-slate-400 ml-1 group-focus-within:text-brand-gold transition-colors">Security Key</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400 group-focus-within:text-brand-gold transition-all duration-500">
                      <LockIcon className="w-5 h-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${formInputClasses} !pl-14 !pr-14`}
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-300 hover:text-brand-gold transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-gold focus:ring-brand-gold/30 transition-all" />
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-wider">Keep Session</span>
                    </label>
                    <button 
                        type="button" 
                        onClick={() => setForgotModalOpen(true)}
                        className="text-[10px] font-black text-brand-blue hover:text-brand-gold uppercase tracking-[1px] transition-colors underline underline-offset-4 decoration-slate-200"
                    >
                        Forgot Keys?
                    </button>
                </div>

                {error && (
                  <div className="text-[11px] text-accent-danger font-bold bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 animate-shake">
                    <div className="w-2 h-2 bg-accent-danger rounded-full animate-pulse"></div>
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full !py-5 !text-[11px] !bg-slate-900 hover:!bg-brand-dark !rounded-2xl !shadow-button hover:animate-glow-pulse !font-black tracking-[3px] uppercase transition-all duration-500 active:scale-[0.98]" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'AUTHORIZING...' : 'ACCESS MY ACCOUNT'}
                  </Button>
                  
                  {/* Brand Value Labels */}
                  <div className="mt-6 flex items-center justify-between px-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">QUALITY</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">TRANSPARENCY</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">ONTIME</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Aesthetic Footer under card */}
            <div className="mt-12 flex flex-col items-center gap-6 animate-in" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-4 opacity-30">
                 <img 
                  src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                  alt="AMAZ Logo" 
                  className="h-5 grayscale" 
                />
                <div className="h-3 w-px bg-slate-400"></div>
                <span className="text-[9px] font-bold uppercase tracking-[2px]">Managed System</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[3px] text-center opacity-40">
                End-to-End Encrypted &bull; ISO 27001 Compliant
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Login;
