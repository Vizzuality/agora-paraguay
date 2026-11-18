import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import type { ExposureDistrict } from '@/lib/map/exposure-districts';
import { analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
import { drawStateAtom } from '@/store/draw-core';
import { exposureMapViewAtom, pickDistrictAtom, selectedDistrictAtom } from '@/store/exposure';
import { goHomeAtom } from '@/store/home';
import { analysedViewAtom, modeAtom, startAnalysisAtom } from '@/store/mode';

const polygon = {
  id: 'polygon-1',
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[]] },
  properties: { mode: 'polygon' },
} as DrawnPolygon;

describe('goHomeAtom', () => {
  it('goes back to the selection with the parcels kept, as Nuevo análisis does', () => {
    const store = createStore();
    store.set(drawStateAtom, { type: 'geometry', polygons: [polygon] });
    store.set(startAnalysisAtom, ['D07D21P00000002']);

    store.set(goHomeAtom);

    expect(store.get(modeAtom)).toBe('selection');
    expect(store.get(analysedViewAtom)).toBe(false);
    expect(store.get(drawPolygonsAtom)).toEqual([polygon]);
    expect(store.get(analysedParcelIdsAtom)).toEqual(['D07D21P00000002']);
  });

  it('clears the picked district and puts the exposure map back on its first view', () => {
    const store = createStore();
    store.set(pickDistrictAtom, { id: '1', name: 'Pilar' } as ExposureDistrict);
    store.set(exposureMapViewAtom, 'capas');

    store.set(goHomeAtom);

    expect(store.get(selectedDistrictAtom)).toBeNull();
    expect(store.get(exposureMapViewAtom)).toBe('exposicion');
  });
});
