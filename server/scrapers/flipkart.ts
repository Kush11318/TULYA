"use server";

import { getBrowser } from './browser';
import { ProductResult } from './utils';

export async function scrapeFlipkart(query: string): Promise<ProductResult[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set screen size
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Allow images but block fonts/media for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      // Block fonts and media, but allow images
      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else if (url.includes('analytics') || url.includes('tracking')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    console.log(`🔍 Flipkart: Searching for "${query}"`);

    // Navigate the page to a URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait longer for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    const products = await page.evaluate(() => {
      const items: Array<{ site: string; title: string; price: string; image: string; link: string }> = [];

      // Find ALL product links first - this is the most reliable method
      const allProductLinks = document.querySelectorAll('a[href*="/p/"]');

      // Get unique product containers
      const seenLinks = new Set<string>();
      const productContainers: Element[] = [];

      for (const link of Array.from(allProductLinks).slice(0, 20)) {
        const href = (link as HTMLAnchorElement).href;
        if (seenLinks.has(href)) continue;
        seenLinks.add(href);

        // Find the container for this product
        let container = link.closest('div[data-id]');
        if (!container) {
          // Try to find parent div with product-like structure
          let parent = link.parentElement;
          let depth = 0;
          while (parent && depth < 5) {
            if (parent.tagName === 'DIV' && (
              parent.querySelector('img') ||
              parent.getAttribute('data-id') ||
              parent.className.includes('col-')
            )) {
              container = parent;
              break;
            }
            parent = parent.parentElement;
            depth++;
          }
        }
        if (container) {
          productContainers.push(container);
        } else {
          // If no container found, use the link's parent
          productContainers.push(link.parentElement || link);
        }
      }

      for (const container of productContainers.slice(0, 10)) {
        if (!container) continue;

        // Find the product link
        const linkEl = container.querySelector('a[href*="/p/"]') as HTMLAnchorElement;
        if (!linkEl) continue;

        // Extract title - try ALL possible methods
        let title = '';

        // Method 1: Look for title in common class patterns
        const titleSelectors = [
          '._4rR01T',
          '.s1Q9rs',
          '._2WkVRV',
          '[class*="title"]',
          'h3',
          'h4',
          'span[class*="title"]',
          'div[class*="title"]'
        ];

        for (const selector of titleSelectors) {
          const titleEl = container.querySelector(selector) as HTMLElement;
          if (titleEl) {
            title = titleEl.innerText?.trim() || titleEl.textContent?.trim() || '';
            if (title && title.length > 3) break;
          }
        }

        // Method 2: Get from link title attribute
        if (!title && linkEl.hasAttribute('title')) {
          title = linkEl.getAttribute('title') || '';
        }

        // Method 3: Get from link text
        if (!title) {
          title = linkEl.innerText?.trim() || linkEl.textContent?.trim() || '';
        }

        // Method 4: Get from any text in container
        if (!title || title.length < 3) {
          const containerEl = container as HTMLElement;
          const allText = containerEl.innerText || containerEl.textContent || '';
          const lines = allText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 3);
          if (lines.length > 0) {
            title = lines[0];
          }
        }


        // Clean up title
        title = title
          .replace(/Add to Compare/gi, '')
          .replace(/Ratings & Reviews/gi, '')
          .replace(/^\s*[\d,.]+\s*/, '') // Remove leading numbers/stats sometimes captured
          .trim();

        if (!title || title.length < 3) continue;

        // Extract price - try ALL possible selectors
        let priceText = '';
        const priceSelectors = [
          '._30jeq3',
          '._25b18c',
          '._1_WHN1',
          '[class*="price"]',
          'div[class*="Price"]',
          'span[class*="price"]'
        ];

        for (const selector of priceSelectors) {
          const priceEl = container.querySelector(selector) as HTMLElement;
          if (priceEl) {
            priceText = priceEl.innerText?.trim() || priceEl.textContent?.trim() || '';
            if (priceText && priceText.includes('₹')) break;
          }
        }

        // If no price found, try to extract from any text containing ₹
        if (!priceText) {
          const containerEl = container as HTMLElement;
          const containerText = containerEl.innerText || containerEl.textContent || '';
          const priceMatch = containerText.match(/₹[\d,]+/);
          if (priceMatch) {
            priceText = priceMatch[0];
          }
        }

        const price = priceText ? `₹${priceText.replace(/[^\d]/g, '')}` : 'Price not available';

        // Extract image - try ALL possible selectors
        let imgEl: HTMLImageElement | null = null;
        const imageSelectors = [
          'img._396cs4',
          'img._2r_T1I',
          'img._1BweB8',
          'img[src*="flipkart"]',
          'img[data-src]',
          'img'
        ];

        for (const selector of imageSelectors) {
          imgEl = container.querySelector(selector) as HTMLImageElement;
          if (imgEl && imgEl.src) break;
        }

        const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.getAttribute('srcset')?.split(' ')[0] || '';

        // Extract link
        let link = linkEl.href || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.flipkart.com${link}`;
        }

        if (title && price !== 'Price not available') {
          items.push({
            site: 'Flipkart',
            title: title.substring(0, 200),
            price,
            image,
            link,
          });
        }
      }

      return items;
    });

    console.log(`✅ Flipkart: Found ${products.length} products`);
    if (products.length === 0) {
      console.log('⚠️ Flipkart: No products found - page structure may have changed');
    }
    return products;
  } catch (error) {
    console.error('❌ Flipkart scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}
