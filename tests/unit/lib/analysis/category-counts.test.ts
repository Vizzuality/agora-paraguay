import { describe, expect, it } from 'vitest';

import { categoryAxis, categoryCountWidgets, categoryTone } from '@/lib/analysis/category-counts';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const resilience: Indicator = {
  id: 'Resiliencia',
  name: 'Proxy de resiliencia operativa',
  indicator_type: { type: 'category', categories: ['Alta', 'Media', 'Baja'] },
};
const itr: Indicator = {
  id: 'ITR_soja',
  name: 'ITR soja',
  indicator_type: { type: 'category', categories: ['Positiva', 'Estable', 'Alerta', 'NA'] },
};
const rust: Indicator = {
  id: 'asian_rust',
  name: 'Phakopsora pachyrhizi',
  indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
};
const quality: Indicator = {
  id: 'data_quality',
  name: 'Calidad del dato',
  indicator_type: { type: 'range', min: 0, max: 100 },
};

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

describe('categoryAxis', () => {
  it('keeps the categories in the order the indicator defines them, NA left out', () => {
    expect(categoryAxis(['Alta', 'Media', 'Baja'])).toEqual(['Alta', 'Media', 'Baja']);
    expect(categoryAxis(['Positiva', 'Estable', 'Alerta', 'NA'])).toEqual([
      'Positiva',
      'Estable',
      'Alerta',
    ]);
  });
});

describe('categoryTone', () => {
  it("reads the magnitude word: low grey, high orange, the rest blue — the ruler's tones", () => {
    expect(['Bajo', 'Muy baja', 'baja'].map(categoryTone)).toEqual(['medium', 'medium', 'medium']);
    expect(['Alto', 'Muy alto', 'Alta', 'Alerta'].map(categoryTone)).toEqual([
      'elevated',
      'elevated',
      'elevated',
      'elevated',
    ]);
    expect(['Medio', 'Media', 'Moderado', 'Estable', 'Positiva'].map(categoryTone)).toEqual([
      'low',
      'low',
      'low',
      'low',
      'low',
    ]);
  });
});

describe('categoryCountWidgets', () => {
  const parcels = [
    parcel('A', { resiliencia: 'Media', ITR_soja: 'Positiva' }),
    parcel('B', { resiliencia: 'media', ITR_soja: 0 }),
    parcel('C', { resiliencia: 'Alta', ITR_soja: 'NA' }),
    parcel('D', { resiliencia: 'NA' }),
  ];

  it('counts the submitted parcels per category, every category kept', () => {
    const [widget] = categoryCountWidgets(
      parcels,
      ['A', 'B', 'C', 'D'],
      [resilience],
      'productivo',
      'multiple',
    );

    expect(widget).toEqual({
      id: 'Resiliencia',
      label: 'Proxy de resiliencia operativa',
      columns: [
        { label: 'Alta', count: 1, tone: 'elevated' },
        { label: 'Media', count: 2, tone: 'low' },
        { label: 'Baja', count: 0, tone: 'medium' },
      ],
    });
  });

  it('counts on sanitario too: the scope decides, not the riesgo', () => {
    const [widget] = categoryCountWidgets(
      parcels,
      ['A', 'B'],
      [resilience],
      'sanitario',
      'multiple',
    );

    expect(widget.columns.map((column) => column.count)).toEqual([0, 2, 0]);
  });

  it('counts "Medio" under "Media": labels match by stem', () => {
    const [widget] = categoryCountWidgets(
      [parcel('A', { resiliencia: 'Medio' }), parcel('B', { resiliencia: 'medio' })],
      ['A', 'B'],
      [resilience],
      'productivo',
      'multiple',
    );

    expect(widget.columns.map((column) => [column.label, column.count])).toEqual([
      ['Alta', 0],
      ['Media', 2],
      ['Baja', 0],
    ]);
  });

  it('reads a class code as an index and leaves NA readings out of every column', () => {
    const [widget] = categoryCountWidgets(
      parcels,
      ['A', 'B', 'C'],
      [itr],
      'productivo',
      'multiple',
    );

    expect(widget.columns).toEqual([
      { label: 'Positiva', count: 2, tone: 'low' },
      { label: 'Estable', count: 0, tone: 'low' },
      { label: 'Alerta', count: 0, tone: 'elevated' },
    ]);
  });

  it('keeps the widget, nothing counted, when every parcel reads NA — the crop it does not apply to', () => {
    const empty = [
      { label: 'Positiva', count: 0, tone: 'low' },
      { label: 'Estable', count: 0, tone: 'low' },
      { label: 'Alerta', count: 0, tone: 'elevated' },
    ];

    expect(
      categoryCountWidgets(parcels, ['C'], [itr], 'productivo', 'multiple')[0].columns,
    ).toEqual(empty);
    expect(
      categoryCountWidgets(
        [parcel('E', { ITR_soja: 3 })],
        ['E'],
        [itr],
        'productivo',
        'multiple',
      )[0].columns,
    ).toEqual(empty);
  });

  it("counts a short range on sanitario under Todas in the ruler's classes, as each parcel's card reads", () => {
    const [widget] = categoryCountWidgets(
      [
        parcel('A', { asian_rust: 3 }),
        parcel('B', { asian_rust: 1 }),
        parcel('C', { asian_rust: '1' }),
        parcel('D', { asian_rust: 1.8 }),
        parcel('E', { asian_rust: 'NA' }),
      ],
      ['A', 'B', 'C', 'D', 'E'],
      [rust],
      'sanitario',
      'multiple',
    );

    expect(widget).toEqual({
      id: 'asian_rust',
      label: 'Phakopsora pachyrhizi',
      columns: [
        { label: 'Sin riesgo', count: 2, tone: 'low' },
        { label: 'Moderado', count: 1, tone: 'medium' },
        { label: 'Severo', count: 1, tone: 'high' },
      ],
    });
  });

  it('leaves a long range and productivo ranges to other widgets', () => {
    const answered = [parcel('A', { data_quality: 40, asian_rust: 2 })];

    expect(categoryCountWidgets(answered, ['A'], [quality], 'sanitario', 'multiple')).toEqual([]);
    expect(categoryCountWidgets(answered, ['A'], [rust], 'productivo', 'multiple')).toEqual([]);
  });

  it('makes no widget when the answer has no column for it, for one parcel, or without metadata', () => {
    expect(categoryCountWidgets(parcels, ['D'], [itr], 'productivo', 'multiple')).toEqual([]);
    expect(
      categoryCountWidgets(parcels, ['missing'], [resilience], 'productivo', 'multiple'),
    ).toEqual([]);
    expect(categoryCountWidgets(parcels, ['A'], [resilience], 'productivo', 'individual')).toEqual(
      [],
    );
    expect(categoryCountWidgets(parcels, ['A'], undefined, 'productivo', 'multiple')).toEqual([]);
  });
});
