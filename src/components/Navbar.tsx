import React, { useState } from 'react';
import { ShoppingCart, Search, User as UserIcon, LogOut, Package, Shield, ChevronDown, MapPin, Store, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  cartItemCount: number;
  activeView: 'home' | 'shop' | 'categories' | 'account' | 'admin' | 'checkout';
  onNavigate: (view: 'home' | 'shop' | 'categories' | 'account') => void;
  onOpenAdminPortal?: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  cartItemCount,
  activeView,
  onNavigate,
  onOpenAdminPortal,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onSearch,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal.trim());
      onNavigate('shop');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#2874F0] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6 h-14 sm:h-16">
          
          {/* 1. BRAND LOGO SECTION */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col text-left focus:outline-none group"
            >
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black italic tracking-tight text-white group-hover:opacity-95 transition-opacity">
                  Amo<span className="text-[#FFE500]">Cart</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-blue-100 font-medium italic -mt-0.5 leading-none">
                <span>Shop Smart. Live</span>
                <span className="text-[#FFE500] font-bold inline-flex items-center">
                  Better
                  <Sparkles className="w-2.5 h-2.5 ml-0.5 inline text-[#FFE500]" />
                </span>
              </div>
            </button>
          </div>

          {/* 2. FLIPKART-STYLE PROMINENT CENTER SEARCH BAR */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl hidden sm:flex items-center relative"
          >
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search for products, brands and more..."
              className="w-full bg-white text-slate-800 text-sm px-4 py-2 pr-10 rounded-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-slate-400"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-3 text-[#2874F0] hover:text-blue-700 transition-colors flex items-center justify-center"
              aria-label="Search Catalog"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* 3. RIGHT ACTIONS AREA (LOGIN / ACCOUNT, SHOP, CART) */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            {/* Quick Catalog link */}
            <button
              onClick={() => onNavigate('shop')}
              className={`hidden md:flex items-center gap-1 text-sm font-semibold hover:text-blue-100 transition-colors ${
                activeView === 'shop' ? 'text-[#FFE500]' : 'text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Catalog</span>
            </button>

            {/* Authentication: Flipkart White Pill for Login OR Dropdown for User */}
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="bg-white text-[#2874F0] font-bold text-xs sm:text-sm px-5 sm:px-7 py-1.5 rounded-xs hover:bg-slate-50 transition-all shadow-xs active:scale-98 whitespace-nowrap"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-bold text-white hover:text-blue-100 transition-colors py-1 px-2 rounded-xs"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="max-w-[110px] truncate">{currentUser.fullName.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-sm shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in text-xs font-normal"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                      <p className="font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => { onNavigate('account'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-[#2874F0] flex items-center gap-2.5 text-slate-700 font-medium"
                    >
                      <Package className="w-4 h-4 text-slate-500" />
                      <span>My Orders & Timeline</span>
                    </button>

                    <button
                      onClick={() => { onNavigate('account'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-[#2874F0] flex items-center gap-2.5 text-slate-700 font-medium"
                    >
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>Addresses & Profile</span>
                    </button>

                    {currentUser.role === 'admin' && onOpenAdminPortal && (
                      <button
                        onClick={() => { onOpenAdminPortal(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-indigo-700 flex items-center gap-2.5 font-bold border-t border-slate-100"
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span>Merchant Back-Office</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CART BUTTON WITH DYNAMIC ITEM BADGE */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 sm:gap-2 text-white font-bold text-xs sm:text-sm hover:text-blue-100 transition-colors relative py-1 px-1.5"
              aria-label="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FB641B] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#2874F0] shadow-sm badge-pop">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden xs:inline">Cart</span>
            </button>
          </div>
        </div>

        {/* MOBILE PROMINENT SEARCH BAR (Visible only on mobile devices) */}
        <form
          onSubmit={handleSearchSubmit}
          className="sm:hidden pb-3 pt-0.5 flex items-center relative"
        >
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="w-full bg-white text-slate-800 text-xs px-3.5 py-2 pr-9 rounded-xs shadow-xs focus:outline-none placeholder-slate-400"
          />
          <button
            type="submit"
            className="absolute right-0 top-0.5 bottom-3 px-3 text-[#2874F0] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
};
