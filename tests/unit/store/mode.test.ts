import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { analysedParcelIdsAtom } from '@/store/analysis';
import {
  analysedViewAtom,
  backToSelectionAtom,
  modeAtom,
  resumeAnalysisAtom,
  startAnalysisAtom,
} from '@/store/mode';

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

describe('analysedViewAtom', () => {
  it('shows the analysis while analysing with parcels, and the selection after Editar', () => {
    const store = createStore();

    expect(store.get(analysedViewAtom)).toBe(false);

    store.set(startAnalysisAtom, ['D07D21P00000002']);
    expect(store.get(analysedViewAtom)).toBe(true);

    store.set(backToSelectionAtom);
    expect(store.get(analysedViewAtom)).toBe(false);
  });

  it('stays on the selection when Analizar sent no parcel', () => {
    const store = createStore();

    store.set(startAnalysisAtom, []);
    expect(store.get(analysedViewAtom)).toBe(false);
  });
});

describe('resumeAnalysisAtom', () => {
  it('brings back the analysis a reload restored the parcels of', () => {
    const store = createStore();

    store.set(analysedParcelIdsAtom, ['D07D21P00000002']);
    store.set(resumeAnalysisAtom);

    expect(store.get(modeAtom)).toBe('analysis');
    expect(store.get(analysedViewAtom)).toBe(true);
  });

  it('does nothing without analysed parcels', () => {
    const store = createStore();

    store.set(resumeAnalysisAtom);
    expect(store.get(modeAtom)).toBe('selection');
  });
});
