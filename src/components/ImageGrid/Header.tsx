import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onClose: () => void;
  onToggleLayout: () => void;
  gridDensity: number;
  onGridDensityChange: (density: number) => void;
  onSliderStart: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onClose,
  gridDensity,
  onGridDensityChange,
  onSliderStart
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
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:block">Back</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
       
        
        {/* Density Controls */}
        <div className=" flex items-center gap-2 bg-white/10 rounded-full backdrop-blur-sm py-2 px-4">
        {/* minus button */}
          <button 
            onClick={() => onGridDensityChange(Math.max(1, gridDensity - 1))}
            disabled={gridDensity <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease density"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
</svg>

          </button>
          
          {/* Slider */}
          <div 
            ref={sliderTrackRef}
            className="w-28 h-2 bg-linear-to-r from-indigo-400 to-purple-500 rounded-full relative cursor-pointer"
            onMouseDown={handleSliderClick}
            role="slider"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={gridDensity}
          >
            <div 
              className="absolute top-1/2 w-4 h-4 rounded-full bg-white shadow-md cursor-pointer -translate-y-1/2 -translate-x-1/2 will-change-transform"
              style={{ 
                left: `${thumbPosition}%`
              }}
            />
          </div>
          
          {/* plus button */}
          <button 
            onClick={() => onGridDensityChange(Math.min(5, gridDensity + 1))}
            disabled={gridDensity >= 5}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase density"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;