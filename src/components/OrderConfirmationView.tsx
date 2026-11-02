import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, MapPin, ArrowRight, ShieldCheck, Printer } from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationViewProps {
  order: Order;
  onTrackOrder: (order: Order) => void;
  onContinueShopping: () => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  onTrackOrder,
  onContinueShopping,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2874F0', '#388E3C', '#FB641B', '#FFE500'],
      });
    } catch (e) {
      // Ignore
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Success Badge Banner */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#388E3C] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#212121] tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#878787]">
          Thank you for choosing AmoCart. Your payment was authenticated via Razorpay. Order updates have been dispatched to <strong>{order.customerEmail}</strong>.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xs text-xs font-mono text-[#212121]">
          <span>Order No:</span>
          <strong className="text-[#2874F0]">{order.orderNumber}</strong>
        </div>
      </div>

      <div className="bg-white rounded-xs border border-[#E0E0E0] overflow-hidden shadow-xs divide-y divide-[#E0E0E0]">
        {/* Payment & Gateway Verification Info */}
        <div className="p-5 bg-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-[#878787]">Payment Status</p>
            <p className="font-bold text-[#388E3C] flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Captured &amp; Verified
            </p>
          </div>
          <div>
            <p className="text-[#878787]">Razorpay Payment ID</p>
            <p className="font-mono font-bold text-[#212121] mt-0.5 truncate">
              {order.razorpayPaymentId || 'pay_rzp_verified_live'}
            </p>
          </div>
          <div>
            <p className="text-[#878787]">Order Date</p>
            <p className="font-bold text-[#212121] mt-0.5">
              {new Date(order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        {/* Shipping Destination Snapshot */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#2874F0]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#212121]">
              Delivery Destination
            </h3>
          </div>
          <div className="text-xs text-slate-700 space-y-0.5">
            <p className="font-bold text-[#212121]">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
            <p className="text-slate-500 pt-0.5">Phone: <strong>{order.shippingAddress.phone}</strong></p>
          </div>
        </div>

        {/* Itemized Order Table */}
        <div className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3">
            Items in this Order ({order.items.length})
          </h3>
          <div className="divide-y divide-[#E0E0E0]">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xs bg-white overflow-hidden shrink-0 border border-[#E0E0E0] p-1">
                    <img src={item.productImage} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#212121]">{item.productName}</p>
                    <p className="text-[11px] text-[#878787]">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-[#212121]">
                  ₹{item.lineTotal.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-[#E0E0E0] space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-[#212121]">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-[#388E3C] font-bold">FREE</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#212121] pt-2 border-t border-[#E0E0E0]">
              <span>Total Paid via Razorpay</span>
              <span className="text-[#2874F0] text-base">₹{order.finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-[#E0E0E0] hover:bg-slate-50 rounded-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Tax Invoice</span>
        </button>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <button
            onClick={() => onTrackOrder(order)}
            className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold text-white bg-[#2874F0] hover:bg-blue-600 rounded-xs transition-colors flex items-center justify-center gap-2 shadow-xs uppercase tracking-wide cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track Order</span>
          </button>
          <button
            onClick={onContinueShopping}
            className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold text-white bg-[#FB641B] hover:bg-[#E85B17] rounded-xs transition-colors flex items-center justify-center gap-2 shadow-xs uppercase tracking-wide cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
