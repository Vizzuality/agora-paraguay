import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import type { MapPoint } from '@/lib/map/point-in-polygon';

/**
 * Where a parcel's number badge sits on the mini map: the area centroid of its largest
 * polygon's outer ring (shoelace formula), so an L-shaped or multi-part parcel gets one
 * badge over its main body rather than at a bounding-box centre that may fall outside it.
 * `null` for a degenerate ring (no area) — the caller skips the badge.
 */
export function parcelLabelPoint(parcel: FilteredParcel): MapPoint | null {
  let best: { area: number; point: MapPoint } | null = null;

  for (const feature of parcel.geometry.features) {
    const rings =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates[0]]
        : feature.geometry.coordinates.map((polygon) => polygon[0]);

    for (const ring of rings) {
      const candidate = ringCentroid(ring);

      if (candidate !== null && (best === null || candidate.area > best.area)) best = candidate;
    }
  }

  return best?.point ?? null;
}

/** Signed-area centroid of one ring; `null` when the ring encloses no area. */
function ringCentroid(ring: number[][]): { area: number; point: MapPoint } | null {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;

  for (let index = 0; index < ring.length; index++) {
    const [x0, y0] = ring[index];
    const [x1, y1] = ring[(index + 1) % ring.length];
    const cross = x0 * y1 - x1 * y0;

    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  if (twiceArea === 0) return null;

  const factor = 1 / (3 * twiceArea);

  return { area: Math.abs(twiceArea) / 2, point: { lng: cx * factor, lat: cy * factor } };
}

/** On-screen parcel size (px, its shorter side) at and above which a badge is full size. */
export const BADGE_FULL_PARCEL_PX = 96;

/** On-screen parcel size at and below which a badge is at its smallest. */
export const BADGE_MIN_PARCEL_PX = 32;

/** The smallest a badge gets, as a factor of its full size — still legible at 12px × 0.5. */
export const BADGE_MIN_SCALE = 0.5;

/**
 * How much to scale a badge over a parcel that is `parcelPx` wide on screen (its shorter
 * side): full size while the parcel has room, half size once it is a sliver, linear in
 * between. Anchored to the parcel's projected size rather than to a zoom level, so it
 * holds for a 2 ha plot and a 200 ha farm alike — badges shrink exactly when their
 * parcels get small enough to overlap. Scaling the whole pill, not just the font, is
 * what frees the space between neighbours.
 */
export function badgeScale(parcelPx: number): number {
  const progress = (parcelPx - BADGE_MIN_PARCEL_PX) / (BADGE_FULL_PARCEL_PX - BADGE_MIN_PARCEL_PX);

  return BADGE_MIN_SCALE + (1 - BADGE_MIN_SCALE) * Math.min(1, Math.max(0, progress));
}
