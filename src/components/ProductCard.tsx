import React from 'react';
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div className="group relative bg-white border border-[#E0E0E0] rounded-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-200 cursor-pointer">
      {/* 1. PRODUCT IMAGE CONTAINER */}
      <div
        className="relative p-4 flex items-center justify-center bg-white aspect-[4/3] sm:aspect-square overflow-hidden"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-2.5 right-2.5 p-1.5 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-50 transition-colors"
          title="Add to Wishlist"
        >
          <Heart className="w-4 h-4 fill-transparent hover:fill-rose-500 transition-colors" />
        </button>

        {/* Stock / Urgent tag */}
        {isOutOfStock ? (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-slate-700 px-2 py-0.5 rounded-xs">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#FB641B] bg-orange-50 px-2 py-0.5 rounded-xs border border-orange-200">
            Only {product.stock} left
          </span>
        ) : null}
      </div>

      {/* 2. PRODUCT DETAILS SECTION */}
      <div className="p-3.5 pt-1 flex-1 flex flex-col justify-between border-t border-slate-50">
        <div>
          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="text-xs sm:text-sm font-medium text-[#212121] line-clamp-2 hover:text-[#2874F0] transition-colors leading-snug mb-1.5"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Flipkart-Style Green Rating Pill */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 fill-white" />
            </span>
            <span className="text-[11px] text-[#878787] font-medium">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price Row: Current Price, Strikethrough MRP, Discount % */}
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mb-1">
            <span className="text-sm sm:text-base font-bold text-[#212121]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-[11px] text-[#878787] line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-[#388E3C]">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          {/* Free Delivery Tag */}
          <div className="text-[11px] text-[#212121] font-medium">
            Free delivery
          </div>
        </div>

        {/* 3. QUICK ACTION BUTTONS */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 transition-colors ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#FF9F00] hover:bg-[#F29400] text-white active:scale-98 shadow-xs'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>

          <button
            onClick={() => onViewDetails(product)}
            className="p-1.5 text-slate-500 hover:text-[#2874F0] hover:bg-blue-50 rounded-xs transition-colors"
            title="View Product Specifications"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
