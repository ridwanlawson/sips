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
 * Safe image component with fallback for broken images
 * Works in both dev and production (Vercel)
 */
export function SafeImage({ src, alt, className = "", width = 40, height = 40 }: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-base-200 text-base-content/40 text-xs font-medium ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        N/A
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div
          className={`flex items-center justify-center bg-base-200 animate-pulse ${className}`}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'hidden' : ''}`}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        crossOrigin="anonymous"
      />
    </>
  );
}
