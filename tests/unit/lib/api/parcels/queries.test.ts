import { describe, expect, it } from 'vitest';

import { parcelQueries } from '@/lib/api/parcels/queries';
import type { FilterParcelsResponse } from '@/lib/api/parcels/schemas';
import type { DrawnPolygon } from '@/lib/map/draw-features';

const polygon = {
  id: 'polygon-1',
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[]] },
  properties: { mode: 'polygon' },
} as DrawnPolygon;

const previous = { status: 'success', results: [] } as unknown as FilterParcelsResponse;

function placeholderOf(polygons: DrawnPolygon[]) {
  const { placeholderData } = parcelQueries.filtered(polygons);

  if (typeof placeholderData !== 'function') throw new Error('placeholderData is not a function');

  return placeholderData(previous, undefined);
}

describe('parcelQueries.filtered', () => {
  it('keeps the previous parcels painted while the geometry changes', () => {
    expect(placeholderOf([polygon])).toBe(previous);
  });

  it('drops them once the geometry is gone, so a reset empties the map', () => {
    expect(placeholderOf([])).toBeUndefined();
    expect(parcelQueries.filtered([]).enabled).toBe(false);
  });
});
