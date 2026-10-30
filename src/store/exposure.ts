import { atom } from 'jotai';

import type { ExposureDistrict } from '@/lib/map/exposure-districts';

/** The district picked on the exposure map: the panel shows it, the layers filter to it. */
export const selectedDistrictAtom = atom<ExposureDistrict | null>(null);
