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

    // Navigate the page to a URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for page to load - GeM uses Angular/React so needs more time
    await new Promise(resolve => setTimeout(resolve, 4000));

    const products = await page.evaluate(() => {
      const items: Array<{site: string; title: string; price: string; image: string; link: string}> = [];

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
              
              if (title && title.length >= 3) {
                let priceEl = element.querySelector('.price, [class*="price"], [class*="amount"]') as HTMLElement;
                if (!priceEl) priceEl = parent.querySelector('.price, [class*="price"], [class*="amount"]') as HTMLElement;
                const priceText = priceEl?.innerText?.trim() || priceEl?.textContent?.trim() || '';
                const price = priceText ? `₹${priceText.replace(/[^\d]/g, '')}` : 'Price not available';
                
                let imgEl = element.querySelector('img') as HTMLImageElement;
                if (!imgEl) imgEl = parent.querySelector('img') as HTMLImageElement;
                const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || '';
                
                let link = parentLink.href || '';
                if (link && !link.startsWith('http')) {
                  link = `https://mkp.gem.gov.in${link}`;
                }
                
                if (title && price !== 'Price not available') {
                  items.push({
                    site: 'GeM',
                    title,
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

        // Extract title - try multiple selectors
        let titleEl = element.querySelector('.product-title') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('[class*="title"]') as HTMLElement;
        if (!titleEl) titleEl = element.querySelector('h3, h4, h5') as HTMLElement;
        if (!titleEl) titleEl = linkEl as HTMLElement;
        const title = titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || linkEl.innerText?.trim() || '';

        if (!title || title.length < 3) continue;

        // Extract price - try multiple selectors
        let priceEl = element.querySelector('.price') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="price"]') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="amount"]') as HTMLElement;
        if (!priceEl) priceEl = element.querySelector('[class*="cost"]') as HTMLElement;
        const priceText = priceEl?.innerText?.trim() || priceEl?.textContent?.trim() || '';
        const price = priceText ? `₹${priceText.replace(/[^\d]/g, '')}` : 'Price not available';

        // Extract image - try multiple selectors
        let imgEl = element.querySelector('img') as HTMLImageElement;
        if (!imgEl) {
          const parent = element.closest('div');
          if (parent) imgEl = parent.querySelector('img') as HTMLImageElement;
        }
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.getAttribute('srcset')?.split(' ')[0] || '';

        // Extract link
        let link = linkEl.href || '';
        if (link && !link.startsWith('http')) {
          link = `https://mkp.gem.gov.in${link}`;
        }

        if (title && price !== 'Price not available') {
          items.push({
            site: 'GeM',
            title,
            price,
            image,
            link,
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
