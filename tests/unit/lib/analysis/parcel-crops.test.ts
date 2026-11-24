import { describe, expect, it } from 'vitest';

import { ALL_CROPS, parcelCrops, withParcelCropOptions } from '@/lib/analysis/parcel-crops';
import type { Crop, Filters } from '@/lib/api/metadata/schemas';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';

const parcel = (parcel_id: string, crop_types: Crop[]): FilteredParcel => ({
  parcel_id,
  geometry: { type: 'FeatureCollection', features: [] },
  selected: true,
  last_crop_type: crop_types[0] ?? null,
  crop_types,
});

const FILTERS: Filters = [
  {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    field_type: {
      type: 'category',
      options: [
        { value: 'rice', label: 'Arroz (API)' },
        { value: 'soja', label: 'Soja (API)' },
      ],
    },
  },
  { id: 'date', name: 'Fecha', field_type: { type: 'date', default: '2026-09-17' } },
];

const cropOptions = (filters: Filters) => {
  const field = filters[0]!.field_type;
  return field.type === 'category' ? field.options : [];
};

describe('parcelCrops', () => {
  it('unites the crops the given parcels grew, each once, in a fixed order', () => {
    const parcels = [parcel('A', ['soja']), parcel('B', ['soja', 'rice']), parcel('C', ['rice'])];

    expect(parcelCrops(parcels, ['A', 'B'])).toEqual(['rice', 'soja']);
    expect(parcelCrops(parcels, ['A'])).toEqual(['soja']);
    expect(parcelCrops(parcels, ['Z'])).toEqual([]);
  });
});

describe('withParcelCropOptions', () => {
  it('offers Todos first, then each crop with the API label, when the parcels grew two', () => {
    expect(cropOptions(withParcelCropOptions(FILTERS, ['rice', 'soja']))).toEqual([
      { value: ALL_CROPS, label: 'Todos' },
      { value: 'rice', label: 'Arroz (API)' },
      { value: 'soja', label: 'Soja (API)' },
    ]);
  });

  it('never offers Todos on sanitario: the diseases analysis reads one crop', () => {
    expect(cropOptions(withParcelCropOptions(FILTERS, ['rice', 'soja'], 'sanitario'))).toEqual([
      { value: 'rice', label: 'Arroz (API)' },
      { value: 'soja', label: 'Soja (API)' },
    ]);
  });

  it('offers the one crop alone, without Todos', () => {
    expect(cropOptions(withParcelCropOptions(FILTERS, ['soja']))).toEqual([
      { value: 'soja', label: 'Soja (API)' },
    ]);
  });

  it('keeps the API list while no parcel crop is known, and leaves other filters alone', () => {
    expect(withParcelCropOptions(FILTERS, [])).toBe(FILTERS);
    expect(withParcelCropOptions(FILTERS, ['soja'])[1]).toBe(FILTERS[1]);
  });
});
