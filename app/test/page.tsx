'use client';

import { useState } from 'react';
import { comparePrices } from '@/app/actions';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('laptop');

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await comparePrices(productName);
      setResult({ success: true, data, count: data.length });
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    setLoading(true);
    setResult(null);
    try {
      const testUrl = `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
      const response = await fetch(`/debug?url=${encodeURIComponent(testUrl)}&site=amazon`);
      const debugData = await response.json();
      setResult(debugData);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-light mb-8">PriceLens - Test Page</h1>
        
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            className="w-full px-4 py-2 border border-black rounded-sm"
          />
          <div className="flex gap-4">
            <button
              onClick={handleTest}
              disabled={loading}
              className="px-6 py-2 border border-black rounded-sm bg-white text-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API'}
            </button>
            <button
              onClick={handleDebug}
              disabled={loading}
              className="px-6 py-2 border border-black rounded-sm bg-white text-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Debugging...' : 'Debug HTML'}
            </button>
          </div>
        </div>

        {result && (
          <div className="border border-black rounded-sm p-6">
            <h2 className="text-xl font-medium mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded-sm overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}

