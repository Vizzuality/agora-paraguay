import { describe, expect, it } from 'vitest';

import { areasBounds } from '@/lib/map/area-bounds';

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
