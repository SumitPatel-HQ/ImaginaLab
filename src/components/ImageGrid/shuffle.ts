/**
 * Returns a new array with the input items in a uniformly shuffled order
 * (Fisher-Yates). Never mutates the input.
 */
export const shuffleOrder = <T>(input: readonly T[]): T[] => {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
