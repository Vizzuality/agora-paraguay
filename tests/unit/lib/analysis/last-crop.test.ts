import { describe, expect, it } from 'vitest';

import { lastCrop } from '@/lib/analysis/last-crop';
import type { Crop } from '@/lib/api/metadata/schemas';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';

const parcel = (parcel_id: string, last_crop_type: Crop | null): FilteredParcel => ({
  parcel_id,
  geometry: { type: 'FeatureCollection', features: [] },
  selected: true,
  last_crop_type,
  crop_types: last_crop_type ? [last_crop_type] : [],
});

const PARCELS = [
  parcel('soy-1', 'soja'),
  parcel('soy-2', 'soja'),
  parcel('rice-1', 'rice'),
  parcel('unknown', null),
];

describe('lastCrop', () => {
  it("reads one parcel's own last crop: soy or rice", () => {
    expect(lastCrop(PARCELS, ['soy-1'])).toBe('soja');
    expect(lastCrop(PARCELS, ['rice-1'])).toBe('rice');
  });

  it('takes the crop most of the parcels last grew', () => {
    expect(lastCrop(PARCELS, ['soy-1', 'soy-2', 'rice-1'])).toBe('soja');
  });

  it('has no answer for a tie between soy and rice, nor for parcels with no known crop', () => {
    expect(lastCrop(PARCELS, ['soy-1', 'rice-1'])).toBeUndefined();
    expect(lastCrop(PARCELS, ['unknown'])).toBeUndefined();
    expect(lastCrop(PARCELS, [])).toBeUndefined();
  });

  it('leaves out parcels with no known crop and parcels not asked about', () => {
    expect(lastCrop(PARCELS, ['rice-1', 'unknown'])).toBe('rice');
    expect(lastCrop(PARCELS, ['rice-1', 'not-answered'])).toBe('rice');
  });
});
