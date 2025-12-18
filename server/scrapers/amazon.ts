"use server";

import { getBrowser } from './browser';
import { ProductResult } from './utils';

export async function scrapeAmazon(query: string): Promise<ProductResult[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set screen size
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Allow images but block fonts/media for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      // Block fonts and media, but allow images for product images
      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else if (url.includes('analytics') || url.includes('tracking') || url.includes('advertising')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    console.log(`🔍 Amazon: Searching for "${query}"`);

    // Navigate the page to a URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for product results with multiple fallback selectors
    try {
      await page.waitForSelector('div.s-result-item[data-component-type="s-search-result"]', {
        timeout: 15000,
      });
    } catch (e) {
      // Try alternative selector
      try {
        await page.waitForSelector('.s-result-item, [data-asin]', { timeout: 5000 });
      } catch (e2) {
        console.log('⚠️ Amazon: No products found with standard selectors');
      }
    }

    // Add small delay to ensure page is fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract up to 10 products
    const products = await page.evaluate(() => {
      const items: Array<{ site: string; title: string; price: string; image: string; link: string }> = [];

      // Try multiple selectors
      let productElements = document.querySelectorAll('div.s-result-item[data-component-type="s-search-result"]');
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('.s-result-item');
      }
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('[data-asin]:not([data-asin=""])');
      }

      for (let i = 0; i < Math.min(10, productElements.length); i++) {
        const element = productElements[i];

        // Extract title - try multiple selectors
        let titleEl = element.querySelector('h2 a span') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h2 span') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h2 a') as HTMLElement;
        const title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || '';

        if (!title || title.length < 3) continue;

        // Extract price - try multiple selectors
        let wholePriceEl = element.querySelector('.a-price-whole') as HTMLElement;
        let fractionPriceEl = element.querySelector('.a-price-fraction') as HTMLElement;
        if (!wholePriceEl) {
          const priceEl = element.querySelector('.a-price .a-offscreen') as HTMLElement;
          if (priceEl) {
            const priceText = priceEl.innerText || priceEl.textContent || '';
            const match = priceText.match(/[\d,]+/);
            if (match) {
              wholePriceEl = { innerText: match[0] } as HTMLElement;
            }
          }
        }
        const wholePrice = wholePriceEl?.innerText?.replace(/[^\d]/g, '') || '';
        const fractionPrice = fractionPriceEl?.innerText?.replace(/[^\d]/g, '') || '';
        const price = wholePrice && fractionPrice
          ? `₹${wholePrice}.${fractionPrice}`
          : wholePrice
            ? `₹${wholePrice}`
            : 'Price not available';

        // Extract image - try multiple selectors
        let imgEl = element.querySelector('img.s-image') as HTMLImageElement;
        if (!imgEl) imgEl = element.querySelector('img[data-image-latency]') as HTMLImageElement;
        if (!imgEl) imgEl = element.querySelector('img') as HTMLImageElement;
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || '';

        // Extract link
        let linkEl = element.querySelector('h2 a') as HTMLAnchorElement;
        if (!linkEl) linkEl = element.querySelector('a.a-link-normal') as HTMLAnchorElement;
        if (!linkEl) linkEl = element.querySelector('a') as HTMLAnchorElement;

        let link = linkEl?.getAttribute('href') || '';

        // Handle relative URLs
        if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) {
            link = `https://www.amazon.in${link}`;
          } else {
            link = `https://www.amazon.in/${link}`;
          }
        }

        if (title && price !== 'Price not available') {
          items.push({
            site: 'Amazon',
            title,
            price,
            image,
            link,
          });
        }
      }

      return items;
    });

    console.log(`✅ Amazon: Found ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ Amazon scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}

