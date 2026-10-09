import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { ImageKitImage as Image } from '../../services/ImageKit';
import ImageModal from '../ImageModal';
import ScrollToTop from '../ScrollToTop';
import { GridSkeleton } from '../loading-placeholders';
import Header from './Header';
import ImageCard from './ImageCard';
import { useImageGrid } from './useImageGrid';
import { useModal } from './useModal';
import { useSliderControl } from './slider';
import { getGridClass, getGapClass } from './utils';
import { buildMasonryLayout, getColumnCount } from './masonry';
import { shuffleOrder } from './shuffle';
import { useScreenWidth } from '../../hooks/useUtils';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  // Mobile (<640px) starts at lowest density (1 col); tablets & desktop share default (3).
  const [gridDensity, setGridDensity] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 3
  );

  // Device screen width
  const screenWidth = useScreenWidth();

  // Custom data and interaction hooks
  const { 
    visibleImages, 
    hasMore, 
    isInitialLoading, 
    isLoadingMore, 
    loadError, 
    fetchMoreData, 
    retryFetchMore 
  } = useImageGrid(images);

  const { selectedImage, openModal, closeModal, goToNextImage, goToPrevImage } = useModal();
  const { handleSliderStart } = useSliderControl();
  const { isInstallable, installApp } = usePWAInstall();

  // Shuffle state: generation counter triggers exactly one reorder per activation.
  // The backing `visibleImages` (infinite-scroll source of truth) is never reordered;
  // only this derived ordered view is shuffled. Newly fetched pages append in fetch
  // order after a shuffle; the user may reshuffle at any time.
  const [shuffleGeneration, setShuffleGeneration] = useState(0);
  const [orderedImages, setOrderedImages] = useState<Image[]>(() => visibleImages);
  const [shuffleAnnouncement, setShuffleAnnouncement] = useState('');
  const [shuffleFlash, setShuffleFlash] = useState(false);
  const lastShuffleAppliedRef = useRef(0);
  const flashTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastShuffleAppliedRef.current !== shuffleGeneration) {
      lastShuffleAppliedRef.current = shuffleGeneration;
      setOrderedImages(shuffleOrder(visibleImages));
      return;
    }
    // Append-only sync: preserve the shuffled order of existing cards and
    // append newly fetched images in fetch order without auto-reshuffling.
    // If the backing source diverges (any ordered id missing from it, e.g. a
    // new collection), reset to source order instead of appending.
    setOrderedImages((prev) => {
      const visibleIds = new Set(visibleImages.map((img) => img.id));
      const hasDiverged = prev.some((img) => !visibleIds.has(img.id));
      if (hasDiverged) {
        return [...visibleImages];
      }
      const seen = new Set(prev.map((img) => img.id));
      const delta = visibleImages.filter((img) => img && img.id && !seen.has(img.id));
      if (delta.length === 0) {
        return prev;
      }
      return [...prev, ...delta];
    });
  }, [visibleImages, shuffleGeneration]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  // Determine number of columns based on density and responsive breakpoints
  const columnCount = useMemo(() => {
    return getColumnCount(gridDensity, screenWidth);
  }, [gridDensity, screenWidth]);

  // Compute deterministic masonry columns (prefix-stable: existing cards never move)
  const columns = useMemo(() => {
    if (layoutMode !== 'masonry' || orderedImages.length === 0) {
      return [];
    }
    const layout = buildMasonryLayout(orderedImages, columnCount);
    return layout.columns;
  }, [orderedImages, columnCount, layoutMode]);

  // Map image ID to its overall index for above-the-fold fetch prioritization
  const imageIndicesMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedImages.forEach((img, idx) => map.set(img.id, idx));
    return map;
  }, [orderedImages]);

  // Sentinel ref for IntersectionObserver infinite scrolling
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isInitialLoading) {
      return;
    }

    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreData();
        }
      },
      {
        root: null,
        rootMargin: '400px', // Prefetch before user reaches bottom
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, isInitialLoading, fetchMoreData]);

  // Handler functions
  const handleToggleLayout = () => {
    setLayoutMode(prev => prev === 'grid' ? 'masonry' : 'grid');
  };

  const handleGridDensityChange = (density: number) => {
    setGridDensity(density);
  };

  // Disabled state derives from the backing source: initial loading status and
  // visible count threshold (fewer than two images means nothing to reorder).
  const isShuffleDisabled = isInitialLoading || visibleImages.length < 2;

  const handleShuffle = () => {
    if (isShuffleDisabled) {
      return;
    }
    setShuffleGeneration((prev) => prev + 1);
    setShuffleAnnouncement(`Gallery order shuffled, showing ${visibleImages.length} images.`);
    setShuffleFlash(true);
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      setShuffleFlash(false);
      flashTimeoutRef.current = null;
    }, 350);
  };

  // Simple fade feedback on the gallery region after a shuffle (no remount, so
  // card identity and loaded state are preserved). Shared by both layouts.
  const galleryFadeClass = `transition-opacity duration-300 ${shuffleFlash ? 'opacity-40' : 'opacity-100'}`;

  const handleGoToNext = () => goToNextImage(orderedImages);
  const handleGoToPrev = () => goToPrevImage(orderedImages);
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="max-w-7xl mx-auto relative">
        <Header
          onClose={onClose}
          onToggleLayout={handleToggleLayout}
          gridDensity={gridDensity}
          onGridDensityChange={handleGridDensityChange}
          onSliderStart={handleSliderStart}
          onShuffle={handleShuffle}
          isShuffleDisabled={isShuffleDisabled}
          isInstallable={isInstallable}
          onInstall={installApp}
        />
        <div aria-live="polite" role="status" className="sr-only">
          {shuffleAnnouncement}
        </div>
        
        <div className="p-4 sm:p-6 pt-0">
          {/* Initial Loading Skeleton */}
          {isInitialLoading ? (
            <GridSkeleton 
              layoutMode={layoutMode}
              gridDensity={gridDensity}
              count={columnCount * 6}
            />
          ) : (
            <div className="w-full">
              {layoutMode === 'masonry' ? (
                /* Stable Masonry Column Layout */
                <div 
                  className={`flex ${getGapClass(gridDensity)} items-start w-full ${galleryFadeClass}`}
                  role="region"
                  aria-label="Masonry image gallery"
                >
                  {columns.map((columnImages, colIndex) => (
                    <div 
                      key={`masonry-col-${colIndex}`}
                      className={`flex-1 flex flex-col ${getGapClass(gridDensity)} min-w-0`}
                    >
                      {columnImages.map((image) => (
                        <ImageCard
                          key={image.id}
                          image={image}
                          layoutMode="masonry"
                          onImageClick={openModal}
                          index={imageIndicesMap.get(image.id)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                /* Standard Uniform Grid Layout */
                <div 
                  className={`grid ${getGridClass('grid', gridDensity)} ${getGapClass(gridDensity)} w-full ${galleryFadeClass}`}
                  role="region"
                  aria-label="Grid image gallery"
                >
                  {orderedImages.map((image, index) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      layoutMode="grid"
                      onImageClick={openModal}
                      index={index}
                    />
                  ))}
                </div>
              )}

              {/* Infinite Scroll Sentinel and Feedback UI */}
              <div 
                ref={sentinelRef} 
                className="py-8 flex flex-col items-center justify-center w-full min-h-[60px]"
              >
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more images...</span>
                  </div>
                )}

                {loadError && !isLoadingMore && (
                  <div className="flex flex-col items-center gap-2 text-red-300 bg-red-950/40 border border-red-500/20 px-5 py-3 rounded-xl max-w-md text-center">
                    <span className="text-sm">{loadError}</span>
                    <button 
                      onClick={retryFetchMore}
                      className="px-4 py-1.5 text-xs bg-red-500/30 hover:bg-red-500/50 text-white rounded-full transition-colors cursor-pointer mt-1"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!hasMore && orderedImages.length > 0 && !isLoadingMore && !loadError && (
                  <p className="text-gray-400 text-sm py-4">
                    You've reached the end of the collection ({orderedImages.length} images)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ScrollToTop />

      {/* Image Modal for Full-View */}
      {selectedImage && (
        <ImageModal 
          key={selectedImage.id}
          image={selectedImage} 
          onClose={closeModal}
          onNext={handleGoToNext}
          onPrev={handleGoToPrev}
          totalImages={orderedImages.length}
          currentIndex={orderedImages.findIndex(img => img.id === selectedImage.id)}
          enableTilt={false}
          prevImage={null}
          nextImage={null}
        />
      )}
    </div>
  );
};

export default ImageGrid;