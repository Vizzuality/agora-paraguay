import { describe, expect, it } from 'vitest';

import { areasBounds, featuresBounds, newlyAdded } from '@/lib/map/area-bounds';

function polygon(coordinates: number[][][]) {
  return { geometry: { coordinates } };
}

describe('areasBounds', () => {
  it('returns [west, south, east, north] of a single ring', () => {
    const area = polygon([
      [
        [-58.4, -23.5],
        [-58.1, -23.5],
        [-58.1, -23.2],
        [-58.4, -23.2],
        [-58.4, -23.5],
      ],
    ]);

    expect(areasBounds([area])).toEqual([-58.4, -23.5, -58.1, -23.2]);
  });

  it('combines the bounds of every area', () => {
    const a = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]);
    const b = polygon([
      [
        [3, 2],
        [4, 2],
        [4, 5],
        [3, 5],
        [3, 2],
      ],
    ]);

    expect(areasBounds([a, b])).toEqual([0, 0, 4, 5]);
  });

  it('a hole never widens the bounds beyond the outer ring', () => {
    const area = polygon([
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0],
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1],
      ],
    ]);

    expect(areasBounds([area])).toEqual([0, 0, 4, 4]);
  });

  it('returns null when there is nothing to frame', () => {
    expect(areasBounds([])).toBeNull();
  });
});

describe('newlyAdded', () => {
  it('lists the ids that were not there before, in current order', () => {
    expect(newlyAdded(['a'], ['b', 'a', 'c'])).toEqual(['b', 'c']);
  });

  it('is empty for an edit (same ids) or a deletion', () => {
    expect(newlyAdded(['a', 'b'], ['a', 'b'])).toEqual([]);
    expect(newlyAdded(['a', 'b'], ['a'])).toEqual([]);
  });

  it('treats every id as new when nothing was known', () => {
    expect(newlyAdded([], ['a'])).toEqual(['a']);
  });
});

describe('featuresBounds', () => {
  it('reads every polygon of a MultiPolygon, and mixes Polygons in', () => {
    expect(
      featuresBounds([
        {
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
        {
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [5, 5],
                  [6, 5],
                  [6, 6],
                  [5, 5],
                ],
              ],
              [
                [
                  [-2, 3],
                  [-1, 3],
                  [-1, 4],
                  [-2, 3],
                ],
              ],
            ],
          },
        },
      ]),
    ).toEqual([-2, 0, 6, 6]);
  });

  it('returns null with nothing to frame', () => {
    expect(featuresBounds([])).toBeNull();
  });
});
