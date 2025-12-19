'use client';

import { ProductResult } from '@/server/scrapers/utils';

interface ComparisonDrawerProps {
  products: ProductResult[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onOpenTable: () => void;
}

export default function ComparisonDrawer({ products, isOpen, onClose, onClear, onOpenTable }: ComparisonDrawerProps) {
  if (!isOpen || products.length < 1) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1 flex items-center gap-2 pr-1 dark:bg-slate-800 dark:border-slate-700">
        <span className="pl-4 text-sm font-medium text-gray-900 dark:text-gray-100">
          {products.length} selected
        </span>

        <div className="h-4 w-px bg-gray-300 mx-1 dark:bg-gray-600" />

        <button
          onClick={onClear}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-full transition-colors dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-slate-700"
        >
          Clear
        </button>

        <button
          onClick={onOpenTable}
          className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          Compare
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

