import { describe, expect, it } from 'vitest';

import {
  geometryBounds,
  roundCoordinates,
  vertexCount,
  type AreaGeometry,
} from '@/lib/map/geojson-precision';

const NOISY_SQUARE: AreaGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-56.79999999970016, -27.49999999980009],
      [-56.79999999970016, -27.44999999990006],
      [-56.74999999980008, -27.449999999900058],
      [-56.74999999980008, -27.49999999980008],
      [-56.79999999970016, -27.49999999980009],
    ],
  ],
};

describe('roundCoordinates', () => {
  it('rounds every position of a polygon to the requested decimals', () => {
    expect(roundCoordinates(NOISY_SQUARE, 2)).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [-56.8, -27.5],
          [-56.8, -27.45],
          [-56.75, -27.45],
          [-56.75, -27.5],
          [-56.8, -27.5],
        ],
      ],
    });
  });

  it('rounds each polygon of a MultiPolygon and drops altitudes', () => {
    const multi: AreaGeometry = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [1.123456789, 2.987654321, 300],
            [1.1, 2.9, 300],
            [1.123456789, 2.987654321, 300],
          ],
        ],
      ],
    };

    expect(roundCoordinates(multi, 5)).toEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [1.12346, 2.98765],
            [1.1, 2.9],
            [1.12346, 2.98765],
          ],
        ],
      ],
    });
  });

  it('is idempotent and never mutates its input', () => {
    const once = roundCoordinates(NOISY_SQUARE, 2);

    expect(roundCoordinates(once, 2)).toEqual(once);
    expect(NOISY_SQUARE.coordinates[0][0][0]).toBe(-56.79999999970016);
  });
});

describe('vertexCount', () => {
  it('counts the positions of every ring of every part', () => {
    expect(vertexCount(NOISY_SQUARE)).toBe(5);
    expect(
      vertexCount({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [0, 0],
            ],
          ],
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        ],
      }),
    ).toBe(7);
  });
});

describe('geometryBounds', () => {
  it('returns west, south, east, north across all rings', () => {
    expect(geometryBounds(roundCoordinates(NOISY_SQUARE, 2))).toEqual([
      -56.8, -27.5, -56.75, -27.45,
    ]);
  });
});
