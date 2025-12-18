"use server";

export interface ProductResult {
    site: string;
    title: string;
    price: string;
    image: string;
    link: string;
    invalid?: boolean;
    blocked?: boolean;
}

// Helper function to extract price from text
export function extractPrice(text: string): string {
    if (!text) return 'Price not available';

    // Try to find price with ₹ symbol first
    let match = text.match(/₹[\d,]+/);
    if (match) {
        return `₹${match[0].replace(/[₹,]/g, '')}`;
    }

    // Try to find just numbers with commas
    match = text.match(/[\d,]+/);
    if (match) {
        return `₹${match[0].replace(/,/g, '')}`;
    }

    return text.trim() || 'Price not available';
}

// Helper function to clean and validate URL
export function cleanUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
}
