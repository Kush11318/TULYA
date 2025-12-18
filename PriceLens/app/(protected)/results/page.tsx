'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { comparePrices } from '@/app/actions';
import type { ProductResult } from '@/server/scrapers/utils';
import SearchBar from '@/app/components/SearchBar';
import WebsiteSection from '@/app/components/WebsiteSection';
import ComparisonDrawer from '@/app/components/ComparisonDrawer';
import ComparisonTable from '@/app/components/ComparisonTable';
import ShimmerSkeleton from '@/app/components/ShimmerSkeleton';
import BackToTop from '@/app/components/BackToTop';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import { addSearchToHistory } from '@/app/components/History';

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'alphabetical' | 'website' | 'rating';
type FilterOption =
  | 'all'
  | 'under-20k'
  | '20k-40k'
  | 'amazon'
  | 'flipkart'
  | 'gem'
  | 'snapdeal'
  | 'meesho';

type SiteFilter = 'All' | 'Amazon' | 'Flipkart' | 'GeM' | 'Snapdeal' | 'Meesho';

interface Intent {
  tokens: string[];
  brand?: string;
  modelTokens: string[];
}

const NEGATIVE_KEYWORDS = [
  'cover',
  'back cover',
  'case',
  'pouch',
  'screen guard',
  'tempered glass',
  'glass',
  'protector',
  'skin',
  'accessory',
  'accessories',
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseIntent(query: string): Intent {
  const normalised = normalise(query);
  const tokens = normalised.split(' ').filter(Boolean);

  const knownBrands = ['apple', 'samsung', 'oneplus', 'redmi', 'xiaomi', 'vivo', 'oppo', 'realme', 'poco', 'motorola'];
  const brand = tokens.find((t) => knownBrands.includes(t));

  const modelTokens =
    brand != null ? tokens.filter((t) => t !== brand && !/^(mobile|phone|smartphone)$/.test(t)) : tokens;

  return { tokens, brand, modelTokens };
}

function isAccessory(title: string): boolean {
  const t = normalise(title);
  return NEGATIVE_KEYWORDS.some((kw) => t.includes(kw));
}

function scoreProduct(intent: Intent, product: ProductResult): number {
  if (!product.title) return 0;
  if (isAccessory(product.title)) return 0;

  const title = normalise(product.title);
  const titleTokens = new Set(title.split(' '));

  let score = 0;

  if (intent.brand && title.includes(intent.brand)) {
    score += 35;
  }

  let modelMatches = 0;
  intent.modelTokens.forEach((t) => {
    if (titleTokens.has(t)) {
      modelMatches += 1;
    }
  });

  if (intent.modelTokens.length) {
    score += (modelMatches / intent.modelTokens.length) * 50;
  }

  const looseMatches = intent.tokens.filter((t) => title.includes(t)).length;
  score += Math.min(15, looseMatches * 3);

  return Math.min(100, Math.round(score));
}

function normaliseAndScoreResults(query: string, data: ProductResult[]): ProductResult[] {
  const intent = parseIntent(query);

  const scored = data.map((product) => {
    const relevanceScore = scoreProduct(intent, product);
    return { ...product, relevanceScore };
  });

  // filter out accessories / low relevance
  const filtered = scored.filter((p) => (p.relevanceScore ?? 0) >= 25);

  return filtered;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<Set<FilterOption>>(new Set(['all']));
  const [siteFilter, setSiteFilter] = useState<SiteFilter>('All');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
          const normalized = normaliseAndScoreResults(query, data);
          setResults(normalized);
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

  const getMatchScore = (product: ProductResult): number =>
    typeof product.relevanceScore === 'number' ? product.relevanceScore : 0;

  // Filter and sort products
  const processedResults = useMemo(() => {
    let filtered = [...results];

    // Site segmented control
    if (siteFilter !== 'All') {
      filtered = filtered.filter((product) => product.site === siteFilter);
    }

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
        if (filters.has('meesho') && product.site !== 'Meesho') return false;
        
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
        case 'rating': {
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return ratingB - ratingA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, sortBy, filters, siteFilter]);

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

  // Best price per site
  const minPriceBySite = useMemo(() => {
    const map: Record<string, number> = {};
    processedResults.forEach((p) => {
      const priceNum = parseInt(String(p.price || '0').replace(/[^\d]/g, '')) || Infinity;
      if (!map[p.site] || priceNum < map[p.site]) {
        map[p.site] = priceNum;
      }
    });
    return map;
  }, [processedResults]);

  const isBestPrice = (product: ProductResult): boolean => {
    const priceNum = parseInt(String(product.price || '0').replace(/[^\d]/g, '')) || Infinity;
    const minForSite = minPriceBySite[product.site];
    return priceNum === minForSite && priceNum !== Infinity;
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
      <main className="page-fade-in min-h-[calc(100vh-56px)] bg-slate-50/80 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">Searching…</h1>
            <DarkModeToggle />
          </div>
          <ShimmerSkeleton />
        </div>
      </main>
    );
  }

  if (error && results.length === 0 && !isLoading) {
    return (
      <main className="page-fade-in flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50/80 px-4 py-10">
        <div className="max-w-md text-center">
          <p className="mb-4 text-lg text-slate-800">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="rounded-full border border-sky-500 bg-sky-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-sky-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            Try another search
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-fade-in min-h-[calc(100vh-56px)] bg-slate-50/80 px-4 py-10 pb-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-semibold text-slate-900">
              Results for: <span className="font-normal">{query}</span>
            </h1>
            <p className="text-sm text-slate-500">
              {processedResults.length} product{processedResults.length === 1 ? '' : 's'} found
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-sky-400 hover:text-sky-700"
            >
              New Search
            </button>
            <DarkModeToggle />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <SearchBar onSearch={handleSearch} initialValue={query} />
        </div>

        {/* Controls */}
        {results.length > 0 && (
          <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            {/* Site Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['All', 'Amazon', 'Flipkart', 'GeM', 'Snapdeal', 'Meesho'] as SiteFilter[]).map(
                (site) => (
                  <button
                    key={site}
                    type="button"
                    onClick={() => setSiteFilter(site)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-150 ${
                      siteFilter === site
                        ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'
                    }`}
                  >
                    {site}
                  </button>
                ),
              )}
            </div>
            {/* Sorting & view */}
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                  <option value="relevance">Relevance</option>
                <option value="price-low">Price (Low → High)</option>
                <option value="price-high">Price (High → Low)</option>
                  <option value="rating">Rating</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="website">Website</option>
              </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">View:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-full px-3 py-1 font-medium ${
                    viewMode === 'list'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-700'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-full px-3 py-1 font-medium ${
                    viewMode === 'grid'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-700'
                  }`}
                >
                  Grid
                </button>
              </div>
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
                { key: 'meesho' as FilterOption, label: 'Meesho Only' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => toggleFilter(filter.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 ${
                    filters.has(filter.key)
                      ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'
                  }`}
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
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-slate-500">No results found. Try adjusting your filters.</p>
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
        <main className="page-fade-in min-h-[calc(100vh-56px)] bg-slate-50/80 px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-slate-900">Loading…</h1>
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
