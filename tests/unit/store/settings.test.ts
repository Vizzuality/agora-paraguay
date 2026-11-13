import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { analysedParcelIdsAtom } from '@/store/analysis';
import { analysedViewAtom, modeAtom, startAnalysisAtom } from '@/store/mode';
import { restartAtAreaAtom, settingsRestartCountAtom } from '@/store/settings';

describe('restartAtAreaAtom', () => {
  it('leaves the analysis for the selection with the parcels kept', () => {
    const store = createStore();

    store.set(startAnalysisAtom, ['D07D21P00000002']);
    store.set(restartAtAreaAtom);

    expect(store.get(modeAtom)).toBe('selection');
    expect(store.get(analysedViewAtom)).toBe(false);
    expect(store.get(analysedParcelIdsAtom)).toEqual(['D07D21P00000002']);
  });

  it('counts every restart, so the sections reset even from the selection', () => {
    const store = createStore();

    store.set(restartAtAreaAtom);
    store.set(restartAtAreaAtom);

    expect(store.get(modeAtom)).toBe('selection');
    expect(store.get(settingsRestartCountAtom)).toBe(2);
  });
});
