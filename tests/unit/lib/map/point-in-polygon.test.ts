import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import { polygonAtPoint, ringContains } from '@/lib/map/point-in-polygon';

/** A closed square ring from (west,south) to (east,north), GeoJSON [lng, lat] order. */
function square(west: number, south: number, east: number, north: number): number[][] {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
}

function polygon(id: string, ring: number[][]): DrawnPolygon {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: { mode: 'polygon' },
  } as DrawnPolygon;
}

/** An L-shape: the unit square with its north-east quadrant cut away. Closed ring. */
const L_SHAPE: number[][] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
  [0, 0],
];

describe('ringContains', () => {
  it('accepts a point well inside', () => {
    expect(ringContains(square(-58, -25, -57, -24), { lng: -57.5, lat: -24.5 })).toBe(true);
  });

  it('rejects a point well outside', () => {
    expect(ringContains(square(-58, -25, -57, -24), { lng: -56, lat: -24.5 })).toBe(false);
  });

  it('rejects a point outside the bounding box on both axes', () => {
    expect(ringContains(square(-58, -25, -57, -24), { lng: -60, lat: -20 })).toBe(false);
  });

  it('handles a concave ring: inside the L, outside its notch', () => {
    expect(ringContains(L_SHAPE, { lng: 0.5, lat: 0.5 })).toBe(true);
    expect(ringContains(L_SHAPE, { lng: 1.5, lat: 1.5 })).toBe(false);
  });

  it('rejects a point aligned with an edge but beyond the ring', () => {
    // Same latitude as the square's southern edge extended eastward: a naive
    // crossing count that ignores segment bounds gets this wrong.
    expect(ringContains(square(0, 0, 1, 1), { lng: 2, lat: 0.5 })).toBe(false);
  });
});

describe('polygonAtPoint', () => {
  const back = polygon('back', square(0, 0, 4, 4));
  const front = polygon('front', square(1, 1, 2, 2));

  it('finds the polygon under the point', () => {
    expect(polygonAtPoint([back], { lng: 2, lat: 2 })).toBe('back');
  });

  it('misses with null', () => {
    expect(polygonAtPoint([back, front], { lng: 10, lat: 10 })).toBeNull();
  });

  it('prefers the later polygon where they overlap — it renders on top', () => {
    expect(polygonAtPoint([back, front], { lng: 1.5, lat: 1.5 })).toBe('front');
  });

  it('is empty-safe', () => {
    expect(polygonAtPoint([], { lng: 0, lat: 0 })).toBeNull();
  });
});
