import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onContinueWithoutLogin: () => void;
  onSignInWithEmail: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onContinueWithoutLogin,
  onSignInWithEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xs shadow-2xl border border-[#E0E0E0] overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        {/* Brand header banner */}
        <div className="bg-[#2874F0] p-6 text-center text-white">
          <div className="inline-block mb-1">
            <span className="text-2xl font-black italic tracking-tight text-white">
              Amo<span className="text-[#FFE500]">Cart</span>
            </span>
          </div>
          <h2 id="welcome-title" className="text-xl font-bold tracking-tight text-white mt-1">
            Welcome to AmoCart
          </h2>
          <p className="mt-1 text-xs text-blue-100 font-medium">
            Discover products you'll love. Start exploring or sign in for a personalized shopping experience.
          </p>
        </div>

        {/* Value Proposition Highlights */}
        <div className="px-6 py-4 bg-slate-50 border-b border-[#E0E0E0]">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-[#388E3C]" />
              <p className="text-xs font-bold text-[#212121]">100% Verified</p>
              <p className="text-[10px] text-[#878787]">Secure Razorpay</p>
            </div>
            <div className="space-y-1">
              <Truck className="w-5 h-5 mx-auto text-[#2874F0]" />
              <p className="text-xs font-bold text-[#212121]">Free Express</p>
              <p className="text-[10px] text-[#878787]">Across India</p>
            </div>
            <div className="space-y-1">
              <Sparkles className="w-5 h-5 mx-auto text-[#FB641B]" />
              <p className="text-xs font-bold text-[#212121]">Genuine Picks</p>
              <p className="text-[10px] text-[#878787]">Artisan quality</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-6 space-y-3">
          {/* Primary Button */}
          <button
            onClick={onContinueWithoutLogin}
            className="w-full py-3 px-4 text-xs font-bold text-[#212121] bg-white border border-[#E0E0E0] rounded-xs hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center gap-2 group shadow-xs uppercase tracking-wide cursor-pointer"
          >
            <span>Continue Without Login</span>
            <ArrowRight className="w-4 h-4 text-[#878787] group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Secondary Button */}
          <button
            onClick={onSignInWithEmail}
            className="w-full py-3 px-4 text-xs font-bold text-white bg-[#2874F0] rounded-xs hover:bg-blue-600 active:bg-blue-700 transition-all shadow-xs flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <span>Sign In with Email</span>
          </button>

          <p className="pt-1 text-center text-[11px] text-[#878787]">
            You can browse, filter, and add items to your cart anytime. Sign in is only needed at checkout.
          </p>
        </div>
      </div>
    </div>
  );
};
