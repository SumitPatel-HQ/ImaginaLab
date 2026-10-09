import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Dices, Minus, Plus, Search, Shuffle, X } from 'lucide-react';
import { useScreenWidth } from '../../hooks/useUtils';
import { shouldCollapseSearchOnScroll } from './search';

interface HeaderProps {
  onClose: () => void;
  onToggleLayout: () => void;
  gridDensity: number;
  onGridDensityChange: (density: number) => void;
  onSliderStart: () => void;
  onShuffle: () => void;
  isShuffleDisabled?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  onRandomName: () => void;
  onClearSearch: () => void;
  isSearchDisabled?: boolean;
  isRandomDisabled?: boolean;
  isModalOpen?: boolean;
}

interface SearchFormProps {
  /** Positioning classes — inline grid placement on desktop, fill on mobile. */
  formClassName: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  onRandomName: () => void;
  onClearSearch: () => void;
  isSearchDisabled: boolean;
  isRandomDisabled: boolean;
  isModalOpen: boolean;
  inputRef: React.Ref<HTMLInputElement>;
  formRef: React.Ref<HTMLFormElement>;
}

/**
 * The gallery search form — identical markup and styling wherever it renders.
 * Desktop mounts it inline in the toolbar; mobile mounts it inside the
 * animated expanding overlay. All query/filter state lives in the grid
 * container, so collapsing never loses the search.
 */
const SearchForm: React.FC<SearchFormProps> = ({
  formClassName,
  query,
  onQueryChange,
  onSubmitSearch,
  onRandomName,
  onClearSearch,
  isSearchDisabled,
  isRandomDisabled,
  isModalOpen,
  inputRef,
  formRef,
}) => (
  <form
    ref={formRef}
    role="search"
    aria-label="Search images by name"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmitSearch(query);
    }}
    onKeyDown={(e) => {
      if (e.key === 'Escape' && !isModalOpen) onClearSearch();
    }}
    className={formClassName}
  >
    <label htmlFor="gallery-search" className="sr-only">
      Search images by name
    </label>
    <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white/5 px-4 py-1 text-white/80 focus-within:bg-white/10 sm:flex-none">
      <Search className="w-5 h-5 shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
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
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-white/70 focus-visible:outline-offset-2"
      >
        <Dices className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  </form>
);

const Header: React.FC<HeaderProps> = ({
  onClose,
  gridDensity,
  onGridDensityChange,
  onSliderStart,
  onShuffle,
  isShuffleDisabled = false,
  query,
  onQueryChange,
  onSubmitSearch,
  onRandomName,
  onClearSearch,
  isSearchDisabled = false,
  isRandomDisabled = false,
  isModalOpen = false,
}) => {
  const screenWidth = useScreenWidth();
  const isMobileToolbar = screenWidth < 640;
  const reduceMotion = useReducedMotion();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchFormRef = useRef<HTMLFormElement | null>(null);
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

  // Mobile collapsible search: focus the input as the panel springs open so
  // the keyboard rises alongside the expansion; blur on collapse. Rapid
  // toggles are safe — the pending focus is always cleared first.
  useEffect(() => {
    if (!isMobileToolbar) return;
    if (mobileSearchOpen) {
      if (reduceMotion) {
        searchInputRef.current?.focus({ preventScroll: true });
        return;
      }
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 140);
      return () => window.clearTimeout(timer);
    }
    searchInputRef.current?.blur();
  }, [isMobileToolbar, mobileSearchOpen, reduceMotion]);

  // Mobile collapsible search: an upward scroll collapses the open panel —
  // unless the user is actively typing or interacting with it. Single passive
  // listener, mounted only while the panel is open.
  useEffect(() => {
    if (!isMobileToolbar || !mobileSearchOpen) return;
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const isInteracting =
          searchFormRef.current?.contains(document.activeElement) ?? false;
        const shouldCollapse = shouldCollapseSearchOnScroll(lastY, y, isInteracting);
        lastY = y;
        if (shouldCollapse) setMobileSearchOpen(false);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobileToolbar, mobileSearchOpen]);

  const searchFormProps = {
    query,
    onQueryChange,
    onSubmitSearch,
    onRandomName,
    onClearSearch,
    isSearchDisabled,
    isRandomDisabled,
    isModalOpen,
    inputRef: searchInputRef,
    formRef: searchFormRef,
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
        {/* Mobile-only collapsible search toggle — desktop/tablet keep the inline form. */}
        {isMobileToolbar && (
          <motion.button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-expanded={mobileSearchOpen}
            aria-controls="mobile-search-panel"
            aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
            whileTap={reduceMotion ? undefined : { scale: 0.86 }}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-white/70 focus-visible:outline-offset-2 ${
              mobileSearchOpen
                ? 'bg-white/15 text-white'
                : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        )}
      </div>

      {/* Desktop/tablet: the search form inline in the toolbar, exactly as before. */}
      {!isMobileToolbar && (
        <SearchForm
          {...searchFormProps}
          formClassName="order-3 flex min-w-0 basis-full sm:order-none sm:basis-auto sm:justify-self-center sm:flex-none"
        />
      )}

      {/* Mobile: the same search form in an animated in-flow row below the
          toolbar. Growing the row height pushes the gallery down smoothly
          instead of floating over it. */}
      {isMobileToolbar && (
        <AnimatePresence initial={false}>
          {mobileSearchOpen && (
            <motion.div
              key="mobile-search-row"
              id="mobile-search-panel"
              className="order-3 min-w-0 basis-full overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.38, ease: [0.32, 0.72, 0, 1] }
              }
            >
              <motion.div
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94, y: reduceMotion ? 0 : -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.16 } }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { delay: 0.05, duration: 0.3, ease: 'easeOut' }
                }
                style={{ transformOrigin: '50% 0%' }}
              >
                <SearchForm {...searchFormProps} formClassName="flex min-w-0 flex-1" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

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