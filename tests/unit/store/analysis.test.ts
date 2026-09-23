import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import {
  activeParcelIdAtom,
  activeParcelTabAtom,
  analysedParcelIdsAtom,
  selectAnalysedParcelAtom,
} from '@/store/analysis';

const PARCELS = ['D07D21P00000002', 'D07D23P00000008', 'D07D23P00000009'];

describe('activeParcelIdAtom', () => {
  it('is the parcel the open tab points at', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);

    expect(store.get(activeParcelIdAtom)).toBe('D07D21P00000002');

    store.set(activeParcelTabAtom, 2);
    expect(store.get(activeParcelIdAtom)).toBe('D07D23P00000009');
  });

  it('falls back to the first parcel when a re-analysis shrinks the list under the tab', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);
    store.set(activeParcelTabAtom, 2);

    store.set(analysedParcelIdsAtom, PARCELS.slice(0, 2));

    expect(store.get(activeParcelIdAtom)).toBe('D07D21P00000002');
  });

  it('is undefined while nothing is analysed', () => {
    expect(createStore().get(activeParcelIdAtom)).toBeUndefined();
  });
});

describe('selectAnalysedParcelAtom', () => {
  it('opens the tab of an analysed parcel', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);

    store.set(selectAnalysedParcelAtom, 'D07D23P00000008');

    expect(store.get(activeParcelTabAtom)).toBe(1);
    expect(store.get(activeParcelIdAtom)).toBe('D07D23P00000008');
  });

  it('ignores a parcel that was not analysed', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);
    store.set(activeParcelTabAtom, 1);

    store.set(selectAnalysedParcelAtom, 'D99D99P00000000');

    expect(store.get(activeParcelTabAtom)).toBe(1);
  });
});
