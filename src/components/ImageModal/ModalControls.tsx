import React from 'react';
import { IoChevronBackSharp, IoChevronForwardSharp } from 'react-icons/io5';

interface ModalControlsProps {
  onPrev?: () => void;
  onNext?: () => void;
  isSwiping?: boolean;
}

export const ModalControls: React.FC<ModalControlsProps> = React.memo(({ onPrev, onNext, isSwiping = false }) => {
  // Reveal animation for edge gradient + chevron as a unified visual unit.
  // Idle state: hidden (opacity-0) and subtly tucked toward the edge (-translate-x-4 / translate-x-4).
  // Hover-in: smoothly translates inward from the respective edge and fades in together over 300ms.
  // Hover-out: retreats back toward the edge and fades out together over 300ms.
  // Touch fallback (hover: none) keeps controls reachable without hover.
  // Keyboard focus (focus-within / focus-visible) reveals controls for tab navigation.
  // During active swiping, controls hide and disable pointer events so gestures are unobstructed.
  const prevReveal = isSwiping
    ? 'opacity-0 -translate-x-4 sm:-translate-x-5 pointer-events-none'
    : 'opacity-0 -translate-x-4 sm:-translate-x-5 ' +
      'group-hover:opacity-100 group-hover:translate-x-0 ' +
      'group-focus-within:opacity-100 group-focus-within:translate-x-0 ' +
      'focus-within:opacity-100 focus-within:translate-x-0 ' +
      '[@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-x-0';

  const nextReveal = isSwiping
    ? 'opacity-0 translate-x-4 sm:translate-x-5 pointer-events-none'
    : 'opacity-0 translate-x-4 sm:translate-x-5 ' +
      'group-hover:opacity-100 group-hover:translate-x-0 ' +
      'group-focus-within:opacity-100 group-focus-within:translate-x-0 ' +
      'focus-within:opacity-100 focus-within:translate-x-0 ' +
      '[@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-x-0';

  const buttonPointerEvents = isSwiping
    ? 'pointer-events-none'
    : 'pointer-events-none ' +
      'group-hover:pointer-events-auto ' +
      'group-focus-within:pointer-events-auto ' +
      'focus-visible:pointer-events-auto ' +
      '[@media(hover:none)]:pointer-events-auto';

  const wrapperBase =
    'absolute inset-y-0 z-40 flex items-center pointer-events-none ' +
    'w-32 sm:w-44 md:w-56 lg:w-64 ' +
    'transition-all duration-300 ease-out motion-reduce:transition-none';

  // Eased multi-stop gradient for a soft, atmospheric, seamless vignette falloff
  const leftGradientStyle: React.CSSProperties = {
    background:
      'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.28) 20%, rgba(0,0,0,0.16) 40%, rgba(0,0,0,0.07) 65%, rgba(0,0,0,0.015) 85%, transparent 100%)',
  };

  const rightGradientStyle: React.CSSProperties = {
    background:
      'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.28) 20%, rgba(0,0,0,0.16) 40%, rgba(0,0,0,0.07) 65%, rgba(0,0,0,0.015) 85%, transparent 100%)',
  };

  return (
    <>
      {onPrev && (
        <div className={`${wrapperBase} left-0 justify-start pl-1 sm:pl-2 ${prevReveal}`}>
          {/* Soft, diffuse edge gradient extending smoothly inward from the left boundary */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={leftGradientStyle}
            aria-hidden="true"
          />

          {/* Accessible chevron button positioned over the gradient */}
          <button
            type="button"
            className={`relative z-10 flex items-center justify-center p-2 sm:p-2.5 text-white/70 hover:text-white/95 active:text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] cursor-pointer touch-manipulation transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:rounded-md ${buttonPointerEvents}`}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            aria-label="Previous image"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <IoChevronBackSharp className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 scale-x-85" />
          </button>
        </div>
      )}

      {onNext && (
        <div className={`${wrapperBase} right-0 justify-end pr-1 sm:pr-2 ${nextReveal}`}>
          {/* Soft, diffuse edge gradient extending smoothly inward from the right boundary */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={rightGradientStyle}
            aria-hidden="true"
          />

          {/* Accessible chevron button positioned over the gradient */}
          <button
            type="button"
            className={`relative z-10 flex items-center justify-center p-2 sm:p-2.5 text-white/70 hover:text-white/95 active:text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] cursor-pointer touch-manipulation transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:rounded-md ${buttonPointerEvents}`}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            aria-label="Next image"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <IoChevronForwardSharp className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 scale-x-85" />
          </button>
        </div>
      )}
    </>
  );
});