import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Bot,
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  const {
    users,
    signIn,
    signUp,
    signInWithGoogle,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          showToast('Password must be at least 6 characters.', 'error');
          setIsLoading(false);
          return;
        }
        
        // Start verification flow
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setOtpError('');
        
        try {
          // Dynamically import emailjs only when needed
          const emailjs = (await import('@emailjs/browser')).default;
          
          const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
          
          if (serviceId && templateId && publicKey) {
            await emailjs.send(
              serviceId,
              templateId,
              {
                to_email: email,
                email: email,
                user_email: email,
                to: email,
                recipient: email,
                reply_to: email,
                to_name: fullName || email.split('@')[0],
                user_name: fullName || email.split('@')[0],
                name: fullName || email.split('@')[0],
                verification_code: otp,
                otp: otp,
                code: otp,
                passcode: otp,
              },
              publicKey
            );
            showToast('Verification code sent to your email.', 'info');
          } else {
            console.log('EmailJS variables missing, simulating email send.');
            console.log(`[MOCK EMAIL] To: ${email}, Verification Code: ${otp}`);
            alert(`[DEMO MODE] Verification code is: ${otp}`);
          }
          setMode('verify');
        } catch (err: any) {
          const errorMsg = err?.text || err?.message || 'Unknown error';
          console.error('Failed to send verification email:', err);
          showToast(`Failed to send verification email: ${errorMsg}`, 'error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOtp) {
       setIsLoading(true);
       try {
         await signUp({
           email,
           password,
           full_name: fullName,
           company: company || 'TechnoResolve',
           role: 'user', // Always default to user, backend promotes first user to admin
         });
       } finally {
         setIsLoading(false);
       }
    } else {
       setOtpError('Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#00d492]/30">
      
      {/* LEFT PANEL - Branding (Hidden on small mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#123333] flex-col justify-between p-12 relative overflow-hidden">
        {/* Ambient background blur */}
        <div
          style={{ width: '30px' }}
          className="absolute -top-[10%] -left-[10%] w-[55%] h-[55%] rounded-full bg-[#00d492]/10 blur-[130px]"
        />
        <div className="absolute top-[35%] -right-[10%] w-[45%] h-[45%] rounded-full bg-[#0f3b6c]/30 blur-[140px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div
            style={{ color: '#000000', borderColor: '#000000', backgroundColor: '#ffffff' }}
            className="size-10 rounded-xl bg-white border border-black text-black shadow-md grid place-items-center font-bold"
          >
            <Bot style={{ width: '40px', height: '40px' }} className="size-10 text-black p-1" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">TechnoResolve Desk</span>
        </div>

        <div className="relative z-10 max-w-lg mb-10">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white font-display leading-[1.1] mb-6">
            Intelligent IT Service Management.
          </h1>
          <p className="text-lg text-slate-300 font-medium leading-relaxed">
            Unify your team's support operations with automated AI triage, real-time ticket execution, and a friction-free storefront.
          </p>
        </div>

        <div className="relative z-10 text-sm font-medium text-slate-400">
          © {new Date().getFullYear()} TechnoResolve Enterprise
        </div>
      </div>

      {/* RIGHT PANEL - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-20 py-12 relative overflow-y-auto">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="size-10 rounded-xl bg-[#123333] text-[#00d492] shadow-sm grid place-items-center font-bold">
            <Bot className="size-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-[#123333]">TechnoResolve</span>
        </div>

        {/* Back Button */}
        {onBackToLanding && (
          <button 
            onClick={onBackToLanding}
            className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to website</span>
          </button>
        

        
        )}<div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 font-display mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 font-medium">
              {mode === 'signin' 
                ? 'Sign in to access your workspace and tickets.'
                : 'Create an account to submit and track IT service requests.'}
            </p>
          </div>

          {/* Form */}
          {mode === 'verify' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-2 mb-6">
                 <h3 className="text-lg font-bold text-slate-900">Verify Your Email</h3>
                 <p className="text-sm text-slate-500">We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>.</p>
              </div>
              
              {otpError && (
                <div className="bg-red-50 text-red-600 p-3 text-sm rounded-xl border border-red-100 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="size-4" />
                  {otpError}
                </div>
              )}

              <div className="space-y-1.5 pb-2">
                <label className="block text-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="w-48 mx-auto text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-slate-200 bg-white py-3 text-slate-900 outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent shadow-sm"
                  />
                </label>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || otpInput.length !== 6}
                className="w-full py-3.5 px-4 bg-[#123333] hover:bg-[#1a4a4a] text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <span>Verify and Create Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setOtpInput('');
                  setOtpError('');
                }}
                className="w-full mt-4 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back to sign up
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <AnimatePresence mode="popLayout">
                {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Company / Department <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Engineering"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              
            
              )}</AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 pb-2">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#123333] hover:bg-[#1a4a4a] text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="size-4" />
                </>
              
            
              )}</button>
          </form>
          )}

          {mode !== 'verify' && (
            <>
              <div className="my-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>

              {/* Toggle Mode */}
              
                <p className="mt-8 text-center text-sm font-medium text-slate-600">
                  {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="font-bold text-[#123333] hover:text-[#00d492] hover:underline transition-all"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
            </>
          )}
          

        </div>
      </div>
    </div>
  );
};
