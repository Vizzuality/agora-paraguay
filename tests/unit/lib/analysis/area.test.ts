import { describe, expect, it } from 'vitest';

import { formatArea, isAreaIndicator, parcelArea, parcelAreaRows } from '@/lib/analysis/area';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const area: Indicator = {
  id: 'area',
  name: 'Área',
  unit: 'ha',
  indicator_type: { type: 'numeric' },
};
const rust: Indicator = {
  id: 'asian_rust',
  name: 'Roya',
  indicator_type: { type: 'range', min: 1, max: 3 },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const west = parcel('W', { Area: 10.2, Asian_rust: 3 });
const east = parcel('E', { Area: 7.3, Asian_rust: 1 });

describe('isAreaIndicator', () => {
  it('matches the area id ignoring case', () => {
    expect(isAreaIndicator(area)).toBe(true);
    expect(isAreaIndicator({ ...area, id: 'AREA' })).toBe(true);
    expect(isAreaIndicator(rust)).toBe(false);
  });
});

describe('parcelArea', () => {
  it("reads the active parcel's area with the unit from the metadata, whatever the column's casing", () => {
    expect(parcelArea([west, east], 'E', [rust, area])).toEqual({ value: 7.3, unit: 'ha' });
  });

  it('sums the parcels under Todas', () => {
    expect(parcelArea([west, east], null, [area])).toEqual({ value: 17.5, unit: 'ha' });
  });

  it('is null without an area indicator in the metadata, or before the analysis answered', () => {
    expect(parcelArea([west, east], null, [rust])).toBeNull();
    expect(parcelArea([west, east], null, undefined)).toBeNull();
    expect(parcelArea([], null, [area])).toBeNull();
  });

  it('skips parcels with no reading and is null when none has one', () => {
    const blank = parcel('B', { area: 'NA' });

    expect(parcelArea([blank, east], null, [area])).toEqual({ value: 7.3, unit: 'ha' });
    expect(parcelArea([blank], null, [area])).toBeNull();
    expect(parcelArea([west], 'missing', [area])).toBeNull();
  });

  it('accepts a number delivered as a string', () => {
    expect(parcelArea([parcel('S', { area: '4.5' })], 'S', [area])).toEqual({
      value: 4.5,
      unit: 'ha',
    });
  });

  it('carries no unit when the metadata gives none', () => {
    expect(parcelArea([west], 'W', [{ ...area, unit: null }])).toEqual({ value: 10.2, unit: null });
  });
});

describe('formatArea', () => {
  it('prints the figure in the platform locale with one decimal at most and the unit', () => {
    expect(formatArea({ value: 17.5, unit: 'ha' })).toBe('17,5 ha');
    expect(formatArea({ value: 1234.56, unit: 'ha' })).toBe('1.234,6 ha');
    expect(formatArea({ value: 3, unit: null })).toBe('3');
  });
});

describe('parcelAreaRows', () => {
  it('lists every analysed parcel in selection order, with null where it carries no area', () => {
    const blank = parcel('B', { Asian_rust: 2 });

    expect(parcelAreaRows([west, east, blank], ['E', 'B', 'W'], [area])).toEqual([
      { parcelId: 'E', area: { value: 7.3, unit: 'ha' } },
      { parcelId: 'B', area: null },
      { parcelId: 'W', area: { value: 10.2, unit: 'ha' } },
    ]);
  });

  it('is all null without an area indicator', () => {
    expect(parcelAreaRows([west, east], ['W', 'E'], [rust])).toEqual([
      { parcelId: 'W', area: null },
      { parcelId: 'E', area: null },
    ]);
  });
});
