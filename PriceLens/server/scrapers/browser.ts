"use server";

import type { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  // Check if browser exists and is still connected
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // If browser is being created, wait for it
  if (browserPromise) {
    return browserPromise;
  }

  // Create browser in a promise to prevent multiple instances
  browserPromise = (async () => {
    const puppeteer = (await import("puppeteer-extra")).default;
    const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;

    puppeteer.use(StealthPlugin());

    console.log('🚀 Launching new Puppeteer browser instance...');

    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-javascript-harmony-shipping",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-ipc-flooding-protection",
        "--memory-pressure-off",
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1920, height: 1080 },
    });

    console.log('✅ Browser instance created');
    browserPromise = null; // Clear promise after creation
    return browserInstance;
  })();

  browserInstance = await browserPromise;
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('🔒 Browser instance closed');
  }
}

