import { describe, expect, it } from 'vitest';

import { numberWidgets } from '@/lib/analysis/number-widget';
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
const seasons: Indicator = {
  id: 'N_soja',
  name: 'Contador de zafras de soja detectadas',
  indicator_type: { type: 'range', min: 0, max: 8, step: 1 },
};
const stability: Indicator = {
  id: 'IEP_H5_soja',
  name: 'Índice de estabilidad productiva',
  unit: '%',
  indicator_type: { type: 'range', min: 0, max: 100, step: 1 },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const parcels = [
  parcel('A', { Pro_soja: 3.55, area: 10.2, N_soja: 5, IEP_H5_soja: 62 }),
  parcel('B', { pro_soja: '3.81', area: 7.3, N_soja: 3, IEP_H5_soja: '87' }),
  parcel('C', { Pro_soja: 'NA' }),
];

describe('numberWidgets', () => {
  it("reads the open parcel's number on the scale of every submitted parcel", () => {
    const [widget] = numberWidgets(
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
    const [widget] = numberWidgets(
      parcels,
      ['A', 'B'],
      [production],
      'productivo',
      'individual',
      parcels[1],
    );

    expect(widget).toMatchObject({ value: 3.81, text: '3,81', position: 95.25 });
  });

  it('draws a range on its own scale, whatever the set: a 0–8 count with a tick per step, a 0–100 % every ten', () => {
    const [count, stable] = numberWidgets(
      parcels,
      ['A', 'B'],
      [seasons, stability],
      'productivo',
      'individual',
      parcels[1],
    );

    expect(count).toMatchObject({
      id: 'N_soja',
      unit: null,
      value: 3,
      text: '3',
      min: 0,
      max: 8,
      ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      position: 37.5,
    });
    expect(stable).toMatchObject({ value: 87, min: 0, max: 100, position: 87 });
    expect(stable.ticks).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  });

  it('makes no widget without a reading, for the area, under Todas or on sanitario', () => {
    expect(
      numberWidgets(parcels, ['A', 'C'], [production], 'productivo', 'individual', parcels[2]),
    ).toEqual([]);
    expect(numberWidgets(parcels, ['A'], [area], 'productivo', 'individual', parcels[0])).toEqual(
      [],
    );
    expect(
      numberWidgets(parcels, ['A', 'B'], [production], 'productivo', 'multiple', undefined),
    ).toEqual([]);
    expect(
      numberWidgets(parcels, ['A'], [production], 'sanitario', 'individual', parcels[0]),
    ).toEqual([]);
    expect(
      numberWidgets(parcels, ['A'], undefined, 'productivo', 'individual', parcels[0]),
    ).toEqual([]);
  });
});
