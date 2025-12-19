import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PriceLens — Compare Prices Instantly',
  description: 'Compare prices across Amazon and Flipkart',
};

import { AlertProvider } from '@/components/providers/AlertProvider';
import LoginSuccessAlert from '@/components/auth/LoginSuccessAlert';

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-black dark:bg-black dark:text-white">
        <AlertProvider>
          <Suspense fallback={null}>
            <LoginSuccessAlert />
          </Suspense>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}

