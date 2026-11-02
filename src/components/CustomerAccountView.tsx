import React, { useState } from 'react';
import { User, Order, Address } from '../types';
import { storeService } from '../services/storeService';
import { Package, MapPin, User as UserIcon, CheckCircle2, ChevronRight, Truck, AlertCircle, Plus, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';

interface CustomerAccountViewProps {
  currentUser: User;
  onLogout: () => void;
  onSelectProductById: (productId: string) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  currentUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // New Address form state
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostal, setNewPostal] = useState('');

  const orders = storeService.getOrders(currentUser.id);

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newPostal) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      fullName: currentUser.fullName,
      phone: currentUser.phone || '8807938905',
      street: newStreet.trim(),
      city: newCity.trim(),
      state: newState.trim() || 'Tamil Nadu',
      postalCode: newPostal.trim(),
      isDefault: currentUser.addresses.length === 0,
    };

    const updated = [...currentUser.addresses, newAddr];
    storeService.updateUserAddresses(currentUser.id, updated);
    setIsAddingAddress(false);
    setNewStreet('');
    setNewCity('');
    setNewPostal('');
  };

  const handleSetDefaultAddress = (addrId: string) => {
    const updated = currentUser.addresses.map((a) => ({
      ...a,
      isDefault: a.id === addrId,
    }));
    storeService.updateUserAddresses(currentUser.id, updated);
  };

  const handleDeleteAddress = (addrId: string) => {
    const updated = currentUser.addresses.filter((a) => a.id !== addrId);
    storeService.updateUserAddresses(currentUser.id, updated);
  };

  // Flipkart Milestone Steps
  const TIMELINE_STEPS = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const getStepStatus = (order: Order, step: string) => {
    const stepIdx = TIMELINE_STEPS.indexOf(step);
    const orderStatusIdx = TIMELINE_STEPS.indexOf(order.orderStatus);

    if (order.orderStatus === 'Cancelled') return 'cancelled';
    if (order.orderStatus === 'Refunded') return 'refunded';

    if (orderStatusIdx >= stepIdx) return 'completed';
    if (orderStatusIdx + 1 === stepIdx) return 'active';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] py-6 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR: FLIPKART ACCOUNT MENU */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            {/* User Greeting Card */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#2874F0] text-white flex items-center justify-center font-bold text-lg">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#878787]">Hello,</p>
                <h3 className="text-sm font-bold text-[#212121] truncate">{currentUser.fullName}</h3>
              </div>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] overflow-hidden text-xs">
              <div className="p-3 border-b border-[#E0E0E0] font-bold text-[#878787] uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#2874F0]" />
                <span>Account Settings</span>
              </div>

              <div className="divide-y divide-[#E0E0E0]">
                <button
                  onClick={() => { setActiveTab('orders'); setSelectedOrderForTracking(null); }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between font-semibold transition-colors ${
                    activeTab === 'orders' ? 'bg-[#EAF2FF] text-[#2874F0]' : 'text-[#212121] hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>My Orders ({orders.length})</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => { setActiveTab('addresses'); setSelectedOrderForTracking(null); }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between font-semibold transition-colors ${
                    activeTab === 'addresses' ? 'bg-[#EAF2FF] text-[#2874F0]' : 'text-[#212121] hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4" />
                    <span>Manage Addresses</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => { setActiveTab('profile'); setSelectedOrderForTracking(null); }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between font-semibold transition-colors ${
                    activeTab === 'profile' ? 'bg-[#EAF2FF] text-[#2874F0]' : 'text-[#212121] hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Profile Information</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2 border-t border-[#E0E0E0]">
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xs font-bold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="md:col-span-8 lg:col-span-9 bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-6 shadow-xs min-h-[500px]">
            
            {/* TAB 1: MY ORDERS & FLIPKART MILESTONE TIMELINE */}
            {activeTab === 'orders' && (
              <div>
                {selectedOrderForTracking ? (
                  <div>
                    {/* Back to Order List */}
                    <button
                      onClick={() => setSelectedOrderForTracking(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2874F0] hover:underline mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to All Orders</span>
                    </button>

                    <div className="border border-[#E0E0E0] rounded-xs p-5 mb-6 bg-slate-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E0E0E0]">
                        <div>
                          <p className="text-xs text-[#878787]">Order Reference</p>
                          <h3 className="text-sm font-bold text-[#212121]">{selectedOrderForTracking.orderNumber}</h3>
                          <p className="text-[11px] text-[#878787]">Placed on {new Date(selectedOrderForTracking.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#878787]">Total Order Value</p>
                          <p className="text-base font-bold text-[#212121]">₹{selectedOrderForTracking.finalAmount.toLocaleString('en-IN')}</p>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs bg-emerald-100 text-emerald-800">
                            {selectedOrderForTracking.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Delivery Address & AWB Tracking */}
                      <div className="py-4 border-b border-[#E0E0E0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold text-[#878787] uppercase mb-1">Shipping Address</p>
                          <p className="font-bold text-[#212121]">{selectedOrderForTracking.shippingAddress.fullName}</p>
                          <p className="text-slate-600">{selectedOrderForTracking.shippingAddress.street}</p>
                          <p className="text-slate-600">{selectedOrderForTracking.shippingAddress.city}, {selectedOrderForTracking.shippingAddress.state} - {selectedOrderForTracking.shippingAddress.postalCode}</p>
                          <p className="text-slate-600">Phone: {selectedOrderForTracking.shippingAddress.phone}</p>
                        </div>

                        <div>
                          <p className="font-bold text-[#878787] uppercase mb-1">Courier Logistics</p>
                          {selectedOrderForTracking.trackingNumber ? (
                            <div className="bg-white p-3 border border-[#E0E0E0] rounded-xs space-y-1">
                              <p className="text-[#212121]">Courier Partner: <strong>Delhivery Express</strong></p>
                              <p className="text-[#212121]">AWB Waybill: <strong className="font-mono text-[#2874F0]">{selectedOrderForTracking.trackingNumber}</strong></p>
                              <p className="text-[11px] text-[#388E3C] font-semibold">Active In-Transit Tracking</p>
                            </div>
                          ) : (
                            <p className="text-slate-500 italic">Courier AWB assignment in progress at merchant fulfillment hub.</p>
                          )}
                        </div>
                      </div>

                      {/* FLIPKART VISUAL MILESTONE TRACKING TIMELINE */}
                      <div className="pt-6">
                        <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider mb-6">
                          Live Shipment Tracking
                        </h4>

                        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E0E0E0]">
                          {TIMELINE_STEPS.map((step) => {
                            const status = getStepStatus(selectedOrderForTracking, step);
                            const isCompleted = status === 'completed';
                            const isActive = status === 'active';

                            return (
                              <div key={step} className="relative flex items-start gap-4">
                                <div
                                  className={`absolute -left-6 sm:-left-8 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 transition-all ${
                                    isCompleted
                                      ? 'bg-[#388E3C] border-[#388E3C]'
                                      : isActive
                                      ? 'bg-[#2874F0] border-[#2874F0] ring-4 ring-blue-100'
                                      : 'bg-white border-[#E0E0E0] text-slate-300'
                                  }`}
                                >
                                  {isCompleted && '✓'}
                                </div>
                                <div>
                                  <h5 className={`text-xs font-bold ${
                                    isCompleted ? 'text-[#388E3C]' : isActive ? 'text-[#2874F0]' : 'text-slate-400'
                                  }`}>
                                    {step}
                                  </h5>
                                  <p className="text-[11px] text-[#878787]">
                                    {isCompleted ? 'Completed and verified' : isActive ? 'In Progress' : 'Pending'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="border border-[#E0E0E0] rounded-xs divide-y divide-[#E0E0E0]">
                      <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-[#878787] uppercase">
                        Items in this Shipment
                      </div>
                      {selectedOrderForTracking.items.map((it) => (
                        <div key={it.id} className="p-4 flex gap-3 items-center">
                          <img src={it.productImage} alt="" className="w-14 h-14 object-contain border p-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#212121]">{it.productName}</p>
                            <p className="text-[11px] text-[#878787]">Qty: {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}</p>
                            <p className="text-xs font-bold text-[#212121] mt-0.5">₹{it.lineTotal.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-bold text-[#212121] mb-4 pb-3 border-b border-[#E0E0E0]">
                      My Orders ({orders.length})
                    </h3>

                    {orders.length === 0 ? (
                      <div className="text-center py-16">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-[#212121]">No orders placed yet</p>
                        <p className="text-xs text-[#878787] mt-1 mb-4">You have not completed any purchases with this account.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="border border-[#E0E0E0] rounded-xs p-4 hover:border-[#2874F0] transition-colors bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="flex gap-3 items-center">
                              {ord.items[0] && (
                                <img
                                  src={ord.items[0].productImage}
                                  alt=""
                                  className="w-16 h-16 object-contain border border-[#E0E0E0] p-1 rounded-xs shrink-0"
                                />
                              )}
                              <div>
                                <p className="text-xs font-bold text-[#212121]">
                                  {ord.items[0]?.productName || 'Order Item'}
                                  {ord.items.length > 1 && ` + ${ord.items.length - 1} more`}
                                </p>
                                <p className="text-[11px] text-[#878787]">
                                  Order ID: {ord.orderNumber} · {new Date(ord.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs font-bold text-[#212121] mt-1">
                                  ₹{ord.finalAmount.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#388E3C]">
                                <span className="w-2 h-2 rounded-full bg-[#388E3C]" />
                                <span>{ord.orderStatus}</span>
                              </span>
                              <button
                                onClick={() => setSelectedOrderForTracking(ord)}
                                className="px-4 py-1.5 bg-[#2874F0] hover:bg-blue-600 text-white text-xs font-bold rounded-xs shadow-xs uppercase tracking-wide transition-colors"
                              >
                                Track Shipment
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANAGE ADDRESSES */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E0E0]">
                  <h3 className="text-base font-bold text-[#212121]">Manage Addresses</h3>
                  {!isAddingAddress && (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="px-3.5 py-1.5 bg-[#2874F0] text-white text-xs font-bold rounded-xs flex items-center gap-1 hover:bg-blue-600 transition-colors uppercase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {isAddingAddress && (
                  <form onSubmit={handleSaveNewAddress} className="border border-[#E0E0E0] p-4 bg-slate-50 rounded-xs mb-6 space-y-3 text-xs">
                    <h4 className="font-bold text-[#212121] uppercase">Add a New Delivery Address</h4>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Street Address / House / Flat *</label>
                      <input
                        type="text"
                        required
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xs bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">State *</label>
                        <input
                          type="text"
                          value={newState}
                          onChange={(e) => setNewState(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          value={newPostal}
                          onChange={(e) => setNewPostal(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="py-2 px-5 bg-[#FB641B] text-white font-bold text-xs uppercase rounded-xs"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="py-2 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {currentUser.addresses.map((addr) => (
                    <div key={addr.id} className="border border-[#E0E0E0] p-4 rounded-xs bg-white flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-[#212121]">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold text-[#2874F0] bg-blue-50 px-1.5 py-0.5 rounded-xs uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700">{addr.street}</p>
                        <p className="text-xs text-slate-700">{addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p className="text-xs text-slate-500 mt-1">Phone: {addr.phone}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[#2874F0] font-bold hover:underline"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-rose-600 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PROFILE INFORMATION */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-base font-bold text-[#212121] pb-3 mb-4 border-b border-[#E0E0E0]">
                  Personal Information
                </h3>
                <div className="max-w-md space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#878787] mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.fullName}
                      className="w-full px-3 py-2 border border-[#E0E0E0] bg-slate-50 rounded-xs text-[#212121] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#878787] mb-1">Email Address</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email}
                      className="w-full px-3 py-2 border border-[#E0E0E0] bg-slate-50 rounded-xs text-[#212121]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#878787] mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.phone || '8807938905'}
                      className="w-full px-3 py-2 border border-[#E0E0E0] bg-slate-50 rounded-xs text-[#212121] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
