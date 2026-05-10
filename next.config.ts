import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'], // Optimasi format gambar
    deviceSizes: [640, 750, 828, 1080, 1200], // Responsive image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Icon sizes
    localPatterns: [
      {
        pathname: '/api/image-proxy/**',
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.daisyui.com",
        pathname: "/images/**",
      },
      {
        protocol: 'http',
        hostname: 'dev.skj.my.id',
        port: '82',
        pathname: '/file/attendance_images/**',
      },
      {
        protocol: 'http',
        hostname: 'dev.skj.my.id',
        port: '82',
        pathname: '/file/harvesting_images/**',
      },
      {
        protocol: "http",
        hostname: "dev.skj.my.id",
        port: "82",
        pathname: "/**",
      },
    ],
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-data-table-component', 'lucide-react'],
    // Turbopack optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable compression
  compress: true,
  // Optimize bundle
  poweredByHeader: false,
  generateEtags: false,
};

export default withPWA(withNextIntl(nextConfig));
