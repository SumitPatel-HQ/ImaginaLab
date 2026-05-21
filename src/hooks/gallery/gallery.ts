import { useEffect, useCallback } from 'react';
import { type ImageKitImage } from '../../services/ImageKit';
import { useImageLoader } from './loader';
import { useRandomImage } from './random';
import { useImagePreloader } from './preloader';
import { GALLERY_CONFIG } from './config';

interface UseGalleryConfig {
  currentIndex: number;
  preloadCount?: number;
}

interface UseGalleryReturn {
  images: ImageKitImage[];
  loading: boolean;
  shuffleLoading: boolean;
  visibleImageIndices: number[];
  totalAvailableImages: number;
  loadAllImagesWithSmartDetection: () => Promise<void>;
  randomImage: () => Promise<number | undefined>;
}

export const useGallery = ({ 
  currentIndex, 
  preloadCount = GALLERY_CONFIG.PRELOAD_COUNT
}: UseGalleryConfig): UseGalleryReturn => {
  
  const {
    images: loaderImages,
    loading,
    totalAvailableImages,
    loadImages,
    loadAllImagesWithSmartDetection,
    setTotalAvailableImages
  } = useImageLoader();

  const { shuffleLoading, randomImage: randomImageFn } = useRandomImage(setTotalAvailableImages);
  
  const images = loaderImages;
  const { visibleImageIndices } = useImagePreloader(currentIndex, images, preloadCount);

  const randomImage = useCallback(async (): Promise<number | undefined> => {
    const result = await randomImageFn(images, currentIndex);
    return result?.index;
  }, [randomImageFn, images, currentIndex]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return {
    images,
    loading,
    shuffleLoading,
    visibleImageIndices,
    totalAvailableImages,
    loadAllImagesWithSmartDetection,
    randomImage,
  };
};