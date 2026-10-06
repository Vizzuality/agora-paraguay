import { describe, expect, it } from 'vitest';

import {
  binLabel,
  HISTOGRAM_BINS,
  histogramBins,
  steppedBins,
  valueHistogramWidgets,
} from '@/lib/analysis/value-histogram';
import type { Indicator } from '@/lib/api/metadata/schemas';

import { parcel, seasons, stability } from './fixtures';

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

  it('paints every bin in one tone when asked to', () => {
    const tones = histogramBins([], { min: 0, max: 10 }, { tone: 'elevated' }).map(
      (bin) => bin.tone,
    );

    expect(new Set(tones)).toEqual(new Set(['elevated']));
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

describe('steppedBins', () => {
  it('cuts a short range in one bin per step, centred on the value and named by it', () => {
    const { min, max, bins } = steppedBins([0, 3, 3, 8], { min: 0, max: 8, step: 1 });

    expect({ min, max }).toEqual({ min: -0.5, max: 8.5 });
    expect(bins).toHaveLength(9);
    expect(bins[0]).toMatchObject({ from: -0.5, to: 0.5, label: '0', count: 1 });
    expect(bins[3]).toMatchObject({ label: '3', count: 2 });
    expect(bins[8]).toMatchObject({ from: 7.5, to: 8.5, label: '8', count: 1 });
    expect(new Set(bins.map((bin) => bin.tone))).toEqual(new Set(['elevated']));
  });

  it('reads the step as a number or as digits, and takes one without it', () => {
    expect(steppedBins([], { min: 0, max: 2, step: '0.5' }).bins.map((bin) => bin.label)).toEqual([
      '0',
      '0,5',
      '1',
      '1,5',
      '2',
    ]);
    expect(steppedBins([], { min: 1, max: 3 }).bins).toHaveLength(3);
  });
});

describe('valueHistogramWidgets', () => {
  const parcels = [
    parcel('A', { data_quality: 12, asian_rust: 2, N_soja: 5, IEP_H5_soja: 62 }),
    parcel('B', { data_quality: '87', asian_rust: 1, N_soja: 3, IEP_H5_soja: '87' }),
    parcel('C', { data_quality: 'NA', asian_rust: 3, N_soja: 'NA' }),
  ];

  it('bins a short productivo range per step on its own scale, no classes, one tone', () => {
    const [widget] = valueHistogramWidgets(
      parcels,
      ['A', 'B', 'C'],
      [seasons],
      'productivo',
      'multiple',
    );

    expect(widget).toMatchObject({ id: 'N_soja', unit: null, min: -0.5, max: 8.5 });
    expect(widget).not.toHaveProperty('classes');
    expect(widget.ticks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(widget.bins.filter((bin) => bin.count > 0).map((bin) => [bin.label, bin.count])).toEqual(
      [
        ['3', 1],
        ['5', 1],
      ],
    );
  });

  it('bins a long productivo range in twenty over its own scale, no classes, one tone', () => {
    const [widget] = valueHistogramWidgets(
      parcels,
      ['A', 'B'],
      [stability],
      'productivo',
      'multiple',
    );

    expect(widget).toMatchObject({ unit: '%', min: 0, max: 100 });
    expect(widget).not.toHaveProperty('classes');
    expect(occupied(widget.bins)).toEqual([
      [12, 1],
      [17, 1],
    ]);
    expect(new Set(widget.bins.map((bin) => bin.tone))).toEqual(new Set(['elevated']));
  });

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
    expect(widget.classes?.map((riskClass) => riskClass.label)).toEqual([
      'Sin riesgo',
      'Moderado',
      'Severo',
    ]);
    expect(widget.ticks).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(occupied(widget.bins)).toEqual([
      [2, 1],
      [17, 1],
    ]);
  });

  it('bins an open number on productivo under Todas from zero to a round figure, no classes, one tone', () => {
    const production: Indicator = {
      id: 'Pro_soja',
      name: 'Producción base histórica de soja',
      unit: 't/ha',
      indicator_type: { type: 'numeric' },
    };
    const [widget] = valueHistogramWidgets(
      [
        parcel('A', { Pro_soja: 3.55 }),
        parcel('B', { Pro_soja: 3.81 }),
        parcel('C', { Pro_soja: 'NA' }),
      ],
      ['A', 'B', 'C'],
      [production],
      'productivo',
      'multiple',
    );

    expect(widget).toMatchObject({ unit: 't/ha', min: 0, max: 4 });
    expect(widget).not.toHaveProperty('classes');
    expect(widget.ticks).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]);
    expect(occupied(widget.bins)).toEqual([
      [17, 1],
      [19, 1],
    ]);
    expect(new Set(widget.bins.map((bin) => bin.tone))).toEqual(new Set(['elevated']));
  });

  it('leaves short sanitario ranges and single parcels to other widgets', () => {
    expect(valueHistogramWidgets(parcels, ['A', 'B'], [rust], 'sanitario', 'multiple')).toEqual([]);
    expect(valueHistogramWidgets(parcels, ['A'], [quality], 'sanitario', 'individual')).toEqual([]);
    expect(valueHistogramWidgets(parcels, ['A'], [seasons], 'productivo', 'individual')).toEqual(
      [],
    );
  });

  it('makes no widget when the answer has no column for it or without metadata', () => {
    expect(
      valueHistogramWidgets([parcel('D', {})], ['D'], [quality], 'sanitario', 'multiple'),
    ).toEqual([]);
    expect(valueHistogramWidgets(parcels, ['A'], undefined, 'sanitario', 'multiple')).toEqual([]);
  });
});

describe('binLabel', () => {
  it('prints the edges in the platform locale, or the label a stepped bin carries', () => {
    expect(binLabel({ from: 0, to: 5 })).toBe('0 – 5');
    expect(binLabel({ from: 12.5, to: 15 })).toBe('12,5 – 15');
    expect(binLabel({ from: 2.5, to: 3.5, label: '3' })).toBe('3');
  });
});
