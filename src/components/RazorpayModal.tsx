import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building, Wallet, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { RAZORPAY_CONFIG, generateTestPaymentSuccess, RazorpayVerificationPayload } from '../services/razorpay';

interface RazorpayModalProps {
  isOpen: boolean;
  orderNumber: string;
  razorpayOrderId: string;
  amountInRupees: number;
  customerEmail: string;
  onPaymentSuccess: (payload: RazorpayVerificationPayload) => void;
  onPaymentFailure: (reason: string) => void;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  orderNumber,
  razorpayOrderId,
  amountInRupees,
  customerEmail,
  onPaymentSuccess,
  onPaymentFailure,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('883');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      const payload = await generateTestPaymentSuccess(razorpayOrderId);
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess(payload);
      }, 700);
    } catch (e) {
      setIsProcessing(false);
      onPaymentFailure('Cryptographic verification transaction failed.');
    }
  };

  const handleDeclinePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentFailure('Transaction declined by issuing bank: Authorization withheld.');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative animate-scale-up"
        role="dialog"
      >
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
              RZP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight">{RAZORPAY_CONFIG.MERCHANT_NAME}</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">Invoice Reference: {orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cancel Razorpay Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payable Total</p>
            <p className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹{amountInRupees.toLocaleString('en-IN')}.00
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Receipt Email</p>
            <p className="text-xs font-semibold text-slate-800">{customerEmail}</p>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-2 mb-5">
            <button
              onClick={() => setSelectedMethod('upi')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                selectedMethod === 'upi'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>UPI / QR</span>
            </button>
            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                selectedMethod === 'card'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setSelectedMethod('netbanking')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                selectedMethod === 'netbanking'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Netbanking</span>
            </button>
            <button
              onClick={() => setSelectedMethod('wallet')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                selectedMethod === 'wallet'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </button>
          </div>

          {/* Method Details Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            {selectedMethod === 'upi' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">UPI ID / Virtual Payment Address</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Supported:</span>
                  <span>Google Pay, PhonePe, Paytm, CRED, BHIM UPI</span>
                </div>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="text-xs space-y-2">
                <p className="font-semibold text-slate-700">Popular Banks</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className="p-2 bg-white border border-slate-200 rounded text-center font-medium">HDFC Bank</span>
                  <span className="p-2 bg-white border border-slate-200 rounded text-center font-medium">ICICI Bank</span>
                  <span className="p-2 bg-white border border-slate-200 rounded text-center font-medium">State Bank of India</span>
                  <span className="p-2 bg-white border border-slate-200 rounded text-center font-medium">Axis Bank</span>
                </div>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-700">Prepaid Wallets</p>
                <p className="text-slate-500 text-[11px]">Paytm, Amazon Pay, PhonePe, Mobikwik.</p>
              </div>
            )}
          </div>

          {/* Real Pay Button */}
          <div className="space-y-2">
            <button
              onClick={handlePayNow}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-[#2874F0] hover:bg-blue-600 active:scale-98 rounded-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Payment...' : `Pay ₹${amountInRupees.toLocaleString('en-IN')}`}</span>
            </button>
          </div>

          {/* Security footnote */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured by Razorpay · End-to-End 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
