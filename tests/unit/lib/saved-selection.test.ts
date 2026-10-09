import { describe, expect, it } from 'vitest';

import {
  isSavedRecord,
  MAX_AGE_MS,
  readSavedSelection,
  unexpired,
  writeSavedSelection,
} from '@/lib/saved-selection';

const polygon = {
  id: 'a',
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[]] },
  properties: { mode: 'polygon' },
};

describe('isSavedRecord', () => {
  it('accepts a record of polygons, an analysis id, parcel flips and a timestamp', () => {
    expect(
      isSavedRecord({ polygons: [polygon], analysisId: 'a', toggledParcelIds: ['p'], savedAt: 1 }),
    ).toBe(true);
    expect(
      isSavedRecord({ polygons: [], analysisId: null, toggledParcelIds: [], savedAt: 1 }),
    ).toBe(true);
  });

  it('rejects anything else, so an older or tampered record reads as nothing saved', () => {
    expect(isSavedRecord(null)).toBe(false);
    expect(isSavedRecord({ polygons: [{ type: 'Feature' }] })).toBe(false);
    expect(
      isSavedRecord({
        polygons: [polygon],
        analysisId: undefined,
        toggledParcelIds: [],
        savedAt: 1,
      }),
    ).toBe(false);
    expect(
      isSavedRecord({ polygons: [polygon], analysisId: null, toggledParcelIds: [1], savedAt: 1 }),
    ).toBe(false);
    // A record from before the timestamp existed is dropped rather than kept forever.
    expect(isSavedRecord({ polygons: [polygon], analysisId: null, toggledParcelIds: [] })).toBe(
      false,
    );
  });
});

describe('unexpired', () => {
  const record = { polygons: [], analysisId: null, toggledParcelIds: [], savedAt: 1_000 };

  it('hands back the selection without the timestamp while the record is fresh', () => {
    expect(unexpired(record as never, 1_000 + MAX_AGE_MS)).toEqual({
      polygons: [],
      analysisId: null,
      toggledParcelIds: [],
    });
  });

  it('drops a record older than seven days', () => {
    expect(unexpired(record as never, 1_000 + MAX_AGE_MS + 1)).toBeNull();
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
