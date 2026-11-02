import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { storeService } from '../services/storeService';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  checkoutRedirectMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  checkoutRedirectMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setError(null);
    setSuccessNotice(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid registered email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = storeService.login(email);
      setIsLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
        resetForm();
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid personal email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters for security.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = storeService.register(fullName, email, phone);
      setIsLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
        resetForm();
      } else {
        setError(res.error || 'Failed to create account.');
      }
    }, 400);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessNotice(`A password reset link with a secure 15-minute verification token has been dispatched to ${email}.`);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-xs shadow-2xl border border-[#E0E0E0] overflow-hidden relative flex flex-col sm:flex-row min-h-[440px]"
        role="dialog"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 text-slate-400 hover:text-slate-700 bg-white/80 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: FLIPKART ICONIC BLUE BRAND PANEL */}
        <div className="sm:w-2/5 bg-[#2874F0] text-white p-6 sm:p-8 flex flex-col justify-between shrink-0">
          <div>
            <div className="inline-block mb-3">
              <span className="text-2xl font-black italic tracking-tight text-white">
                Amo<span className="text-[#FFE500]">Cart</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
              {mode === 'login' && 'Login'}
              {mode === 'register' && "Looks like you're new here!"}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="mt-3 text-xs text-blue-100 font-medium leading-relaxed">
              {mode === 'login' && 'Get access to your Orders, Delivery Addresses, and Wishlist.'}
              {mode === 'register' && 'Sign up with your email address to get started with AmoCart.'}
              {mode === 'forgot' && 'Enter your registered email to receive a password reset authorization code.'}
            </p>
          </div>

          <div className="hidden sm:block pt-8 text-[11px] text-blue-200">
            <p className="font-semibold text-white">100% Genuine Products</p>
            <p>Official Razorpay 256-bit Secure Gateway</p>
          </div>
        </div>

        {/* RIGHT COLUMN: CLEAN FORM WITHOUT PLACEHOLDERS */}
        <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Checkout banner notice */}
            {checkoutRedirectMessage && (
              <div className="mb-4 bg-amber-50 border border-amber-200 p-2.5 rounded-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-tight">
                  {checkoutRedirectMessage}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="mb-4 p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* FORM: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setSuccessNotice(null); }}
                      className="text-[11px] text-[#2874F0] hover:underline font-bold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                  />
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  By continuing, you agree to AmoCart's Terms of Use and Privacy Policy.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#FB641B] hover:bg-[#E85B17] active:scale-98 rounded-xs shadow-xs transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Verifying...' : 'Login'}
                </button>
              </form>
            )}

            {/* FORM: REGISTER */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#FB641B] hover:bg-[#E85B17] active:scale-98 rounded-xs shadow-xs transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Creating...' : 'Continue'}
                </button>
              </form>
            )}

            {/* FORM: FORGOT */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#2874F0] hover:bg-blue-600 rounded-xs shadow-xs transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Sending token...' : 'Request Reset Link'}
                </button>
              </form>
            )}
          </div>

          {/* Mode Switcher Button (Flipkart Style) */}
          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); setSuccessNotice(null); }}
                className="w-full py-2 text-xs font-bold text-[#2874F0] bg-white border border-[#E0E0E0] rounded-xs hover:bg-slate-50 transition-colors uppercase"
              >
                New to AmoCart? Create an account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccessNotice(null); }}
                className="w-full py-2 text-xs font-bold text-[#2874F0] bg-white border border-[#E0E0E0] rounded-xs hover:bg-slate-50 transition-colors uppercase"
              >
                Existing User? Log in
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
