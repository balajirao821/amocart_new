import React, { useState } from 'react';
import { X, Star, ShoppingCart, Zap, ShieldCheck, Truck, RefreshCw, CheckCircle2, MapPin } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  relatedProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  relatedProducts,
  onSelectProduct,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const savingsAmount =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : null;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAdd = () => {
    if (quantity > 0 && quantity <= product.stock) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  const handleInstantBuy = () => {
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product, quantity);
      onClose();
    } else {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-5xl bg-white rounded-xs shadow-2xl border border-[#E0E0E0] overflow-hidden relative my-6 max-h-[92vh] flex flex-col"
        role="dialog"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 text-slate-400 hover:text-slate-700 bg-white/80 rounded-full hover:bg-slate-100 transition-colors shadow-xs"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: PRODUCT IMAGES & DUAL FLIPKART BUTTONS */}
            <div className="md:col-span-5 flex flex-col">
              {/* Main Image Container */}
              <div className="relative border border-[#E0E0E0] p-4 flex items-center justify-center bg-white aspect-square rounded-xs overflow-hidden">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                />

                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="px-4 py-1.5 bg-slate-800 text-white font-bold text-sm rounded-xs">
                      CURRENTLY OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 border-2 p-1 rounded-xs flex items-center justify-center bg-white shrink-0 transition-all ${
                        activeImageIndex === idx ? 'border-[#2874F0]' : 'border-[#E0E0E0] hover:border-slate-400'
                      }`}
                    >
                      <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* FLIPKART-STYLE DUAL ACTION BUTTONS (Add to Cart #FF9F00, Buy Now #FB641B) */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`py-3.5 px-4 font-bold text-sm rounded-xs shadow-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wide ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#FF9F00] hover:bg-[#F29400] text-white active:scale-98'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 fill-white" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleInstantBuy}
                  disabled={isOutOfStock}
                  className={`py-3.5 px-4 font-bold text-sm rounded-xs shadow-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wide ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#FB641B] hover:bg-[#E85B17] text-white active:scale-98'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS & DETAILS */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                {/* Breadcrumbs Category & SKU */}
                <div className="flex items-center gap-2 text-xs text-[#878787] mb-1 font-medium">
                  <span>Home</span>
                  <span>&gt;</span>
                  <span>{product.categoryName}</span>
                  <span>&gt;</span>
                  <span className="text-[#212121]">SKU: {product.sku}</span>
                </div>

                {/* Title */}
                <h1 className="text-lg sm:text-xl font-medium text-[#212121] leading-tight mb-2">
                  {product.name}
                </h1>

                {/* Flipkart Rating & Review Count */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 bg-[#388E3C] text-white text-xs font-bold px-2 py-0.5 rounded-xs">
                    <span>{product.rating.toFixed(1)}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </span>
                  <span className="text-xs font-semibold text-[#878787]">
                    {product.reviewCount} Ratings &amp; Reviews
                  </span>
                  <span className="text-xs text-[#388E3C] font-bold ml-2">
                    ✓ AmoCart Verified
                  </span>
                </div>

                {/* Price Display */}
                <div className="bg-[#f9fafb] p-3 rounded-xs border border-slate-100 mb-4">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold text-[#212121]">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-sm sm:text-base text-[#878787] line-through">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#388E3C]">
                          {discountPercent}% off
                        </span>
                      </>
                    )}
                  </div>
                  {savingsAmount && (
                    <p className="text-xs text-[#388E3C] font-semibold mt-1">
                      You save ₹{savingsAmount.toLocaleString('en-IN')} on this order!
                    </p>
                  )}
                </div>

                {/* Delivery Destination Check */}
                <div className="mb-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#212121]">
                    <MapPin className="w-3.5 h-3.5 text-[#2874F0]" />
                    <span>Delivery to: 4/285 ,NGGOS Colony, Hosur - 635109</span>
                  </div>
                  <p className="text-[#388E3C] font-semibold pl-5">
                    Free Delivery available. Usually delivered in 2 - 3 business days.
                  </p>
                </div>

                {/* Available Offers Section */}
                <div className="space-y-1.5 mb-4 text-xs">
                  <p className="font-bold text-[#212121]">Available Offers</p>
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="text-[#388E3C] font-bold">🏷</span>
                    <span><strong>Bank Offer:</strong> Instant payment processing via official Razorpay gateway.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="text-[#388E3C] font-bold">🏷</span>
                    <span><strong>Special Price:</strong> Get direct manufacturer pricing with zero platform markups.</span>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-4 py-3 border-y border-[#E0E0E0] mb-4">
                  <span className="text-xs font-bold text-[#212121]">Quantity:</span>
                  <div className="flex items-center border border-[#E0E0E0] rounded-xs overflow-hidden">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-bold text-slate-900 border-x border-[#E0E0E0]">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {isLowStock && (
                    <span className="text-xs font-semibold text-[#FB641B]">
                      Hurry, only {product.stock} items left!
                    </span>
                  )}
                </div>

                {/* Product Description */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[#212121] uppercase tracking-wide mb-1.5">
                    Product Description
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Highlights / Specifications Table */}
                <div className="border border-[#E0E0E0] rounded-xs overflow-hidden text-xs mb-4">
                  <div className="bg-slate-50 px-3 py-2 font-bold text-[#212121] border-b border-[#E0E0E0]">
                    Specifications
                  </div>
                  <div className="divide-y divide-[#E0E0E0]">
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span className="text-[#878787] font-medium">Department</span>
                      <span className="col-span-2 text-[#212121] font-semibold">{product.categoryName}</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span className="text-[#878787] font-medium">SKU Reference</span>
                      <span className="col-span-2 text-[#212121] font-mono">{product.sku}</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span className="text-[#878787] font-medium">Warranty</span>
                      <span className="col-span-2 text-[#212121]">1 Year Domestic Manufacturer Warranty</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span className="text-[#878787] font-medium">Authenticity</span>
                      <span className="col-span-2 text-[#388E3C] font-semibold">100% Original AmoCart Guaranteed</span>
                    </div>
                  </div>
                </div>

                {/* Assurance Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-xs">
                    <ShieldCheck className="w-4 h-4 mx-auto text-[#2874F0] mb-1" />
                    <p className="text-[10px] font-bold text-[#212121]">1 Year Warranty</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xs">
                    <RefreshCw className="w-4 h-4 mx-auto text-[#2874F0] mb-1" />
                    <p className="text-[10px] font-bold text-[#212121]">7 Days Return</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xs">
                    <Truck className="w-4 h-4 mx-auto text-[#2874F0] mb-1" />
                    <p className="text-[10px] font-bold text-[#212121]">Free Delivery</p>
                  </div>
                </div>
              </div>

              {/* Similar Products */}
              {relatedProducts.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#E0E0E0]">
                  <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wide mb-3">
                    Similar Products in {product.categoryName}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {relatedProducts.slice(0, 3).map((rp) => (
                      <div
                        key={rp.id}
                        onClick={() => {
                          onSelectProduct(rp);
                          setActiveImageIndex(0);
                        }}
                        className="p-2 border border-[#E0E0E0] rounded-xs hover:border-[#2874F0] cursor-pointer bg-white transition-all"
                      >
                        <img src={rp.images[0]} alt={rp.name} className="h-16 w-full object-contain mb-1.5" />
                        <p className="text-[11px] font-semibold text-[#212121] truncate">{rp.name}</p>
                        <p className="text-xs font-bold text-[#212121]">₹{rp.price.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
