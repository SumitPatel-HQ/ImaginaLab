// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react';
import { ImageCardSkeleton } from '../ui/Skeleton';
import { getGridClass, getGapClass, getColumnCount } from '../ImageGrid/utils';
import { useScreenWidth } from '../../hooks/useUtils';

interface GridSkeletonProps {
  layoutMode: 'grid' | 'masonry';
  gridDensity: number;
  count?: number;
}

const GridSkeleton: React.FC<GridSkeletonProps> = ({ 
  layoutMode, 
  gridDensity, 
  count = 12 
}) => {
  const screenWidth = useScreenWidth();
  const columnCount = getColumnCount(gridDensity, screenWidth);

  // Generate mixed aspect ratios for more realistic skeleton
  const getRandomAspectRatio = (index: number): "2:3" | "3:2" => {
    return (index * 7) % 3 === 0 ? '3:2' : '2:3';
  };

  if (layoutMode === 'masonry') {
    // Distribute skeleton cards evenly across columns
    const columns = Array.from({ length: columnCount }, () => [] as number[]);
    for (let i = 0; i < count; i++) {
      columns[i % columnCount].push(i);
    }

    return (
      <div 
        className={`flex ${getGapClass(gridDensity)} items-start w-full`}
        aria-hidden="true"
      >
        {columns.map((colIndices, colIdx) => (
          <div 
            key={`skeleton-col-${colIdx}`}
            className={`flex-1 flex flex-col ${getGapClass(gridDensity)} min-w-0`}
          >
            {colIndices.map((index) => (
              <ImageCardSkeleton key={`skeleton-${index}`} aspectRatio={getRandomAspectRatio(index)} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`grid ${getGridClass('grid', gridDensity)} ${getGapClass(gridDensity)} w-full`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ImageCardSkeleton key={`skeleton-${index}`} aspectRatio={getRandomAspectRatio(index)} />
      ))}
    </div>
  );
};

export default GridSkeleton;