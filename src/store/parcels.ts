import { atom } from "jotai";

import type { ParcelFeature } from "@/lib/api/schemas";
import { canSelectParcel } from "@/lib/map/draw-state";
import { toggleParcel } from "@/lib/map/parcel-selection";
import { drawStateAtom } from "@/store/draw-core";

/**
 * The cadastral parcels picked for analysis by clicking them on the map. Multi-select:
 * every selected parcel is submitted together with the drawn and uploaded polygons when
 * Analizar is pressed.
 *
 * Deliberately outside the draw store: the cadastral layer is read-only reference data
 * (`parcels-layer.tsx`), never Terra Draw geometry — selecting a parcel must not make
 * it editable.
 */
export const selectedParcelsAtom = atom<ParcelFeature[]>([]);

/**
 * Toggles a parcel in the selection. Gated by the same session rule as the drawn
 * polygons (`canSelectParcel`): clicks select only while no tool is active and the
 * session has not been analyzed.
 */
export const toggleParcelAtom = atom(null, (get, set, parcel: ParcelFeature) => {
  if (!canSelectParcel(get(drawStateAtom))) return;

  set(selectedParcelsAtom, toggleParcel(get(selectedParcelsAtom), parcel));
});
