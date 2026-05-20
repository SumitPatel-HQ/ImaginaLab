import { useState, useCallback, useRef } from 'react';
import { 
  getAllImagesWithRangeDetection,
  getAllImagesFromAPI, // NEW: API-based discovery for any filename
  type ImageKitImage 
} from '../../services/ImageKit';
import { useImageCache } from './cache';

export interface UseImageLoaderReturn {
  images: ImageKitImage[];
  loading: boolean;
  totalAvailableImages: number;
  loadImages: () => Promise<void>; // Updated return type
  loadAllImagesWithSmartDetection: () => Promise<void>;
  setTotalAvailableImages: (count: number) => void;
}

export const useImageLoader = (): UseImageLoaderReturn => {
  const [images, setImages] = useState<ImageKitImage[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading = true to show loading screen initially
  const [totalAvailableImages, setTotalAvailableImages] = useState<number>(0);
  const loadingRef = useRef(false);
  
  const { getCachedImages, cacheImages } = useImageCache();

  // Load images with progressive batching - NOW USING API-BASED DISCOVERY
  const loadImages = useCallback(async () => {
    try {
      // Skip if we already have images or are already loading
      if (images.length > 0) {
        console.log('✅ Images already loaded, skipping...');
        return;
      }
      if (loadingRef.current) {
        console.log('⏳ Already loading images, skipping duplicate request...');
        return;
      }
      
      loadingRef.current = true;
      setLoading(true);
      
      // Try to recover from cache first
      const cached = getCachedImages();
      if (cached && cached.length > 0) {
        console.log(`🗄️ Recovered ${cached.length} images from cache`);
        setImages(cached);
        setTotalAvailableImages(cached.length);
        setLoading(false);
        return;
      }

      console.log('🚀 Loading images using API-based discovery...');

      // NEW: Use API to fetch ALL files with any name/type
      const allImages = await getAllImagesFromAPI();
      
      // Cache valid data shape
      if (allImages && allImages.length > 0) {
        cacheImages(allImages);
        setImages(allImages);
        setTotalAvailableImages(allImages.length);
      } else {
        // Safe fallback if API returns empty
        console.warn('⚠️ API returned empty images, keeping existing state or rendering blank');
        setImages([]);
        setTotalAvailableImages(0);
      }
      
      console.log(`✅ Loaded ${allImages ? allImages.length : 0} images from ImageKit API`);
      
    } catch (error) {
      console.error('Error loading images:', error);
      // Try cache recovery on error
      const cached = getCachedImages();
      if (cached && cached.length > 0) {
        console.log('🗄️ Recovered images from cache after API error');
        setImages(cached);
        setTotalAvailableImages(cached.length);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [images.length, getCachedImages, cacheImages]); // Added cache dependencies

  // Load all images using API-based discovery (supports any filename)
  const loadAllImagesWithSmartDetection = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚀 Using API-based discovery for all files...');
      
      const allImages = await getAllImagesFromAPI();
      if (allImages && allImages.length > 0) {
        cacheImages(allImages);
        setImages(allImages);
        setTotalAvailableImages(allImages.length);
        console.log(`✅ Loaded ${allImages.length} images from ImageKit API!`);
      }
    } catch (error) {
      console.error('Error loading images from API:', error);
      // Fallback to legacy method if API fails
      console.log('⚠️ Falling back to legacy discovery...');
      try {
        const allImages = await getAllImagesWithRangeDetection();
        if (allImages && allImages.length > 0) {
          cacheImages(allImages);
          setImages(allImages);
          setTotalAvailableImages(allImages.length);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheImages]);

  return {
    images,
    loading,
    totalAvailableImages,
    loadImages,
    loadAllImagesWithSmartDetection,
    setTotalAvailableImages
  };
};