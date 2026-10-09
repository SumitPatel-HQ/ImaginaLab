/**
 * Whether a List-Files entry should become a gallery card.
 *
 * The listing can include folder records and historical file versions, which
 * share visual content with the current file but carry different fileIds, so
 * id-based dedupe cannot collapse them and the same photo would render
 * multiple times. Only current file entries pass. A missing `type` is treated
 * as a file for backward compatibility with responses that omit it.
 *
 * Dependency-free so it stays testable under the plain Node test runner.
 */
export const isCurrentFileEntry = (
  file: { readonly type?: string } | null | undefined
): boolean => {
  if (!file) return false;
  if (file.type === 'folder' || file.type === 'file-version') return false;
  return true;
};
