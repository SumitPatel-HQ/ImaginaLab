import React, { useState, useCallback, useEffect } from 'react';
import { Image as IKImage } from '@imagekit/react';
import { type ImageKitImage as ImageType, IMAGEKIT_URL_ENDPOINT } from '../../services/ImageKit';
import { 
  RESPONSIVE_SIZES, 
  getAspectRatioClass, 
  getCardPosition, 
  IMAGE_TRANSFORMATIONS 
} from './CardUtils';

interface CardProps {
  image: ImageType;
  index: number;
  activeIndex: number;
  totalImages: number;
  isDragging?: boolean;
  isMobile?: boolean;
}

const Card: React.FC<CardProps> = React.memo(({ 
  image, 
  index, 
  activeIndex, 
  totalImages, 
  isDragging = false, 
  isMobile = false 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Safety fallback for cached images where onLoad might not fire
  useEffect(() => {
    if (!cardRef.current || loaded) return;
    
    // Check if the main image is already complete (loaded from browser cache)
    const images = cardRef.current.querySelectorAll('img');
    images.forEach(img => {
      // The second image is usually the main high-quality one
      if (img.complete && img.src && img.src.includes(image.src)) {
        setLoaded(true);
        setShowSkeleton(false);
      }
    });
    
    // Also set a polling interval just in case React's synthetic event misses it
    const interval = setInterval(() => {
      const imgs = cardRef.current?.querySelectorAll('img');
      if (imgs) {
        let anyComplete = false;
        imgs.forEach(img => {
          // If the image has a src and is complete (and naturalWidth > 0 ensures it's not a broken image)
          if (img.complete && img.naturalWidth > 0 && (img.src.includes('imagekit') || img.src.includes('tr='))) {
            anyComplete = true;
          }
        });
        
        if (anyComplete) {
          setLoaded(true);
          setShowSkeleton(false);
          clearInterval(interval);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [image.src, loaded]);

  // Reset loading state when image source changes (e.g., on shuffle)
  useEffect(() => {
    setLoaded(false);
    setPlaceholderLoaded(false);
    setShowSkeleton(true);
  }, [image.src]);

  const handleMainImageLoad = useCallback(() => {
    setLoaded(true);
    setTimeout(() => setShowSkeleton(false), 100);
  }, []);

  const handlePlaceholderLoad = useCallback(() => {
    setPlaceholderLoaded(true);
  }, []);

  const handleImageError = useCallback((e: any) => {
    console.error(`🚨 Image failed to load: ${image.src}`, e);
    // Don't just hide everything. Show a visible fallback state.
    setLoaded(true); // Force loaded to true so opacity becomes 100
    setPlaceholderLoaded(true);
    setShowSkeleton(false);
  }, [image.src]);

  const aspectRatioClass = getAspectRatioClass(image.ratio);
  const cardPosition = getCardPosition(index, activeIndex, totalImages, isDragging, isMobile);
  const isActive = index === activeIndex;

  return (
    <div 
      ref={cardRef}
      className="absolute left-1/2 top-1/2 will-change-transform" 
      style={{
        ...cardPosition,
        transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* Skeleton placeholder */}
        {showSkeleton && (
          <div 
            className={`${RESPONSIVE_SIZES} ${aspectRatioClass} bg-gray-800/80 relative overflow-hidden rounded-xl object-cover`}
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        )}

        {/* Low-quality placeholder */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt=""
          loading="eager"
          className={`absolute inset-0 w-full h-full object-cover blur-sm transition-opacity duration-500 z-10 ${placeholderLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handlePlaceholderLoad}
          onError={handleImageError}
          transformation={IMAGE_TRANSFORMATIONS.placeholder}
        />

        {/* Main image - Ultra High Quality */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt={image.title || "Gallery Image"}
          loading="eager"
          className={`${RESPONSIVE_SIZES} ${aspectRatioClass} object-cover transition-opacity duration-500 z-20 relative ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            imageRendering: 'high-quality',
            WebkitFontSmoothing: 'antialiased',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)', // Hardware acceleration
            filter: 'contrast(1.02) saturate(1.02)', // Slight enhancement
          }}
          onLoad={handleMainImageLoad}
          onError={handleImageError}
          transformation={IMAGE_TRANSFORMATIONS.main}
        />
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;