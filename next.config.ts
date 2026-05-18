import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Hanya cache aset statis — jangan cache API calls
  runtimeCaching: [],
});

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"], // avif lebih kecil, prioritaskan
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7, // cache gambar 7 hari
    localPatterns: [
      { pathname: "/api/image-proxy/**" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.daisyui.com",
        pathname: "/images/**",
      },
      ...(process.env.BACKEND_URL
        ? [
          {
            protocol: new URL(process.env.BACKEND_URL).protocol.replace(":", "") as "http" | "https",
            hostname: new URL(process.env.BACKEND_URL).hostname,
            port: new URL(process.env.BACKEND_URL).port || undefined,
            pathname: "/**",
          },
        ]
        : []),
    ],
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  experimental: {
    optimizeCss: true,
    // Tambah semua heavy packages agar tree-shaken dengan benar
    optimizePackageImports: [
      "react-data-table-component",
      "lucide-react",
      "@tanstack/react-query",
      "react-hot-toast",
      "next-intl",
    ],
    // Aktifkan partial prerendering untuk halaman yang bisa di-prerender sebagian
    ppr: false, // set true jika Next.js >= 15 dan ingin eksperimen PPR
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // HTTP headers untuk caching aset statis
  async headers() {
    return [
      {
        // Cache aset statis Next.js (JS/CSS chunks) selama 1 tahun
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache gambar publik 7 hari
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache SVG/favicon
        source: "/:file(.*\\.(?:svg|ico|png|jpg|jpeg|webp|avif))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // API routes: no-store (data selalu fresh)
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache",
          },
        ],
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
  // generateEtags: true (default) — biarkan aktif untuk caching kondisional
};

export default withPWA(withNextIntl(nextConfig));
