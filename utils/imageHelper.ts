/**
 * Convert HTTP image URLs to use our HTTPS proxy.
 * This solves mixed content (HTTP on HTTPS) without needing to
 * know every possible image server origin ahead of time.
 *
 * Security: The server-side proxy (/api/image-proxy) validates
 * the origin against a trusted allowlist, so proxying all HTTP
 * URLs client-side is safe.
 */
export const getProxiedImageUrl = (originalUrl: string | null | undefined): string => {
  if (!originalUrl) return '';

  // data: and relative URLs need no proxy
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('/')) return originalUrl;

  // HTTPS URLs are safe from mixed content
  if (originalUrl.startsWith('https://')) return originalUrl;

  // Proxy all HTTP URLs through our API to avoid mixed content
  if (originalUrl.startsWith('http://')) {
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
};

/**
 * Placeholder image for broken/missing images
 */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlN2U1ZTQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZHk9Ii4zZW0iIGZpbGw9IiNhM2EzYTMiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk4vQTwvdGV4dD48L3N2Zz4=';
