import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { analysedParcelIdsAtom } from '@/store/analysis';
import { backToSelectionAtom, modeAtom, startAnalysisAtom } from '@/store/mode';

describe('startAnalysisAtom', () => {
  it('freezes the submitted parcels for the analysis page and enters analysis mode', () => {
    const store = createStore();

    store.set(startAnalysisAtom, ['D07D21P00000002', 'D07D23P00000008']);

    expect(store.get(modeAtom)).toBe('analysis');
    expect(store.get(analysedParcelIdsAtom)).toEqual(['D07D21P00000002', 'D07D23P00000008']);
  });

  it('keeps the submitted parcels through a trip back to selection until Analizar runs again', () => {
    const store = createStore();

    store.set(startAnalysisAtom, ['D07D21P00000002']);
    store.set(backToSelectionAtom);
    expect(store.get(analysedParcelIdsAtom)).toEqual(['D07D21P00000002']);

    store.set(startAnalysisAtom, ['D07D23P00000008']);
    expect(store.get(analysedParcelIdsAtom)).toEqual(['D07D23P00000008']);
  });
});
