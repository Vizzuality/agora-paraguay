import type { ParcelFeature } from "@/lib/api/schemas";
import { ringContains, type MapPoint } from "@/lib/map/point-in-polygon";

/**
 * Selection logic for the cadastral parcels layer — pure, node-tested. The selection
 * is a toggled set: clicking a parcel adds it, clicking it again removes it, and
 * every selected parcel is submitted together when the analysis is sent
 * (multi-select, unlike the single-highlight selection of the drawn polygons).
 */

/** Adds `parcel` to the selection, or removes it if it is already there. */
export function toggleParcel(selection: ParcelFeature[], parcel: ParcelFeature): ParcelFeature[] {
  const without = selection.filter((entry) => entry.properties.id !== parcel.properties.id);

  return without.length === selection.length ? [...selection, parcel] : without;
}

/**
 * The cadastral parcel under `point`, or `null`. Later features win, mirroring
 * `polygonAtPoint` — though the mock parcels never overlap by construction.
 */
export function parcelAtPoint(parcels: ParcelFeature[], point: MapPoint): ParcelFeature | null {
  for (let index = parcels.length - 1; index >= 0; index--) {
    if (ringContains(parcels[index].geometry.coordinates[0], point)) {
      return parcels[index];
    }
  }

  return null;
}
