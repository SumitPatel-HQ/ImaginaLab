import { useState, useCallback, useEffect } from 'react';
import { preloadImageKit as preloadImage } from '../services/ImageKit';
import type { ImageKitImage as Image } from '../services/ImageKit';

export interface ImageLoadingState {
  loaded: boolean;
  error: boolean;
  placeholderLoaded: boolean;
}

export const useImageState = (image: Image | null, prevImage?: Image | null, nextImage?: Image | null) => {
  const getInitialState = useCallback((): ImageLoadingState => ({
    loaded: false,
    error: false,
    placeholderLoaded: false,
  }), []);

  const [loadingState, setLoadingState] = useState<ImageLoadingState>(getInitialState);

  // Preload adjacent images
  useEffect(() => {
    if (!image) return;
    
    const preloadAdjacentImages = () => {
      const requestIdleCallbackPolyfill = 
        window.requestIdleCallback || 
        ((callback) => setTimeout(callback, 1));
      
      requestIdleCallbackPolyfill(() => {
        if (nextImage?.src) {
          preloadImage(nextImage.src);
        }
        if (prevImage?.src) {
          preloadImage(prevImage.src);
        }
      });
    };
    
    preloadAdjacentImages();
  }, [image, nextImage, prevImage]);

  const handleImageLoad = useCallback(() => {
    setLoadingState({ loaded: true, error: false, placeholderLoaded: false });
  }, []);

  const handleImageError = useCallback(() => {
    setLoadingState({ loaded: false, error: true, placeholderLoaded: false });
  }, []);

  const handlePlaceholderLoad = useCallback(() => {
    setLoadingState(prev => ({ ...prev, placeholderLoaded: true }));
  }, []);

  return {
    loadingState,
    handlers: {
      onImageLoad: handleImageLoad,
      onImageError: handleImageError,
      onPlaceholderLoad: handlePlaceholderLoad,
    },
  };
};