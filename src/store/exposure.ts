import { atom } from 'jotai';

import type { ExposureMapView } from '@/components/map/exposure-layers';
import type { ExposureDistrict } from '@/lib/map/exposure-districts';

/** The district picked on the exposure map: the panel shows it, the layers filter to it. */
export const selectedDistrictAtom = atom<ExposureDistrict | null>(null);

/** Picks a district, or clears the pick, on either map tab. */
export const pickDistrictAtom = atom(null, (_get, set, district: ExposureDistrict | null) => {
  set(selectedDistrictAtom, district);
});

/** The exposure map's open view, kept while the map moves between the two columns. */
export const exposureMapViewAtom = atom<ExposureMapView>('exposicion');
