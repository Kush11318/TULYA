"use server";

import { scrapeAmazon } from './amazon';
import { scrapeFlipkart } from './flipkart';
import { scrapeGeM } from './gem';
import { scrapeSnapdeal } from './snapdeal';
import { scrapeMeesho } from './meesho';
import { ProductResult } from './utils';

export async function runAllScrapers(query: string): Promise<ProductResult[]> {
  console.log(`🚀 Starting scraping for: "${query}"`);

  // Run all scrapers in parallel (each uses its own page, so no conflict)
  const results = await Promise.allSettled([
    scrapeAmazon(query),
    scrapeFlipkart(query),
    scrapeGeM(query),
    scrapeSnapdeal(query),
    scrapeMeesho(query),
  ]);

  // Flatten all results and filter valid products
  const allProducts: ProductResult[] = [];

  results.forEach((result, index) => {
    const sites = ['Amazon', 'Flipkart', 'GeM', 'Snapdeal', 'Meesho'];
    if (result.status === 'fulfilled') {
      const products = result.value;
      console.log(`✅ ${sites[index]}: Found ${products.length} products`);
      allProducts.push(...products);
    } else {
      const error = result.reason;
      console.error(`❌ ${sites[index]} failed:`, error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error(`   Stack: ${error.stack.substring(0, 200)}`);
      }
    }
  });

  // Filter valid products (must have title and price)
  const validProducts = allProducts.filter(
    (p) => p && p.title && p.price && p.price !== 'Price not available'
  );

  // Sort by price (numeric, ascending)
  validProducts.sort((a, b) => {
    const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || Infinity;
    const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || Infinity;
    return priceA - priceB;
  });

  console.log(`📊 Total: ${validProducts.length} valid products from ${allProducts.length} found`);

  return validProducts;
}
