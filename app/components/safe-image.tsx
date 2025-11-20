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

  // Use proxy for external images to bypass CORS
  const getImageSrc = () => {
    if (!src) return placeholderSvg;
    
    // If it's an external URL from dev.skj.my.id, use proxy
    if (src.startsWith('http://dev.skj.my.id:82/')) {
      return `/api/image-proxy?url=${encodeURIComponent(src)}`;
    }
    
    // Otherwise use direct URL (for local or data URLs)
    return src;
  };

  const imageSrc = getImageSrc();

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
    <div 
      className="relative overflow-hidden flex items-center justify-center" 
      style={{ 
        width, 
        height,
        maxWidth: width,
        maxHeight: height,
      }}
    >
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-base-200 rounded-lg"
          style={{ width, height }}
        >
          <span className="loading loading-spinner loading-xs"></span>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading="lazy"
        crossOrigin="anonymous"
        onLoad={() => setLoading(false)}
        onError={(e) => {
          console.warn("Image failed to load:", imageSrc, e);
          setError(true);
          setLoading(false);
        }}
        style={{
          opacity: loading ? 0 : 1,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
