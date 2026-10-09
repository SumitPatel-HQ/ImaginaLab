// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ImageKitImage as Image } from '../../services/ImageKit';

export interface MasonryLayout {
  columns: Image[][];
  columnHeights: number[];
  placedIds: Set<string>;
}

/**
 * Calculates a normalized height weight for an image card in masonry layout.
 * In a column of fixed width, card height is proportional to (height / width).
 * Returns height factor (e.g. 1.5 for 2:3, 0.67 for 3:2, 1.0 for 1:1).
 */
export const getImageHeightWeight = (image: Image): number => {
  if (image.width && image.height && image.width > 0 && image.height > 0) {
    return image.height / image.width;
  }
  if (image.ratio === '3:2') {
    return 2 / 3; // ~0.667
  }
  if (image.ratio === '2:3') {
    return 3 / 2; // 1.5
  }
  return 1.0;
};

/**
 * Creates an empty masonry layout structure with `numColumns`.
 */
export const createEmptyMasonryLayout = (numColumns: number): MasonryLayout => {
  const safeColumns = Math.max(1, Math.floor(numColumns));
  return {
    columns: Array.from({ length: safeColumns }, () => []),
    columnHeights: new Array(safeColumns).fill(0),
    placedIds: new Set<string>(),
  };
};

/**
 * Deterministically assigns a list of images to columns using shortest-column placement.
 * Ensures:
 * 1. Each image appears at most once (no duplicates).
 * 2. New images are placed in the column with the minimum cumulative height.
 * 3. In case of ties, the leftmost column (lowest index) is chosen deterministically.
 * 4. Existing images in `layout` are NEVER moved or re-ordered (prefix stability).
 */
export const appendToMasonryLayout = (
  layout: MasonryLayout,
  images: Image[]
): MasonryLayout => {
  const numColumns = layout.columns.length;
  if (numColumns === 0) return layout;

  const nextColumns = layout.columns.map(col => [...col]);
  const nextHeights = [...layout.columnHeights];
  const nextPlacedIds = new Set(layout.placedIds);

  for (const image of images) {
    if (!image || !image.id) continue;
    if (nextPlacedIds.has(image.id)) continue; // Strictly prevent duplicate cards

    const weight = getImageHeightWeight(image);

    // Find the shortest column deterministically (lowest index wins ties)
    let shortestColIndex = 0;
    let minHeight = nextHeights[0];

    for (let c = 1; c < numColumns; c++) {
      if (nextHeights[c] < minHeight) {
        minHeight = nextHeights[c];
        shortestColIndex = c;
      }
    }

    // Place image in the shortest column
    nextColumns[shortestColIndex].push(image);
    nextHeights[shortestColIndex] += weight;
    nextPlacedIds.add(image.id);
  }

  return {
    columns: nextColumns,
    columnHeights: nextHeights,
    placedIds: nextPlacedIds,
  };
};

/**
 * Builds a complete masonry layout from scratch for a full list of images.
 * Due to the prefix-stability of greedy shortest-column placement,
 * building from scratch on [batch1, batch2] yields identical placements for batch1
 * as building on [batch1] alone.
 */
export const buildMasonryLayout = (
  images: Image[],
  numColumns: number
): MasonryLayout => {
  const empty = createEmptyMasonryLayout(numColumns);
  return appendToMasonryLayout(empty, images);
};

/**
 * Determines the number of columns based on density (1-5) and container/window width.
 * Matches Tailwind responsive breakpoints:
 * default (< 640px)
 * sm (>= 640px and < 1024px)
 * lg (>= 1024px)
 */
export const getColumnCount = (gridDensity: number, width: number): number => {
  const isLg = width >= 1024;
  const isSm = width >= 640;

  switch (gridDensity) {
    case 1:
      return isSm ? 2 : 1;
    case 2:
      return isSm ? 3 : 2;
    case 3:
      return isLg ? 4 : (isSm ? 3 : 2);
    case 4:
      return isLg ? 5 : (isSm ? 4 : 3);
    case 5:
      return isLg ? 6 : (isSm ? 5 : 4);
    default:
      return isLg ? 4 : (isSm ? 3 : 2);
  }
};
