import { describe, expect, it } from 'vitest';

import { parcelValueTiles } from '@/lib/analysis/parcel-values';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base histórica de soja',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};
const area: Indicator = {
  id: 'area',
  name: 'Área',
  unit: 'ha',
  indicator_type: { type: 'numeric' },
};
const rust: Indicator = {
  id: 'asian_rust',
  name: 'Roya',
  indicator_type: { type: 'range', min: 0, max: 3 },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const parcels = [
  parcel('B', { pro_soja: 3.81, area: 7.3 }),
  parcel('A', { pro_soja: 3.55, area: 10.2 }),
  parcel('C', { pro_soja: 'NA' }),
];

describe('parcelValueTiles', () => {
  it('lists the parcels in the submitted order as P.n, the track relative to the largest', () => {
    const [tile] = parcelValueTiles(parcels, ['A', 'B'], [production], 'productivo');

    expect(tile).toMatchObject({
      id: 'Pro_soja',
      label: 'Producción base histórica de soja',
      unit: 't/ha',
    });
    expect(tile.rows).toEqual([
      { parcelId: 'A', label: 'P.1', value: 3.55, text: '3,55', position: (3.55 / 3.81) * 100 },
      { parcelId: 'B', label: 'P.2', value: 3.81, text: '3,81', position: 100 },
    ]);
  });

  it('skips a parcel with no reading but keeps the others their numbers', () => {
    const [tile] = parcelValueTiles(parcels, ['A', 'C', 'B'], [production], 'productivo');

    expect(tile.rows.map((row) => row.label)).toEqual(['P.1', 'P.3']);
  });

  it('makes no tile for an indicator no parcel answered, nor for the area, nor for a classed one', () => {
    expect(parcelValueTiles(parcels, ['C'], [production], 'productivo')).toEqual([]);
    expect(parcelValueTiles(parcels, ['A'], [area, rust], 'productivo')).toEqual([]);
  });

  it('is empty on sanitario, where open numbers are facts, and without metadata', () => {
    expect(parcelValueTiles(parcels, ['A'], [production], 'sanitario')).toEqual([]);
    expect(parcelValueTiles(parcels, ['A'], undefined, 'productivo')).toEqual([]);
  });

  it('fills nothing when every value is zero or below', () => {
    const [tile] = parcelValueTiles(
      [parcel('A', { pro_soja: 0 })],
      ['A'],
      [production],
      'productivo',
    );

    expect(tile.rows[0].position).toBe(0);
  });
});
