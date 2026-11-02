import React, { useState, useEffect } from 'react';
import { User, Product, Category, Cart, Order, Address } from './types';
import { storeService } from './services/storeService';
import { RazorpayVerificationPayload, openOfficialRazorpayCheckout } from './services/razorpay';
import { Navbar } from './components/Navbar';
import { CategoryNav } from './components/CategoryNav';
import { Footer } from './components/Footer';
import { WelcomeModal } from './components/WelcomeModal';
import { AuthModal } from './components/AuthModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { RazorpayModal } from './components/RazorpayModal';
import { OrderConfirmationView } from './components/OrderConfirmationView';
import { CustomerAccountView } from './components/CustomerAccountView';
import { AdminDashboard } from './components/AdminDashboard';

import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Search,
  Package,
  Layers,
  ChevronRight,
  ChevronLeft,
  Clock,
  Home,
  Grid,
  ShoppingCart,
  User as UserIcon,
  Zap,
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<'home' | 'shop' | 'categories' | 'account' | 'admin' | 'checkout' | 'order-confirmation'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, shipping: 0, discount: 0, total: 0 });

  // Hero carousel slide index
  const [heroSlide, setHeroSlide] = useState(0);

  // Modals
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRedirectMessage, setAuthRedirectMessage] = useState<string | undefined>(undefined);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Checkout & Payment State
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>('');
  const [activeOrderForConfirmation, setActiveOrderForConfirmation] = useState<Order | null>(null);
  const [activeCheckoutShippingAddress, setActiveCheckoutShippingAddress] = useState<Address | null>(null);
  const [razorpayModalData, setRazorpayModalData] = useState<{
    isOpen: boolean;
    orderNumber: string;
    razorpayOrderId: string;
    amountInRupees: number;
  }>({
    isOpen: false,
    orderNumber: '',
    razorpayOrderId: '',
    amountInRupees: 0,
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);

  // Shop Filters
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceMax, setPriceMax] = useState<number>(25000);

  // Hero carousel slides
  const HERO_SLIDES = [
    {
      badge: 'TOP ELECTRONICS & ACOUSTICS',
      title: 'Your Next Favorite Find Starts Here',
      subtitle: 'Explore great products for everyday living.',
      cta: 'Shop Now',
      category: 'audio-acoustics',
      bg: 'from-[#0d3b84] via-[#1a5bc7] to-[#2874F0]',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    },
    {
      badge: 'WORKSTATIONS & ERGONOMICS',
      title: 'Custom Mechanical Keyboards & Desk Setup',
      subtitle: 'CNC aluminum cases, Gateron switches, and solid walnut accessories.',
      cta: 'Explore Workspace',
      category: 'desk-workspace',
      bg: 'from-[#172337] via-[#243553] to-[#2874F0]',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    },
    {
      badge: 'ARTISANAL LIVING & EDC',
      title: 'Precision Horology & Handcrafted Leather',
      subtitle: 'Automatic chronographs and vegetable-tanned RFID card folios.',
      cta: 'Discover More',
      category: 'watches-leather',
      bg: 'from-[#1f2937] via-[#374151] to-[#1e3a8a]',
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // Auto-advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [HERO_SLIDES.length]);

  // Initialize data on mount
  useEffect(() => {
    const user = storeService.getCurrentUser();
    setCurrentUser(user);
    setCart(storeService.getCart());

    // Check first-visit welcome popup
    if (!storeService.isWelcomePopupDismissed()) {
      setIsWelcomeOpen(true);
    }
  }, []);

  const refreshCart = () => {
    setCart(storeService.getCart());
  };

  const refreshUserData = () => {
    setCurrentUser(storeService.getCurrentUser());
    refreshCart();
  };

  // Welcome Modal actions
  const handleContinueWithoutLogin = () => {
    storeService.setWelcomePopupDismissed(true);
    setIsWelcomeOpen(false);
  };

  const handleSignInWithEmailFromWelcome = () => {
    storeService.setWelcomePopupDismissed(true);
    setIsWelcomeOpen(false);
    setIsAuthOpen(true);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    const res = storeService.addToCart(product.id, quantity);
    setCart(res.cart);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const updated = storeService.updateCartQuantity(productId, quantity);
    setCart(updated);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updated = storeService.removeFromCart(productId);
    setCart(updated);
  };

  // Checkout workflow
  const handleProceedToCheckoutFromCart = () => {
    setIsCartOpen(false);

    // If visitor is not logged in, prompt login per Section 8 requirements
    if (!currentUser) {
      setAuthRedirectMessage('Please sign in or create an account to complete checkout. Your cart has been safely preserved!');
      setIsAuthOpen(true);
      return;
    }

    setActiveView('checkout');
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    const res = storeService.addToCart(product.id, quantity);
    setCart(res.cart);
    if (!currentUser) {
      setAuthRedirectMessage('Please sign in to proceed with your order.');
      setIsAuthOpen(true);
      return;
    }
    setActiveView('checkout');
  };

  const handleInitiatePayment = async (shippingAddress: Address) => {
    setIsCheckoutProcessing(true);
    setCheckoutError(null);
    setActiveCheckoutShippingAddress(shippingAddress);

    try {
      const res = await storeService.initiateCheckout(shippingAddress);
      setIsCheckoutProcessing(false);

      if (res.success && res.orderNumber && res.razorpayOrderId) {
        setActiveOrderNumber(res.orderNumber);
        // Attempt official Razorpay Checkout popup
        const launched = openOfficialRazorpayCheckout({
          keyId: res.keyId,
          orderId: res.razorpayOrderId,
          amountInRupees: res.amountInRupees || cart.total,
          orderNumber: res.orderNumber,
          customerName: shippingAddress.fullName || currentUser?.fullName || 'Customer',
          customerEmail: currentUser?.email || 'customer@amocart.com',
          customerPhone: shippingAddress.phone,
          onSuccess: (payload) => {
            handlePaymentSuccess(payload);
          },
          onFailure: (reason) => {
            handlePaymentFailure(reason);
          },
          onDismiss: () => {
            setCheckoutError('Payment window was dismissed. You can retry checkout anytime.');
          },
        });

        // If iframe environment restricts external popup, use integrated Razorpay modal
        if (!launched) {
          setRazorpayModalData({
            isOpen: true,
            orderNumber: res.orderNumber,
            razorpayOrderId: res.razorpayOrderId,
            amountInRupees: res.amountInRupees || cart.total,
          });
        }
      } else {
        setCheckoutError(res.error || 'Failed to initialize payment.');
      }
    } catch (err: any) {
      setIsCheckoutProcessing(false);
      setCheckoutError(err.message || 'Payment initiation failed.');
    }
  };

  const handlePaymentSuccess = async (payload: RazorpayVerificationPayload) => {
    if (!activeCheckoutShippingAddress) return;

    setRazorpayModalData((prev) => ({ ...prev, isOpen: false }));
    setIsCheckoutProcessing(true);

    try {
      const orderNum = activeOrderNumber || razorpayModalData.orderNumber || `AMO-${Date.now().toString().slice(-6)}`;
      const res = await storeService.completeOrderWithVerification(
        orderNum,
        activeCheckoutShippingAddress,
        payload
      );
      setIsCheckoutProcessing(false);

      if (res.success && res.order) {
        refreshCart();
        setActiveOrderForConfirmation(res.order);
        setActiveView('order-confirmation');
      } else {
        setCheckoutError(res.error || 'Payment signature verification failed.');
      }
    } catch (err: any) {
      setIsCheckoutProcessing(false);
      setCheckoutError(err.message || 'Error completing verified transaction.');
    }
  };

  const handlePaymentFailure = (reason: string) => {
    setRazorpayModalData((prev) => ({ ...prev, isOpen: false }));
    setCheckoutError(`Payment failed or cancelled: ${reason}. You can retry without losing your cart.`);
  };

  // Auth Success
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    refreshCart();

    if (authRedirectMessage) {
      setAuthRedirectMessage(undefined);
      setActiveView('checkout');
    }
  };

  const handleLogout = () => {
    storeService.logout();
    setCurrentUser(null);
    refreshCart();
    setActiveView('home');
  };

  // Categories & Products Data
  const categories = storeService.getCategories();
  const allProducts = storeService.getProducts();

  const products = storeService.getProducts({
    categorySlug: selectedCategorySlug,
    searchQuery,
    sortBy,
    inStockOnly,
  }).filter((p) => p.price <= priceMax);

  // Home curated sections
  const dealsProducts = allProducts.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 4);
  const bestSellers = allProducts.slice(0, 4);
  const freshFinds = [...allProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const recommended = allProducts.slice(2, 6);

  const totalCartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F3F6] text-[#212121] pb-14 sm:pb-0">
      
      {/* 1. PRIMARY FLIPKART-STYLE TOP BAR */}
      <Navbar
        currentUser={currentUser}
        cartItemCount={totalCartCount}
        activeView={activeView as any}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdminPortal={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => {
          setAuthRedirectMessage(undefined);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onSearch={(q) => {
          setSearchQuery(q);
          setSelectedCategorySlug(undefined);
          setActiveView('shop');
        }}
      />

      {/* 2. CATEGORY NAVIGATION STRIP (Visible on Home & Shop) */}
      {(activeView === 'home' || activeView === 'shop' || activeView === 'categories') && (
        <CategoryNav
          categories={categories}
          selectedCategorySlug={selectedCategorySlug}
          onSelectCategory={(slug) => {
            setSelectedCategorySlug(slug);
            setActiveView('shop');
          }}
        />
      )}

      {/* 3. MAIN APPLICATION VIEWS */}
      <main className="flex-1">
        
        {/* ========================================================================= */}
        {/* VIEW 1: FLIPKART-INSPIRED HOME PAGE */}
        {/* ========================================================================= */}
        {activeView === 'home' && (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 space-y-4 animate-fade-in pb-8">
            
            {/* HERO PROMOTIONAL BANNER CAROUSEL */}
            <div className="relative rounded-xs overflow-hidden shadow-xs border border-[#E0E0E0] bg-white">
              <div
                className={`bg-gradient-to-r ${HERO_SLIDES[heroSlide].bg} text-white p-6 sm:p-12 min-h-[260px] sm:min-h-[340px] flex items-center justify-between relative overflow-hidden transition-all duration-700`}
              >
                <div className="max-w-lg z-10 space-y-3">
                  <span className="inline-block bg-[#FFE500] text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-xs">
                    {HERO_SLIDES[heroSlide].badge}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    {HERO_SLIDES[heroSlide].title}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium">
                    {HERO_SLIDES[heroSlide].subtitle}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedCategorySlug(HERO_SLIDES[heroSlide].category);
                        setActiveView('shop');
                      }}
                      className="py-2.5 px-6 sm:px-8 bg-[#FB641B] hover:bg-[#E85B17] active:scale-98 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xs shadow-md transition-all inline-flex items-center gap-2"
                    >
                      <span>{HERO_SLIDES[heroSlide].cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hero Showcase Image */}
                <div className="hidden sm:block absolute right-8 top-1/2 -translate-y-1/2 w-64 h-64 lg:w-80 lg:h-80 rounded-xs overflow-hidden border-4 border-white/20 shadow-2xl">
                  <img
                    src={HERO_SLIDES[heroSlide].image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Carousel Left / Right Controls */}
                <button
                  onClick={() => setHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-14 bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center rounded-r-xs shadow-md transition-all"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-14 bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center rounded-l-xs shadow-md transition-all"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Carousel Indicator Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        heroSlide === idx ? 'w-6 bg-[#FFE500]' : 'w-1.5 bg-white/60'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION: DEALS YOU DON'T WANT TO MISS */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E0E0E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#212121]">
                      Deals You Don't Want to Miss
                    </h2>
                    <p className="text-[11px] text-[#878787]">
                      Top value picks with genuine discounts calculated directly from MRP.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('shop')}
                  className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xs uppercase tracking-wide transition-colors shrink-0"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {dealsProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={(prod) => handleAddToCart(prod)}
                    onViewDetails={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>
            </div>

            {/* SECTION: FEATURED CATEGORIES PANEL */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E0E0]">
                <h2 className="text-base sm:text-lg font-bold text-[#212121]">
                  Featured Categories
                </h2>
                <button
                  onClick={() => setActiveView('categories')}
                  className="text-xs font-bold text-[#2874F0] hover:underline uppercase"
                >
                  Explore All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug);
                      setActiveView('shop');
                    }}
                    className="p-3 border border-[#E0E0E0] rounded-xs hover:border-[#2874F0] hover:shadow-xs transition-all cursor-pointer bg-white group text-center flex flex-col items-center justify-between"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#EAF2FF] flex items-center justify-center text-[#2874F0] mb-2 group-hover:scale-105 transition-transform">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#212121] group-hover:text-[#2874F0] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-[#388E3C] font-semibold mt-0.5">
                        Min. 15% Off
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: BEST SELLERS / POPULAR PICKS */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E0E0E0]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#212121]">
                    Best Sellers
                  </h2>
                  <p className="text-[11px] text-[#878787]">
                    Most demanded studio headphones, mechanical boards, and accessories.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSortBy('rating');
                    setActiveView('shop');
                  }}
                  className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xs uppercase tracking-wide transition-colors shrink-0"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {bestSellers.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={(prod) => handleAddToCart(prod)}
                    onViewDetails={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>
            </div>

            {/* SECTION: FRESH FINDS (NEW ARRIVALS) */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E0E0E0]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#212121]">
                    Fresh Finds
                  </h2>
                  <p className="text-[11px] text-[#878787]">
                    Newest releases added to our catalog.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSortBy('newest');
                    setActiveView('shop');
                  }}
                  className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xs uppercase tracking-wide transition-colors shrink-0"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {freshFinds.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={(prod) => handleAddToCart(prod)}
                    onViewDetails={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>
            </div>

            {/* SECTION: RECOMMENDED FOR YOU */}
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E0E0E0]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#212121]">
                    Recommended for You
                  </h2>
                  <p className="text-[11px] text-[#878787]">
                    Hand-picked suggestions based on catalog popularity and customer reviews.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {recommended.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={(prod) => handleAddToCart(prod)}
                    onViewDetails={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FLIPKART-INSPIRED PRODUCT LISTING (SHOP CATALOG) */}
        {/* ========================================================================= */}
        {activeView === 'shop' && (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              
              {/* LEFT 3 COLS: FLIPKART FILTERS SIDEBAR */}
              <div className="lg:col-span-3 bg-white rounded-xs border border-[#E0E0E0] p-4 text-xs shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0]">
                  <span className="font-bold text-sm text-[#212121] uppercase tracking-wider">
                    Filters
                  </span>
                  {(selectedCategorySlug || searchQuery || inStockOnly || priceMax < 25000) && (
                    <button
                      onClick={() => {
                        setSelectedCategorySlug(undefined);
                        setSearchQuery('');
                        setInStockOnly(false);
                        setPriceMax(25000);
                      }}
                      className="font-bold text-[#2874F0] hover:underline uppercase text-[11px]"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* CATEGORIES FILTER */}
                <div>
                  <p className="font-bold text-[#878787] uppercase text-[11px] mb-2">
                    CATEGORIES
                  </p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSelectedCategorySlug(undefined)}
                      className={`w-full text-left py-1 px-1.5 rounded-xs transition-colors ${
                        !selectedCategorySlug
                          ? 'font-bold text-[#2874F0] bg-[#EAF2FF]'
                          : 'text-[#212121] hover:text-[#2874F0]'
                      }`}
                    >
                      All Categories ({allProducts.length})
                    </button>
                    {categories.map((cat) => {
                      const count = allProducts.filter((p) => p.categoryId === cat.id).length;
                      const isSelected = selectedCategorySlug === cat.slug;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategorySlug(cat.slug)}
                          className={`w-full text-left py-1 px-1.5 rounded-xs transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'font-bold text-[#2874F0] bg-[#EAF2FF]'
                              : 'text-[#212121] hover:text-[#2874F0]'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] text-[#878787]">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PRICE RANGE FILTER */}
                <div className="pt-3 border-t border-[#E0E0E0]">
                  <p className="font-bold text-[#878787] uppercase text-[11px] mb-2">
                    MAX PRICE: ₹{priceMax.toLocaleString('en-IN')}
                  </p>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="1000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#2874F0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#878787] mt-1">
                    <span>₹1,000</span>
                    <span>₹25,000</span>
                  </div>
                </div>

                {/* AVAILABILITY FILTER */}
                <div className="pt-3 border-t border-[#E0E0E0]">
                  <p className="font-bold text-[#878787] uppercase text-[11px] mb-2">
                    AVAILABILITY
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer text-[#212121] font-medium">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-[#2874F0]"
                    />
                    <span>Exclude Out of Stock</span>
                  </label>
                </div>
              </div>

              {/* RIGHT 9 COLS: FLIPKART SORT BAR & PRODUCT GRID */}
              <div className="lg:col-span-9 space-y-3">
                
                {/* SORT STRIP & BREADCRUMBS */}
                <div className="bg-white rounded-xs border border-[#E0E0E0] p-3 text-xs shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-[#878787]">
                        Home &gt; Catalog {selectedCategorySlug && `> ${categories.find(c => c.slug === selectedCategorySlug)?.name}`}
                      </div>
                      <h1 className="text-sm font-bold text-[#212121] mt-0.5">
                        {selectedCategorySlug
                          ? categories.find(c => c.slug === selectedCategorySlug)?.name
                          : searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
                        <span className="text-[#878787] font-normal text-xs ml-2">
                          (Showing 1 – {products.length} of {products.length} products)
                        </span>
                      </h1>
                    </div>

                    {/* Flipkart-Style Text Sort Tabs */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 font-medium text-[11px]">
                      <span className="font-bold text-[#212121] shrink-0">Sort By</span>
                      <button
                        onClick={() => setSortBy('featured')}
                        className={`shrink-0 pb-0.5 border-b-2 transition-colors ${
                          sortBy === 'featured' ? 'border-[#2874F0] text-[#2874F0] font-bold' : 'border-transparent text-[#212121]'
                        }`}
                      >
                        Relevance
                      </button>
                      <button
                        onClick={() => setSortBy('price-asc')}
                        className={`shrink-0 pb-0.5 border-b-2 transition-colors ${
                          sortBy === 'price-asc' ? 'border-[#2874F0] text-[#2874F0] font-bold' : 'border-transparent text-[#212121]'
                        }`}
                      >
                        Price -- Low to High
                      </button>
                      <button
                        onClick={() => setSortBy('price-desc')}
                        className={`shrink-0 pb-0.5 border-b-2 transition-colors ${
                          sortBy === 'price-desc' ? 'border-[#2874F0] text-[#2874F0] font-bold' : 'border-transparent text-[#212121]'
                        }`}
                      >
                        Price -- High to Low
                      </button>
                      <button
                        onClick={() => setSortBy('newest')}
                        className={`shrink-0 pb-0.5 border-b-2 transition-colors ${
                          sortBy === 'newest' ? 'border-[#2874F0] text-[#2874F0] font-bold' : 'border-transparent text-[#212121]'
                        }`}
                      >
                        Newest First
                      </button>
                    </div>
                  </div>
                </div>

                {/* PRODUCT GRID */}
                {products.length === 0 ? (
                  <div className="bg-white rounded-xs border border-[#E0E0E0] p-12 text-center my-4">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#212121]">No products found</h3>
                    <p className="text-xs text-[#878787] mt-1 mb-4">
                      Try adjusting your filters or search keywords.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategorySlug(undefined);
                        setSearchQuery('');
                        setInStockOnly(false);
                        setPriceMax(25000);
                      }}
                      className="px-5 py-2 bg-[#2874F0] text-white font-bold text-xs rounded-xs shadow-xs uppercase tracking-wide"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onAddToCart={(prod) => handleAddToCart(prod)}
                        onViewDetails={(prod) => setSelectedProduct(prod)}
                      />
                    ))}
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CATEGORIES OVERVIEW */}
        {/* ========================================================================= */}
        {activeView === 'categories' && (
          <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
            <div className="bg-white rounded-xs border border-[#E0E0E0] p-5 mb-4 shadow-xs">
              <h1 className="text-lg font-bold text-[#212121]">All Categories</h1>
              <p className="text-xs text-[#878787] mt-0.5">Explore AmoCart products organized by discipline.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const categoryProducts = allProducts.filter((p) => p.categoryId === cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug);
                      setActiveView('shop');
                    }}
                    className="bg-white rounded-xs border border-[#E0E0E0] p-5 shadow-xs hover:border-[#2874F0] transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-[#EAF2FF] flex items-center justify-center text-[#2874F0] mb-3">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-[#212121]">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                      <p className="text-xs font-bold text-[#388E3C] mt-3">
                        {categoryProducts.length} Items Available
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2874F0]">
                      <span>Shop Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: CHECKOUT VIEW */}
        {/* ========================================================================= */}
        {activeView === 'checkout' && currentUser && (
          <CheckoutView
            currentUser={currentUser}
            cart={cart}
            onBackToShop={() => setActiveView('shop')}
            onInitiatePayment={handleInitiatePayment}
            isProcessing={isCheckoutProcessing}
            errorMessage={checkoutError}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: ORDER CONFIRMATION */}
        {/* ========================================================================= */}
        {activeView === 'order-confirmation' && activeOrderForConfirmation && (
          <OrderConfirmationView
            order={activeOrderForConfirmation}
            onTrackOrder={() => setActiveView('account')}
            onContinueShopping={() => setActiveView('shop')}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: CUSTOMER ACCOUNT & LIVE TRACKING */}
        {/* ========================================================================= */}
        {activeView === 'account' && currentUser && (
          <CustomerAccountView
            currentUser={currentUser}
            onLogout={handleLogout}
            onSelectProductById={(id) => {
              const p = storeService.getProductById(id);
              if (p) setSelectedProduct(p);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: ADMINISTRATOR DASHBOARD */}
        {/* ========================================================================= */}
        {activeView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onStaffLogin={(email) => {
              const res = storeService.login(email);
              if (res.user) {
                setCurrentUser(res.user);
                refreshCart();
              }
            }}
            onReturnToStore={() => setActiveView('home')}
            onRefreshData={refreshUserData}
          />
        )}

      </main>

      {/* 4. FLIPKART-STYLE MOBILE FIXED BOTTOM NAVIGATION */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E0E0E0] flex items-center justify-around py-2 px-1 shadow-lg text-[10px] font-bold">
        <button
          onClick={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'home' ? 'text-[#2874F0]' : 'text-slate-600'}`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveView('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'shop' ? 'text-[#2874F0]' : 'text-slate-600'}`}
        >
          <Grid className="w-4 h-4" />
          <span>Categories</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 text-slate-600 relative"
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#FB641B] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        <button
          onClick={() => {
            if (currentUser) {
              setActiveView('account');
            } else {
              setIsAuthOpen(true);
            }
          }}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'account' ? 'text-[#2874F0]' : 'text-slate-600'}`}
        >
          <UserIcon className="w-4 h-4" />
          <span>{currentUser ? 'Account' : 'Login'}</span>
        </button>
      </div>

      {/* 5. GLOBAL MODALS & DRAWERS */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onContinueWithoutLogin={handleContinueWithoutLogin}
        onSignInWithEmail={handleSignInWithEmailFromWelcome}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        checkoutRedirectMessage={authRedirectMessage}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckoutFromCart}
        onCartChange={refreshCart}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        relatedProducts={
          selectedProduct
            ? allProducts.filter((p) => p.categoryId === selectedProduct.categoryId && p.id !== selectedProduct.id)
            : []
        }
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <RazorpayModal
        isOpen={razorpayModalData.isOpen}
        orderNumber={razorpayModalData.orderNumber}
        razorpayOrderId={razorpayModalData.razorpayOrderId}
        amountInRupees={razorpayModalData.amountInRupees}
        customerEmail={currentUser?.email || 'customer@amocart.com'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
        onClose={() => setRazorpayModalData((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 6. FLIPKART MULTI-COLUMN FOOTER */}
      <Footer
        onOpenAdminPortal={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateCategory={(slug) => {
          setSelectedCategorySlug(slug);
          setActiveView('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}
