"use server";

import { getBrowser } from './browser';
import { ProductResult } from './utils';

export async function scrapeGeM(query: string): Promise<ProductResult[]> {
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

    const url = `https://mkp.gem.gov.in/search?q=${encodeURIComponent(query)}`;
    console.log(`🔍 GeM: Searching for "${query}"`);

    // Navigate the page - use domcontentloaded for faster loading
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
    } catch (error) {
      console.log('⚠️ GeM: Navigation timeout, trying with load event');
      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 45000,
        });
      } catch (e2) {
        console.error('❌ GeM: Failed to load page');
        return [];
      }
    }

    // Wait for page to load - GeM uses Angular/React so needs more time
    await new Promise(resolve => setTimeout(resolve, 5000));

    const products = await page.evaluate(() => {
      const items: Array<{site: string; title: string; price: string; image: string; link: string; rating?: number}> = [];

      // GeM uses various selectors - try all of them
      let productElements: NodeListOf<Element> | Element[] = [];
      
      // Method 1: Standard product items
      productElements = document.querySelectorAll('div.product-item, div.mat-card, .product-card');
      
      // Method 2: Angular Material cards
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('mat-card, .mat-card');
      }
      
      // Method 3: Find by product links
      if (productElements.length === 0) {
        const links = document.querySelectorAll('a[href*="/product/"], a[href*="/p/"]');
        productElements = Array.from(links).map(link => {
          let parent = link.closest('div');
          if (!parent) parent = link.closest('mat-card');
          if (!parent) parent = link.closest('.card');
          return parent || link.parentElement;
        }).filter(Boolean) as Element[];
      }

      // Method 4: Find any card-like containers with product info
      if (productElements.length === 0) {
        productElements = Array.from(document.querySelectorAll('div[class*="card"], div[class*="item"]')).filter(el => {
          const hasLink = el.querySelector('a[href*="/product/"], a[href*="/p/"]');
          const hasTitle = el.querySelector('h3, h4, [class*="title"]');
          return hasLink && hasTitle;
        });
      }

      const products = Array.from(productElements).slice(0, 10);

      for (const element of products) {
        if (!element) continue;

        // Find the product link first
        const linkEl = element.querySelector('a[href*="/product/"], a[href*="/p/"]') as HTMLAnchorElement;
        if (!linkEl) {
          // If no link in element, try parent
          const parent = element.closest('div');
          if (parent) {
            const parentLink = parent.querySelector('a[href*="/product/"], a[href*="/p/"]') as HTMLAnchorElement;
            if (parentLink) {
              // Extract from parent
              let titleEl = element.querySelector('.product-title, [class*="title"], h3, h4') as HTMLElement;
              if (!titleEl) titleEl = parent.querySelector('.product-title, [class*="title"], h3, h4') as HTMLElement;
              const title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || '';
              
              // Clean up title
              let cleanTitle = title;
              if (cleanTitle) {
                cleanTitle = cleanTitle
                  .replace(/Add to Cart/gi, '')
                  .replace(/Buy Now/gi, '')
                  .replace(/View Details/gi, '')
                  .replace(/\s+/g, ' ')
                  .trim();
              }
              
              if (cleanTitle && cleanTitle.length >= 10) {
                let priceEl = element.querySelector('.price, [class*="price"], [class*="amount"]') as HTMLElement;
                if (!priceEl) priceEl = parent.querySelector('.price, [class*="price"], [class*="amount"]') as HTMLElement;
                const priceText = priceEl?.innerText?.trim() || priceEl?.textContent?.trim() || '';
                
                let price = 'Price not available';
                if (priceText) {
                  const priceNum = priceText.replace(/[^\d]/g, '');
                  if (priceNum && priceNum.length > 0) {
                    price = `₹${priceNum}`;
                  }
                }
                
                if (price === 'Price not available') continue;
                
                let imgEl = element.querySelector('img') as HTMLImageElement;
                if (!imgEl) imgEl = parent.querySelector('img') as HTMLImageElement;
                const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || '';
                
                let link = parentLink.href || parentLink.getAttribute('href') || '';
                if (link && !link.startsWith('http')) {
                  link = `https://mkp.gem.gov.in${link}`;
                }
                
                // Remove tracking parameters
                if (link.includes('?')) {
                  link = link.split('?')[0];
                }
                
                if (cleanTitle && cleanTitle.length >= 10 && price !== 'Price not available') {
                  items.push({
                    site: 'GeM',
                    title: cleanTitle.substring(0, 200),
                    price,
                    image,
                    link,
                  });
                }
              }
              continue;
            }
          }
          continue;
        }

        // Extract title - improved with noise filtering
        let titleEl = element.querySelector('.product-title') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('[class*="title"]') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h3, h4, h5') as HTMLElement;
        if (!titleEl) titleEl = linkEl as HTMLElement;
        let title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || linkEl.innerText?.trim() || '';

        // Clean up title - remove noise text
        if (title) {
          title = title
            .replace(/Add to Cart/gi, '')
            .replace(/Buy Now/gi, '')
            .replace(/Wishlist/gi, '')
            .replace(/Compare/gi, '')
            .replace(/Currently unavailable/gi, '')
            .replace(/View Details/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Skip if title is too short or contains only unwanted text
        if (!title || title.length < 10) continue;
        
        // Skip if title looks like button text
        if (title.toLowerCase().includes('add to') || 
            title.toLowerCase().includes('buy now') ||
            title.toLowerCase().includes('view details')) continue;

        // Extract price - try multiple selectors
        let priceEl = element.querySelector('.price') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="price"]') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="amount"]') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="cost"]') as HTMLElement;
        const priceText = priceEl?.innerText?.trim() || priceEl?.textContent?.trim() || '';
        
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

        // Extract image - try multiple selectors
        let imgEl = element.querySelector('img') as HTMLImageElement;
        if (!imgEl) {
          const parent = element.closest('div');
          if (parent) imgEl = parent.querySelector('img') as HTMLImageElement;
        }
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.getAttribute('srcset')?.split(' ')[0] || '';

        // Extract link - clean up tracking parameters
        let link = linkEl.href || linkEl.getAttribute('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://mkp.gem.gov.in${link}`;
        }
        
        // Remove tracking parameters
        if (link.includes('?')) {
          link = link.split('?')[0];
        }

        // Skip if no valid link
        if (!link || link === 'https://mkp.gem.gov.in/') continue;

        // Only add products with valid title (at least 10 chars) and price
        if (title && title.length >= 10 && price !== 'Price not available') {
          items.push({
            site: 'GeM',
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

    console.log(`✅ GeM: Found ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ GeM scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}
