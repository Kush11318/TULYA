'use client';

import { ProductResult } from '@/server/scrapers/utils';
import Image from 'next/image';
import { useState } from 'react';
import { retryScraper } from '@/app/actions';

interface ResultTableProps {
  results: ProductResult[];
  query: string;
  onRetrySuccess?: (product: ProductResult) => void;
}

export default function ResultTable({ results, query, onRetrySuccess }: ResultTableProps) {
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryResults, setRetryResults] = useState<Record<string, ProductResult>>({});

  // Separate valid and invalid products
  const validProducts = results.filter(p => !p.invalid);
  const invalidProducts = results.filter(p => p.invalid);

  // Merge retry results with valid products
  const allValidProducts = [...validProducts, ...Object.values(retryResults).filter(p => !p.invalid)];

  const handleRetry = async (site: string) => {
    setRetrying(site);
    try {
      const result = await retryScraper(site, query);
      if (result) {
        setRetryResults(prev => ({ ...prev, [site]: result }));
        if (result && !result.invalid && onRetrySuccess) {
          onRetrySuccess(result);
        }
      }
    } catch (error) {
      console.error(`Error retrying ${site}:`, error);
    } finally {
      setRetrying(null);
    }
  };

  if (allValidProducts.length === 0 && invalidProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-4">No results found. Try a different search term.</p>
      </div>
    );
  }

  // Calculate minimum price for "Best Price" badge (only from valid products)
  const prices = allValidProducts
    .map(p => parseInt(String(p.price || '0').replace(/[^\d]/g, '')) || Infinity)
    .filter(p => p !== Infinity);
  const minPrice = prices.length > 0 ? Math.min(...prices) : Infinity;

  // Filter out sites that were successfully retried
  const stillInvalid = invalidProducts.filter(p => !retryResults[p.site] || retryResults[p.site].invalid);

  return (
    <div>
      {/* Show warnings for blocked/invalid products with retry buttons */}
      {stillInvalid.length > 0 && (
        <div className="mb-4 space-y-2">
          {stillInvalid.map((product, idx) => (
            <div
              key={`invalid-${product.site}-${idx}`}
              className="border border-black dark:border-white p-3 text-sm flex items-center justify-between"
            >
              <span>
                {product.blocked ? (
                  <>⚠️ {product.site} blocked by anti-bot.</>
                ) : (
                  <>⚠️ {product.site} returned no results.</>
                )}
              </span>
              <button
                onClick={() => handleRetry(product.site)}
                disabled={retrying === product.site}
                className="px-3 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-xs disabled:opacity-50"
              >
                {retrying === product.site ? 'Retrying...' : `Retry ${product.site}`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main results table */}
      {allValidProducts.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full border-collapse border border-black dark:border-white min-w-[800px]">
            <thead>
              <tr className="bg-black dark:bg-white text-white dark:text-black">
                <th className="border border-black dark:border-white p-4 text-left">Image</th>
                <th className="border border-black dark:border-white p-4 text-left">Product</th>
                <th className="border border-black dark:border-white p-4 text-left">Site</th>
                <th className="border border-black dark:border-white p-4 text-right">Price</th>
                <th className="border border-black dark:border-white p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {allValidProducts.map((product, index) => {
                if (!product || !product.site || !product.title) {
                  return null;
                }

                const imageUrl = product.image && product.image.startsWith('http') ? product.image : '';
                const productLink = product.link && product.link.startsWith('http') ? product.link : '#';

                // Check if this is the best price
                const priceNum = product.price ? parseInt(String(product.price).replace(/[^\d]/g, '')) || Infinity : Infinity;
                const isBestPrice = priceNum === minPrice && priceNum !== Infinity;

                return (
                  <tr
                    key={`${product.site}-${index}`}
                    className="hover-subtle"
                  >
                    <td className="border border-black dark:border-white p-4">
                      <div className="w-20 h-20 relative bg-white dark:bg-black border border-black dark:border-white overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.title || 'Product image'}
                            fill
                            className="object-contain"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs border border-black dark:border-white opacity-50">
                            No image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-black dark:border-white p-4">
                      <div className="max-w-xs">
                        <h3 className="font-medium line-clamp-2 mb-1">{product.title || 'Untitled Product'}</h3>
                        {isBestPrice && (
                          <span className="inline-block px-2 py-1 text-xs best-price-badge">
                            Best Price
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-black dark:border-white p-4">
                      <span className="font-medium">{product.site || 'Unknown Site'}</span>
                    </td>
                    <td className="border border-black dark:border-white p-4 text-right">
                      <span className="text-xl font-semibold">
                        {product.price || 'Price not available'}
                      </span>
                    </td>
                    <td className="border border-black dark:border-white p-4 text-center">
                      <a
                        href={productLink}
                        className="inline-block px-4 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-sm"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg mb-4">No valid products found.</p>
        </div>
      )}
    </div>
  );
}
