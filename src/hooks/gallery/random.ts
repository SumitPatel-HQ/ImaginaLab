import { useState, useCallback } from 'react';
import logger from '../../utils/logger';
import type { ImageKitImage } from '../../services/ImageKit';
import { getFallbackIndex, addImageToArray } from './randomUtils';

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
    if (images.length === 0) {
      logger.warn('⚠️ No images available for shuffle');
      return undefined;
    }
    
    setShuffleLoading(true);
    
    try {
      // NEW: Use API to get all available files for random selection
      logger.log('🔍 Fetching all files from API for random shuffle...');
      
      try {
        const { getAllImagesFromAPI } = await import('../../services/ImageKit');
        const allAvailableImages = await getAllImagesFromAPI();
        
        if (allAvailableImages.length === 0) {
          logger.error('❌ No images found from API, cannot shuffle');
          setShuffleLoading(false);
          return undefined;
        }
        
        logger.log(`✅ Found ${allAvailableImages.length} total images from API`);
        setTotalAvailableImages(allAvailableImages.length);
        
        // Pick a random image from all available images (excluding current)
        let randomIndex;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          randomIndex = Math.floor(Math.random() * allAvailableImages.length);
          attempts++;
        } while (
          randomIndex === currentIndex && 
          allAvailableImages.length > 1 && 
          attempts < maxAttempts
        );
        
        const randomImageData = allAvailableImages[randomIndex];
        
        // Add to current images array if not already there
        const result = addImageToArray(images, randomImageData);
        
        setShuffleLoading(false);
        logger.log(`✅ Random image selected: ${randomImageData.fileName || randomImageData.id}`);
        
        return {
          index: result.index,
          images: result.images
        };
        
      } catch (apiError) {
        logger.error('❌ API-based random failed:', apiError);
        logger.log('🔄 Falling back to current images array...');
        
        // Fallback: pick from current images
        const fallbackIndex = getFallbackIndex(images, currentIndex);
        
        setShuffleLoading(false);
        
        if (fallbackIndex === null) {
          return undefined;
        }
        
        return {
          index: fallbackIndex,
          images
        };
      }
      
    } catch (error) {
      logger.error('Error in random shuffle:', error);
      setShuffleLoading(false);
      
      const fallbackIndex = getFallbackIndex(images, currentIndex);
      return fallbackIndex !== null ? { index: fallbackIndex, images } : undefined;
    }
  }, [shuffleLoading, setTotalAvailableImages]);

  return { shuffleLoading, randomImage };
};