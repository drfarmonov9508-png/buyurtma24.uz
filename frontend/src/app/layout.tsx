'use client';

import './globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { LanguageProvider } from '@/lib/i18n';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
  }));

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <title>Buyurtma24.uz</title>
        <meta name="description" content="Restaurant Management Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <QueryClientProvider client={queryClient}>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: { borderRadius: '12px', background: '#333', color: '#fff' },
                  success: { style: { background: '#16a34a' } },
                  error: { style: { background: '#dc2626' } },
                }}
              />
            </QueryClientProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
