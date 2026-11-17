import { describe, expect, it } from 'vitest';

import { outsideMask } from '@/lib/map/country-mask';

const SQUARE = [
  [-58, -25],
  [-57, -25],
  [-57, -24],
  [-58, -24],
  [-58, -25],
];
const HOLE = [
  [-57.6, -24.6],
  [-57.4, -24.6],
  [-57.4, -24.4],
  [-57.6, -24.6],
];

describe('outsideMask', () => {
  it('cuts the country out of a world-wide polygon', () => {
    const mask = outsideMask({ type: 'Polygon', coordinates: [SQUARE] });

    expect(mask.type).toBe('Polygon');
    expect(mask.coordinates).toHaveLength(2);
    expect(mask.coordinates[0]).toContainEqual([-180, -85]);
    expect(mask.coordinates[0]).toContainEqual([180, 85]);
    expect(mask.coordinates[1]).toEqual(SQUARE);
  });

  it('drops the country’s own holes: nothing inside is masked', () => {
    const mask = outsideMask({ type: 'Polygon', coordinates: [SQUARE, HOLE] });

    expect(mask.coordinates).toEqual([mask.coordinates[0], SQUARE]);
  });

  it('cuts out every part of a MultiPolygon', () => {
    const island = SQUARE.map(([lng, lat]) => [lng + 2, lat]);
    const mask = outsideMask({ type: 'MultiPolygon', coordinates: [[SQUARE, HOLE], [island]] });

    expect(mask.coordinates.slice(1)).toEqual([SQUARE, island]);
  });
});
