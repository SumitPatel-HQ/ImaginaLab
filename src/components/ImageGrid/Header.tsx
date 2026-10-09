import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Dices, Minus, Plus, Search, Shuffle, MonitorDown, X } from 'lucide-react';

interface HeaderProps {
  onClose: () => void;
  onToggleLayout: () => void;
  gridDensity: number;
  onGridDensityChange: (density: number) => void;
  onSliderStart: () => void;
  onShuffle: () => void;
  isShuffleDisabled?: boolean;
  /** Called when the user clicks the in-page install button. */
  onInstall?: () => void;
  /** True when Chrome has determined the app is installable and not yet installed. */
  isInstallable?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  onRandomName: () => void;
  onClearSearch: () => void;
  isSearchDisabled?: boolean;
  isRandomDisabled?: boolean;
  /** True while the image modal is open — Escape then closes the modal, not the search. */
  isModalOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onClose,
  gridDensity,
  onGridDensityChange,
  onSliderStart,
  onShuffle,
  isShuffleDisabled = false,
  onInstall,
  isInstallable = false,
  query,
  onQueryChange,
  onSubmitSearch,
  onRandomName,
  onClearSearch,
  isSearchDisabled = false,
  isRandomDisabled = false,
  isModalOpen = false,
}) => {
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const initialThumbPosition = ((gridDensity - 1) / 4) * 100;
  const animationFrameRef = useRef<number | null>(null);
  const thumbPositionRef = useRef(initialThumbPosition);
  const [thumbPosition, setThumbPosition] = useState(initialThumbPosition);

  useEffect(() => {
    const targetPosition = ((gridDensity - 1) / 4) * 100;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startPosition = thumbPositionRef.current;
    const startTime = performance.now();
    const duration = 220;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextPosition = startPosition + (targetPosition - startPosition) * easedProgress;

      thumbPositionRef.current = nextPosition;
      setThumbPosition(nextPosition);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gridDensity]);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderTrackRef.current) return;
    
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    const newDensity = Math.round(percentage * 4) + 1;
    onGridDensityChange(newDensity);
    onSliderStart();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-4 sticky top-2 z-50 py-2 px-4 sm:px-6 backdrop-blur-sm bg-black/5 shadow-3xl rounded-3xl sm:grid sm:grid-cols-[1fr_auto_1fr] sm:rounded-full">
      <div className="flex items-center gap-4 sm:justify-self-start">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden font-light sm:block">Back</span>
        </button>
        <button
          onClick={onShuffle}
          disabled={isShuffleDisabled}
          aria-label="Shuffle gallery layout"
          title="Shuffle gallery layout"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-white/70 focus-visible:outline-offset-2"
        >
          <Shuffle className="w-5 h-5" aria-hidden="true" />
          <span className="hidden font-light sm:block">Shuffle</span>
        </button>

        {/* PWA Install button — only rendered when Chrome fires beforeinstallprompt */}
        {isInstallable && onInstall && (
          <button
            onClick={onInstall}
            aria-label="Install ImaginaLab application"
            title="Install App"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 hover:border-indigo-400/60 rounded-full transition-all duration-200 text-indigo-300 hover:text-indigo-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-400 focus-visible:outline-offset-2"
          >
            <MonitorDown className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:block">Install</span>
          </button>
        )}
      </div>

      <form
        role="search"
        aria-label="Search images by name"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitSearch(query);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isModalOpen) onClearSearch();
        }}
        className="order-3 flex min-w-0 basis-full sm:order-none sm:basis-auto sm:justify-self-center sm:flex-none"
      >
        <label htmlFor="gallery-search" className="sr-only">
          Search images by name
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-white/80 focus-within:bg-white/10 sm:flex-none">
          <Search className="w-5 h-5 shrink-0" aria-hidden="true" />
          <input
            id="gallery-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search image..."
            disabled={isSearchDisabled}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40 disabled:opacity-40 sm:w-48 sm:flex-none"
          />
          {query && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="cursor-pointer rounded-full p-0.5"
            >
              <X className="w-5 h-5 text-white/40 hover:text-white/80 transition-all duration-200" aria-hidden="true" />
            </button>
          )}
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-white/10" />
          <button
            type="button"
            onClick={onRandomName}
            disabled={isRandomDisabled}
            aria-label="Fill search with a random image name"
            title="Random image name"
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-white/70 focus-visible:outline-offset-2"
          >
            <Dices className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-4 sm:justify-self-end">

        
        {/* Density Controls */}
        <div className="flex items-center gap-2 rounded-full bg-black/5 backdrop-blur-sm py-1.5 px-3">
        {/* minus button */}
          <button 
            onClick={() => onGridDensityChange(Math.max(1, gridDensity - 1))}
            disabled={gridDensity <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Decrease density"
          >
            <Minus className="w-4 h-4" />

          </button>
          
          {/* Slider */}
          <div 
            ref={sliderTrackRef}
            className="w-20 h-1 bg-linear-to-r from-indigo-400/70 to-purple-500/70 rounded-full relative cursor-pointer"
            onMouseDown={handleSliderClick}
            role="slider"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={gridDensity}
          >
            <div 
              className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white cursor-pointer -translate-y-1/2 -translate-x-1/2 will-change-transform"
              style={{ 
                left: `${thumbPosition}%`
              }}
            />
          </div>
          
          {/* plus button */}
          <button 
            onClick={() => onGridDensityChange(Math.min(5, gridDensity + 1))}
            disabled={gridDensity >= 5}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Increase density"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;