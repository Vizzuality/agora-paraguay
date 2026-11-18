import { atom } from 'jotai';

import { restartSelectionAtom } from '@/store/draw';
import { exposureMapViewAtom, pickDistrictAtom } from '@/store/exposure';

/**
 * The logo's way home: the app as a fresh load finds it. No polygons and no analysis
 * (`restartSelectionAtom`), no district picked, Exposición climática back on its first view.
 */
export const startOverAtom = atom(null, (_get, set) => {
  set(restartSelectionAtom);
  set(pickDistrictAtom, null);
  set(exposureMapViewAtom, 'exposicion');
});
