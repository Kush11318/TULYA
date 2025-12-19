import { NextResponse } from 'next/server';
import { fetchWithScrapingBee } from '@/lib/scrapingbee';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const site = searchParams.get('site') || 'amazon';
  
  if (!url) {
    return NextResponse.json({ error: 'Please provide a URL parameter' }, { status: 400 });
  }

  try {
    const html = await fetchWithScrapingBee(url, true);
    
    // Return first 5000 chars of HTML for inspection
    return NextResponse.json({
      success: true,
      url,
      htmlLength: html.length,
      htmlPreview: html.substring(0, 5000),
      hasCaptcha: html.includes('captcha') || html.includes('CAPTCHA'),
      hasError: html.includes('ScrapingBee') && html.includes('error'),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

