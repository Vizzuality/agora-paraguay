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
  it('starts on Todas and follows the open tab', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);

    expect(store.get(activeParcelIdAtom)).toBeNull();

    store.set(activeParcelTabAtom, 'D07D23P00000009');
    expect(store.get(activeParcelIdAtom)).toBe('D07D23P00000009');

    store.set(activeParcelTabAtom, null);
    expect(store.get(activeParcelIdAtom)).toBeNull();
  });

  it('falls back to Todas when a re-analysis drops the open parcel', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);
    store.set(activeParcelTabAtom, 'D07D23P00000009');

    store.set(analysedParcelIdsAtom, PARCELS.slice(0, 2));

    expect(store.get(activeParcelIdAtom)).toBeNull();
  });
});

describe('selectAnalysedParcelAtom', () => {
  it('opens the tab of an analysed parcel', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);

    store.set(selectAnalysedParcelAtom, 'D07D23P00000008');

    expect(store.get(activeParcelIdAtom)).toBe('D07D23P00000008');
  });

  it('ignores a parcel that was not analysed', () => {
    const store = createStore();
    store.set(analysedParcelIdsAtom, PARCELS);
    store.set(activeParcelTabAtom, 'D07D23P00000008');

    store.set(selectAnalysedParcelAtom, 'D99D99P00000000');

    expect(store.get(activeParcelIdAtom)).toBe('D07D23P00000008');
  });
});
