import type { ArealGeometry } from '@/lib/map/area-bounds';

/** `[lng, lat]`, the order GeoJSON and MapLibre markers use. */
export type LngLat = [number, number];

/**
 * Where a parcel's number sits on the map: the area centroid of its largest outer ring,
 * across every Polygon or MultiPolygon the parcel is made of. Size does not matter, shape
 * does: a convex ring always holds its centroid, and cadastral parcels are mostly simple
 * blobs and rectangles; a strongly concave one (an L or a C) could push it out, accepted.
 * `null` when there is no ring to anchor to.
 */
export function labelAnchor(geometries: readonly ArealGeometry[]): LngLat | null {
  let best: { area: number; anchor: LngLat } | null = null;

  for (const geometry of geometries) {
    const rings =
      geometry.type === 'Polygon'
        ? [geometry.coordinates[0]]
        : geometry.coordinates.map((polygon) => polygon[0]);

    for (const ring of rings) {
      const candidate = ringCentroid(ring);

      if (candidate !== null && (best === null || candidate.area > best.area)) best = candidate;
    }
  }

  return best?.anchor ?? null;
}

/** Shoelace centroid of one ring; a ring without area falls back to its bounding-box centre. */
function ringCentroid(ring: readonly number[][]): { area: number; anchor: LngLat } | null {
  if (ring.length === 0) return null;

  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let index = 0; index < ring.length; index++) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;

    twiceArea += cross;
    x += (x1 + x2) * cross;
    y += (y1 + y2) * cross;
  }

  if (twiceArea === 0) {
    const xs = ring.map(([lng]) => lng);
    const ys = ring.map(([, lat]) => lat);

    return {
      area: 0,
      anchor: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2],
    };
  }

  const factor = 1 / (3 * twiceArea);

  return { area: Math.abs(twiceArea) / 2, anchor: [x * factor, y * factor] };
}
