import { useState } from 'react';
import Logo from '../assets/logo.svg';

/** Image qui affiche le logo du site si elle est absente ou introuvable */
export function SafeImage({ src, alt, className = '', eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const missing = !src || failedSrc === src;

  return (
    <img
      src={missing ? Logo : src}
      alt={alt}
      className={`${className} ${missing ? 'img-fallback' : ''}`.trim()}
      loading={eager ? undefined : 'lazy'}
      onError={() => src && setFailedSrc(src)}
    />
  );
}
