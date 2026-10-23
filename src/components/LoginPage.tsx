import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';

interface LoginPageProps {
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    showToast,
    isDarkMode,
    toggleDarkMode,
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setOtpError('');

        try {
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
            showToast(`Verification code: ${otp}`, 'info');
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
          role: 'user',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setOtpError('Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#f4f4f2] text-[#262523] font-sans">
      {/* LEFT PANEL - Calm Warm Stone & Light Brown */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#efede8] border-r border-[#e4dfd7] flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#ebe3da] border border-[#d6c2b0] text-[#8c6d53] grid place-items-center font-bold">
            <Bot className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#262523]">TechnoResolve Desk</span>
        </div>

        <div className="relative z-10 max-w-lg mb-10 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-[#ebe3da] border border-[#d6c2b0] text-xs font-semibold text-[#6e533c]">
            Support & Service Desk
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#262523] leading-[1.12]">
            Simple, Calm IT Support Management.
          </h1>
          <p className="text-base text-[#5c5954] leading-relaxed">
            Submit and track support tickets, get guided troubleshooting from our Helpdesk Assistant, and stay connected with your support team.
          </p>
        </div>

        <div className="relative z-10 text-xs font-medium text-[#8c8881]">
          © {new Date().getFullYear()} TechnoResolve Desk
        </div>
      </div>

      {/* RIGHT PANEL - Harmonized Warm Stone Canvas with Elevated Form Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-20 py-12 relative overflow-y-auto bg-[#f4f4f2]">
        {/* Top Bar Controls */}
        <div className="absolute top-6 left-6 right-6 lg:left-12 lg:right-12 flex items-center justify-between">
          {onBackToLanding ? (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-xs font-semibold text-[#5c5954] hover:text-[#262523] transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Back to home</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="calm-btn flex items-center gap-1.5 rounded-xl bg-[#ebe9e4] hover:bg-[#e3dfd8] border border-[#d6d1c7] px-3 py-1.5 text-xs font-semibold text-[#5c5954] hover:text-[#262523] transition-all cursor-pointer"
          >
            {isDarkMode ? (
              <>
                <Sun className="size-3.5 text-[#8c6d53]" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="size-3.5 text-[#8c6d53]" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 mb-8 mt-8">
          <div className="size-9 rounded-xl bg-[#ebe3da] border border-[#d6c2b0] text-[#8c6d53] grid place-items-center font-bold">
            <Bot className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#262523]">TechnoResolve Desk</span>
        </div>

        <div className="max-w-md w-full mx-auto bg-white border border-[#e2dfd9] rounded-2xl p-7 sm:p-8 calm-fade-slide">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#262523] mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5c5954]">
              {mode === 'signin'
                ? 'Sign in to access your support portal and tickets.'
                : 'Create an account to submit and track IT service requests.'}
            </p>
          </div>

          {mode === 'verify' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-base font-bold text-[#262523]">Verify Your Email</h3>
                <p className="text-xs text-[#5c5954]">
                  We sent a 6-digit code to <span className="font-semibold text-[#262523]">{email}</span>.
                </p>
              </div>

              {otpError && (
                <div className="bg-[#f5efe8] text-[#6e533c] p-3 text-xs rounded-xl border border-[#d6c2b0] text-center flex items-center justify-center gap-2">
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
                    className="w-48 mx-auto text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] py-3 text-[#262523] outline-none focus:border-[#8c6d53]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpInput.length !== 6}
                className="w-full py-3 px-4 bg-[#8c6d53] hover:bg-[#765a43] text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer calm-btn"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
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
                className="w-full mt-4 text-xs font-semibold text-[#5c5954] hover:text-[#262523] transition-colors cursor-pointer"
              >
                Back to sign up
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-4 calm-fade-slide">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#262523]">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8c8881]" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-[#f4f4f2] focus:bg-white border border-[#e2dfd9] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#262523] placeholder:text-[#8c8881] focus:outline-none focus:border-[#8c6d53] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#262523]">
                      Company / Department <span className="text-[#8c8881] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8c8881]" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Engineering"
                        className="w-full bg-[#f4f4f2] focus:bg-white border border-[#e2dfd9] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#262523] placeholder:text-[#8c8881] focus:outline-none focus:border-[#8c6d53] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#262523]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8c8881]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#f4f4f2] focus:bg-white border border-[#e2dfd9] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#262523] placeholder:text-[#8c8881] focus:outline-none focus:border-[#8c6d53] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pb-2">
                <label className="text-xs font-semibold text-[#262523]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8c8881]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#f4f4f2] focus:bg-white border border-[#e2dfd9] rounded-xl py-2.5 pl-10 pr-10 text-sm text-[#262523] placeholder:text-[#8c8881] focus:outline-none focus:border-[#8c6d53] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8881] hover:text-[#262523] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#8c6d53] hover:bg-[#765a43] text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer calm-btn"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode !== 'verify' && (
            <>
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-[#e2dfd9]" />
                <span className="text-[11px] font-semibold text-[#8c8881] uppercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-[#e2dfd9]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-[#f4f4f2] border border-[#e2dfd9] text-[#262523] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                <svg className="size-4" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>

              <p className="mt-6 text-center text-xs text-[#5c5954]">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="font-semibold text-[#8c6d53] hover:underline transition-all cursor-pointer"
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
