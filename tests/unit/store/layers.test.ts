import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { activeGlobalLayerIdAtom, toggleGlobalLayerAtom } from '@/store/layers';

describe('toggleGlobalLayerAtom', () => {
  it('shows one layer at a time and hides the one already shown', () => {
    const store = createStore();

    store.set(toggleGlobalLayerAtom, 6);
    expect(store.get(activeGlobalLayerIdAtom)).toBe(6);

    store.set(toggleGlobalLayerAtom, 9);
    expect(store.get(activeGlobalLayerIdAtom)).toBe(9);

    store.set(toggleGlobalLayerAtom, 9);
    expect(store.get(activeGlobalLayerIdAtom)).toBeNull();
  });
});
