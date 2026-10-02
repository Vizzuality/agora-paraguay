import { describe, expect, it } from 'vitest';

import {
  binLabel,
  HISTOGRAM_BINS,
  histogramBins,
  valueHistogramWidgets,
} from '@/lib/analysis/value-histogram';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const quality: Indicator = {
  id: 'data_quality',
  name: 'Calidad del dato',
  unit: '%',
  indicator_type: { type: 'range', min: 0, max: 100 },
};
const rust: Indicator = {
  id: 'asian_rust',
  name: 'Phakopsora pachyrhizi',
  indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const occupied = (bins: { count: number }[]) =>
  bins.flatMap((bin, index) => (bin.count > 0 ? [[index, bin.count]] : []));

describe('histogramBins', () => {
  it('cuts the range in twenty equal bins, every bin kept, the maximum in the last', () => {
    const bins = histogramBins([0, 4.9, 5, 50, 99, 100], { min: 0, max: 100 });

    expect(bins).toHaveLength(HISTOGRAM_BINS);
    expect(bins[0]).toMatchObject({ from: 0, to: 5 });
    expect(bins[19]).toMatchObject({ from: 95, to: 100 });
    expect(occupied(bins)).toEqual([
      [0, 2],
      [1, 1],
      [10, 1],
      [19, 2],
    ]);
  });

  it("paints a bin by the class its middle falls in: the ruler's thirds", () => {
    const tones = histogramBins([], { min: 0, max: 100 }).map((bin) => bin.tone);

    expect(tones.slice(0, 7)).toEqual(Array(7).fill('low'));
    expect(tones.slice(7, 13)).toEqual(Array(6).fill('medium'));
    expect(tones.slice(13)).toEqual(Array(7).fill('high'));
  });

  it('clamps a value outside the range to the outer bins', () => {
    expect(occupied(histogramBins([-3, 140], { min: 0, max: 100 }))).toEqual([
      [0, 1],
      [19, 1],
    ]);
  });

  it('puts everything in the first bin on a flat range rather than dividing by zero', () => {
    expect(occupied(histogramBins([5, 5], { min: 5, max: 5 }))).toEqual([[0, 2]]);
  });
});

describe('valueHistogramWidgets', () => {
  const parcels = [
    parcel('A', { data_quality: 12, asian_rust: 2 }),
    parcel('B', { data_quality: '87', asian_rust: 1 }),
    parcel('C', { data_quality: 'NA', asian_rust: 3 }),
  ];

  it('bins a long range on sanitario under Todas over the submitted parcels, unreadable values left out', () => {
    const [widget] = valueHistogramWidgets(
      parcels,
      ['A', 'B', 'C'],
      [quality],
      'sanitario',
      'multiple',
    );

    expect(widget).toMatchObject({
      id: 'data_quality',
      label: 'Calidad del dato',
      min: 0,
      max: 100,
    });
    expect(widget.classes.map((riskClass) => riskClass.label)).toEqual([
      'Sin riesgo',
      'Moderado',
      'Severo',
    ]);
    expect(occupied(widget.bins)).toEqual([
      [2, 1],
      [17, 1],
    ]);
  });

  it('leaves short ranges, productivo and single parcels to other widgets', () => {
    expect(valueHistogramWidgets(parcels, ['A', 'B'], [rust], 'sanitario', 'multiple')).toEqual([]);
    expect(valueHistogramWidgets(parcels, ['A', 'B'], [quality], 'productivo', 'multiple')).toEqual(
      [],
    );
    expect(valueHistogramWidgets(parcels, ['A'], [quality], 'sanitario', 'individual')).toEqual([]);
  });

  it('makes no widget when the answer has no column for it or without metadata', () => {
    expect(
      valueHistogramWidgets([parcel('D', {})], ['D'], [quality], 'sanitario', 'multiple'),
    ).toEqual([]);
    expect(valueHistogramWidgets(parcels, ['A'], undefined, 'sanitario', 'multiple')).toEqual([]);
  });
});

describe('binLabel', () => {
  it('prints the edges in the platform locale', () => {
    expect(binLabel({ from: 0, to: 5 })).toBe('0 – 5');
    expect(binLabel({ from: 12.5, to: 15 })).toBe('12,5 – 15');
  });
});
