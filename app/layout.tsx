import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/theme/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import Providers from './components/auth/providers';

// Use font-display swap so fonts do not block the initial render.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['monospace'],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: '%s | SiPS Mobile Web',
      default: 'SiPS Mobile Web',
    },
    description: 'SiPS Mobile Web application by PT Sentosa Kalimantan Jaya',
    manifest: '/manifest.json',
    icons: {
      icon: '/logo.svg',
      apple: '/logo.svg',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'SiPS Mobile',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations('Navbar');

  return (
    <html lang={locale} data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:bg-primary focus:text-primary-content focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
            >
              {t('skipToContent')}
            </a>
            <ThemeProvider />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

