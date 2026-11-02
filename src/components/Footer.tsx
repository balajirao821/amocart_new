import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Lock, Truck, RefreshCw, CreditCard } from 'lucide-react';

interface FooterProps {
  onNavigateCategory: (slug: string) => void;
  onOpenAdminPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateCategory, onOpenAdminPortal }) => {
  return (
    <footer className="bg-[#172337] text-white pt-10 pb-6 border-t border-slate-700 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP SERVICE HIGHLIGHTS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 mb-8 border-b border-slate-700/80 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-[#2874F0] shrink-0" />
            <div>
              <p className="font-bold text-white text-xs">Free &amp; Fast Delivery</p>
              <p className="text-[11px] text-slate-400">On all prepaid orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#2874F0] shrink-0" />
            <div>
              <p className="font-bold text-white text-xs">7 Days Easy Return</p>
              <p className="text-[11px] text-slate-400">Hassle-free pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#2874F0] shrink-0" />
            <div>
              <p className="font-bold text-white text-xs">100% Authentic</p>
              <p className="text-[11px] text-slate-400">Directly sourced</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#2874F0] shrink-0" />
            <div>
              <p className="font-bold text-white text-xs">Secure Razorpay</p>
              <p className="text-[11px] text-slate-400">256-bit SSL encrypted</p>
            </div>
          </div>
        </div>

        {/* 4-COLUMN FLIPKART FOOTER LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-700/80">
          
          {/* ABOUT AMOCART */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ABOUT AMOCART</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              AmoCart is a premier Indian e-commerce platform curating high-fidelity audio, mechanical desk equipment, horology, and specialty lifestyle goods.
            </p>
            <p className="text-[11px] text-slate-400">
              CIN: U51909KA2026PTC109842 · Registered in India
            </p>
          </div>

          {/* TOP CATEGORIES */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">SHOP CATEGORIES</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button onClick={() => onNavigateCategory('audio-acoustics')} className="hover:text-white transition-colors">
                  Audio &amp; Acoustics
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCategory('desk-workspace')} className="hover:text-white transition-colors">
                  Desk &amp; Mechanical Keyboards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCategory('watches-leather')} className="hover:text-white transition-colors">
                  Watches &amp; Leather Folios
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCategory('artisanal-coffee')} className="hover:text-white transition-colors">
                  Artisanal Coffee Equipment
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateCategory('carry-bags')} className="hover:text-white transition-colors">
                  Everyday Carry &amp; Bags
                </button>
              </li>
            </ul>
          </div>

          {/* CUSTOMER SUPPORT */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">HELP &amp; POLICIES</h4>
            <ul className="space-y-2 text-slate-300">
              <li>Payment Security &amp; Razorpay</li>
              <li>Shipping &amp; Transit Timelines</li>
              <li>Cancellation &amp; Refunds</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          {/* REGISTERED ADDRESS & PHONE */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">MAIL &amp; REGISTERED OFFICE</h4>
            <div className="space-y-2 text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>4/285 ,NGGOS Colony,Hosur-635109, Tamil Nadu, India</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Telephone: <strong>+91 8807938905</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Email: support@amocart.com</span>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Customer Support Hours: 9:00 AM – 7:00 PM IST (Mon - Sat)
            </p>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT & MERCHANT PORTAL */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <p>© 2026 AmoCart India Private Limited. All rights reserved.</p>
          
          <div className="flex items-center gap-4">
            <span>Verified by Razorpay</span>
            <span>·</span>
            <span>Prices in Indian Rupees (₹)</span>
            <span>·</span>
            <button
              onClick={onOpenAdminPortal}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              title="AmoCart Internal Operations"
            >
              <Lock className="w-3 h-3" />
              <span>Merchant Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
