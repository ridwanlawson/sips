import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Providers from "./components/providers";

// display: "swap" + preload: false → font tidak blokir render awal
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,          // preload latin subset untuk LCP lebih cepat
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,         // mono font tidak kritis untuk LCP
  adjustFontFallback: false,
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | SiPS Mobile Web",
    default: "SiPS Mobile Web",
  },
  description: "Aplikasi SiPS Mobile Web oleh PT Sentosa Kalimantan Jaya",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SiPS Mobile",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ThemeProvider />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
