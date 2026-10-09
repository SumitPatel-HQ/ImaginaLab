import { useState, useEffect, useCallback, useRef } from 'react';
import { getImagesPageFromAPI, type ImageKitImage as Image } from '../../services/ImageKit';
import { mergeUniqueImages } from './dedupe';
import logger from '../../utils/logger';

interface UseImageGridReturn {
  allImages: Image[];
  visibleImages: Image[];
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  fetchMoreData: () => Promise<void>;
  retryFetchMore: () => Promise<void>;
}

const INITIAL_LOAD = 30;
const IMAGES_PER_LOAD = 15;

export const useImageGrid = (initialImages: Image[]): UseImageGridReturn => {
  const hasInitialImages = Boolean(initialImages && initialImages.length > 0);

  const [allImages, setAllImages] = useState<Image[]>(() => initialImages || []);
  const [visibleImages, setVisibleImages] = useState<Image[]>(() => 
    hasInitialImages ? initialImages.slice(0, INITIAL_LOAD) : []
  );
  const [hasMore, setHasMore] = useState<boolean>(() => 
    hasInitialImages ? initialImages.length > INITIAL_LOAD : true
  );
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => !hasInitialImages);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References to prevent stale closures and overlapping calls
  const isLoadingMoreRef = useRef(false);
  const allImagesRef = useRef(allImages);
  const visibleImagesRef = useRef(visibleImages);
  const apiHasMoreRef = useRef(true);

  // Keep refs synchronized with state in an effect
  useEffect(() => {
    allImagesRef.current = allImages;
    visibleImagesRef.current = visibleImages;
  }, [allImages, visibleImages]);

  // Initial load effect (only triggers when initialImages is empty)
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      return;
    }

    let isCancelled = false;

    const loadInitialBatch = async () => {
      try {
        setIsInitialLoading(true);
        setLoadError(null);
        logger.log('🔍 Loading initial batch from ImageKit API...');

        const page = await getImagesPageFromAPI(0, INITIAL_LOAD);
        if (isCancelled) return;

        logger.log(`✅ Loaded initial batch of ${page.images.length} images`);
        setAllImages(page.images);
        setVisibleImages(page.images);
        apiHasMoreRef.current = page.hasMore;
        setHasMore(page.hasMore);
      } catch (error) {
        if (isCancelled) return;
        logger.error('❌ Failed to load initial images:', error);
        setLoadError('Failed to load images. Please check your connection and retry.');
        setHasMore(false);
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    loadInitialBatch();

    return () => {
      isCancelled = true;
    };
  }, [initialImages]);

  // Load more images (from in-memory allImages or next API page)
  const fetchMoreData = useCallback(async () => {
    // Prevent overlapping pagination requests
    if (isLoadingMoreRef.current || isInitialLoading) {
      return;
    }

    const currentVisible = visibleImagesRef.current;
    const currentAll = allImagesRef.current;

    // 1. If we have remaining images in memory, slice them directly without delay
    if (currentVisible.length < currentAll.length) {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setLoadError(null);

      const nextSlice = currentAll.slice(
        currentVisible.length,
        currentVisible.length + IMAGES_PER_LOAD
      );

      setVisibleImages(prev => mergeUniqueImages(prev, nextSlice));
      const hasMoreInMemory = currentVisible.length + nextSlice.length < currentAll.length;
      setHasMore(hasMoreInMemory || apiHasMoreRef.current);

      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      return;
    }

    // 2. If memory is exhausted but API has more, fetch the next page from API
    if (apiHasMoreRef.current) {
      try {
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
        setLoadError(null);

        const skip = currentAll.length;
        logger.log(`📦 Fetching next page from API (skip: ${skip}, limit: ${IMAGES_PER_LOAD})...`);

        const page = await getImagesPageFromAPI(skip, IMAGES_PER_LOAD);
        apiHasMoreRef.current = page.hasMore;

        setAllImages(prev => mergeUniqueImages(prev, page.images));
        setVisibleImages(prev => mergeUniqueImages(prev, page.images));
        setHasMore(page.hasMore);
      } catch (error) {
        logger.error('❌ Failed to load more images:', error);
        setLoadError('Could not load additional images. Click to retry.');
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
      return;
    }

    // 3. No more images anywhere
    setHasMore(false);
  }, [isInitialLoading]);

  // Retry action for failed requests
  const retryFetchMore = useCallback(async () => {
    setLoadError(null);
    await fetchMoreData();
  }, [fetchMoreData]);

  return {
    allImages,
    visibleImages,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    loadError,
    fetchMoreData,
    retryFetchMore
  };
};