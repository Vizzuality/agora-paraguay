import { describe, expect, it } from 'vitest';

import { isSavedSelection, readSavedSelection, writeSavedSelection } from '@/lib/saved-selection';

const polygon = {
  id: 'a',
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[]] },
  properties: { mode: 'polygon' },
};

describe('isSavedSelection', () => {
  it('accepts a record of polygons, an analysis id and parcel flips', () => {
    expect(
      isSavedSelection({ polygons: [polygon], analysisId: 'a', toggledParcelIds: ['p'] }),
    ).toBe(true);
    expect(isSavedSelection({ polygons: [], analysisId: null, toggledParcelIds: [] })).toBe(true);
  });

  it('rejects anything else, so an older or tampered record reads as nothing saved', () => {
    expect(isSavedSelection(null)).toBe(false);
    expect(isSavedSelection({ polygons: [{ type: 'Feature' }] })).toBe(false);
    expect(
      isSavedSelection({ polygons: [polygon], analysisId: undefined, toggledParcelIds: [] }),
    ).toBe(false);
    expect(isSavedSelection({ polygons: [polygon], analysisId: null, toggledParcelIds: [1] })).toBe(
      false,
    );
  });
});

describe('without IndexedDB', () => {
  // Node has no IndexedDB, the same situation as a browser that blocks site data.
  it('reads nothing and writes without throwing', async () => {
    await expect(readSavedSelection()).resolves.toBeNull();
    await expect(
      writeSavedSelection({ polygons: [], analysisId: null, toggledParcelIds: [] }),
    ).resolves.toBeUndefined();
  });
});
