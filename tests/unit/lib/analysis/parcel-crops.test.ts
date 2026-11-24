import { describe, expect, it } from 'vitest';

import { ALL_CROPS, parcelCrops, withCropOptions } from '@/lib/analysis/parcel-crops';
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

describe('withCropOptions', () => {
  it('offers productivo Todos first, then every crop with the API label, whatever the parcels grew', () => {
    expect(cropOptions(withCropOptions(FILTERS, 'productivo'))).toEqual([
      { value: ALL_CROPS, label: 'Todos' },
      { value: 'rice', label: 'Arroz (API)' },
      { value: 'soja', label: 'Soja (API)' },
    ]);
  });

  it('offers sanitario every crop and never Todos: the diseases analysis reads one crop', () => {
    expect(cropOptions(withCropOptions(FILTERS, 'sanitario'))).toEqual([
      { value: 'rice', label: 'Arroz (API)' },
      { value: 'soja', label: 'Soja (API)' },
    ]);
  });

  it('leaves the other filters alone', () => {
    expect(withCropOptions(FILTERS, 'productivo')[1]).toBe(FILTERS[1]);
  });
});
