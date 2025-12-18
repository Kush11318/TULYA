import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PriceLens — Compare Prices Instantly',
  description: 'Compare prices across Amazon and Flipkart',
};

import { AlertProvider } from '@/components/providers/AlertProvider';
import LoginSuccessAlert from '@/components/auth/LoginSuccessAlert';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-white text-black dark:bg-black dark:text-white">
        <AlertProvider>
          <LoginSuccessAlert />
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}

