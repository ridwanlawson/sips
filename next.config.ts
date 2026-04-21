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
    localPatterns: [
      {
        pathname: '/api/image-proxy',
        search: 'url',
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
        protocol: "http",
        hostname: "dev.skj.my.id",
        port: "82",
        pathname: "/**",
      },
    ],
  },
  // Optimize CSS loading to prevent unused preload warnings
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-data-table-component'],
  },
  // Disable CSS preload warnings
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // hapus: optimizeFonts, swcMinify, assetPrefix undefined
};

export default withPWA(withNextIntl(nextConfig));
