import { describe, expect, it } from 'vitest';

import { parcelValueWidgets } from '@/lib/analysis/parcel-values';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base histórica de soja',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};
/** A range on productivo is what the list serves now; an open number has the gauge and histogram. */
const score: Indicator = {
  id: 'Pro_soja_score',
  name: 'Puntuación de producción de soja',
  unit: 'pts',
  indicator_type: { type: 'range', min: 0, max: 5 },
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
  parcel('B', { pro_soja_score: 3.81, pro_soja: 3.81, area: 7.3 }),
  parcel('A', { pro_soja_score: 3.55, pro_soja: 3.55, area: 10.2 }),
  parcel('C', { pro_soja_score: 'NA', pro_soja: 'NA' }),
];

describe('parcelValueWidgets', () => {
  it("lists the parcels in the submitted order as Parcela N, the track on the range's scale", () => {
    const [widget] = parcelValueWidgets(parcels, ['A', 'B'], [score], 'productivo');

    expect(widget).toMatchObject({
      id: 'Pro_soja_score',
      label: 'Puntuación de producción de soja',
      unit: 'pts',
    });
    expect(widget.rows).toEqual([
      { parcelId: 'A', label: 'Parcela 1', value: 3.55, text: '3,55', position: 71 },
      { parcelId: 'B', label: 'Parcela 2', value: 3.81, text: '3,81', position: 76.2 },
    ]);
  });

  it('lists only the given parcels, numbered by their place in the whole submission', () => {
    const [widget] = parcelValueWidgets(parcels, ['A', 'B'], [score], 'productivo', ['B']);

    expect(widget.rows.map((row) => [row.label, row.text])).toEqual([['Parcela 2', '3,81']]);
    expect(parcelValueWidgets(parcels, ['A', 'C'], [score], 'productivo', ['C'])).toEqual([]);
  });

  it('skips a parcel with no reading but keeps the others their numbers and numbering', () => {
    const [widget] = parcelValueWidgets(parcels, ['A', 'C', 'B'], [score], 'productivo');

    // C is the second parcel: B stays Parcela 3 even though its row comes second.
    expect(widget.rows.map((row) => row.label)).toEqual(['Parcela 1', 'Parcela 3']);
  });

  it('carries the indicator description for the title info icon', () => {
    const [widget] = parcelValueWidgets(
      parcels,
      ['A'],
      [{ ...score, description: 'Rendimiento medio histórico.' }],
      'productivo',
    );

    expect(widget.description).toBe('Rendimiento medio histórico.');
  });

  it('makes no widget for an indicator no parcel answered, nor for the area', () => {
    expect(parcelValueWidgets(parcels, ['C'], [score], 'productivo')).toEqual([]);
    expect(parcelValueWidgets(parcels, ['A'], [area], 'productivo')).toEqual([]);
  });

  it('leaves open numbers to the gauge and the histogram, sanitario ranges to the ruler', () => {
    expect(parcelValueWidgets(parcels, ['A', 'B'], [production], 'productivo')).toEqual([]);
    expect(parcelValueWidgets(parcels, ['A'], [rust, score], 'sanitario')).toEqual([]);
    expect(parcelValueWidgets(parcels, ['A'], undefined, 'productivo')).toEqual([]);
  });

  it('fills a range on its own scale, not relative to the parcels, and reads digits in strings', () => {
    const iep: Indicator = {
      id: 'IEP_H5_soja',
      name: 'IEP',
      unit: '%',
      indicator_type: { type: 'range', min: 0, max: 100 },
    };
    const [widget] = parcelValueWidgets(
      [parcel('A', { IEP_H5_soja: '74' }), parcel('B', { IEP_H5_soja: 67 })],
      ['A', 'B'],
      [iep],
      'productivo',
    );

    expect(widget.rows.map((row) => [row.text, row.position])).toEqual([
      ['74', 74],
      ['67', 67],
    ]);
  });

  it('fills nothing at the bottom of the range', () => {
    const [widget] = parcelValueWidgets(
      [parcel('A', { pro_soja_score: 0 })],
      ['A'],
      [score],
      'productivo',
    );

    expect(widget.rows[0].position).toBe(0);
  });
});
