'use client';

import { ProductResult } from '@/server/scrapers/utils';
import Image from 'next/image';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductResult;
  isBestPrice: boolean;
  matchScore: number;
  isSelected: boolean;
  onSelect: (product: ProductResult) => void;
}

export default function ProductCard({ product, isBestPrice, matchScore, isSelected, onSelect }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = product.image && product.image.startsWith('http') ? product.image : '';
  const productLink = product.link && product.link.startsWith('http') ? product.link : '#';

  const getMatchColor = () => {
    if (matchScore >= 70) return 'text-green-600';
    if (matchScore >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(productLink);
  };

  const shareProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: productLink,
      });
    }
  };

  return (
    <div
      className={`
        group relative bg-white rounded-lg border border-gray-200 p-4
        transition-all duration-200 ease-out
        hover:shadow-md hover:-translate-y-1
        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-30' : ''}
      `}
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Checkbox for comparison */}
      <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(product)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">Compare</span>
        </label>
      </div>

      {/* Best Price Badge */}
      {isBestPrice && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            animation: 'float 3s ease-in-out infinite',
          }}
        >
          Best Price
        </div>
      )}

      {/* Product Image */}
      <div className="relative w-full aspect-square mb-3 rounded-md overflow-hidden bg-gray-50">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-contain"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 text-gray-900 leading-tight">
          {product.title}
        </h3>

        {/* Match Score */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Match:</span>
          <span className={`font-medium ${getMatchColor()}`}>{matchScore}%</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold text-gray-900">{product.price}</span>
          <span className="text-xs text-gray-500">{product.site}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <a
            href={productLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-center border border-black no-underline"
            onClick={(e) => {
              e.stopPropagation();
              // Don't prevent default - let the browser handle the link naturally
            }}
          >
            View Product
          </a>
          <button
            onClick={copyLink}
            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors border border-black rounded"
            title="Copy Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {navigator.share && (
            <button
              onClick={shareProduct}
              className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors border border-black rounded"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

