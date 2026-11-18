import { describe, expect, it } from 'vitest';

import { analysisWidgets } from '@/lib/analysis/analysis-widgets';
import {
  percentile,
  projectionCrop,
  projectionScale,
  projectionWidgets,
} from '@/lib/analysis/projection';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const numeric = (id: string): Indicator => ({
  id,
  name: id,
  unit: 't/ha',
  description: `Descripción de ${id}`,
  indicator_type: { type: 'numeric' },
});

const SCENARIOS = ['LOW', 'MID', 'HIGH'].flatMap((scenario) =>
  ['H5', 'H10'].map((horizon) => numeric(`${scenario}_${horizon}_soja`)),
);
const PRO = numeric('Pro_soja');
const INDICATORS = [PRO, ...SCENARIOS];

const parcel = (id: string, values: Record<string, number | string>): AnalysisParcel => ({
  parcel_id: id,
  properties: values,
});

const A = parcel('A', {
  Pro_soja: 3,
  LOW_H5_soja: 2,
  MID_H5_soja: 3,
  HIGH_H5_soja: 4,
  LOW_H10_soja: 1,
  MID_H10_soja: 2.5,
  HIGH_H10_soja: 3.5,
});
const B = parcel('B', {
  Pro_soja: 4,
  LOW_H5_soja: 3,
  MID_H5_soja: 4,
  HIGH_H5_soja: 5,
  LOW_H10_soja: 2,
  MID_H10_soja: 3.5,
  HIGH_H10_soja: 4.5,
});

describe('projectionCrop', () => {
  it('recognises the scenario × horizon ids, case-blind', () => {
    expect(projectionCrop('MID_H5_soja')).toBe('soja');
    expect(projectionCrop('high_h10_ARROZ')).toBe('arroz');
  });

  it('leaves every other indicator alone', () => {
    expect(projectionCrop('Pro_soja')).toBeNull();
    expect(projectionCrop('IEP_H5_soja')).toBeNull();
  });
});

describe('percentile', () => {
  it('interpolates between ranks as numpy does', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.1)).toBeCloseTo(1.4);
    expect(percentile([1, 2, 3, 4, 5], 0.9)).toBeCloseTo(4.6);
    expect(percentile([7], 0.9)).toBe(7);
  });
});

describe('projectionScale', () => {
  it('rounds just outside the band rather than starting at zero', () => {
    expect(projectionScale([2.04, 3.71])).toEqual({
      min: 2,
      max: 4,
      ticks: [2, 2.5, 3, 3.5, 4],
    });
  });
});

describe('projectionWidgets', () => {
  it('on a parcel tab reads its own scenarios, the base narrowed to its one value', () => {
    const [widget] = projectionWidgets([A, B], ['A', 'B'], INDICATORS, 'individual', A);

    expect(widget.id).toBe('projection_soja');
    expect(widget.unit).toBe('t/ha');
    expect(widget.description).toBe('Descripción de MID_H5_soja');
    expect(widget.points).toEqual([
      { label: 'Base histórica', low: 3, mid: 3, high: 3 },
      { label: 'Horizonte 5 años', low: 2, mid: 3, high: 4 },
      { label: 'Horizonte 10 años', low: 1, mid: 2.5, high: 3.5 },
    ]);
  });

  it('under Todas spans P10 of the pessimist values to P90 of the optimist ones, the mean in between', () => {
    const [widget] = projectionWidgets([A, B], ['A', 'B'], INDICATORS, 'multiple', undefined);
    const [base, h5] = widget.points;

    expect(base.mid).toBe(3.5);
    expect(base.low).toBeCloseTo(3.1);
    expect(base.high).toBeCloseTo(3.9);
    expect(h5.mid).toBe(3.5);
    expect(h5.low).toBeCloseTo(2.1);
    expect(h5.high).toBeCloseTo(4.9);
  });

  it('names the base by the year, the horizons as before', () => {
    const [widget] = projectionWidgets([A, B], ['A', 'B'], INDICATORS, 'individual', A, '2026');

    expect(widget.points.map((point) => point.label)).toEqual([
      '2026',
      'Horizonte 5 años',
      'Horizonte 10 años',
    ]);
  });

  it('leaves out a horizon without readings and the base when Pro was not answered', () => {
    const partial = parcel('C', { LOW_H5_soja: 2, MID_H5_soja: 3, HIGH_H5_soja: 'NA' });
    const only = parcel('D', { LOW_H10_soja: 1, MID_H10_soja: 2, HIGH_H10_soja: 3 });
    const [widget] = projectionWidgets([only], ['D'], INDICATORS, 'individual', only);

    expect(widget.points.map((point) => point.label)).toEqual(['Horizonte 10 años']);
    expect(projectionWidgets([partial], ['C'], INDICATORS, 'individual', partial)).toEqual([]);
  });

  it('draws nothing when the picker shows no scenario', () => {
    expect(projectionWidgets([A], ['A'], [PRO], 'individual', A)).toEqual([]);
  });
});

describe('analysisWidgets with projections', () => {
  it('replaces the six scenario widgets with one chart ahead of the rest, Pro kept', () => {
    const widgets = analysisWidgets({
      parcels: [A],
      parcelIds: ['A'],
      indicators: INDICATORS,
      riesgo: 'productivo',
      scope: 'individual',
      parcel: A,
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['projection', 'projection_soja'],
      ['number', 'Pro_soja'],
    ]);
  });
});
