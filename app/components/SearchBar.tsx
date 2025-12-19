'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  initialValue?: string;
}

export default function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [productName, setProductName] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    setIsLoading(true);
    const query = productName.trim();

    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/results?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2 rounded-full border border-sky-100 bg-white/90 p-1.5 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm dark:bg-slate-800/90 dark:border-slate-700 dark:ring-slate-700">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Search for a product, e.g. “iPhone 15 Pro”"
          className="flex-1 rounded-full border-0 bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !productName.trim()}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-sky-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  );
}

