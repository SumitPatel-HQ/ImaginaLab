/**
 * Pure client-side search utilities for the gallery grid.
 * Single test seam for the search + random-name feature.
 * Never mutates inputs; all matching is case-insensitive and
 * extension-agnostic.
 */

export interface SearchableImage {
  title: string;
  fileName?: string;
  filePath?: string;
}

const stripExtension = (name: string): string =>
  name.replace(/\.[a-z0-9]+$/i, "");

export const normalizeSearchQuery = (raw: string): string =>
  raw.trim().toLowerCase();

const searchableNames = (img: SearchableImage): string[] => {
  const fileName = img.fileName ?? "";
  return [
    fileName,
    img.title ?? "",
    fileName ? stripExtension(fileName) : "",
  ].filter(Boolean);
};

const exactCandidates = (img: SearchableImage): string[] =>
  searchableNames(img).map((n) => n.toLowerCase());

export const filterImagesByName = <T extends SearchableImage>(
  images: readonly T[],
  rawQuery: string,
): T[] => {
  const q = normalizeSearchQuery(rawQuery);
  if (!q) return [...images];
  const strippedQ = stripExtension(q);
  return images.filter((img) =>
    searchableNames(img).some((n) => {
      const lower = n.toLowerCase();
      return lower.includes(q) || (strippedQ && lower.includes(strippedQ));
    }),
  );
};

export const findExactImageByName = <T extends SearchableImage>(
  images: readonly T[],
  rawQuery: string,
): T | undefined => {
  const q = normalizeSearchQuery(rawQuery);
  if (!q) return undefined;
  const strippedQ = stripExtension(q);
  return images.find((img) => {
    const candidates = exactCandidates(img);
    return candidates.includes(q) || (strippedQ ? candidates.includes(strippedQ) : false);
  });
};

/** Guaranteed-different-index pick over a count (same rule as getFallbackIndex). */
export const pickRandomSearchIndex = (
  count: number,
  lastIndex: number | null,
): number | null => {
  if (count <= 1) return null;
  const safe =
    lastIndex !== null && lastIndex >= 0 && lastIndex < count ? lastIndex : 0;
  return (safe + 1 + Math.floor(Math.random() * (count - 1))) % count;
};

/** Single shared result-count phrasing for announcements and the result banner. */
export const formatSearchCount = (
  matchCount: number,
  rawQuery: string,
  loadedCount: number,
  hasMore: boolean,
): string => {
  const noun = matchCount === 1 ? "result" : "results";
  const base = `${matchCount} ${noun} for "${rawQuery.trim()}"`;
  return hasMore ? `${base} (searched ${loadedCount} loaded images)` : base;
};

export const pickRandomSearchName = <T extends SearchableImage>(
  images: readonly T[],
  lastIndex: number | null,
): { index: number; name: string } | null => {
  if (images.length === 0) return null;
  if (images.length === 1) {
    const only = images[0];
    return { index: 0, name: only.fileName ?? only.title };
  }
  const index = pickRandomSearchIndex(images.length, lastIndex);
  if (index === null) return null;
  const img = images[index];
  return { index, name: img.fileName ?? img.title };
};

/** Minimum upward travel (px) before an open mobile search panel collapses. */
export const SCROLL_COLLAPSE_THRESHOLD_PX = 6;

/**
 * Decides whether an upward scroll should collapse the expanded mobile
 * search panel. Never collapses while the user is interacting with the
 * search (focused input or controls), and ignores downward/no-op scrolls.
 */
export const shouldCollapseSearchOnScroll = (
  prevY: number,
  currY: number,
  isInteracting: boolean,
  threshold: number = SCROLL_COLLAPSE_THRESHOLD_PX,
): boolean => !isInteracting && prevY - currY > threshold;
