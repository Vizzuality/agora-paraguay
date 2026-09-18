import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { ringContains, type MapPoint } from '@/lib/map/point-in-polygon';

/**
 * Manual refinement of what `filter-parcels` answered — pure, node-tested. The API
 * flags the parcels over the overlap threshold; the user can flip any returned parcel
 * by clicking it. The flips are kept as a list of parcel ids and applied on top of the
 * answer, so a refetch (an edited polygon) keeps the user's choices for the parcels
 * that are still there and drops the rest with the parcels themselves.
 */

/** Adds `id` to the flipped list, or removes it if it is already there. */
export function toggleParcelId(toggled: string[], id: string): string[] {
  return toggled.includes(id) ? toggled.filter((entry) => entry !== id) : [...toggled, id];
}

/** The answer with the user's flips applied: a flipped parcel's `selected` is inverted. */
export function applyToggles(parcels: FilteredParcel[], toggled: string[]): FilteredParcel[] {
  if (toggled.length === 0) return parcels;

  return parcels.map((parcel) =>
    toggled.includes(parcel.parcel_id) ? { ...parcel, selected: !parcel.selected } : parcel,
  );
}

/** The ids Analizar sends: every parcel selected after the flips. */
export function selectedParcelIds(parcels: FilteredParcel[]): string[] {
  return parcels.filter((parcel) => parcel.selected).map((parcel) => parcel.parcel_id);
}

/** The outer rings of a parcel's geometry, whatever its polygon type. */
function outerRingsOf(parcel: FilteredParcel): number[][][] {
  return parcel.geometry.features.flatMap((feature) =>
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map((polygon) => polygon[0]),
  );
}

/** The returned parcel under `point`, or `null`. Later parcels win, like `polygonAtPoint`. */
export function parcelAtPoint(parcels: FilteredParcel[], point: MapPoint): FilteredParcel | null {
  for (let index = parcels.length - 1; index >= 0; index--) {
    if (outerRingsOf(parcels[index]).some((ring) => ringContains(ring, point))) {
      return parcels[index];
    }
  }

  return null;
}
