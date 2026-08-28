import { atom } from 'jotai';

import type { ParcelFeature } from '@/lib/api/schemas';
import { toggleParcel } from '@/lib/map/parcel-selection';
import { parcelClickEnabledAtom } from '@/store/analysis';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';

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
 * Toggles a parcel in the selection. Gated by `parcelClickEnabledAtom`: clicks select
 * only while no tool is active and the app is in selection mode.
 *
 * Replace semantics, like the other entry points: clicking a parcel focuses the
 * selection on cadastral parcels, so whatever drawing or upload was on the map goes.
 */
export const toggleParcelAtom = atom(null, (get, set, parcel: ParcelFeature) => {
  if (!get(parcelClickEnabledAtom)) return;

  const draw = get(drawInstanceAtom);

  if (draw?.enabled && get(drawStateAtom).polygons.length > 0) {
    draw.clear();
    // `clear()` does not surface as a `change` event, so report it by hand.
    set(drawStateAtom, { type: 'geometry', polygons: [] });
  }

  set(selectedParcelsAtom, toggleParcel(get(selectedParcelsAtom), parcel));
});
