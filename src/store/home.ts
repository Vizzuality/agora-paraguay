import { atom } from 'jotai';

import { exposureMapViewAtom, pickDistrictAtom } from '@/store/exposure';
import { backToSelectionAtom } from '@/store/mode';

/**
 * The logo's way home: the first screen with the parcels kept, as Nuevo análisis leaves
 * it (`backToSelectionAtom`), no district picked, Exposición climática back on its first
 * view.
 */
export const goHomeAtom = atom(null, (_get, set) => {
  set(backToSelectionAtom);
  set(pickDistrictAtom, null);
  set(exposureMapViewAtom, 'exposicion');
});
