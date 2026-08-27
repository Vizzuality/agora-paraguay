import type { GeoJSONStoreFeatures } from 'terra-draw';
import { describe, expect, it } from 'vitest';

import { drawnPolygons, isDrawnPolygon } from '@/lib/map/draw-features';

/**
 * Fixtures mirror what Terra Draw actually keeps in its store: alongside the drawn
 * polygons there are selection points, midpoints and the in-progress ring. They are typed
 * as `GeoJSONStoreFeatures`, so a shape change in Terra Draw breaks the build rather than
 * the runtime.
 */
const ring: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 0],
];

function polygon(id: string, properties: Record<string, unknown> = {}): GeoJSONStoreFeatures {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: { mode: 'polygon', ...properties },
  } as GeoJSONStoreFeatures;
}

const selectionPoint = {
  id: 'selection-point',
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { mode: 'select', selectionPoint: true },
} as GeoJSONStoreFeatures;

const midPoint = {
  id: 'mid-point',
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0.5, 0] },
  properties: { mode: 'select', midPoint: true },
} as GeoJSONStoreFeatures;

const line = {
  id: 'line',
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: ring },
  properties: { mode: 'linestring' },
} as GeoJSONStoreFeatures;

describe('isDrawnPolygon', () => {
  it('accepts a finished polygon', () => {
    expect(isDrawnPolygon(polygon('a'))).toBe(true);
  });

  it('rejects the guidance features that share the store', () => {
    expect(isDrawnPolygon(selectionPoint)).toBe(false);
    expect(isDrawnPolygon(midPoint)).toBe(false);
    expect(isDrawnPolygon(line)).toBe(false);
  });

  it('rejects the ring that is still being drawn', () => {
    expect(isDrawnPolygon(polygon('a', { currentlyDrawing: true }))).toBe(false);
  });
});

describe('drawnPolygons', () => {
  it('keeps every finished polygon, in store order', () => {
    const snapshot = [polygon('a'), selectionPoint, polygon('b'), midPoint, polygon('c')];

    expect(drawnPolygons(snapshot).map((feature) => feature.id)).toEqual(['a', 'b', 'c']);
  });

  it('excludes the polygon being drawn, so a finished count never counts it twice', () => {
    const snapshot = [polygon('a'), polygon('b', { currentlyDrawing: true })];

    expect(drawnPolygons(snapshot).map((feature) => feature.id)).toEqual(['a']);
  });

  it('is empty when only guidance features remain', () => {
    expect(drawnPolygons([selectionPoint, midPoint])).toEqual([]);
    expect(drawnPolygons([])).toEqual([]);
  });
});
