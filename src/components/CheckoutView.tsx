import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, MapPin, CheckCircle2, ShoppingBag, CreditCard, AlertCircle } from 'lucide-react';
import { Cart, User, Address } from '../types';

interface CheckoutViewProps {
  currentUser: User;
  cart: Cart;
  onBackToShop: () => void;
  onInitiatePayment: (shippingAddress: Address) => void;
  isProcessing: boolean;
  errorMessage: string | null;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  currentUser,
  cart,
  onBackToShop,
  onInitiatePayment,
  isProcessing,
  errorMessage,
}) => {
  // Use user's default saved address or initial address
  const defaultAddress = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];

  const [fullName, setFullName] = useState(defaultAddress?.fullName || currentUser.fullName || 'Customer');
  const [phone, setPhone] = useState(defaultAddress?.phone || currentUser.phone || '8807938905');
  const [street, setStreet] = useState(defaultAddress?.street || '4/285 ,NGGOS Colony');
  const [city, setCity] = useState(defaultAddress?.city || 'Hosur');
  const [state, setState] = useState(defaultAddress?.state || 'Tamil Nadu');
  const [postalCode, setPostalCode] = useState(defaultAddress?.postalCode || '635109');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Price calculations
  const totalItemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const totalMrp = cart.items.reduce((acc, item) => {
    const original = item.product.originalPrice || item.unitPrice;
    return acc + original * item.quantity;
  }, 0);
  const totalSavings = totalMrp > cart.total ? totalMrp - cart.total : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setValidationError('Please complete all shipping address fields.');
      return;
    }

    if (postalCode.trim().length < 5) {
      setValidationError('Please provide a valid postal / PIN code.');
      return;
    }

    const shippingAddress: Address = {
      id: defaultAddress?.id || `addr-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      isDefault: true,
    };

    onInitiatePayment(shippingAddress);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] py-6 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <button
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#2874F0] hover:underline mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Shopping</span>
        </button>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {validationError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8 COLS: FLIPKART 4-STEP CHECKOUT PANELS */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STEP 1: LOGIN COMPLETED */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-xs bg-[#2874F0] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#878787] uppercase">LOGIN</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#388E3C]" />
                  </div>
                  <p className="text-xs font-semibold text-[#212121]">
                    {currentUser.fullName} <span className="font-normal text-slate-500">({currentUser.email})</span>
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 2: DELIVERY ADDRESS */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] overflow-hidden">
              <div className="bg-[#2874F0] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-xs bg-white text-[#2874F0] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    DELIVERY ADDRESS
                  </span>
                </div>
                {!isEditingAddress && (
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="text-xs font-bold text-white hover:underline uppercase"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-6">
                {!isEditingAddress ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-xs sm:text-sm text-[#212121]">{fullName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-xs font-bold uppercase">
                        HOME
                      </span>
                      <span className="font-bold text-xs text-[#212121] ml-2">{phone}</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      {street}, {city}, {state} - <strong className="text-[#212121]">{postalCode}</strong>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setIsEditingAddress(false); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">10-digit mobile number *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Address (Area and Street) *</label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">City / District *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#2874F0]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="py-2 px-5 bg-[#FB641B] text-white font-bold text-xs uppercase rounded-xs"
                      >
                        Save and Deliver Here
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="py-2 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* STEP 3: ORDER SUMMARY */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E0E0E0]">
                <span className="w-5 h-5 rounded-xs bg-[#2874F0] text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#212121]">
                  ORDER SUMMARY ({totalItemsCount} {totalItemsCount === 1 ? 'ITEM' : 'ITEMS'})
                </span>
              </div>

              <div className="divide-y divide-[#E0E0E0]">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-3 flex gap-3 items-center">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-14 h-14 object-contain border border-[#E0E0E0] p-1 rounded-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#212121] truncate">{item.product.name}</p>
                      <p className="text-[11px] text-[#878787]">Qty: {item.quantity}</p>
                      <p className="text-xs font-bold text-[#212121] mt-0.5">
                        ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 4: PAYMENT OPTIONS & RAZORPAY SUBMIT */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-xs bg-[#2874F0] text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#212121]">
                  PAYMENT OPTIONS (OFFICIAL RAZORPAY GATEWAY)
                </span>
              </div>

              <div className="p-4 bg-[#EAF2FF] border border-blue-200 rounded-xs mb-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xs bg-[#2874F0] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  RZP
                </div>
                <div className="text-xs text-slate-800">
                  <p className="font-bold text-[#2874F0]">Razorpay Verified Checkout</p>
                  <p className="text-[11px] text-slate-600">
                    Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, &amp; Netbanking with instant HMAC-SHA256 verification.
                  </p>
                </div>
              </div>

              {/* PAYMENT ACTION BUTTON */}
              <button
                onClick={handleSubmit}
                disabled={isProcessing || cart.items.length === 0}
                className="w-full sm:w-auto py-3.5 px-10 bg-[#FB641B] hover:bg-[#E85B17] active:scale-98 text-white font-bold text-sm rounded-xs shadow-md uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Connecting to Razorpay...' : `CONTINUE TO PAYMENT (₹${cart.total.toLocaleString('en-IN')})`}
              </button>
            </div>

          </div>

          {/* RIGHT 4 COLS: FLIPKART "PRICE DETAILS" STICKY CARD */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 text-xs shadow-xs">
              <h3 className="font-bold text-[#878787] uppercase tracking-wider pb-3 border-b border-[#E0E0E0]">
                Price Details
              </h3>

              <div className="space-y-3 py-3 border-b border-dashed border-[#E0E0E0]">
                <div className="flex justify-between text-[#212121]">
                  <span>Price ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#388E3C] font-semibold">
                    <span>Discount</span>
                    <span>- ₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#212121]">
                  <span>Delivery Charges</span>
                  <span className="text-[#388E3C] font-bold">FREE</span>
                </div>
              </div>

              <div className="flex justify-between text-base font-bold text-[#212121] py-3 border-b border-[#E0E0E0]">
                <span>Total Payable</span>
                <span>₹{cart.total.toLocaleString('en-IN')}</span>
              </div>

              {totalSavings > 0 && (
                <p className="text-xs font-bold text-[#388E3C] pt-3">
                  You will save ₹{totalSavings.toLocaleString('en-IN')} on this order
                </p>
              )}
            </div>

            {/* Assurance */}
            <div className="mt-4 flex items-center gap-2 text-xs text-[#878787] justify-center">
              <ShieldCheck className="w-4 h-4 text-[#388E3C]" />
              <span>100% Safe and Secure Payments</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
