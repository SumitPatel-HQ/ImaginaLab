import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Minus, Plus, Shuffle } from 'lucide-react';

interface HeaderProps {
  onClose: () => void;
  onToggleLayout: () => void;
  gridDensity: number;
  onGridDensityChange: (density: number) => void;
  onSliderStart: () => void;
  onShuffle: () => void;
  isShuffleDisabled?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onClose,
  gridDensity,
  onGridDensityChange,
  onSliderStart,
  onShuffle,
  isShuffleDisabled = false
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
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 sticky top-2 z-50 py-2 px-4 sm:px-6 backdrop-blur-sm bg-black/5 shadow-3xl rounded-full">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:block">Back</span>
        </button>
        <button
          onClick={onShuffle}
          disabled={isShuffleDisabled}
          aria-label="Shuffle gallery layout"
          title="Shuffle gallery layout"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-white/70 focus-visible:outline-offset-2"
        >
          <Shuffle className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:block">Shuffle</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
       
        
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