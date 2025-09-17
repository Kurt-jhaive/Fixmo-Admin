/**
 * Utility functions for handling image URLs and Cloudinary integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Converts a relative or incomplete image URL to a full URL
 * Handles Cloudinary URLs, relative paths, and filenames
 */
export function getImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;

  // Debug logging
  console.log('🔍 getImageUrl input:', imagePath);

  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('✅ getImageUrl output (full URL):', imagePath);
    return imagePath;
  }

  // SPECIAL CASE: Handle backend bug where Cloudinary URLs are prefixed with /uploads/
  // Example: "/uploads/https://res.cloudinary.com/..." should become "https://res.cloudinary.com/..."
  console.log('🔍 Checking uploads prefix:', imagePath.startsWith('/uploads/https://'), imagePath.startsWith('/uploads/http://'));
  if (imagePath.startsWith('/uploads/https://') || imagePath.startsWith('/uploads/http://')) {
    const cleanUrl = imagePath.replace('/uploads/', '');
    console.log('✅ getImageUrl output (cleaned uploads prefix):', cleanUrl);
    return cleanUrl;
  }

  // If it contains cloudinary.com, it's likely a partial Cloudinary URL
  if (imagePath.includes('cloudinary.com')) {
    // If it already starts with http/https, return as-is (this should have been caught earlier but safety check)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('✅ getImageUrl output (cloudinary full URL):', imagePath);
      return imagePath;
    }
    // If it doesn't start with http, add https
    const cloudinaryUrl = imagePath.startsWith('//') ? `https:${imagePath}` : `https://${imagePath}`;
    console.log('✅ getImageUrl output (cloudinary):', cloudinaryUrl);
    return cloudinaryUrl;
  }

  // IMPORTANT: Check if the imagePath is actually a full Cloudinary URL that got stored without protocol
  // This happens when the backend stores URLs like "res.cloudinary.com/..." instead of "https://res.cloudinary.com/..."
  if (imagePath.includes('res.cloudinary.com')) {
    const cloudinaryUrl = imagePath.startsWith('//') ? `https:${imagePath}` : `https://${imagePath}`;
    console.log('✅ getImageUrl output (cloudinary without protocol):', cloudinaryUrl);
    return cloudinaryUrl;
  }

  // If it starts with a forward slash, it's a relative path from the API
  if (imagePath.startsWith('/')) {
    const relativeUrl = `${API_BASE_URL}${imagePath}`;
    console.log('✅ getImageUrl output (relative):', relativeUrl);
    return relativeUrl;
  }

  // If it doesn't start with a slash, assume it's in the uploads directory
  const uploadsUrl = `${API_BASE_URL}/uploads/${imagePath}`;
  console.log('✅ getImageUrl output (uploads):', uploadsUrl);
  return uploadsUrl;
}

/**
 * Determines if an image should use Next.js Image component or regular img tag
 */
export function shouldUseNextImage(imageUrl?: string | null): boolean {
  if (!imageUrl) {
    console.log('🚫 shouldUseNextImage: No URL provided, returning false');
    return false;
  }
  
  // Don't use Next.js Image for external URLs (Cloudinary, etc.)
  const isExternal = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
  const isCloudinary = imageUrl.includes('cloudinary.com');
  const shouldUse = !isExternal && !isCloudinary;
  
  console.log('🎯 shouldUseNextImage:', { 
    url: imageUrl, 
    isExternal, 
    isCloudinary, 
    shouldUseNext: shouldUse 
  });
  
  // Use regular img tag for external/Cloudinary images to avoid optimization issues
  return shouldUse;
}

/**
 * Gets a placeholder image URL for when no image is available
 */
export function getPlaceholderImage(type: 'profile' | 'certificate' | 'document' = 'profile'): string {
  const placeholders = {
    profile: 'https://res.cloudinary.com/demo/image/upload/c_scale,w_100,h_100/v1/sample.jpg',
    certificate: 'https://res.cloudinary.com/demo/image/upload/c_scale,w_300,h_200/v1/sample.jpg',
    document: 'https://res.cloudinary.com/demo/image/upload/c_scale,w_200,h_300/v1/sample.jpg'
  };
  
  return placeholders[type];
}

/**
 * Validates if an image URL is likely to be valid
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  
  // Check if it's a Cloudinary URL
  const isCloudinary = url.includes('cloudinary.com');
  
  // Check if it's a data URL
  const isDataUrl = url.startsWith('data:image/');
  
  return imageExtensions.test(url) || isCloudinary || isDataUrl;
}

/**
 * Handles image loading errors by providing fallback URLs
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackType: 'profile' | 'certificate' | 'document' = 'profile'
) {
  const target = event.target as HTMLImageElement;
  target.src = getPlaceholderImage(fallbackType);
  target.onerror = null; // Prevent infinite loop
}

/**
 * Creates optimized Cloudinary URLs with transformations
 */
export function getOptimizedImageUrl(
  imagePath?: string | null,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string | null {
  const fullUrl = getImageUrl(imagePath);
  if (!fullUrl) return null;

  // If it's a Cloudinary URL, we can add transformations
  if (fullUrl.includes('cloudinary.com')) {
    const { width, height, quality = 80, format = 'auto' } = options;
    
    // Insert transformations into Cloudinary URL
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    
    const transformationString = transformations.join(',');
    
    // Replace /upload/ with /upload/{transformations}/
    return fullUrl.replace('/upload/', `/upload/${transformationString}/`);
  }

  // For non-Cloudinary URLs, return as is
  return fullUrl;
}
