'use server';

import type { ProductResult } from '@/server/scrapers/utils';

// Test mode - returns mock data to verify UI works
const TEST_MODE = process.env.TEST_MODE === 'true';

function getMockData(productName: string): ProductResult[] {
  return [
    {
      site: 'Amazon',
      title: `Mock ${productName} - Test Product from Amazon`,
      price: '₹9,999',
      image: 'https://via.placeholder.com/300x300?text=Product+Image',
      link: 'https://www.amazon.in',
    },
    {
      site: 'GeM',
      title: `Mock ${productName} - Test Product from GeM`,
      price: '₹7,999',
      image: 'https://via.placeholder.com/300x300?text=Product+Image',
      link: 'https://mkp.gem.gov.in',
    },
  ];
}

export async function comparePrices(productName: string): Promise<ProductResult[]> {
  if (!productName || productName.trim().length === 0) {
    return [];
  }

  // Test mode - return mock data
  if (TEST_MODE) {
    console.log('🧪 TEST MODE: Returning mock data');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getMockData(productName);
  }

  // No API key needed - using Puppeteer!

  console.log(`🔍 Starting price comparison for: "${productName}"`);

  try {
    // Use Puppeteer scrapers - no API keys needed!
    const { runAllScrapers } = await import("@/server/scrapers/scraper");
    const items = await runAllScrapers(productName);
    return items;
  } catch (error) {
    // If we get an API limit error, automatically switch to test mode
    if (error instanceof Error && error.message.includes('limit reached')) {
      console.log('⚠️  API limit reached, switching to test mode');
      return getMockData(productName);
    }
    console.error('💥 Fatal error in comparePrices:', error);
    throw error;
  }
}

// New function to retry a specific scraper
export async function retryScraper(site: string, productName: string): Promise<ProductResult | null> {
  if (!productName || productName.trim().length === 0) {
    return null;
  }

  // No API key needed - using Puppeteer!

  try {
    let result: ProductResult | null = null;

    switch (site) {
      case 'Amazon': {
        const { scrapeAmazon } = await import('@/server/scrapers/amazon');
        const results = await scrapeAmazon(productName);
        result = results[0] || null;
        break;
      }
      case 'Flipkart': {
        const { scrapeFlipkart } = await import('@/server/scrapers/flipkart');
        const results = await scrapeFlipkart(productName);
        result = results[0] || null;
        break;
      }
      case 'GeM': {
        const { scrapeGeM } = await import('@/server/scrapers/gem');
        const results = await scrapeGeM(productName);
        result = results[0] || null;
        break;
      }
      case 'Snapdeal': {
        const { scrapeSnapdeal } = await import('@/server/scrapers/snapdeal');
        const results = await scrapeSnapdeal(productName);
        result = results[0] || null;
        break;
      }

      default:
        return null;
    }

    return result;
  } catch (error) {
    console.error(`Error retrying ${site}:`, error);
    return { site, title: '', price: '', image: '', link: '', invalid: true, blocked: true };
  }
}
