import { describe, expect, it } from 'vitest';

import { areasSignature } from '@/lib/map/areas-signature';
import type { DrawnPolygon } from '@/lib/map/draw-features';

function square(id: string, size: number): DrawnPolygon {
  return {
    id,
    type: 'Feature',
    properties: { mode: 'polygon' },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-58.5, -24.5],
          [-58.5 + size, -24.5],
          [-58.5 + size, -24.5 + size],
          [-58.5, -24.5 + size],
          [-58.5, -24.5],
        ],
      ],
    },
  } as DrawnPolygon;
}

describe('areasSignature', () => {
  it('keys the same areas alike, whichever array holds them', () => {
    expect(areasSignature([square('a', 0.1)]).key).toBe(areasSignature([square('a', 0.1)]).key);
  });

  it('re-keys on a moved vertex, another id or another area', () => {
    const key = areasSignature([square('a', 0.1)]).key;

    expect(areasSignature([square('a', 0.11)]).key).not.toBe(key);
    expect(areasSignature([square('b', 0.1)]).key).not.toBe(key);
    expect(areasSignature([square('a', 0.1), square('b', 0.1)]).key).not.toBe(key);
  });

  it('hands back the same answer for the same array, measured once', () => {
    const areas = [square('a', 0.1)];

    expect(areasSignature(areas)).toBe(areasSignature(areas));
  });

  it('flags areas over the limit', () => {
    expect(areasSignature([square('a', 0.1)]).oversized).toBe(false);
    expect(areasSignature([square('a', 5)]).oversized).toBe(true);
  });
});
