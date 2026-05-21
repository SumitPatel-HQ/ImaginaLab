import { useState, useEffect, useCallback } from 'react';
import { getAllImagesFromAPI, type ImageKitImage as Image } from '../../services/ImageKit';
import logger from '../../utils/logger';

interface UseImageGridReturn {
  allImages: Image[];
  visibleImages: Image[];
  hasMore: boolean;
  isInitialLoading: boolean;
  fetchMoreData: () => void;
}

export const useImageGrid = (initialImages: Image[]): UseImageGridReturn => {
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [visibleImages, setVisibleImages] = useState<Image[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const INITIAL_LOAD = 30;
  const IMAGES_PER_LOAD = 15;

  // Load all images once at startup
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setIsInitialLoading(true);
        logger.log('🔍 Discovering all available images from API...');
        const allDiscoveredImages = await getAllImagesFromAPI();
        logger.log(`✅ Found ${allDiscoveredImages.length} total images from API`);
        
        setAllImages(allDiscoveredImages);
        setVisibleImages(allDiscoveredImages.slice(0, INITIAL_LOAD));
        setHasMore(allDiscoveredImages.length > INITIAL_LOAD);
      } catch (error) {
        logger.error('Error loading images:', error);
        setAllImages(initialImages);
        setVisibleImages(initialImages.slice(0, INITIAL_LOAD));
        setHasMore(initialImages.length > INITIAL_LOAD);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadAllImages();
  }, [initialImages]);

  // Load more images for infinite scroll
  const fetchMoreData = useCallback(() => {
    if (visibleImages.length >= allImages.length) {
      setHasMore(false);
      return;
    }

    logger.log(`📦 Loading more images... (${visibleImages.length}/${allImages.length})`);
    
    setTimeout(() => {
      const nextImages = allImages.slice(
        visibleImages.length, 
        visibleImages.length + IMAGES_PER_LOAD
      );
      
      setVisibleImages(prev => [...prev, ...nextImages]);
      
      setHasMore(visibleImages.length + nextImages.length < allImages.length);
    }, 300);
  }, [visibleImages.length, allImages]);

  return {
    allImages,
    visibleImages,
    hasMore,
    isInitialLoading,
    fetchMoreData
  };
};