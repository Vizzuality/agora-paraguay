import { describe, expect, it } from 'vitest';

import {
  deviationHistogramBins,
  deviationHistogramWidgets,
  deviationPosition,
  deviationSpan,
  deviationWidgets,
  formatSigned,
} from '@/lib/analysis/deviation-widget';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const deviation: Indicator = {
  id: 'Desv_soja',
  name: 'Desviación de la producción de soja respecto a la base histórica',
  unit: 't/ha',
  description: 'Diferencia con la base histórica.',
  indicator_type: { type: 'deviation', base: 'Pro_soja' },
};
const bounded: Indicator = {
  ...deviation,
  id: 'Desv_arroz',
  indicator_type: { type: 'deviation', max: 2 },
};
const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base histórica de soja',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const parcels = [
  parcel('A', { Desv_soja: 0.5, Desv_arroz: -1, Pro_soja: 3.55 }),
  parcel('B', { desv_soja: '-0.3', Desv_arroz: 0.5, pro_soja: 'NA' }),
  parcel('C', { Desv_soja: 'NA' }),
];

describe('deviationSpan', () => {
  it("takes the metadata's bound either side, whichever side the backend wrote it on", () => {
    expect(deviationSpan({ type: 'deviation', max: 2 }, [0.5])).toBe(2);
    expect(deviationSpan({ type: 'deviation', min: -3 }, [0.5])).toBe(3);
    expect(deviationSpan({ type: 'deviation', min: -1, max: 4 }, [])).toBe(4);
  });

  it('otherwise ends on a round figure above the largest absolute value, like the number scale', () => {
    expect(deviationSpan({ type: 'deviation' }, [0.5, -0.3])).toBe(0.5);
    expect(deviationSpan({ type: 'deviation' }, [0.12, -0.87])).toBe(0.9);
    expect(deviationSpan({ type: 'deviation' }, [])).toBe(1);
  });
});

describe('deviationPosition', () => {
  it('puts zero in the middle and the span at either end, clamping beyond it', () => {
    expect(deviationPosition(0, 2)).toBe(50);
    expect(deviationPosition(1, 2)).toBe(75);
    expect(deviationPosition(-2, 2)).toBe(0);
    expect(deviationPosition(5, 2)).toBe(100);
    expect(deviationPosition(1, 0)).toBe(50);
  });
});

describe('formatSigned', () => {
  it('prints the sign, platform locale, two decimals at most, none on zero', () => {
    expect(formatSigned(0.5)).toBe('+0,5');
    expect(formatSigned(-0.345)).toBe('-0,35');
    expect(formatSigned(0)).toBe('0');
  });
});

describe('deviationWidgets', () => {
  it("reads the open parcel's deviation on a span covering every submitted parcel", () => {
    const [widget] = deviationWidgets(
      parcels,
      ['A', 'B', 'C'],
      [deviation],
      'productivo',
      'individual',
      parcels[1],
    );

    expect(widget).toEqual({
      id: 'Desv_soja',
      label: 'Desviación de la producción de soja respecto a la base histórica',
      description: 'Diferencia con la base histórica.',
      unit: 't/ha',
      value: -0.3,
      text: '-0,3',
      span: 0.5,
      position: 20,
      base: null,
    });
  });

  it("reads the parcel's base from the indicator the metadata names, column case aside", () => {
    const [widget] = deviationWidgets(
      parcels,
      ['A', 'B'],
      [deviation],
      'productivo',
      'individual',
      parcels[0],
    );

    expect(widget).toMatchObject({ value: 0.5, base: 3.55 });
  });

  it("uses the metadata's bound when there is one", () => {
    const [widget] = deviationWidgets(
      parcels,
      ['A', 'B'],
      [bounded],
      'productivo',
      'individual',
      parcels[0],
    );

    // No base named: none read, however the parcel's columns look.
    expect(widget).toMatchObject({ value: -1, text: '-1', span: 2, position: 25, base: null });
  });

  it('answers only deviations, in metadata order, and skips a parcel with no reading', () => {
    expect(
      deviationWidgets(
        parcels,
        ['A', 'B', 'C'],
        [production, bounded, deviation],
        'productivo',
        'individual',
        parcels[0],
      ).map((widget) => widget.id),
    ).toEqual(['Desv_arroz', 'Desv_soja']);
    expect(
      deviationWidgets(
        parcels,
        ['A', 'B', 'C'],
        [deviation],
        'productivo',
        'individual',
        parcels[2],
      ),
    ).toEqual([]);
  });

  it('is nothing under Todas or on sanitario, where the histogram and the facts take over', () => {
    expect(
      deviationWidgets(parcels, ['A', 'B'], [deviation], 'productivo', 'multiple', parcels[0]),
    ).toEqual([]);
    expect(
      deviationWidgets(parcels, ['A', 'B'], [deviation], 'sanitario', 'individual', parcels[0]),
    ).toEqual([]);
  });
});

const occupied = (bins: { above: number; below: number }[]) =>
  bins.flatMap((bin, index) =>
    bin.above > 0 || bin.below > 0 ? [[index, bin.above, bin.below]] : [],
  );

describe('deviationHistogramBins', () => {
  it('counts a positive deviation above and a negative one below, in the bin its place falls in', () => {
    const bins = deviationHistogramBins(
      [
        { at: 0, deviation: 1 },
        { at: 0.5, deviation: -1 },
        { at: 2.5, deviation: 0.2 },
        { at: 2.5, deviation: -0.2 },
        { at: 10, deviation: 1 },
      ],
      { min: 0, max: 10 },
    );

    expect(bins).toHaveLength(20);
    expect(bins[0]).toMatchObject({ from: 0, to: 0.5 });
    expect(bins[19]).toMatchObject({ from: 9.5, to: 10 });
    expect(occupied(bins)).toEqual([
      [0, 1, 0],
      [1, 0, 1],
      [5, 1, 1],
      [19, 1, 0],
    ]);
  });

  it('counts an exact zero on neither side, and clamps a place outside the axis to the outer bins', () => {
    const bins = deviationHistogramBins(
      [
        { at: 1, deviation: 0 },
        { at: -4, deviation: -1 },
        { at: 40, deviation: 1 },
      ],
      { min: 0, max: 10 },
    );

    expect(occupied(bins)).toEqual([
      [0, 0, 1],
      [19, 1, 0],
    ]);
  });
});

describe('deviationHistogramWidgets', () => {
  const withBase: Indicator = {
    ...deviation,
    indicator_type: { type: 'deviation', base: 'Pro_soja' },
  };
  const set = [
    parcel('A', { Desv_soja: 0.5, Pro_soja: 3.55 }),
    parcel('B', { desv_soja: '-0.3', pro_soja: '3.81' }),
    parcel('C', { Desv_soja: 0.1 }),
  ];

  it("bins the parcels over their base production, a bar up or down by the deviation's sign", () => {
    const [widget] = deviationHistogramWidgets(
      set,
      ['A', 'B', 'C'],
      [withBase],
      'productivo',
      'multiple',
    );

    // 3,55 and 3,81 on 0–4; C has no base reading, so it is not placed.
    expect(widget).toMatchObject({ id: 'Desv_soja', unit: 't/ha', min: 0, max: 4 });
    expect(occupied(widget.bins)).toEqual([
      [17, 1, 0],
      [19, 0, 1],
    ]);
  });

  it('bins the deviation itself, symmetric around zero, when no base is named', () => {
    const unbased: Indicator = { ...deviation, indicator_type: { type: 'deviation', max: 2 } };
    const [widget] = deviationHistogramWidgets(
      set,
      ['A', 'B', 'C'],
      [unbased],
      'productivo',
      'multiple',
    );

    // +0,5, -0,3 and +0,1 on ±2: every parcel placed, C included.
    expect(widget).toMatchObject({ min: -2, max: 2 });
    expect(occupied(widget.bins)).toEqual([
      [8, 0, 1],
      [10, 1, 0],
      [12, 1, 0],
    ]);
  });

  it('is nothing on a parcel tab, on sanitario, or for an indicator the answer has no column for', () => {
    expect(
      deviationHistogramWidgets(set, ['A', 'B'], [withBase], 'productivo', 'individual'),
    ).toEqual([]);
    expect(deviationHistogramWidgets(set, ['A', 'B'], [withBase], 'sanitario', 'multiple')).toEqual(
      [],
    );
    expect(deviationHistogramWidgets(set, ['A', 'B'], [bounded], 'productivo', 'multiple')).toEqual(
      [],
    );
  });
});
