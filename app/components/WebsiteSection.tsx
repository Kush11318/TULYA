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
}

const siteColors: Record<string, { bg: string; border: string; text: string }> = {
  Amazon: {
    bg: 'rgba(255, 153, 0, 0.08)',
    border: 'rgba(255, 153, 0, 0.2)',
    text: 'rgba(255, 153, 0, 0.6)',
  },
  Flipkart: {
    bg: 'rgba(0, 123, 255, 0.08)',
    border: 'rgba(0, 123, 255, 0.2)',
    text: 'rgba(0, 123, 255, 0.6)',
  },
  GeM: {
    bg: 'rgba(76, 182, 159, 0.08)',
    border: 'rgba(76, 182, 159, 0.2)',
    text: 'rgba(76, 182, 159, 0.6)',
  },
  Snapdeal: {
    bg: 'rgba(230, 57, 70, 0.08)',
    border: 'rgba(230, 57, 70, 0.2)',
    text: 'rgba(230, 57, 70, 0.6)',
  },
};

export default function WebsiteSection({
  site,
  products,
  isBestPrice,
  getMatchScore,
  selectedProducts,
  onSelectProduct,
}: WebsiteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const siteColor = siteColors[site] || { bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)', text: 'rgba(0,0,0,0.5)' };

  if (products.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-lg border transition-all duration-200"
      style={{
        borderColor: siteColor.border,
        backgroundColor: siteColor.bg,
      }}
    >
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity border-b border-black"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900" style={{ color: siteColor.text }}>
            {site}
          </span>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
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
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      </div>
    </div>
  );
}

