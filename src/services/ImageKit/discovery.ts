// Image discovery algorithms
import logger from '../../utils/logger';
import type { ImageRange } from './types';
import { CONFIG, getImageKitPath, testImageExists } from './config';
import { getAllFilesFromFolder } from './api';

export const findImageRangeFromAPI = async (): Promise<ImageRange> => {
  logger.log('🔍 Using ImageKit API for range detection...');
  
  try {
    const files = await getAllFilesFromFolder(import.meta.env.VITE_IMAGEKIT_PATH_PREFIX || '/AP/');
    logger.log(`✅ Found ${files.length} files from ImageKit API`);
    
    return {
      min: 1,
      max: files.length
    };
  } catch (error) {
    logger.error('❌ Error in API-based range detection:', error);
    logger.log('⚠️ Falling back to legacy binary search...');
    return findImageRange();
  }
};

export const findImageRange = async (): Promise<ImageRange> => {
  logger.log('🔍 Starting range detection...');
  
  let low = 1;
  let high = 1000;
  let maxFound = 0;
  
  while (high <= CONFIG.MAX_RANGE) {
    logger.log(`🧪 Testing image ${high}...`);
    const imagePath = getImageKitPath(high);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1500))
    ]);
    
    if (exists) {
      maxFound = high;
      logger.log(`✅ Found image ${high}, expanding search...`);
      high *= 2;
    } else {
      logger.log(`❌ Image ${high} not found, starting binary search...`);
      break;
    }
  }
  
  const searchLow = maxFound;
  const searchHigh = Math.min(high, CONFIG.MAX_RANGE);
  
  logger.log(`🎯 Binary search between ${searchLow} and ${searchHigh}...`);
  
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    logger.log(`🔍 Testing midpoint: ${mid}`);
    
    const imagePath = getImageKitPath(mid);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    
    if (exists) {
      low = mid;
      maxFound = mid;
      logger.log(`✅ Image ${mid} exists, searching higher...`);
    } else {
      high = mid - 1;
      logger.log(`❌ Image ${mid} missing, searching lower...`);
    }
  }
  
  logger.log(`🏁 Final range detected: 1 to ${maxFound}`);
  return { min: 1, max: maxFound };
};

export const getEstimatedImageCount = async (): Promise<number> => {
  logger.log('📊 Estimating total image count with sampling...');
  
  let maxFound = 0;
  let consecutiveGaps = 0;
  
  for (let i = CONFIG.SAMPLE_INTERVAL; i <= 2000; i += CONFIG.SAMPLE_INTERVAL) {
    const imagePath = getImageKitPath(i);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 800))
    ]);
    
    if (exists) {
      maxFound = i;
      consecutiveGaps = 0;
      logger.log(`✅ Sample found at ${i}`);
    } else {
      consecutiveGaps++;
      if (consecutiveGaps >= 3) {
        logger.log(`🔍 Stopping sampling at ${i}, last found: ${maxFound}`);
        break;
      }
    }
  }
  
  const estimate = maxFound + (CONFIG.SAMPLE_INTERVAL * 2);
  logger.log(`📈 Estimated ~${estimate} images based on sampling`);
  return estimate;
};

// Get total count estimation (legacy function)
export const getTotalImageCount = async (): Promise<number> => {
  let maxFound = 0;
  for (let i = 10; i <= 500; i += 10) {
    const imagePath = getImageKitPath(i);
    const exists = await testImageExists(imagePath);
    if (exists) {
      maxFound = i;
    } else if (i - maxFound > 50) {
      break;
    }
  }
  
  return Math.min(maxFound + 20, 500);
};
