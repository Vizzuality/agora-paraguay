import { describe, expect, it } from 'vitest';

import { searchParcels } from '@/lib/analysis/parcel-search';

const PARCELS = ['D07D21P00000002', 'D07D23P00000008', 'D01D02P00000120'];

describe('searchParcels', () => {
  it('keeps every parcel, in selection order, for an empty query', () => {
    expect(searchParcels(PARCELS, '  ')).toEqual(PARCELS);
  });

  it('matches the "Parcela N" label, ignoring case and accents', () => {
    expect(searchParcels(PARCELS, 'PÁRCELA 2 ')).toEqual(['D07D23P00000008']);
  });

  it('matches the cadastral id', () => {
    expect(searchParcels(PARCELS, 'p00000120')).toEqual(['D01D02P00000120']);
  });

  it('finds nothing when no label or id contains the query', () => {
    expect(searchParcels(PARCELS, 'Parcela 9')).toEqual([]);
  });
});
