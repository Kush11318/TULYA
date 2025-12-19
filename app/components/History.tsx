'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const HISTORY_KEY = 'price_comparison_history';
const MAX_HISTORY = 5;

export default function History() {
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load history from localStorage
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    setHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, MAX_HISTORY);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving history:', error);
      }

      return updated;
    });
  };

  const handleClick = (query: string) => {
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-xs mb-2 text-slate-600 dark:text-slate-400">Recent searches:</p>
      <div className="flex flex-wrap gap-2">
        {history.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(item)}
            className="text-sm underline hover:no-underline opacity-70 hover:opacity-100 transition-opacity border border-slate-400 dark:border-slate-500 rounded px-2 py-1 text-slate-800 dark:text-slate-200"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// Export function to add to history from other components
export function addSearchToHistory(query: string) {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const current = stored ? JSON.parse(stored) : [];
    const filtered = current.filter((item: string) => item.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

