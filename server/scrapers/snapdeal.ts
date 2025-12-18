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

    // Navigate the page to a URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

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
      const items: Array<{site: string; title: string; price: string; image: string; link: string}> = [];
      
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

        // Extract title - try multiple selectors
        let titleEl = element.querySelector('p.product-title') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('[class*="product-title"]') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('[class*="title"]') as HTMLElement;
        if (!titleEl) {
          const linkEl = element.querySelector('a[href*="/product/"]') as HTMLAnchorElement;
          if (linkEl) titleEl = linkEl as HTMLElement;
        }
        const title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || '';

        if (!title || title.length < 3) continue;

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
        
        const price = priceText ? `₹${priceText.replace(/[^\d]/g, '')}` : 'Price not available';

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

        // Extract link
        const linkEl = element.querySelector('a[href*="/product/"]') as HTMLAnchorElement;
        let link = linkEl?.href || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.snapdeal.com${link}`;
        }

        if (title && price !== 'Price not available') {
          items.push({
            site: 'Snapdeal',
            title: title.substring(0, 200),
            price,
            image,
            link,
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
