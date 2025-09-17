import React from 'react';
import Image from 'next/image';
import { getImageUrl, handleImageError, getPlaceholderImage, shouldUseNextImage } from '@/lib/image-utils';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackType?: 'profile' | 'certificate' | 'document';
  fallbackContent?: React.ReactNode;
  onClick?: () => void;
}

/**
 * Smart Image component that automatically chooses between Next.js Image and regular img
 * based on the image source (uses regular img for external URLs like Cloudinary)
 */
export function SmartImage({ 
  src, 
  alt, 
  width = 100, 
  height = 100, 
  className = '', 
  fallbackType = 'profile',
  fallbackContent,
  onClick 
}: SmartImageProps) {
  // If no src provided and we have custom fallback content, use it
  if (!src && fallbackContent) {
    return <>{fallbackContent}</>;
  }

  const imageUrl = getImageUrl(src);
  const useNextImage = shouldUseNextImage(imageUrl);
  const finalImageUrl = imageUrl || getPlaceholderImage(fallbackType);

  console.log('🖼️ SmartImage DEBUG:', { 
    originalSrc: src, 
    processedUrl: imageUrl, 
    useNextImage, 
    finalUrl: finalImageUrl,
    srcType: typeof src,
    srcLength: src?.length
  });

  if (useNextImage) {
    return (
      <Image
        src={finalImageUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onClick={onClick}
        onError={(e) => handleImageError(e, fallbackType)}
      />
    );
  }

  return (
    <img
      src={finalImageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      onError={(e) => handleImageError(e, fallbackType)}
    />
  );
}

export default SmartImage;
