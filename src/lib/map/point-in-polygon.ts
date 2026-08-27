import type { DrawnPolygon, FeatureId } from "@/lib/map/draw-features";

/** A geographic point, as MapLibre hands it to click handlers. */
export type MapPoint = { lng: number; lat: number };

/**
 * Whether `point` falls inside the ring. `ring` is a closed GeoJSON linear ring:
 * `[lng, lat]` positions where the last repeats the first.
 *
 * Pure hit-test against the store's own geometry, on purpose: querying Terra Draw's
 * rendered layers would couple this to the adapter's internal layer ids and to how
 * MapLibre round-trips feature ids, both of which are private surface.
 */
export function ringContains(ring: number[][], point: MapPoint): boolean {
  // Ray cast: a horizontal ray eastward from the point crosses the ring an odd
  // number of times iff the point is inside. Planar lng/lat is fine at parcel scale.
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const spansLatitude = yi > point.lat !== yj > point.lat;

    if (spansLatitude && point.lng < xi + ((point.lat - yi) * (xj - xi)) / (yj - yi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * The polygon under `point`, or `null`. Later polygons win: they render on top, so the
 * one the user sees is the one the click picks. Only the outer ring is tested — holed
 * polygons never reach the store (uploads skip them, Terra Draw rejects them).
 */
export function polygonAtPoint(polygons: DrawnPolygon[], point: MapPoint): FeatureId | null {
  for (let index = polygons.length - 1; index >= 0; index--) {
    const polygon = polygons[index];

    if (ringContains(polygon.geometry.coordinates[0] as number[][], point)) {
      return polygon.id;
    }
  }

  return null;
}
