import type { DrawnPolygon } from '@/lib/map/draw-features';
import { exceedsMaxArea } from '@/lib/map/polygon-area';

export type AreasSignature = {
  /** Equal for areas with the same ids and geometry, whichever array holds them. */
  key: string;
  oversized: boolean;
};

// The store hands every consumer the same array until the areas change, so this
// measures and serialises each geometry once instead of once per consumer per render.
const signatures = new WeakMap<readonly DrawnPolygon[], AreasSignature>();

/** The areas' query key and size check, computed once per array. */
export function areasSignature(polygons: readonly DrawnPolygon[]): AreasSignature {
  let signature = signatures.get(polygons);

  if (signature === undefined) {
    const content = JSON.stringify(polygons.map(({ id, geometry }) => [id, geometry]));
    signature = {
      key: `${polygons.length}:${hash53(content)}`,
      oversized: exceedsMaxArea(polygons),
    };
    signatures.set(polygons, signature);
  }

  return signature;
}

/** cyrb53: a fast 53-bit string hash, in base 36. */
function hash53(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
