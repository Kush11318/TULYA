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
      <div className="flex gap-2">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Enter product name..."
          className="flex-1 px-4 py-3 border border-black dark:border-white focus:outline-none bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !productName.trim()}
          className="px-6 py-3 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

