import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
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
  // hapus: optimizeFonts, swcMinify, assetPrefix undefined
};

export default withPWA(withNextIntl(nextConfig));
