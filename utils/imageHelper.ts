import { BACKEND_URL } from "@/utils/backendConfig";

/**
 * Convert backend image URL to use our proxy in production
 * This solves mixed content (HTTP/HTTPS) issues
 */
export const getProxiedImageUrl = (originalUrl: string | null | undefined): string => {
  if (!originalUrl) return "";

  // If it's already a data URL or relative URL, return as-is
  if (originalUrl.startsWith("data:") || originalUrl.startsWith("/")) {
    return originalUrl;
  }

  // If it's from our HTTP backend, proxy it through our API
  if (originalUrl.startsWith(`${BACKEND_URL}/`)) {
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  }

  // For other URLs (HTTPS, etc), return as-is
  return originalUrl;
};

/**
 * Placeholder image for broken/missing images
 */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlN2U1ZTQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZHk9Ii4zZW0iIGZpbGw9IiNhM2EzYTMiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk4vQTwvdGV4dD48L3N2Zz4=";
