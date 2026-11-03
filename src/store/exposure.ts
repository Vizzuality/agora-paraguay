import { atom } from 'jotai';

import type { ExposureDistrict } from '@/lib/map/exposure-districts';
import type { LayerFeature } from '@/lib/map/layer-feature';

/** The district picked on the exposure map: the panel shows it, the layers filter to it. */
export const selectedDistrictAtom = atom<ExposureDistrict | null>(null);

/** The reference-layer feature clicked on Capas: the panel lists its properties. */
export const selectedLayerFeatureAtom = atom<LayerFeature | null>(null);

/**
 * Picks a district, or clears the pick, on either map tab. A clicked layer feature
 * belongs to the previous pick, so it goes too.
 */
export const pickDistrictAtom = atom(null, (_get, set, district: ExposureDistrict | null) => {
  set(selectedDistrictAtom, district);
  set(selectedLayerFeatureAtom, null);
});
