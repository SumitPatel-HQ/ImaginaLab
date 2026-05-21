// Optimized ImageKit-powered image gallery
import { useSyncExternalStore, useCallback } from 'react';
import ImageGrid from '../ImageGrid';
import { useGalleryState } from './state';
import { LoadingState } from './Loading';
import { MainGalleryView } from './Main';

const Gallery = () => {
  const galleryState = useGalleryState();
  const mounted = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );

  if (!mounted) {
    return <LoadingState />;
  }

  // Proper loading gate: check if loading or if we have no images (which shouldn't happen unless loading or error)
  if (galleryState.loading || !galleryState.images || galleryState.images.length === 0) {
    return <LoadingState />;
  }

  // Grid view
  if (galleryState.showGrid) {
    return <ImageGrid images={galleryState.images} onClose={() => galleryState.setShowGrid(false)} />;
  }

  // Main gallery view
  return <MainGalleryView {...galleryState} />;
};

export default Gallery;
