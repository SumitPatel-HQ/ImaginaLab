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
import { useScreenWidth } from '../../hooks/useUtils';

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  const [gridDensity, setGridDensity] = useState(3);

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

  // Determine number of columns based on density and responsive breakpoints
  const columnCount = useMemo(() => {
    return getColumnCount(gridDensity, screenWidth);
  }, [gridDensity, screenWidth]);

  // Compute deterministic masonry columns (prefix-stable: existing cards never move)
  const columns = useMemo(() => {
    if (layoutMode !== 'masonry' || visibleImages.length === 0) {
      return [];
    }
    const layout = buildMasonryLayout(visibleImages, columnCount);
    return layout.columns;
  }, [visibleImages, columnCount, layoutMode]);

  // Map image ID to its overall index for above-the-fold fetch prioritization
  const imageIndicesMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleImages.forEach((img, idx) => map.set(img.id, idx));
    return map;
  }, [visibleImages]);

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

  const handleGoToNext = () => goToNextImage(visibleImages);
  const handleGoToPrev = () => goToPrevImage(visibleImages);
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="max-w-7xl mx-auto relative">
        <Header
          onClose={onClose}
          onToggleLayout={handleToggleLayout}
          gridDensity={gridDensity}
          onGridDensityChange={handleGridDensityChange}
          onSliderStart={handleSliderStart}
        />
        
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
                  className={`flex ${getGapClass(gridDensity)} items-start w-full`}
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
                  className={`grid ${getGridClass('grid', gridDensity)} ${getGapClass(gridDensity)} w-full`}
                  role="region"
                  aria-label="Grid image gallery"
                >
                  {visibleImages.map((image, index) => (
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

                {!hasMore && visibleImages.length > 0 && !isLoadingMore && !loadError && (
                  <p className="text-gray-400 text-sm py-4">
                    You've reached the end of the collection ({visibleImages.length} images)
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
          totalImages={visibleImages.length}
          currentIndex={visibleImages.findIndex(img => img.id === selectedImage.id)}
          enableTilt={false}
          prevImage={null}
          nextImage={null}
        />
      )}
    </div>
  );
};

export default ImageGrid;