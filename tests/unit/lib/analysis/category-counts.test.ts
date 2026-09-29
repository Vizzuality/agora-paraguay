import { describe, expect, it } from 'vitest';

import { categoryAxis, categoryCountTiles, categoryTone } from '@/lib/analysis/category-counts';
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

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

describe('categoryAxis', () => {
  it('reads worst to best and never shows NA', () => {
    expect(categoryAxis(['Alta', 'Media', 'Baja'])).toEqual(['Baja', 'Media', 'Alta']);
    expect(categoryAxis(['Positiva', 'Estable', 'Alerta', 'NA'])).toEqual([
      'Alerta',
      'Estable',
      'Positiva',
    ]);
  });
});

describe('categoryTone', () => {
  it('reads the magnitude word: low grey, high orange, the rest blue', () => {
    expect(['Bajo', 'Muy baja', 'baja'].map(categoryTone)).toEqual(['low', 'low', 'low']);
    expect(['Alto', 'Muy alto', 'Alta', 'Alerta'].map(categoryTone)).toEqual([
      'high',
      'high',
      'high',
      'high',
    ]);
    expect(['Medio', 'Media', 'Moderado', 'Estable', 'Positiva'].map(categoryTone)).toEqual([
      'mid',
      'mid',
      'mid',
      'mid',
      'mid',
    ]);
  });
});

describe('categoryCountTiles', () => {
  const parcels = [
    parcel('A', { resiliencia: 'Media', ITR_soja: 'Positiva' }),
    parcel('B', { resiliencia: 'media', ITR_soja: 0 }),
    parcel('C', { resiliencia: 'Alta', ITR_soja: 'NA' }),
    parcel('D', { resiliencia: 'NA' }),
  ];

  it('counts the submitted parcels per category, every category kept, bars relative to the fullest', () => {
    const [tile] = categoryCountTiles(parcels, ['A', 'B', 'C', 'D'], [resilience], 'productivo');

    expect(tile).toEqual({
      id: 'Resiliencia',
      label: 'Proxy de resiliencia operativa',
      columns: [
        { label: 'Baja', count: 0, height: 0, tone: 'low' },
        { label: 'Media', count: 2, height: 100, tone: 'mid' },
        { label: 'Alta', count: 1, height: 50, tone: 'high' },
      ],
    });
  });

  it('reads a class code as an index and leaves NA readings out of every column', () => {
    const [tile] = categoryCountTiles(parcels, ['A', 'B', 'C'], [itr], 'productivo');

    expect(tile.columns).toEqual([
      { label: 'Alerta', count: 0, height: 0, tone: 'high' },
      { label: 'Estable', count: 0, height: 0, tone: 'mid' },
      { label: 'Positiva', count: 2, height: 100, tone: 'mid' },
    ]);
  });

  it('keeps the tile, nothing counted, when every parcel reads NA — the crop it does not apply to', () => {
    const empty = [
      { label: 'Alerta', count: 0, height: 0, tone: 'high' },
      { label: 'Estable', count: 0, height: 0, tone: 'mid' },
      { label: 'Positiva', count: 0, height: 0, tone: 'mid' },
    ];

    expect(categoryCountTiles(parcels, ['C'], [itr], 'productivo')[0].columns).toEqual(empty);
    expect(
      categoryCountTiles([parcel('E', { ITR_soja: 3 })], ['E'], [itr], 'productivo')[0].columns,
    ).toEqual(empty);
  });

  it('makes no tile when the answer has no column for it, on sanitario, or without metadata', () => {
    expect(categoryCountTiles(parcels, ['D'], [itr], 'productivo')).toEqual([]);
    expect(categoryCountTiles(parcels, ['missing'], [resilience], 'productivo')).toEqual([]);
    expect(categoryCountTiles(parcels, ['A'], [resilience], 'sanitario')).toEqual([]);
    expect(categoryCountTiles(parcels, ['A'], undefined, 'productivo')).toEqual([]);
  });
});
