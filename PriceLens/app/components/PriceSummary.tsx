'use client';

import { ProductResult } from '@/server/scrapers/utils';

interface PriceSummaryProps {
  results: ProductResult[];
}

export default function PriceSummary({ results }: PriceSummaryProps) {
  // Only count valid products (exclude invalid/blocked)
  const validResults = results.filter(p => !p.invalid);
  const prices = validResults
    .map(p => parseInt(String(p.price || '0').replace(/[^\d]/g, '')) || 0)
    .filter(p => p > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const totalResults = validResults.length;

  if (totalResults === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="border border-black dark:border-white p-4 hover-subtle">
        <p className="text-xs mb-1 opacity-70">Lowest Price</p>
        <p className="text-xl font-semibold">₹{minPrice.toLocaleString('en-IN')}</p>
      </div>
      <div className="border border-black dark:border-white p-4 hover-subtle">
        <p className="text-xs mb-1 opacity-70">Highest Price</p>
        <p className="text-xl font-semibold">₹{maxPrice.toLocaleString('en-IN')}</p>
      </div>
      <div className="border border-black dark:border-white p-4 hover-subtle">
        <p className="text-xs mb-1 opacity-70">Average Price</p>
        <p className="text-xl font-semibold">₹{avgPrice.toLocaleString('en-IN')}</p>
      </div>
      <div className="border border-black dark:border-white p-4 hover-subtle">
        <p className="text-xs mb-1 opacity-70">Total Results</p>
        <p className="text-xl font-semibold">{totalResults}</p>
      </div>
    </div>
  );
}

