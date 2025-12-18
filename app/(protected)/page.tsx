'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/app/components/SearchBar';
import History from '@/app/components/History';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import { addSearchToHistory } from '@/app/components/History';

export default function Home() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    addSearchToHistory(query);
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light tracking-tight">
            PriceLens
          </h1>
          <DarkModeToggle />
        </div>

        <SearchBar onSearch={handleSearch} />
        <History />
      </div>
    </main>
  );
}
