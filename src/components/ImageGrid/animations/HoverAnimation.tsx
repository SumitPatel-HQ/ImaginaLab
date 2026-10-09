import React, { memo } from 'react';
import { useHoverAnimation } from './useHoverAnimation';
import './hoverFix.css';

interface HoverAnimationProps {
  children: React.ReactNode;
  imageUrl: string;
  title: string;
  className?: string;
  layoutMode: 'grid' | 'masonry';
  onImageClick: () => void;
}

const HoverAnimation: React.FC<HoverAnimationProps> = memo(({
  children,
  imageUrl,
  title,
  className = '',
  onImageClick
}) => {
  const {
    cardRef,
    handleMouseEnter,
    handleMouseLeave,
    config,
    supportsHover
  } = useHoverAnimation({ imageUrl });

  return (
    <div
      className={`group relative cursor-pointer hover-animation-container ${className}`}
      onClick={onImageClick}
      style={{ zIndex: 1, position: 'relative' }}
    >
      <div
        ref={cardRef}
        className="hover-card relative overflow-hidden rounded-lg w-full h-full"
        onMouseEnter={supportsHover ? handleMouseEnter : undefined}
        onMouseLeave={supportsHover ? handleMouseLeave : undefined}
        style={{
          '--transition-speed': `${config.TRANSITION_SPEED}s`,
          '--shadow-color': config.SHADOW_COLOR,
        } as React.CSSProperties}
      >
        <div className="w-full h-full relative">
          {children}
          
          {/* CSS-driven gradient overlay */}
          <div className="hover-overlay absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* CSS-driven title animation */}
          <div className="hover-title-container absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
            <h3 className="hover-title-text text-white text-sm font-medium drop-shadow-lg truncate">
              {title}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
});

HoverAnimation.displayName = 'HoverAnimation';

export default HoverAnimation;