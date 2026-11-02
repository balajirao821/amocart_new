import React from 'react';
import { Category } from '../types';
import { Headphones, Laptop, Watch, Coffee, Briefcase, Grid } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategorySlug?: string;
  onSelectCategory: (slug?: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'audio-acoustics': <Headphones className="w-5 h-5 text-[#2874F0]" />,
  'desk-workspace': <Laptop className="w-5 h-5 text-[#2874F0]" />,
  'watches-leather': <Watch className="w-5 h-5 text-[#2874F0]" />,
  'artisanal-coffee': <Coffee className="w-5 h-5 text-[#2874F0]" />,
  'carry-bags': <Briefcase className="w-5 h-5 text-[#2874F0]" />,
};

// High-fidelity image thumbnails matching Flipkart's category bubble style
const CATEGORY_THUMBNAILS: Record<string, string> = {
  'audio-acoustics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80',
  'desk-workspace': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&auto=format&fit=crop&q=80',
  'watches-leather': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=120&auto=format&fit=crop&q=80',
  'artisanal-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=80',
  'carry-bags': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&auto=format&fit=crop&q=80',
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white border-b border-[#E0E0E0] shadow-xs mb-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between sm:justify-center gap-6 sm:gap-12 py-3 overflow-x-auto no-scrollbar">
          
          {/* ALL CATEGORIES SHORTCUT */}
          <button
            onClick={() => onSelectCategory(undefined)}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${
                !selectedCategorySlug
                  ? 'border-[#2874F0] bg-[#EAF2FF]'
                  : 'border-transparent bg-slate-100 group-hover:border-slate-300'
              }`}
            >
              <Grid className="w-5 h-5 text-[#2874F0]" />
            </div>
            <span
              className={`text-xs whitespace-nowrap transition-colors ${
                !selectedCategorySlug
                  ? 'text-[#2874F0] font-bold'
                  : 'text-[#212121] font-semibold group-hover:text-[#2874F0]'
              }`}
            >
              All Products
            </span>
          </button>

          {/* DYNAMIC CATEGORIES FROM DATABASE */}
          {categories.filter(c => c.isActive).map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            const thumb = CATEGORY_THUMBNAILS[cat.slug];

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all ${
                    isSelected
                      ? 'border-[#2874F0] p-0.5'
                      : 'border-transparent group-hover:border-slate-300'
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#EAF2FF] flex items-center justify-center rounded-full">
                      {CATEGORY_ICONS[cat.slug] || <Grid className="w-5 h-5 text-[#2874F0]" />}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-[#2874F0] font-bold'
                      : 'text-[#212121] font-semibold group-hover:text-[#2874F0]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
