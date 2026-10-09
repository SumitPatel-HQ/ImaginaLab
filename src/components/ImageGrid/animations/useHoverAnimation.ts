// SPDX-License-Identifier: AGPL-3.0-or-later

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { getOptimizedImageUrl, createImageTransformations } from '../../../services/ImageKit/config';
import { createIntersectionObserver } from './animationUtils';

export const HOVER_CONFIG = {
  SCALE_FACTOR: 1.5,
  TRANSITION_SPEED: 0.22,
  SHADOW_COLOR: 'rgba(0,0,0,0.6)',
  USE_HIGH_QUALITY: true,
} as const;

interface UseHoverAnimationProps {
  imageUrl: string;
}

export const useHoverAnimation = ({ imageUrl }: UseHoverAnimationProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [, setIsVisible] = useState(true);
  
  const supportsHover = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const highQualityUrl = useMemo(() => {
    if (!imageUrl) return '';
    const imagePath = imageUrl.split('?')[0].replace(import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '', '');
    return getOptimizedImageUrl(imagePath, createImageTransformations.ultra(2400));
  }, [imageUrl]);

  useEffect(() => {
    const currentCard = cardRef.current;
    if (currentCard) {
      const observer = createIntersectionObserver((visible) => {
        setIsVisible(visible);
      }, 0.1);
      
      observer.observe(currentCard);
      
      return () => {
        if (currentCard) {
          observer.unobserve(currentCard);
        }
        observer.disconnect();
      };
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current || !supportsHover) return;
    const card = cardRef.current;
    card.style.setProperty('--scale', HOVER_CONFIG.SCALE_FACTOR.toString());
    card.setAttribute('data-hovering', 'true');
  }, [supportsHover]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || !supportsHover) return;
    const card = cardRef.current;
    card.style.setProperty('--scale', '1');
    card.removeAttribute('data-hovering');
  }, [supportsHover]);

  return {
    cardRef,
    highQualityUrl,
    handleMouseEnter,
    handleMouseLeave,
    config: HOVER_CONFIG,
    supportsHover,
  };
};