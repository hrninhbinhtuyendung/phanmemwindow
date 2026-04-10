'use client';

import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type SmartImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt'
> & {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
};

export default function SmartImage({
  src,
  alt,
  fallbackSrc = '/placeholder-software.svg',
  className,
  ...rest
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(
    src && src.trim().length > 0 ? src : fallbackSrc
  );

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      className={className}
      loading={rest.loading ?? 'lazy'}
      decoding={rest.decoding ?? 'async'}
      onError={(e) => {
        rest.onError?.(e);
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}
