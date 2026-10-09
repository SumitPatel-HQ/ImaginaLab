import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
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
import {
  filterImagesByName,
  findExactImageByName,
  formatSearchCount,
  normalizeSearchQuery,
  pickRandomSearchName,
} from './search';
import { useScreenWidth } from '../../hooks/useUtils';

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
    allImages,
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

  // Search state: live input text vs committed (submitted) query.
  // The grid filters only on the committed query to avoid per-keystroke churn.
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [lastRandomIdx, setLastRandomIdx] = useState<number | null>(null);
  const [searchAnnouncement, setSearchAnnouncement] = useState('');

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

  const isSearching = submittedQuery.trim().length > 0;

  // Filter over the widest client truth (everything fetched), not the visible
  // slice, so loaded-but-not-yet-visible names are still found.
  const filteredImages = useMemo(() => {
    if (!isSearching) return null;
    return filterImagesByName(allImages, submittedQuery);
  }, [allImages, submittedQuery, isSearching]);

  // Single source of truth for rendering, index map, and modal navigation.
  const displayImages = filteredImages ?? orderedImages;

  // Compute deterministic masonry columns (prefix-stable: existing cards never move)
  const columns = useMemo(() => {
    if (layoutMode !== 'masonry' || displayImages.length === 0) {
      return [];
    }
    const layout = buildMasonryLayout(displayImages, columnCount);
    return layout.columns;
  }, [displayImages, columnCount, layoutMode]);

  // Map image ID to its overall index for above-the-fold fetch prioritization
  const imageIndicesMap = useMemo(() => {
    const map = new Map<string, number>();
    displayImages.forEach((img, idx) => map.set(img.id, idx));
    return map;
  }, [displayImages]);

  // Sentinel ref for IntersectionObserver infinite scrolling
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Top of the grid region so committed searches return to the results,
  // not just the page top.
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isInitialLoading || isSearching) {
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
  }, [hasMore, isLoadingMore, isInitialLoading, isSearching, fetchMoreData]);

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

  const scrollGridToTop = () => {
    if (typeof window === 'undefined') return;
    const top = gridTopRef.current;
    if (top) top.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  };

  const commitSearch = useCallback((raw: string, opts?: { revealInModal?: boolean }) => {
    const norm = normalizeSearchQuery(raw);
    setSubmittedQuery(norm);
    if (!norm) {
      setSearchAnnouncement('');
      return;
    }
    const matches = filterImagesByName(allImages, norm);
    const exact = findExactImageByName(allImages, norm);
    if (matches.length === 0) {
      setSearchAnnouncement(`No images match "${raw.trim()}".`);
    } else {
      setSearchAnnouncement(formatSearchCount(matches.length, raw, allImages.length, hasMore));
    }
    // Reveal a lone exact filename/title hit in the modal — only for
    // explicit submits (Enter), never for Random picks.
    if (opts?.revealInModal && matches.length === 1 && exact) {
      openModal(exact);
    }
    scrollGridToTop();
  }, [allImages, hasMore, openModal]);

  const handleSubmitSearch = useCallback((raw: string) => {
    commitSearch(raw, { revealInModal: true });
  }, [commitSearch]);

  const handleRandomName = useCallback(() => {
    if (isInitialLoading || allImages.length < 2) return;
    const picked = pickRandomSearchName(allImages, lastRandomIdx);
    if (!picked) return;
    setLastRandomIdx(picked.index);
    // Fill the input AND filter the grid so every click reveals a new
    // image — but never pop the modal; that is reserved for Enter submits.
    setQuery(picked.name);
    commitSearch(picked.name);
    const matches = filterImagesByName(allImages, picked.name);
    setSearchAnnouncement(
      `Random pick: ${picked.name}. ${formatSearchCount(matches.length, picked.name, allImages.length, hasMore)} Press Enter to open it.`
    );
  }, [allImages, commitSearch, hasMore, isInitialLoading, lastRandomIdx]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
    setSearchAnnouncement('');
    scrollGridToTop();
  }, []);

  const isSearchDisabled = isInitialLoading;
  const isRandomDisabled = isInitialLoading || allImages.length < 2;

  const handleGoToNext = () => goToNextImage(displayImages);
  const handleGoToPrev = () => goToPrevImage(displayImages);
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div ref={gridTopRef} className="max-w-7xl mx-auto relative scroll-mt-2">
        <Header
          onClose={onClose}
          onToggleLayout={handleToggleLayout}
          gridDensity={gridDensity}
          onGridDensityChange={handleGridDensityChange}
          onSliderStart={handleSliderStart}
          onShuffle={handleShuffle}
          isShuffleDisabled={isShuffleDisabled}
          query={query}
          onQueryChange={setQuery}
          onSubmitSearch={handleSubmitSearch}
          onRandomName={handleRandomName}
          onClearSearch={handleClearSearch}
          isSearchDisabled={isSearchDisabled}
          isRandomDisabled={isRandomDisabled}
          isModalOpen={selectedImage !== null}
        />
        <div aria-live="polite" role="status" className="sr-only">
          {shuffleAnnouncement} {searchAnnouncement}
        </div>
        {isSearching && (
          <div className="px-4 sm:px-6 pb-2 flex flex-wrap items-center gap-2 text-sm">
            <p aria-hidden="true" className="text-gray-300">
              {formatSearchCount(filteredImages?.length ?? 0, submittedQuery, allImages.length, hasMore)}
            </p>
            <button
              onClick={handleClearSearch}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}
        
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
              {isSearching && filteredImages?.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-gray-300 text-sm">
                    No images match &ldquo;{submittedQuery}&rdquo;
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
              <>
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
                  {displayImages.map((image, index) => (
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

              {/* Infinite Scroll Sentinel and Feedback UI (paused while searching) */}
              {!isSearching && (
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

                {!hasMore && displayImages.length > 0 && !isLoadingMore && !loadError && (
                  <p className="text-gray-400 text-sm py-4">
                    You&apos;ve reached the end of the collection ({displayImages.length} images)
                  </p>
                )}
              </div>
              )}
              </>
              )}
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
          totalImages={displayImages.length}
          currentIndex={displayImages.findIndex(img => img.id === selectedImage.id)}
          enableTilt={false}
          prevImage={null}
          nextImage={null}
        />
      )}
    </div>
  );
};

export default ImageGrid;