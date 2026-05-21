// ImageKit cache management
import logger from '../../utils/logger';
import { CONFIG, IMAGEKIT_URL_ENDPOINT, getImageKitConfigSignature } from './config';

const CACHE_NAMESPACE = getImageKitConfigSignature();
const getCacheKey = () => `${CONFIG.CACHE_KEY}_${CACHE_NAMESPACE}`;

let imageCache: Map<string, boolean>;

try {
  const cachedData = localStorage.getItem(getCacheKey());
  if (cachedData) {
    imageCache = new Map(JSON.parse(cachedData));
  } else {
    imageCache = new Map<string, boolean>();
  }
} catch (e) {
  logger.warn('Failed to load image cache from localStorage:', e);
  imageCache = new Map<string, boolean>();
}

const saveCache = () => {
  try {
    localStorage.setItem(getCacheKey(), JSON.stringify(Array.from(imageCache.entries())));
  } catch (e) {
    logger.warn('Failed to save image cache to localStorage:', e);
  }
};

// Preload image function for ImageKit
export const preloadImageKit = (imagePath: string): Promise<boolean> => {
  return new Promise(resolve => {
    if (imageCache.get(imagePath)) {
      resolve(true);
      return;
    }
    
    const img = new Image();
    
    const onLoad = () => {
      imageCache.set(imagePath, true);
      saveCache();
      resolve(true);
      cleanup();
    };
    
    const onError = () => {
      resolve(false);
      cleanup();
    };
    
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = onLoad;
    img.onerror = onError;
    img.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
    
    if (img.complete) {
      onLoad();
    }
  });
};

// Mark an image as loaded in the cache
export const markImageLoaded = (imagePath: string): void => {
  imageCache.set(imagePath, true);
  saveCache();
};

// Check if an image is already loaded/cached
export const isImageLoaded = (imagePath: string): boolean => {
  return imageCache.get(imagePath) || false;
};

// Reset the image cache (useful for debugging)
export const resetImageCache = (): void => {
  imageCache.clear();
  saveCache();
};
