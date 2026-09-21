/** `[west, south, east, north]` — the tuple MapLibre's `fitBounds` accepts. */
export type Bounds = [number, number, number, number];

/** Breathing room around framed areas, in px — the main map and the hero thumbnail alike. */
export const FIT_PADDING = 40;

/** The ids in `current` that were not in `previous`: what a fit should react to. */
export function newlyAdded(previous: string[], current: string[]): string[] {
  const seen = new Set(previous);

  return current.filter((id) => !seen.has(id));
}

/** What the bounds helpers read: a Polygon's rings or a MultiPolygon's polygons of rings. */
type ArealGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

/**
 * Combined bounding box of any Polygon or MultiPolygon features — the drawn areas and
 * the parcels the API answers alike. Structural parameter on purpose (like
 * `polygonName`). `null` when there is nothing to frame — the caller keeps its camera.
 */
export function featuresBounds(features: { geometry: ArealGeometry }[]): Bounds | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const { geometry } of features) {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat(1);

    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        west = Math.min(west, lng);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        north = Math.max(north, lat);
      }
    }
  }

  return west === Infinity ? null : [west, south, east, north];
}
