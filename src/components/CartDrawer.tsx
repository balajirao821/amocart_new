import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, MapPin } from 'lucide-react';
import { Cart } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  cart: Cart;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onCartChange: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalItemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate total MRP savings
  const totalMrp = cart.items.reduce((acc, item) => {
    const original = item.product.originalPrice || item.unitPrice;
    return acc + original * item.quantity;
  }, 0);

  const totalSavings = totalMrp > cart.total ? totalMrp - cart.total : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-fade-in flex justify-end">
      <div className="w-full max-w-xl bg-[#F1F3F6] shadow-2xl flex flex-col h-full overflow-hidden border-l border-[#E0E0E0]">
        
        {/* 1. FLIPKART-STYLE BLUE TOP HEADER */}
        <div className="bg-[#2874F0] text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight">
              My Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xs hover:bg-white/10 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. DELIVERY DESTINATION STRIP */}
        <div className="bg-white px-5 py-3 border-b border-[#E0E0E0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#212121]">
            <MapPin className="w-3.5 h-3.5 text-[#2874F0]" />
            <span>Deliver to: <strong>Hosur - 635109</strong></span>
          </div>
          <span className="text-[#2874F0] font-bold">4/285 ,NGGOS Colony</span>
        </div>

        {/* 3. CART ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-8 text-center flex flex-col items-center justify-center my-8">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-[#2874F0] mb-4">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-[#212121]">Your cart is empty!</h3>
              <p className="mt-1 text-xs text-[#878787] max-w-xs mb-6">
                Explore our catalog and add items to your cart.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#2874F0] hover:bg-blue-600 rounded-xs shadow-xs transition-colors uppercase tracking-wide"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <>
              {/* Product Items Cards */}
              <div className="bg-white rounded-xs border border-[#E0E0E0] divide-y divide-[#E0E0E0]">
                {cart.items.map((item) => {
                  const discountPct =
                    item.product.originalPrice && item.product.originalPrice > item.unitPrice
                      ? Math.round(((item.product.originalPrice - item.unitPrice) / item.product.originalPrice) * 100)
                      : null;

                  return (
                    <div key={item.id} className="p-4 flex gap-4 items-start">
                      {/* Thumbnail with Stepper */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-[#E0E0E0] rounded-xs p-1 flex items-center justify-center">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-[#E0E0E0] rounded-xs text-xs font-bold bg-white">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            className="px-2 py-0.5 hover:bg-slate-100 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 py-0.5 border-x border-[#E0E0E0] text-[#212121]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="px-2 py-0.5 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Info & Price */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-[#212121] line-clamp-2 hover:text-[#2874F0] cursor-pointer">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-[#878787] mt-0.5">
                          Seller: AmoCart Direct · Delivery in 2-3 Days
                        </p>

                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-sm sm:text-base font-bold text-[#212121]">
                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {item.product.originalPrice && item.product.originalPrice > item.unitPrice && (
                            <>
                              <span className="text-xs text-[#878787] line-through">
                                ₹{(item.product.originalPrice * item.quantity).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs font-bold text-[#388E3C]">
                                {discountPct}% Off
                              </span>
                            </>
                          )}
                        </div>

                        {/* Remove / Save actions */}
                        <div className="flex items-center gap-4 mt-3 text-xs font-bold">
                          <button
                            onClick={() => onRemoveItem(item.productId)}
                            className="text-[#212121] hover:text-[#FB641B] transition-colors flex items-center gap-1 uppercase text-[11px]"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FLIPKART-STYLE PRICE DETAILS CARD */}
              <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 text-xs">
                <h3 className="font-bold text-[#878787] uppercase tracking-wider pb-3 border-b border-[#E0E0E0]">
                  Price Details
                </h3>

                <div className="space-y-2.5 py-3 border-b border-dashed border-[#E0E0E0]">
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

                <div className="flex justify-between text-sm sm:text-base font-bold text-[#212121] pt-3 pb-1 border-b border-[#E0E0E0]">
                  <span>Total Amount</span>
                  <span>₹{cart.total.toLocaleString('en-IN')}</span>
                </div>

                {totalSavings > 0 && (
                  <p className="text-xs font-bold text-[#388E3C] pt-2.5">
                    You will save ₹{totalSavings.toLocaleString('en-IN')} on this order
                  </p>
                )}
              </div>

              {/* Safe payments reassurance */}
              <div className="flex items-center gap-2 text-xs text-[#878787] justify-center py-1">
                <ShieldCheck className="w-4 h-4 text-[#388E3C]" />
                <span>Safe and Secure Payments. 100% Authentic Products.</span>
              </div>
            </>
          )}
        </div>

        {/* 4. FLIPKART BOTTOM STICKY BAR WITH "PLACE ORDER" BUTTON */}
        {cart.items.length > 0 && (
          <div className="bg-white p-4 border-t border-[#E0E0E0] shadow-lg flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-[#878787] uppercase font-bold">Total Amount</p>
              <p className="text-lg font-bold text-[#212121]">
                ₹{cart.total.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="py-3 px-8 bg-[#FB641B] hover:bg-[#E85B17] active:scale-98 text-white font-bold text-sm rounded-xs shadow-md transition-all uppercase tracking-wide"
            >
              Place Order
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
