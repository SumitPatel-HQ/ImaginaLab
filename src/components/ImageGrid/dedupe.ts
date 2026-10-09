/** Minimal structural shape needed for content-aware dedupe. */
export interface DedupableImage {
  readonly id: string;
  readonly src?: string;
  readonly filePath?: string;
}

/**
 * Deduplicates and appends incoming images to existing images.
 * Matches on image.id as well as content identity (filePath, falling back to
 * src): distinct records can point at the same photo (e.g. historical file
 * versions carry different ids), and those must never render as duplicate
 * cards. Malformed entries without an id are skipped. Never mutates inputs.
 *
 * Dependency-free so it stays testable under the plain Node test runner.
 */
export const mergeUniqueImages = <T extends DedupableImage>(
  existing: readonly T[],
  incoming: readonly T[]
): T[] => {
  const seenIds = new Set(existing.map((img) => img.id));
  const seenContent = new Set(
    existing.map((img) => img.filePath || img.src).filter(Boolean)
  );
  const newUnique: T[] = [];
  for (const img of incoming) {
    if (!img || !img.id || seenIds.has(img.id)) continue;
    const contentKey = img.filePath || img.src;
    if (contentKey && seenContent.has(contentKey as string)) continue;
    seenIds.add(img.id);
    if (contentKey) seenContent.add(contentKey as string);
    newUnique.push(img);
  }
  return [...existing, ...newUnique];
};
