'use client';

import Image from 'next/image';
import { useState, memo } from 'react';
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from '@/utils/imageHelper';

interface PhotoCellProps {
  imageUrl?: string | null;
  alt?: string;
  href?: string;
  size?: number;
}

/**
 * ⚡ Bolt Optimization: PhotoCell component.
 * - Wrapped in React.memo to prevent unnecessary re-renders.
 * - Derives display source from prop during render to avoid useEffect overhead.
 * - Centralizes error handling and placeholder display for list images.
 */
const PhotoCellInner = ({ imageUrl, alt = 'foto', href, size = 40 }: PhotoCellProps) => {
  const [hasError, setHasError] = useState(false);
  const [prevImageUrl, setPrevImageUrl] = useState<string | null | undefined>(null);

  // ⚡ Bolt: Reset error state when imageUrl prop changes (derivation pattern)
  if (imageUrl !== prevImageUrl) {
    setHasError(false);
    setPrevImageUrl(imageUrl);
  }

  const imgSrc = !hasError && imageUrl ? getProxiedImageUrl(imageUrl) : PLACEHOLDER_IMAGE;

  const content = (
    <div
      className="relative rounded-lg ring-1 ring-base-300 bg-base-200 overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={alt} className="inline-block shrink-0">
        {content}
      </a>
    );
  }

  return content;
};

export const PhotoCell = memo(PhotoCellInner);
PhotoCell.displayName = 'PhotoCell';
