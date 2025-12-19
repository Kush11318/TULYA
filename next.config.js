/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  },
}

module.exports = nextConfig

