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

    // Navigate the page - use domcontentloaded for faster loading
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
    } catch (error) {
      console.log('⚠️ Amazon: Navigation timeout, trying with load event');
      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 45000,
        });
      } catch (e2) {
        console.error('❌ Amazon: Failed to load page');
        return [];
      }
    }

    // Wait for product results with multiple fallback selectors
    let productsFound = false;
    const selectors = [
      'div.s-result-item[data-component-type="s-search-result"]',
      'div[data-asin]:not([data-asin=""])',
      '.s-result-item',
      '[data-component-type="s-search-result"]',
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        productsFound = true;
        break;
      } catch (e) {
        continue;
      }
    }

    // Add delay to ensure dynamic content loads
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Extract up to 10 products
    const products = await page.evaluate(() => {
      const items: Array<{ site: string; title: string; price: string; image: string; link: string; rating?: number }> = [];

      // Try multiple selectors - improved order
      let productElements: NodeListOf<Element> | Element[] = [];
      
      // Method 1: Standard search results
      productElements = document.querySelectorAll('div.s-result-item[data-component-type="s-search-result"]');
      
      // Method 2: Any element with data-asin (product ID)
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('[data-asin]:not([data-asin=""])');
      }
      
      // Method 3: Generic result items
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('.s-result-item');
      }
      
      // Method 4: Find by product links
      if (productElements.length === 0) {
        const links = document.querySelectorAll('a[href*="/dp/"], a[href*="/gp/product/"]');
        productElements = Array.from(links).map(link => {
          let container = link.closest('div[data-asin]') || 
                         link.closest('div.s-result-item') ||
                         link.closest('div[data-component-type="s-search-result"]');
          return container || link.parentElement;
        }).filter(Boolean) as Element[];
      }

      // Filter out invalid/sponsored items before processing
      const validElements = Array.from(productElements).filter(el => {
        if (!el) return false;
        
        // Skip sponsored/ads
        const isSponsored = el.querySelector('[data-component-type="sp-sponsored-result"]') !== null;
        const hasAdLabel = el.textContent?.toLowerCase().includes('sponsored') || 
                          el.textContent?.toLowerCase().includes('ad');
        if (isSponsored || hasAdLabel) return false;
        
        // Must have a product link
        const hasLink = el.querySelector('a[href*="/dp/"], a[href*="/gp/product/"]') !== null;
        return hasLink;
      });

      console.log(`📦 Amazon: Found ${validElements.length} valid product elements`);

      for (let i = 0; i < Math.min(10, validElements.length); i++) {
        const element = validElements[i];
        if (!element) continue;

        // Extract title - improved selectors that avoid button text
        let titleEl: HTMLElement | null = null;
        
        // Method 1: Look for h2 with class containing "title" or "heading"
        titleEl = element.querySelector('h2.a-size-mini a span.a-text-normal') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h2.a-size-mini span.a-text-normal') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h2 span.a-text-normal') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h2 a span') as HTMLElement;
        
        // Method 2: Get from h2 link directly (more reliable)
        if (!titleEl) {
          const h2Link = element.querySelector('h2 a') as HTMLAnchorElement;
          if (h2Link) {
            // Get the first span inside the link, or use link text
            titleEl = h2Link.querySelector('span') as HTMLElement || h2Link;
          }
        }
        
        // Method 3: Fallback to any h2
        if (!titleEl) titleEl = element.querySelector('h2') as HTMLElement;

        let title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || '';

        // Clean up title - remove common unwanted text
        if (title) {
          // Remove "Currently unavailable", "Add to Compare", etc.
          title = title
            .replace(/Currently unavailable/gi, '')
            .replace(/Add to Compare/gi, '')
            .replace(/Add to Cart/gi, '')
            .replace(/Buy Now/gi, '')
            .replace(/See more/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Skip if title is too short or contains only unwanted text
        if (!title || title.length < 10) continue;
        
        // Skip if title looks like it's just button text
        if (title.toLowerCase().includes('add to') || title.toLowerCase().includes('currently')) continue;

        // Extract price - try multiple selectors
        let price = 'Price not available';
        const priceSelectors = [
          '.a-price-whole',
          '.a-price .a-offscreen',
          '.a-price-range .a-offscreen',
          '[data-a-color="price"] .a-offscreen',
          '.a-price-symbol + .a-price-whole',
        ];

        for (const selector of priceSelectors) {
          const priceEl = element.querySelector(selector) as HTMLElement;
          if (priceEl) {
            const priceText = priceEl.innerText || priceEl.textContent || '';
            const match = priceText.match(/₹?\s*([\d,]+(?:\.\d{2})?)/);
            if (match) {
              const priceNum = match[1].replace(/,/g, '');
              price = `₹${priceNum}`;
              break;
            }
          }
        }

        // Fallback: look for price in whole + fraction format
        if (price === 'Price not available') {
          const wholePriceEl = element.querySelector('.a-price-whole') as HTMLElement;
          const fractionPriceEl = element.querySelector('.a-price-fraction') as HTMLElement;
          if (wholePriceEl) {
            const wholePrice = wholePriceEl.innerText?.replace(/[^\d]/g, '') || '';
            const fractionPrice = fractionPriceEl?.innerText?.replace(/[^\d]/g, '') || '';
            if (wholePrice) {
              price = fractionPrice ? `₹${wholePrice}.${fractionPrice}` : `₹${wholePrice}`;
            }
          }
        }

        // Final fallback: search entire element text for price pattern
        if (price === 'Price not available') {
          const elementText = (element as HTMLElement).innerText || '';
          const priceMatch = elementText.match(/₹\s*([\d,]+(?:\.\d{2})?)/);
          if (priceMatch) {
            const priceNum = priceMatch[1].replace(/,/g, '');
            price = `₹${priceNum}`;
          }
        }

        // Extract image - try multiple selectors
        let imgEl = element.querySelector('img.s-image') as HTMLImageElement;
        if (!imgEl) imgEl = element.querySelector('img[data-image-latency]') as HTMLImageElement;
        if (!imgEl) imgEl = element.querySelector('img') as HTMLImageElement;
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || '';

        // Extract link - prioritize product page links, avoid compare/cart links
        let linkEl: HTMLAnchorElement | null = null;
        
        // Method 1: Get link from h2 (most reliable for product page)
        linkEl = element.querySelector('h2 a') as HTMLAnchorElement;
        
        // Method 2: Look for product link (contains /dp/ or /gp/product/)
        if (!linkEl || !linkEl.href.includes('/dp/') && !linkEl.href.includes('/gp/product/')) {
          const allLinks = element.querySelectorAll('a');
          for (const a of Array.from(allLinks)) {
            const href = a.getAttribute('href') || '';
            if (href.includes('/dp/') || href.includes('/gp/product/')) {
              linkEl = a as HTMLAnchorElement;
              break;
            }
          }
        }
        
        // Method 3: Fallback to any link
        if (!linkEl) linkEl = element.querySelector('a.a-link-normal') as HTMLAnchorElement;
        if (!linkEl) linkEl = element.querySelector('a') as HTMLAnchorElement;

        let link = linkEl?.getAttribute('href') || linkEl?.href || '';

        // Clean up link - remove tracking parameters
        if (link.includes('?')) {
          link = link.split('?')[0];
        }
        
        // Handle relative URLs
        if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) {
            link = `https://www.amazon.in${link}`;
          } else {
            link = `https://www.amazon.in/${link}`;
          }
        }
        
        // Skip if no valid link
        if (!link || link === 'https://www.amazon.in/') continue;

        // Extract rating if available
        let rating: number | undefined;
        const ratingSelectors = [
          '.a-icon-alt',
          '[aria-label*="stars"]',
          '.a-star-icon',
          'i.a-icon-star',
        ];
        for (const selector of ratingSelectors) {
          const ratingEl = element.querySelector(selector) as HTMLElement;
          if (ratingEl) {
            const ratingText = ratingEl.innerText || ratingEl.textContent || ratingEl.getAttribute('aria-label') || '';
            const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(?:out of|stars?)/i);
            if (ratingMatch) {
              const ratingVal = parseFloat(ratingMatch[1]);
              if (!isNaN(ratingVal) && ratingVal >= 0 && ratingVal <= 5) {
                rating = ratingVal;
                break;
              }
            }
          }
        }

        // Only add products with valid title (at least 10 chars) and price
        if (title && title.length >= 10 && price !== 'Price not available') {
          items.push({
            site: 'Amazon',
            title: title.substring(0, 200), // Limit title length
            price,
            image,
            link,
            rating,
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

