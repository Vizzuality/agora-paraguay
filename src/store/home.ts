import { atom } from 'jotai';

import { exposureMapViewAtom, pickDistrictAtom } from '@/store/exposure';
import { backToSelectionAtom } from '@/store/mode';

/**
 * True while arriving on the first screen — the app's first page, or the logo's way back —
 * so the settings open Tipo de análisis there. The sidebar clears it once read.
 */
export const arrivingHomeAtom = atom(true);

/**
 * The logo's way home: the first screen with the parcels kept, as Nuevo análisis leaves
 * it (`backToSelectionAtom`), no district picked, Exposición climática back on its first
 * view and Tipo de análisis open.
 */
export const goHomeAtom = atom(null, (_get, set) => {
  set(backToSelectionAtom);
  set(pickDistrictAtom, null);
  set(exposureMapViewAtom, 'exposicion');
  set(arrivingHomeAtom, true);
});
