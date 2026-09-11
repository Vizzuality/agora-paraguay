import { atom } from 'jotai';

import type { ParcelFeature } from '@/lib/api/parcels/schemas';
import { toggleParcel } from '@/lib/map/parcel-selection';
import { parcelClickEnabledAtom } from '@/store/analysis';

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
 * Parcels coexist with the drawn or uploaded polygon: step 2 of the selection flow
 * ("Confirmación de parcelas") is where the user refines the parcels around their área
 * de interés, so a click must not wipe it. Everything selected is analysed together.
 */
export const toggleParcelAtom = atom(null, (get, set, parcel: ParcelFeature) => {
  if (!get(parcelClickEnabledAtom)) return;

  set(selectedParcelsAtom, toggleParcel(get(selectedParcelsAtom), parcel));
});
