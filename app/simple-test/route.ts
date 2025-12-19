import { NextResponse } from 'next/server';
import { fetchWithScrapingBee } from '@/lib/scrapingbee';

export async function GET() {
  try {
    // Test with a simple, known URL
    const testUrl = 'https://www.amazon.in/s?k=laptop';
    console.log('Testing ScrapingBee with:', testUrl);
    
    const html = await fetchWithScrapingBee(testUrl, true);
    
    return NextResponse.json({
      success: true,
      htmlLength: html.length,
      first500Chars: html.substring(0, 500),
      hasAmazon: html.includes('amazon') || html.includes('Amazon'),
      hasProducts: html.includes('product') || html.includes('s-result-item'),
      hasCaptcha: html.includes('captcha') || html.includes('CAPTCHA'),
      hasError: html.includes('error') || html.includes('Error'),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

