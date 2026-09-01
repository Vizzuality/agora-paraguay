/** `[west, south, east, north]` — the tuple MapLibre's `fitBounds` accepts. */
export type Bounds = [number, number, number, number];

/**
 * Combined bounding box of the analysed areas. Structural parameter on purpose (like
 * `polygonName`): it accepts drawn polygons and cadastral parcels alike. `null` when
 * there is nothing to frame — the caller keeps its default camera.
 */
export function areasBounds(areas: { geometry: { coordinates: number[][][] } }[]): Bounds | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const area of areas) {
    for (const ring of area.geometry.coordinates) {
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
