"use server";

import { getBrowser } from './browser';
import { ProductResult } from './utils';

export async function scrapeMeesho(query: string): Promise<ProductResult[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1440, height: 900 });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else if (url.includes('analytics') || url.includes('tracking')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
    console.log(`🔍 Meesho: Searching for "${query}"`);

    // Navigate the page - use domcontentloaded for faster loading
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
    } catch (error) {
      console.log('⚠️ Meesho: Navigation timeout, trying with load event');
      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 45000,
        });
      } catch (e2) {
        console.error('❌ Meesho: Failed to load page');
        return [];
      }
    }

    // Wait for products to load
    try {
      await page.waitForSelector('a[href*="/product/"], a[href*="/share"]', { timeout: 15000 });
    } catch (e) {
      console.log('⚠️ Meesho: Waiting for products...');
    }

    // small delay for client rendering
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const products = await page.evaluate(() => {
      const items: Array<ProductResult> = [] as any;

      // Meesho frequently uses anchor cards inside section with product thumbnails
      const cardSelectors = [
        'a[href*="/product/"]',
        'a[href*="/share"]',
      ];

      let productLinks: NodeListOf<HTMLAnchorElement> | HTMLAnchorElement[] = [];
      for (const selector of cardSelectors) {
        const found = document.querySelectorAll(selector) as NodeListOf<HTMLAnchorElement>;
        if (found.length) {
          productLinks = found;
          break;
        }
      }

      const unique: HTMLAnchorElement[] = [];
      const seen = new Set<string>();

      Array.from(productLinks)
        .slice(0, 24)
        .forEach((link) => {
          const href = link.href || link.getAttribute('href') || '';
          if (!href || seen.has(href)) return;
          seen.add(href);
          unique.push(link);
        });

      unique.slice(0, 12).forEach((linkEl) => {
        const container = linkEl.closest('div') || linkEl;

        // title - improved with noise filtering
        let title = '';
        const titleSelectors = [
          '[class*="ProductName"]',
          '[class*="Title"]',
          'h1',
          'h2',
          'h3',
          'p',
          'span',
        ];
        for (const sel of titleSelectors) {
          const el = container.querySelector(sel) as HTMLElement | null;
          if (el) {
            const rawTitle = el.innerText?.trim() || el.textContent?.trim() || '';
            // Filter out noise text
            if (rawTitle && 
                rawTitle.length > 10 && 
                !rawTitle.toLowerCase().includes('add to cart') &&
                !rawTitle.toLowerCase().includes('buy now') &&
                !rawTitle.toLowerCase().includes('wishlist') &&
                !rawTitle.toLowerCase().includes('compare') &&
                !rawTitle.toLowerCase().startsWith('₹') &&
                !rawTitle.match(/^\d+$/)) {
              title = rawTitle;
              break;
            }
          }
        }
        if (!title) {
          const linkText = linkEl.innerText?.trim() || linkEl.textContent?.trim() || '';
          if (linkText && 
              linkText.length > 10 && 
              !linkText.toLowerCase().includes('add to') &&
              !linkText.toLowerCase().includes('buy now')) {
            title = linkText;
          }
        }
        
        // Clean up title
        if (title) {
          title = title
            .replace(/Add to Cart/gi, '')
            .replace(/Buy Now/gi, '')
            .replace(/Wishlist/gi, '')
            .replace(/Compare/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        if (!title || title.length < 10) return;
        
        // Skip if title looks like button text
        if (title.toLowerCase().includes('add to') || 
            title.toLowerCase().includes('buy now')) return;

        // price
        let priceText = '';
        const priceSelectors = [
          '[class*="Price"]',
          '[class*="price"]',
          '[class*="SellingPrice"]',
          'span',
        ];
        for (const sel of priceSelectors) {
          const el = container.querySelector(sel) as HTMLElement | null;
          if (!el) continue;
          const txt = el.innerText || el.textContent || '';
          if (txt.includes('₹')) {
            priceText = txt;
            break;
          }
        }
        if (!priceText) {
          const txt = container.innerText || '';
          const match = txt.match(/₹[\d,]+/);
          if (match) priceText = match[0];
        }
        let price = 'Price not available';
        if (priceText) {
          const priceNum = priceText.replace(/[^\d]/g, '');
          if (priceNum && priceNum.length > 0) {
            price = `₹${priceNum}`;
          }
        }

        // Skip if no valid price
        if (price === 'Price not available') return;

        // image
        let imgEl =
          (container.querySelector('img') as HTMLImageElement | null) ||
          (linkEl.querySelector('img') as HTMLImageElement | null);
        const image =
          imgEl?.src ||
          imgEl?.getAttribute('data-src') ||
          imgEl?.getAttribute('data-lazy-src') ||
          '';

        // rating (very approximate)
        let rating: number | undefined;
        const ratingEl =
          (container.querySelector('[class*="Rating"]') as HTMLElement | null) ||
          (container.querySelector('[class*="rating"]') as HTMLElement | null);
        if (ratingEl) {
          const txt = ratingEl.innerText || ratingEl.textContent || '';
          const match = txt.match(/[\d.]+/);
          if (match) {
            const val = parseFloat(match[0]);
            if (!Number.isNaN(val)) rating = val;
          }
        }

        let link = linkEl.href || linkEl.getAttribute('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.meesho.com${link}`;
        }
        
        // Remove tracking parameters
        if (link.includes('?')) {
          link = link.split('?')[0];
        }

        // Skip if no valid link
        if (!link || link === 'https://www.meesho.com/') return;

        // Only add products with valid title (at least 10 chars) and price
        if (title && title.length >= 10 && price !== 'Price not available') {
          items.push({
            site: 'Meesho',
            title: title.substring(0, 200),
            price,
            image,
            link,
            rating,
          });
        }
      });

      return items;
    });

    console.log(`✅ Meesho: Found ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ Meesho scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}


