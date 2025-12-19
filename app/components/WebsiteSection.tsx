'use client';

import { ProductResult } from '@/server/scrapers/utils';
import { useState } from 'react';
import ProductCard from './ProductCard';

interface WebsiteSectionProps {
  site: string;
  products: ProductResult[];
  isBestPrice: (product: ProductResult) => boolean;
  getMatchScore: (product: ProductResult) => number;
  selectedProducts: Set<string>;
  onSelectProduct: (product: ProductResult) => void;
  viewMode: 'list' | 'grid';
}

const siteColors: Record<string, { bg: string; border: string; text: string }> = {
  Amazon: {
    bg: 'rgba(59, 130, 246, 0.03)',
    border: 'rgba(59, 130, 246, 0.18)',
    text: 'rgba(37, 99, 235, 0.9)',
  },
  Flipkart: {
    bg: 'rgba(37, 99, 235, 0.03)',
    border: 'rgba(37, 99, 235, 0.18)',
    text: 'rgba(30, 64, 175, 0.9)',
  },
  GeM: {
    bg: 'rgba(56, 189, 248, 0.03)',
    border: 'rgba(56, 189, 248, 0.18)',
    text: 'rgba(8, 47, 73, 0.9)',
  },
  Snapdeal: {
    bg: 'rgba(248, 113, 113, 0.03)',
    border: 'rgba(248, 113, 113, 0.18)',
    text: 'rgba(127, 29, 29, 0.9)',
  },
};

export default function WebsiteSection({
  site,
  products,
  isBestPrice,
  getMatchScore,
  selectedProducts,
  onSelectProduct,
  viewMode,
}: WebsiteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const siteColor = siteColors[site] || { bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)', text: 'rgba(0,0,0,0.5)' };

  if (products.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-2xl border transition-all duration-200 hover:border-sky-300 hover:shadow-sm"
      style={{
        borderColor: siteColor.border,
        backgroundColor: siteColor.bg,
      }}
    >
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between border-b border-slate-200 px-6 py-4 text-left transition-colors hover:bg-slate-50/60 dark:border-slate-700 dark:hover:bg-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: siteColor.text }}>
            {site}
          </span>
          <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-4 pb-4">
          {viewMode === 'list' ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {products.map((product, index) => (
                <div key={`${product.site}-${index}-${product.title}`} className="py-3">
                  <ProductCard
                    product={product}
                    isBestPrice={isBestPrice(product)}
                    matchScore={getMatchScore(product)}
                    isSelected={selectedProducts.has(`${product.site}-${product.title}`)}
                    onSelect={onSelectProduct}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <ProductCard
                  key={`${product.site}-${index}-${product.title}`}
                  product={product}
                  isBestPrice={isBestPrice(product)}
                  matchScore={getMatchScore(product)}
                  isSelected={selectedProducts.has(`${product.site}-${product.title}`)}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

