import type { SyntheticEvent } from 'react';
export function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (!image.src.endsWith('/product-placeholder.svg')) image.src = '/product-placeholder.svg';
}
