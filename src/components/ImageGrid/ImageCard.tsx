import React from 'react';
import { ImageSkeleton } from '../loading-placeholders';
import HoverAnimation from './animations/HoverAnimation';
import type { ImageKitImage as Image } from '../../services/ImageKit';

interface ImageCardProps {
  image: Image;
  layoutMode: 'grid' | 'masonry';
  onImageClick: (image: Image) => void;
  index?: number;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  layoutMode, 
  onImageClick,
  index = 999 
}) => {
  // Only the first 6 cards are given high fetch priority and eager loading
  const isHighPriority = index < 6;

  return (
    <HoverAnimation
      imageUrl={image.src}
      title={image.title}
      layoutMode={layoutMode}
      onImageClick={() => onImageClick(image)}
    >
      <ImageSkeleton 
        image={image}
        quality="thumbnail"
        className="w-full"
        fetchPriority={isHighPriority ? 'high' : 'auto'}
        loading={isHighPriority ? 'eager' : 'lazy'}
      />
    </HoverAnimation>
  );
};

export default ImageCard;