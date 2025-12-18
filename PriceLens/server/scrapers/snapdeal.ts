"use server";

import { getBrowser } from './browser';
import { ProductResult } from './utils';

export async function scrapeSnapdeal(query: string): Promise<ProductResult[]> {
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

    const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}`;
    console.log(`🔍 Snapdeal: Searching for "${query}"`);

    // Navigate the page - use domcontentloaded for faster loading
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
    } catch (error) {
      console.log('⚠️ Snapdeal: Navigation timeout, trying with load event');
      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 45000,
        });
      } catch (e2) {
        console.error('❌ Snapdeal: Failed to load page');
        return [];
      }
    }

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to wait for products with fallback
    try {
      await page.waitForSelector('div.product-tuple-listing, div.product-tuple, [class*="product"]', {
        timeout: 10000,
      });
    } catch (e) {
      console.log('⚠️ Snapdeal: Waiting for products...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const products = await page.evaluate(() => {
      const items: Array<{site: string; title: string; price: string; image: string; link: string; rating?: number}> = [];
      
      // Try multiple selectors to find products
      let productElements: NodeListOf<Element> | Element[] = [];
      
      // Method 1: Standard product tuple
      productElements = document.querySelectorAll('div.product-tuple-listing');
      
      // Method 2: Alternative product tuple
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('div.product-tuple');
      }
      
      // Method 3: Find by product links
      if (productElements.length === 0) {
        const links = document.querySelectorAll('a[href*="/product/"]');
        productElements = Array.from(links).map(link => {
          let container = link.closest('div.product-tuple-listing');
          if (!container) container = link.closest('div.product-tuple');
          if (!container) container = link.closest('div[class*="product"]');
          return container || link.parentElement;
        }).filter(Boolean) as Element[];
      }

      // Method 4: Find any div with product-like structure
      if (productElements.length === 0) {
        productElements = Array.from(document.querySelectorAll('div[class*="product"]')).filter(div => {
          const hasLink = div.querySelector('a[href*="/product/"]');
          const hasTitle = div.querySelector('p.product-title, [class*="title"]');
          return hasLink && hasTitle;
        });
      }

      const products = Array.from(productElements).slice(0, 10);

      for (const element of products) {
        if (!element) continue;

        // Extract title - improved with noise filtering
        let titleEl = element.querySelector('p.product-title') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('[class*="product-title"]') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('[class*="title"]') as HTMLElement;
        if (!titleEl) {
          const linkEl = element.querySelector('a[href*="/product/"]') as HTMLAnchorElement;
          if (linkEl) titleEl = linkEl as HTMLElement;
        }
        let title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || '';

        // Clean up title - remove noise text
        if (title) {
          title = title
            .replace(/Add to Cart/gi, '')
            .replace(/Buy Now/gi, '')
            .replace(/Wishlist/gi, '')
            .replace(/Compare/gi, '')
            .replace(/Currently unavailable/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Skip if title is too short or contains only unwanted text
        if (!title || title.length < 10) continue;
        
        // Skip if title looks like button text
        if (title.toLowerCase().includes('add to') || 
            title.toLowerCase().includes('buy now') ||
            title.toLowerCase().includes('currently unavailable')) continue;

        // Extract price - try multiple selectors
        let priceEl = element.querySelector('.product-price') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="product-price"]') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="price"]') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('span[class*="price"]') as HTMLElement;
        
        let priceText = priceEl?.innerText?.trim() || priceEl?.textContent?.trim() || '';
        
        // If no price found, try to extract from container text
        if (!priceText) {
          const elementEl = element as HTMLElement;
          const containerText = elementEl.innerText || elementEl.textContent || '';
          const priceMatch = containerText.match(/₹[\d,]+/);
          if (priceMatch) {
            priceText = priceMatch[0];
          }
        }
        
        let price = 'Price not available';
        if (priceText) {
          const priceNum = priceText.replace(/[^\d]/g, '');
          if (priceNum && priceNum.length > 0) {
            price = `₹${priceNum}`;
          }
        }

        // Skip if no valid price
        if (price === 'Price not available') continue;

        // Extract rating if available
        let rating: number | undefined;
        const ratingSelectors = [
          '[class*="rating"]',
          '[class*="Rating"]',
          '.ratings',
          '[data-rating]',
        ];
        for (const selector of ratingSelectors) {
          const ratingEl = element.querySelector(selector) as HTMLElement;
          if (ratingEl) {
            const ratingText = ratingEl.innerText || ratingEl.textContent || ratingEl.getAttribute('data-rating') || '';
            const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
            if (ratingMatch) {
              const ratingVal = parseFloat(ratingMatch[1]);
              if (!isNaN(ratingVal) && ratingVal >= 0 && ratingVal <= 5) {
                rating = ratingVal;
                break;
              }
            }
          }
        }

        // Extract image - try ALL possible selectors
        let imgEl: HTMLImageElement | null = null;
        const imageSelectors = [
          '.product-image img',
          '.picture-elem img',
          'img[src*="snapdeal"]',
          'img[data-src]',
          'img[data-lazy-src]',
          'img'
        ];

        for (const selector of imageSelectors) {
          imgEl = element.querySelector(selector) as HTMLImageElement;
          if (imgEl && (imgEl.src || imgEl.getAttribute('data-src'))) break;
        }

        const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.getAttribute('lazy-src') || imgEl?.getAttribute('srcset')?.split(' ')[0] || '';

        // Extract link - clean up tracking parameters
        const linkEl = element.querySelector('a[href*="/product/"]') as HTMLAnchorElement;
        let link = linkEl?.href || linkEl?.getAttribute('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.snapdeal.com${link}`;
        }
        
        // Remove tracking parameters
        if (link.includes('?')) {
          link = link.split('?')[0];
        }

        // Skip if no valid link
        if (!link || link === 'https://www.snapdeal.com/') continue;

        // Only add products with valid title (at least 10 chars) and price
        if (title && title.length >= 10 && price !== 'Price not available') {
          items.push({
            site: 'Snapdeal',
            title: title.substring(0, 200),
            price,
            image,
            link,
            rating,
          });
        }
      }

      return items;
    });

    console.log(`✅ Snapdeal: Found ${products.length} products`);
    if (products.length === 0) {
      console.log('⚠️ Snapdeal: No products found - page structure may have changed');
    }
    return products;
  } catch (error) {
    console.error('❌ Snapdeal scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}
