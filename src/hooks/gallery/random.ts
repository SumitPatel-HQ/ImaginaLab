import { useState, useCallback } from 'react';
import logger from '../../utils/logger';
import type { ImageKitImage } from '../../services/ImageKit';
import { getFallbackIndex } from './randomUtils';

export interface UseRandomImageReturn {
  shuffleLoading: boolean;
  randomImage: (images: ImageKitImage[], currentIndex: number) => Promise<{ index: number; images: ImageKitImage[] } | undefined>;
}

export const useRandomImage = (
  setTotalAvailableImages: (count: number) => void
): UseRandomImageReturn => {
  const [shuffleLoading, setShuffleLoading] = useState(false);

  const randomImage = useCallback(async (
    images: ImageKitImage[], 
    currentIndex: number
  ): Promise<{ index: number; images: ImageKitImage[] } | undefined> => {
    if (shuffleLoading) return undefined;
    
    // Check if we have images to work with
    if (!images || images.length === 0) {
      logger.warn('⚠️ No images available for shuffle');
      return undefined;
    }

    if (images.length === 1) {
      logger.log('ℹ️ Only 1 image available, cannot shuffle to a different image');
      return { index: 0, images };
    }
    
    setShuffleLoading(true);
    
    try {
      setTotalAvailableImages(images.length);
      
      const nextIndex = getFallbackIndex(images, currentIndex);
      
      if (nextIndex === null) {
        return undefined;
      }
      
      const selectedImage = images[nextIndex];
      logger.log(`✅ Random image selected: ${selectedImage.fileName || selectedImage.title || selectedImage.id} (index ${nextIndex})`);
      
      return {
        index: nextIndex,
        images
      };
    } catch (error) {
      logger.error('Error in random shuffle:', error);
      return undefined;
    } finally {
      setShuffleLoading(false);
    }
  }, [shuffleLoading, setTotalAvailableImages]);

  return { shuffleLoading, randomImage };
};