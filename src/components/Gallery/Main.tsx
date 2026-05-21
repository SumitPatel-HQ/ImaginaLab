import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card } from '../loading-placeholders';
import ImageModal from '../ImageModal';
import Controls from './Controls';
import type { ImageKitImage } from '../../services/ImageKit';

interface MainGalleryViewProps {
  images: ImageKitImage[];
  currentIndex: number;
  isDragging: boolean;
  dragOffset: number;
  isMobile: boolean;
  isTransitioning: boolean;
  showModal: boolean;
  adjacentImages: {
    prevImage: ImageKitImage | null;
    nextImage: ImageKitImage | null;
  };
  visibleIndicators: number[];
  loading: boolean;
  galleryRef: React.RefObject<HTMLDivElement | null>;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  openImageModal: () => void;
  closeImageModal: () => void;
  prevImage: () => void;
  nextImage: () => void;
  handleRandomImage: () => void;
  openGrid: () => void;
  loadAllImagesWithSmartDetection: () => void;
  setCurrentIndex: (index: number) => void;
}

export const MainGalleryView: React.FC<MainGalleryViewProps> = ({
  images,
  currentIndex,
  isDragging,
  dragOffset,
  isMobile,
  isTransitioning,
  showModal,
  adjacentImages,
  visibleIndicators,
  loading,
  galleryRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  openImageModal,
  closeImageModal,
  prevImage,
  nextImage,
  handleRandomImage,
  openGrid,
  loadAllImagesWithSmartDetection,
  setCurrentIndex
}) => (
  <div 
    ref={galleryRef}
    className="fixed inset-0 flex flex-col bg-linear-to-br from-gray-900 via-gray-800 to-indigo-900 overflow-hidden"
    style={{ overscrollBehavior: 'none', touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
  >
    <div 
      className={`w-full h-full relative ${isTransitioning ? 'pointer-events-none' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main image display area */}
      <div className="relative h-full w-full">
        <div 
          className="relative w-full h-full"
          style={{ perspective: '1000px' }}
        >
          {images.map((image, index) => {
            // Safe index validation
            const safeCurrentIndex = Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < images.length 
              ? currentIndex 
              : 0;

            // Only render images that are close to current index for performance
            const diff = Math.abs(index - safeCurrentIndex);
            const shouldRender = diff <= 2 || 
                               (safeCurrentIndex === 0 && index >= images.length - 2) ||
                               (safeCurrentIndex >= images.length - 2 && index <= 2);
            
            if (!shouldRender || !image) return null;
            
            return (
              <div
                key={image.id || `fallback-img-key-${index}`}
                className="absolute inset-0"
              >
                <Card
                  image={image}
                  index={index}
                  activeIndex={safeCurrentIndex}
                  totalImages={images.length}
                  isDragging={isDragging}
                  isMobile={isMobile}
                  dragOffset={dragOffset}
                  onClick={index === safeCurrentIndex ? openImageModal : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Navigation Controls */}
      <Controls
        onPrev={prevImage}
        onNext={nextImage}
        onRandom={handleRandomImage}
        onOpenGrid={openGrid}
        onLoadAll={loadAllImagesWithSmartDetection}
        loading={loading}
        currentIndex={currentIndex}
        visibleIndicators={visibleIndicators}
        onIndicatorClick={setCurrentIndex}
      />
    </div>

    {/* Image Modal */}
    <AnimatePresence>
      {showModal && (
        <ImageModal
          key={images[currentIndex]?.id ?? currentIndex}
          image={images[currentIndex]}
          onClose={closeImageModal}
          onNext={nextImage}
          onPrev={prevImage}
          totalImages={images.length}
          currentIndex={currentIndex}
          enableTilt={!isMobile}
          prevImage={adjacentImages.prevImage}
          nextImage={adjacentImages.nextImage}
        />
      )}
    </AnimatePresence>
  </div>
);