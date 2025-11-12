import type { NextConfig } from "next";

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

export default nextConfig;
