/*
 * The size of the areas on the map, in hectares, before anything is asked of the API.
 * `filter-parcels` answers every cadastral parcel inside the areas with its geometry: a
 * department-sized drawing comes back as hundreds of megabytes, parsed and painted on the
 * main thread. The limit below is the client's guard; the API has none.
 */

/** The most the drawn or uploaded areas may cover together, in hectares. */
export const MAX_AREA_HECTARES = 100_000;

/** WGS84 equatorial radius, metres. */
const EARTH_RADIUS = 6_378_137;
const SQUARE_METRES_PER_HECTARE = 10_000;

type Position = readonly number[];

/** Anything with polygon rings: a Terra Draw feature or an upload feature before it lands. */
type Areal = { geometry: { coordinates: readonly (readonly Position[])[] } };

/**
 * The area a lon/lat ring encloses on the sphere, in square metres, whichever way it
 * winds. Spherical excess as summed in Chamberlain & Duquette (2007), the formula the
 * usual GIS libraries use; within 0.3% of the ellipsoid at Paraguay's latitudes. Closed
 * and open rings give the same answer.
 */
function ringArea(ring: readonly Position[]): number {
  if (ring.length < 3) return 0;

  const radians = Math.PI / 180;
  let sum = 0;

  for (let index = 0; index < ring.length; index++) {
    const [lng1, lat1] = ring[index];
    const [lng2, lat2] = ring[(index + 1) % ring.length];

    sum += (lng2 - lng1) * radians * (2 + Math.sin(lat1 * radians) + Math.sin(lat2 * radians));
  }

  return Math.abs((sum * EARTH_RADIUS * EARTH_RADIUS) / 2);
}

/** A polygon's hectares: its outer ring less its holes. */
export function polygonHectares(rings: readonly (readonly Position[])[]): number {
  const [outer, ...holes] = rings;

  if (!outer) return 0;

  const holed = holes.reduce((total, hole) => total + ringArea(hole), 0);

  return Math.max(0, ringArea(outer) - holed) / SQUARE_METRES_PER_HECTARE;
}

/** The hectares the areas cover together. */
export function areasHectares(polygons: readonly Areal[]): number {
  return polygons.reduce(
    (total, polygon) => total + polygonHectares(polygon.geometry.coordinates),
    0,
  );
}

export function exceedsMaxArea(polygons: readonly Areal[]): boolean {
  return areasHectares(polygons) > MAX_AREA_HECTARES;
}

/** What the panel says when the areas are over the limit. */
export function oversizedAreasMessage(hectares: number): string {
  const format = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });

  return `El área seleccionada abarca ${format.format(hectares)} ha y supera el máximo de ${format.format(MAX_AREA_HECTARES)} ha. Seleccione un área menor.`;
}
