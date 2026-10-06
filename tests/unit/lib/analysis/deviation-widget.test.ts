import { describe, expect, it } from 'vitest';

import {
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
