import { atom } from 'jotai';

import type { ExposureDistrict } from '@/lib/map/exposure-districts';
import type { LayerFeature } from '@/lib/map/layer-feature';

/** The district picked on the exposure map: the panel shows it, the layers filter to it. */
export const selectedDistrictAtom = atom<ExposureDistrict | null>(null);

/** The reference-layer feature clicked on Capas: the panel lists its properties. */
export const selectedLayerFeatureAtom = atom<LayerFeature | null>(null);
