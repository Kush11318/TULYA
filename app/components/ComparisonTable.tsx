'use client';

import { ProductResult } from '@/server/scrapers/utils';
import Image from 'next/image';
import { useState } from 'react';

interface ComparisonTableProps {
  products: ProductResult[];
  getMatchScore: (product: ProductResult) => number;
  onRemove: (product: ProductResult) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ComparisonTable({
  products,
  getMatchScore,
  onRemove,
  onClear,
  onClose,
}: ComparisonTableProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (products.length === 0) return null;

  // Find best price
  const prices = products.map(p => parseInt(String(p.price || '0').replace(/[^\d]/g, '')) || Infinity);
  const minPrice = Math.min(...prices.filter(p => p !== Infinity));

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-semibold text-gray-900">
            Compare Products ({products.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-black rounded"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-black rounded"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-20">
                <tr>
                  <th className="sticky left-0 bg-white border-r border-gray-200 border-b border-gray-200 p-4 text-left text-sm font-semibold text-gray-700 min-w-[150px]">
                    Attribute
                  </th>
                  {products.map((product, index) => (
                    <th
                      key={index}
                      className="border-b border-gray-200 p-4 text-center text-sm font-semibold text-gray-700 min-w-[200px] relative"
                      style={{
                        animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                        animationFillMode: 'both',
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => onRemove(product)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors border border-black rounded"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className="w-24 h-24 relative bg-gray-50 rounded-md overflow-hidden">
                          {product.image && product.image.startsWith('http') && !imageErrors.has(index) ? (
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              className="object-contain"
                              unoptimized
                              onError={() => handleImageError(index)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{product.site}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Product Title Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white border-r border-gray-200 border-b border-gray-100 p-4 text-sm font-medium text-gray-700">
                    Product Title
                  </td>
                  {products.map((product, index) => (
                    <td
                      key={`title-${index}`}
                      className="border-b border-gray-100 p-4 text-center"
                    >
                      <p className="text-sm text-gray-900 line-clamp-3">{product.title}</p>
                    </td>
                  ))}
                </tr>

                {/* Website Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white border-r border-gray-200 border-b border-gray-100 p-4 text-sm font-medium text-gray-700">
                    Website
                  </td>
                  {products.map((product, index) => (
                    <td key={`site-${index}`} className="border-b border-gray-100 p-4 text-center">
                      <span className="text-sm text-gray-600">{product.site}</span>
                    </td>
                  ))}
                </tr>

                {/* Price Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white border-r border-gray-200 border-b border-gray-100 p-4 text-sm font-medium text-gray-700">
                    Price
                  </td>
                  {products.map((product, index) => {
                    const priceNum = parseInt(String(product.price || '0').replace(/[^\d]/g, '')) || Infinity;
                    const isBestPrice = priceNum === minPrice && priceNum !== Infinity;
                    return (
                      <td key={`price-${index}`} className="border-b border-gray-100 p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-semibold text-gray-900">{product.price}</span>
                          {isBestPrice && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)',
                              }}
                            >
                              Best Value
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Match Score Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white border-r border-gray-200 border-b border-gray-100 p-4 text-sm font-medium text-gray-700">
                    Match Score
                  </td>
                  {products.map((product, index) => {
                    const score = getMatchScore(product);
                    const getColor = () => {
                      if (score >= 70) return 'text-green-600';
                      if (score >= 40) return 'text-yellow-600';
                      return 'text-red-600';
                    };
                    return (
                      <td key={`score-${index}`} className="border-b border-gray-100 p-4 text-center">
                        <span className={`text-sm font-medium ${getColor()}`}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Link Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white border-r border-gray-200 border-b border-gray-100 p-4 text-sm font-medium text-gray-700">
                    Product Link
                  </td>
                  {products.map((product, index) => {
                    const productLink = product.link && product.link.startsWith('http') ? product.link : '#';
                    return (
                      <td key={`link-${index}`} className="border-b border-gray-100 p-4 text-center">
                        <a
                          href={productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors border border-black rounded no-underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Don't prevent default - let the browser handle the link naturally
                          }}
                        >
                          Open Product
                        </a>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

