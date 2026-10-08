import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import {
  areasHectares,
  exceedsMaxArea,
  MAX_AREA_HECTARES,
  oversizedAreasMessage,
  polygonHectares,
} from '@/lib/map/polygon-area';

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

function polygon(rings: number[][][]): DrawnPolygon {
  return {
    id: 'p',
    type: 'Feature',
    properties: { mode: 'polygon' },
    geometry: { type: 'Polygon', coordinates: rings },
  } as DrawnPolygon;
}

describe('polygonHectares', () => {
  it('measures a one-degree square at the equator as about 1.24 million hectares', () => {
    // 111.3 km × 111.3 km on the sphere, give or take the cosine of half a degree.
    expect(polygonHectares([square(0, 0, 1, 1)])).toBeCloseTo(1_237_000, -4);
  });

  it('shrinks the same square with latitude: at 23° south it is roughly 8% smaller', () => {
    const equator = polygonHectares([square(0, 0, 1, 1)]);
    const paraguay = polygonHectares([square(-58, -24, -57, -23)]);

    expect(paraguay / equator).toBeCloseTo(Math.cos((23.5 * Math.PI) / 180), 2);
  });

  it('is the same whichever way the ring winds, closed or open', () => {
    const closed = square(-58, -24, -57, -23);
    const reversed = [...closed].reverse();
    const open = closed.slice(0, -1);

    expect(polygonHectares([reversed])).toBeCloseTo(polygonHectares([closed]), 6);
    expect(polygonHectares([open])).toBeCloseTo(polygonHectares([closed]), 6);
  });

  it('takes holes away from the outer ring', () => {
    const outer = square(-58, -24, -57, -23);
    const hole = square(-57.75, -23.75, -57.25, -23.25);

    expect(polygonHectares([outer, hole])).toBeCloseTo(
      polygonHectares([outer]) - polygonHectares([hole]),
      6,
    );
  });

  it('is zero for a degenerate ring or no ring at all', () => {
    expect(polygonHectares([])).toBe(0);
    expect(
      polygonHectares([
        [
          [-58, -24],
          [-57, -23],
        ],
      ]),
    ).toBe(0);
  });
});

describe('areasHectares / exceedsMaxArea', () => {
  // About 0.02° a side: a 2 km farm, well under the limit.
  const farm = polygon([square(-58.02, -23.02, -58, -23)]);
  // Paraguay's bounding box, give or take: forty million hectares.
  const country = polygon([square(-62.6, -27.6, -54.3, -19.3)]);

  it('sums the areas', () => {
    expect(areasHectares([farm, farm])).toBeCloseTo(2 * areasHectares([farm]), 6);
    expect(areasHectares([])).toBe(0);
  });

  it('lets farms through and stops a country', () => {
    expect(areasHectares([farm])).toBeLessThan(1_000);
    expect(exceedsMaxArea([farm])).toBe(false);
    expect(areasHectares([country])).toBeGreaterThan(35_000_000);
    expect(exceedsMaxArea([country])).toBe(true);
  });

  it('is a limit on the total, not on each area', () => {
    // About 0.3° × 0.25°: 85 000 ha, under the limit alone, over it doubled.
    const half = polygon([square(-58.3, -23.25, -58, -23)]);

    expect(areasHectares([half])).toBeLessThan(MAX_AREA_HECTARES);
    expect(exceedsMaxArea([half, half])).toBe(true);
  });
});

describe('oversizedAreasMessage', () => {
  it('prints the hectares and the limit the platform way, no decimals', () => {
    expect(oversizedAreasMessage(4_512_345.6)).toBe(
      'El área seleccionada abarca 4.512.346 ha y supera el máximo de 100.000 ha. Seleccione un área menor.',
    );
  });
});
