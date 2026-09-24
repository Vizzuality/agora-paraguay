import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import {
  activeParcelIdAtom,
  activeParcelTabAtom,
  analysedParcelIdsAtom,
  analysisFiltersAtom,
  selectedIndicatorIdsAtom,
  setAnalysisFilterAtom,
} from '@/store/analysis';
import { drawPolygonsAtom, restartSelectionAtom } from '@/store/draw';
import { drawStateAtom } from '@/store/draw-core';
import { modeAtom, startAnalysisAtom } from '@/store/mode';
import { toggledParcelIdsAtom, toggleParcelAtom } from '@/store/parcels';
import { uploadResultAtom } from '@/store/upload';

const polygon = {
  id: 'polygon-1',
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[]] },
  properties: { mode: 'polygon' },
} as DrawnPolygon;

const INDICATORS = [
  {
    id: 'asian_rust',
    name: 'Phakopsora pachyrhizi',
    indicator_type: { type: 'range' as const, min: 1, max: 3 },
  },
];

/** A store after a full run: drawn, flipped, analysed, tuned — and back to `/analisis`. */
function storeAfterAnalysis() {
  const store = createStore();

  // Bound while drawing and flipping (the click gate needs it), unbound on /analisis.
  store.set(drawStateAtom, { type: 'bound' });
  store.set(drawStateAtom, { type: 'geometry', polygons: [polygon] });
  store.set(toggleParcelAtom, 'D07D23P00000008');
  store.set(uploadResultAtom, {
    fileName: 'farms.kml',
    accepted: 1,
    warnings: [],
    error: null,
    errorCode: null,
  });
  store.set(startAnalysisAtom, ['D07D21P00000002', 'D07D23P00000008']);
  store.set(activeParcelTabAtom, 'D07D23P00000008');
  store.set(setAnalysisFilterAtom, { id: 'crop_type', value: 'soy' });
  store.set(selectedIndicatorIdsAtom, { indicators: INDICATORS, id: 'asian_rust' });
  store.set(drawStateAtom, { type: 'unbound' });

  return store;
}

describe('restartSelectionAtom', () => {
  it('clears every slice of the previous run, even with the map gone', () => {
    const store = storeAfterAnalysis();

    // Sanity: the run is really there before the reset.
    expect(store.get(drawPolygonsAtom)).toHaveLength(1);
    expect(store.get(modeAtom)).toBe('analysis');
    expect(store.get(toggledParcelIdsAtom)).toEqual(['D07D23P00000008']);
    expect(store.get(selectedIndicatorIdsAtom)).not.toBeNull();

    store.set(restartSelectionAtom);

    expect(store.get(drawPolygonsAtom)).toEqual([]);
    expect(store.get(modeAtom)).toBe('selection');
    expect(store.get(toggledParcelIdsAtom)).toEqual([]);
    expect(store.get(uploadResultAtom)).toBeNull();
    expect(store.get(analysedParcelIdsAtom)).toEqual([]);
    expect(store.get(activeParcelIdAtom)).toBeNull();
    expect(store.get(analysisFiltersAtom)).toEqual({});
    expect(store.get(selectedIndicatorIdsAtom)).toBeNull();
  });

  it('leaves nothing for the next map to restore', () => {
    const store = storeAfterAnalysis();

    store.set(restartSelectionAtom);
    store.set(drawStateAtom, { type: 'bound' });

    expect(store.get(drawPolygonsAtom)).toEqual([]);
  });
});
