'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { comparePrices } from '@/app/actions';
import { ProductResult } from '@/server/scrapers/utils';
import SearchBar from '@/app/components/SearchBar';
import WebsiteSection from '@/app/components/WebsiteSection';
import ComparisonDrawer from '@/app/components/ComparisonDrawer';
import ComparisonTable from '@/app/components/ComparisonTable';
import ShimmerSkeleton from '@/app/components/ShimmerSkeleton';
import BackToTop from '@/app/components/BackToTop';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import { addSearchToHistory } from '@/app/components/History';

type SortOption = 'price-low' | 'price-high' | 'alphabetical' | 'website' | 'relevance';
type FilterOption = 'all' | 'under-20k' | '20k-40k' | 'amazon' | 'flipkart' | 'gem' | 'snapdeal';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('price-low');
  const [filters, setFilters] = useState<Set<FilterOption>>(new Set(['all']));
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showComparisonTable, setShowComparisonTable] = useState(false);

  useEffect(() => {
    if (!query) {
      router.push('/');
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await comparePrices(query);
        if (Array.isArray(data)) {
          setResults(data);
          addSearchToHistory(query);
          if (data.length === 0) {
            setError('No products found. Try a different search term.');
          } else {
            setError(null);
          }
        } else {
          setError('Invalid response from server. Please try again.');
          setResults([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices. Please try again.';
        if (results.length === 0) {
          setError(errorMessage);
        }
        console.error('Price comparison error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, router]);

  // Calculate match score for a product
  const getMatchScore = (product: ProductResult): number => {
    if (!query || !product.title) return 0;
    const queryLower = query.toLowerCase();
    const titleLower = product.title.toLowerCase();
    
    // Simple matching algorithm
    const queryWords = queryLower.split(/\s+/);
    const titleWords = titleLower.split(/\s+/);
    
    let matches = 0;
    queryWords.forEach(qWord => {
      if (titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
        matches++;
      }
    });
    
    return Math.min(100, Math.round((matches / queryWords.length) * 100));
  };

  // Filter and sort products
  const processedResults = useMemo(() => {
    let filtered = [...results];

    // Apply filters
    if (!filters.has('all')) {
      filtered = filtered.filter(product => {
        const priceNum = parseInt(String(product.price || '0').replace(/[^\d]/g, '')) || 0;
        
        if (filters.has('under-20k') && priceNum >= 20000) return false;
        if (filters.has('20k-40k') && (priceNum < 20000 || priceNum >= 40000)) return false;
        if (filters.has('amazon') && product.site !== 'Amazon') return false;
        if (filters.has('flipkart') && product.site !== 'Flipkart') return false;
        if (filters.has('gem') && product.site !== 'GeM') return false;
        if (filters.has('snapdeal') && product.site !== 'Snapdeal') return false;
        
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          const priceA = parseInt(String(a.price || '0').replace(/[^\d]/g, '')) || Infinity;
          const priceB = parseInt(String(b.price || '0').replace(/[^\d]/g, '')) || Infinity;
          return priceA - priceB;
        }
        case 'price-high': {
          const priceA = parseInt(String(a.price || '0').replace(/[^\d]/g, '')) || 0;
          const priceB = parseInt(String(b.price || '0').replace(/[^\d]/g, '')) || 0;
          return priceB - priceA;
        }
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '');
        case 'website':
          return (a.site || '').localeCompare(b.site || '');
        case 'relevance':
          return getMatchScore(b) - getMatchScore(a);
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, sortBy, filters, query]);

  // Group by website
  const groupedResults = useMemo(() => {
    const groups: Record<string, ProductResult[]> = {};
    processedResults.forEach(product => {
      if (!groups[product.site]) {
        groups[product.site] = [];
      }
      groups[product.site].push(product);
    });
    return groups;
  }, [processedResults]);

  // Find best price
  const minPrice = useMemo(() => {
    const prices = processedResults
      .map(p => parseInt(String(p.price || '0').replace(/[^\d]/g, '')) || Infinity)
      .filter(p => p !== Infinity);
    return prices.length > 0 ? Math.min(...prices) : Infinity;
  }, [processedResults]);

  const isBestPrice = (product: ProductResult): boolean => {
    const priceNum = parseInt(String(product.price || '0').replace(/[^\d]/g, '')) || Infinity;
    return priceNum === minPrice && priceNum !== Infinity;
  };

  const handleSelectProduct = (product: ProductResult) => {
    setSelectedProducts(prev => {
      const key = `${product.site}-${product.title}`;
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleRemoveProduct = (product: ProductResult) => {
    setSelectedProducts(prev => {
      const key = `${product.site}-${product.title}`;
      const newSet = new Set(prev);
      newSet.delete(key);
      // Close table if no products remain
      if (newSet.size === 0) {
        setShowComparisonTable(false);
      }
      return newSet;
    });
  };

  const selectedProductsList = useMemo(() => {
    return processedResults.filter(p => selectedProducts.has(`${p.site}-${p.title}`));
  }, [processedResults, selectedProducts]);

  const toggleFilter = (filter: FilterOption) => {
    setFilters(prev => {
      const newFilters = new Set(prev);
      if (filter === 'all') {
        newFilters.clear();
        newFilters.add('all');
      } else {
        newFilters.delete('all');
        if (newFilters.has(filter)) {
          newFilters.delete(filter);
        } else {
          newFilters.add(filter);
        }
        if (newFilters.size === 0) {
          newFilters.add('all');
        }
      }
      return newFilters;
    });
  };

  const handleSearch = (newQuery: string) => {
    router.push(`/results?q=${encodeURIComponent(newQuery)}`);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-light text-gray-900">Searching...</h1>
            <DarkModeToggle />
          </div>
          <ShimmerSkeleton />
        </div>
      </main>
    );
  }

  if (error && results.length === 0 && !isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-lg mb-4 text-gray-700">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              Results for: <span className="font-normal">{query}</span>
            </h1>
            <p className="text-sm text-gray-500">{processedResults.length} products found</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-black rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              New Search
            </button>
            <DarkModeToggle />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} initialValue={query} />
        </div>

        {/* Controls */}
        {results.length > 0 && (
          <div className="mb-8 space-y-4">
            {/* Sorting */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="price-low">Price (Low → High)</option>
                <option value="price-high">Price (High → Low)</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="website">Website</option>
                <option value="relevance">Relevance (Match Score)</option>
              </select>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all' as FilterOption, label: 'All' },
                { key: 'under-20k' as FilterOption, label: 'Under ₹20,000' },
                { key: '20k-40k' as FilterOption, label: '₹20k – ₹40k' },
                { key: 'amazon' as FilterOption, label: 'Amazon Only' },
                { key: 'flipkart' as FilterOption, label: 'Flipkart Only' },
                { key: 'gem' as FilterOption, label: 'GeM Only' },
                { key: 'snapdeal' as FilterOption, label: 'Snapdeal Only' },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => toggleFilter(filter.key)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${filters.has(filter.key)
                      ? 'bg-gray-900 text-white border border-black'
                      : 'bg-white text-gray-700 border border-black hover:border-gray-800'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {processedResults.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedResults).map(([site, products]) => (
              <WebsiteSection
                key={site}
                site={site}
                products={products}
                isBestPrice={isBestPrice}
                getMatchScore={getMatchScore}
                selectedProducts={selectedProducts}
                onSelectProduct={handleSelectProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">No results found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Comparison Drawer */}
        <ComparisonDrawer
          products={selectedProductsList}
          isOpen={selectedProductsList.length >= 1 && !showComparisonTable}
          onClose={() => setSelectedProducts(new Set())}
          onClear={() => setSelectedProducts(new Set())}
          onOpenTable={() => setShowComparisonTable(true)}
        />

        {/* Comparison Table Modal */}
        {showComparisonTable && (
          <ComparisonTable
            products={selectedProductsList}
            getMatchScore={getMatchScore}
            onRemove={handleRemoveProduct}
            onClear={() => {
              setSelectedProducts(new Set());
              setShowComparisonTable(false);
            }}
            onClose={() => setShowComparisonTable(false)}
          />
        )}

        {/* Back to Top */}
        <BackToTop />
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen py-12 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-light text-gray-900">Loading...</h1>
            </div>
            <ShimmerSkeleton />
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
