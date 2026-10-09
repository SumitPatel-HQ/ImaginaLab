// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react';
import { Skeleton } from '../ui/Skeleton';
import type { ImageKitImage as Image } from '../../services/ImageKit';
import { createImageTransformations, getOptimizedImageUrl, getDeviceType, getOptimalQuality } from '../../services/ImageKit/config';

interface ImageSkeletonProps {
  image: Image;
  className?: string;
  onImageLoad?: () => void;
  aspectRatio?: string; // Quality aspect ratio (e.g., '2:3', '3:2', '1:1', or CSS ratio)
  quality?: 'thumbnail' | 'preview' | 'full' | 'ultra'; // Quality level
  fetchPriority?: 'high' | 'low' | 'auto'; // Browser fetch priority
  loading?: 'eager' | 'lazy'; // Loading behavior
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  image,
  className = '',
  onImageLoad,
  aspectRatio,
  quality = 'thumbnail',
  fetchPriority = 'auto',
  loading = 'lazy'
}) => {
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Compute stable aspect ratio from actual dimensions first, falling back to ratio property
  const computedAspectRatio = (() => {
    if (image.width && image.height && image.width > 0 && image.height > 0) {
      return `${image.width} / ${image.height}`;
    }
    if (aspectRatio) {
      if (aspectRatio === '2:3') return '2 / 3';
      if (aspectRatio === '3:2') return '3 / 2';
      return aspectRatio.includes(':') ? aspectRatio.replace(':', ' / ') : aspectRatio;
    }
    if (image.ratio === '3:2') return '3 / 2';
    if (image.ratio === '2:3') return '2 / 3';
    return '2 / 3';
  })();

  // Get original image path from the image object or clean src
  const imagePath = image.filePath || image.src.split('?')[0].replace(import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '', '');
  
  // Generate different quality URLs
  const placeholderUrl = getOptimizedImageUrl(imagePath, createImageTransformations.placeholder(30));
  
  const getMainImageUrl = () => {
    const deviceType = getDeviceType();
    switch (quality) {
      case 'thumbnail':
        return getOptimizedImageUrl(imagePath, getOptimalQuality('thumbnail', deviceType));
      case 'preview':
        return getOptimizedImageUrl(imagePath, getOptimalQuality('preview', deviceType));
      case 'full':
        return getOptimizedImageUrl(imagePath, getOptimalQuality('fullSize', deviceType));
      case 'ultra':
        return getOptimizedImageUrl(imagePath, createImageTransformations.ultra(2400));
      default:
        return getOptimizedImageUrl(imagePath, createImageTransformations.responsive(deviceType));
    }
  };

  const mainImageUrl = getMainImageUrl();

  const handlePlaceholderLoad = () => {
    setPlaceholderLoaded(true);
  };

  const handleMainImageLoad = () => {
    setMainImageLoaded(true);
    setShowSkeleton(false);
    onImageLoad?.();
  };

  const handleImageError = () => {
    setShowSkeleton(false);
  };

  return (
    <div 
      className={`relative w-full rounded-lg overflow-hidden bg-gray-800/80 ${className}`}
      style={{ aspectRatio: computedAspectRatio }}
    >
      {/* Stable skeleton layer - smoothly fades out when image finishes loading */}
      {showSkeleton && (
        <div 
          className={`absolute inset-0 z-10 transition-opacity duration-300 ${
            mainImageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Skeleton 
            className="w-full h-full rounded-lg" 
            shimmer 
            variant="square"
          />
        </div>
      )}
      
      {/* Low-quality blur placeholder */}
      <img 
        className={`absolute inset-0 w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
          placeholderLoaded && !mainImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={placeholderUrl}
        alt=""
        loading={loading}
        fetchPriority="low"
        onLoad={handlePlaceholderLoad}
        onError={handleImageError}
        style={{ filter: 'blur(10px)' }}
      />
      
      {/* Main optimized image */}
      <img 
        className={`absolute inset-0 w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          mainImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={mainImageUrl}
        alt={image.title}
        loading={loading}
        fetchPriority={fetchPriority}
        onLoad={handleMainImageLoad}
        onError={handleImageError}
        style={{
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
};

export default ImageSkeleton;