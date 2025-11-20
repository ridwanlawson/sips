"use client";

import { useState } from "react";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * SafeImage component that handles external images reliably
 * Works in both development and production (Vercel)
 * Falls back to placeholder if image fails to load
 */
export default function SafeImage({
  src,
  alt,
  className = "",
  width = 40,
  height = 40,
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Placeholder SVG (gray box with "N/A" text)
  const placeholderSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlN2U1ZTQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZHk9Ii4zZW0iIGZpbGw9IiNhM2EzYTMiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk4vQTwvdGV4dD48L3N2Zz4=`;

  if (error || !src) {
    return (
      <img
        src={placeholderSvg}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-base-200 rounded-lg"
          style={{ width, height }}
        >
          <span className="loading loading-spinner loading-xs"></span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        style={loading ? { opacity: 0 } : { opacity: 1 }}
      />
    </div>
  );
}
