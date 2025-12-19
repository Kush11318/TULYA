'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/app/components/SearchBar';
import History from '@/app/components/History';
import { addSearchToHistory } from '@/app/components/History';

export default function Home() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    addSearchToHistory(query);
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="page-fade-in relative min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-start">
        <section className="w-full max-w-xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                PriceLens
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                One search. All the prices.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Search once and see live offers from Amazon, Flipkart, GeM, Snapdeal and Meesho in a
                clean, comparable view – no more tab chaos.
              </p>
            </div>
          </div>

          <SearchBar onSearch={handleSearch} />

          <div className="mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
              Recent searches
            </h2>
            <div className="mt-3">
              <History />
            </div>
          </div>
        </section>

        <section className="mt-8 w-full max-w-md space-y-4 md:mt-0 md:pl-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-sm backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Why teams use PriceLens</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>• Unified view across marketplaces in seconds.</li>
              <li>• Relevance‑aware results that filter out accessories.</li>
              <li>• Side‑by‑side comparison for confident decisions.</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-sky-50/60 p-3 text-xs text-slate-800">
              <p className="font-semibold">Smart relevance</p>
              <p className="mt-1">
                Focus on real products, not cases and screen guards.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-800">
              <p className="font-semibold">Clean comparisons</p>
              <p className="mt-1">
                Select items and open a structured comparison table any time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
