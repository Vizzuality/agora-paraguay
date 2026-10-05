import { describe, expect, it } from 'vitest';

import { numberGaugeWidgets } from '@/lib/analysis/number-gauge';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base histórica de soja',
  unit: 't/ha',
  description: 'Rendimiento medio histórico.',
  indicator_type: { type: 'numeric' },
};
const area: Indicator = {
  id: 'area',
  name: 'Área',
  unit: 'ha',
  indicator_type: { type: 'numeric' },
};
const score: Indicator = {
  id: 'Pro_soja_score',
  name: 'Puntuación',
  indicator_type: { type: 'range', min: 0, max: 5 },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const parcels = [
  parcel('A', { Pro_soja: 3.55, area: 10.2, Pro_soja_score: 3 }),
  parcel('B', { pro_soja: '3.81', area: 7.3, Pro_soja_score: 4 }),
  parcel('C', { Pro_soja: 'NA' }),
];

describe('numberGaugeWidgets', () => {
  it("reads the open parcel's number on the scale of every submitted parcel", () => {
    const [widget] = numberGaugeWidgets(
      parcels,
      ['A', 'B', 'C'],
      [production],
      'productivo',
      'individual',
      parcels[0],
    );

    expect(widget).toEqual({
      id: 'Pro_soja',
      label: 'Producción base histórica de soja',
      description: 'Rendimiento medio histórico.',
      unit: 't/ha',
      value: 3.55,
      text: '3,55',
      min: 0,
      max: 4,
      ticks: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4],
      position: 88.75,
    });
  });

  it('reads digits in a string and matches the column ignoring case', () => {
    const [widget] = numberGaugeWidgets(
      parcels,
      ['A', 'B'],
      [production],
      'productivo',
      'individual',
      parcels[1],
    );

    expect(widget).toMatchObject({ value: 3.81, text: '3,81', position: 95.25 });
  });

  it('makes no widget without a reading, for the area, for a range, under Todas or on sanitario', () => {
    expect(
      numberGaugeWidgets(parcels, ['A', 'C'], [production], 'productivo', 'individual', parcels[2]),
    ).toEqual([]);
    expect(
      numberGaugeWidgets(parcels, ['A'], [area, score], 'productivo', 'individual', parcels[0]),
    ).toEqual([]);
    expect(
      numberGaugeWidgets(parcels, ['A', 'B'], [production], 'productivo', 'multiple', undefined),
    ).toEqual([]);
    expect(
      numberGaugeWidgets(parcels, ['A'], [production], 'sanitario', 'individual', parcels[0]),
    ).toEqual([]);
    expect(
      numberGaugeWidgets(parcels, ['A'], undefined, 'productivo', 'individual', parcels[0]),
    ).toEqual([]);
  });
});
