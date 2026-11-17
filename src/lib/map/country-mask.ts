import type { AreaGeometry } from './geojson-precision.ts';

/** A ring round the whole Web Mercator world: the mask's outer edge. */
const WORLD_RING = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

/**
 * Everything but the country: the world as one polygon with the country's outer
 * rings cut out as holes, so a single fill dims what lies outside. The country's own
 * holes are dropped: inside, nothing is masked.
 */
export function outsideMask(country: AreaGeometry): { type: 'Polygon'; coordinates: number[][][] } {
  const polygons = country.type === 'Polygon' ? [country.coordinates] : country.coordinates;

  return { type: 'Polygon', coordinates: [WORLD_RING, ...polygons.map(([outer]) => outer)] };
}
