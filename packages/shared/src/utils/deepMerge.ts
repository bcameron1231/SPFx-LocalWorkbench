/**
 * Deep merge utility for recursively merging objects
 *
 * Merges multiple source objects into a target object, recursively merging nested objects.
 * Arrays are replaced, not merged. Null/undefined sources are skipped.
 *
 * @param target - The target object to merge into (will be mutated)
 * @param sources - One or more source objects to merge from
 * @returns The merged target object
 *
 * @example
 * ```typescript
 * const result = deepMerge(
 *   { a: 1, b: { c: 2 } },
 *   { b: { d: 3 }, e: 4 }
 * );
 * // Result: { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 */
export function deepMerge<T = any>(target: T, ...sources: any[]): T {
  for (const source of sources) {
    if (source === null || source === undefined) {
      continue;
    }
    for (const key of Object.keys(source)) {
      const srcVal = source[key];
      const tgtVal = (target as any)[key];
      if (
        srcVal &&
        typeof srcVal === 'object' &&
        !Array.isArray(srcVal) &&
        tgtVal &&
        typeof tgtVal === 'object' &&
        !Array.isArray(tgtVal)
      ) {
        (target as any)[key] = deepMerge({ ...tgtVal }, srcVal);
      } else {
        (target as any)[key] = srcVal;
      }
    }
  }
  return target;
}
