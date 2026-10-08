import { describe, expect, it } from 'vitest';

import { labelAnchor } from '@/lib/map/label-anchor';

const square = (west: number, south: number, size: number) => ({
  type: 'Polygon' as const,
  coordinates: [
    [
      [west, south],
      [west + size, south],
      [west + size, south + size],
      [west, south + size],
      [west, south],
    ],
  ],
});

describe('labelAnchor', () => {
  it('is the centroid of a polygon', () => {
    const [lng, lat] = labelAnchor([square(-58.4, -23.5, 0.2)]) ?? [];

    expect(lng).toBeCloseTo(-58.3);
    expect(lat).toBeCloseTo(-23.4);
  });

  it('ignores holes: only the outer ring positions the number', () => {
    const holed = {
      type: 'Polygon' as const,
      coordinates: [square(0, 0, 10).coordinates[0], square(6, 6, 3).coordinates[0]],
    };

    expect(labelAnchor([holed])).toEqual([5, 5]);
  });

  it('picks the largest part of a MultiPolygon, and of several features', () => {
    const multi = {
      type: 'MultiPolygon' as const,
      coordinates: [square(0, 0, 1).coordinates, square(10, 10, 4).coordinates],
    };

    expect(labelAnchor([multi])).toEqual([12, 12]);
    expect(labelAnchor([square(0, 0, 1), multi, square(100, 100, 2)])).toEqual([12, 12]);
  });

  it('falls back to the bounding-box centre of a ring without area', () => {
    const line = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [0, 0],
        ],
      ],
    };

    expect(labelAnchor([line])).toEqual([2, 0]);
  });

  it('has nothing to anchor to without rings', () => {
    expect(labelAnchor([])).toBeNull();
    expect(labelAnchor([{ type: 'MultiPolygon', coordinates: [] }])).toBeNull();
  });
});
