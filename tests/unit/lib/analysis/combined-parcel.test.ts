import { describe, expect, it } from 'vitest';

import { COMBINED_PARCEL_ID, combinedParcel, indicatorCards } from '@/lib/analysis/indicator-cards';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

function parcel(id: string, properties: Record<string, string | number | null>): AnalysisParcel {
  return { parcel_id: id, properties };
}

const asianRust: Indicator = {
  id: 'asian_rust',
  name: 'Phakopsora pachyrhizi',
  indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
};

const itr: Indicator = {
  id: 'ITR_soja',
  name: 'ITR soja',
  indicator_type: { type: 'category', categories: ['Positiva', 'Estable', 'Alerta'] },
};

const crop: Indicator = {
  id: 'crop_type',
  name: 'Tipo de cultivo',
  indicator_type: { type: 'text' },
};

const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};

const INDICATORS = [asianRust, itr, crop, production];

describe('combinedParcel', () => {
  it('is null for an empty set', () => {
    expect(combinedParcel([], INDICATORS)).toBeNull();
  });

  it('averages ranges and open numbers, matching columns by the backend casing', () => {
    const combined = combinedParcel(
      [
        parcel('A', { Asian_rust: 3, Pro_soja: 2.5 }),
        parcel('B', { Asian_rust: 1, Pro_soja: 3.5 }),
      ],
      INDICATORS,
    );

    expect(combined).toEqual({
      parcel_id: COMBINED_PARCEL_ID,
      properties: { Asian_rust: 2, Pro_soja: 3 },
    });
  });

  it('keeps the most frequent category, the first one on a tie', () => {
    const combined = combinedParcel(
      [
        parcel('A', { ITR_soja: 'Alerta' }),
        parcel('B', { ITR_soja: 'Estable' }),
        parcel('C', { ITR_soja: 'alerta' }),
      ],
      INDICATORS,
    );
    expect(combined?.properties.ITR_soja).toBe('Alerta');

    const tie = combinedParcel(
      [parcel('A', { ITR_soja: 'Estable' }), parcel('B', { ITR_soja: 'Alerta' })],
      INDICATORS,
    );
    expect(tie?.properties.ITR_soja).toBe('Estable');
  });

  it('lists the distinct texts', () => {
    const combined = combinedParcel(
      [
        parcel('A', { crop_type: 'Soja' }),
        parcel('B', { crop_type: 'Arroz' }),
        parcel('C', { crop_type: 'Soja' }),
      ],
      INDICATORS,
    );

    expect(combined?.properties.crop_type).toBe('Soja, Arroz');
  });

  it('skips missing readings and combines the rest', () => {
    const combined = combinedParcel(
      [
        parcel('A', { Asian_rust: 3, crop_type: null }),
        parcel('B', { Asian_rust: 'NA', crop_type: 'Soja' }),
        parcel('C', { Asian_rust: '' }),
      ],
      INDICATORS,
    );

    expect(combined?.properties).toEqual({ Asian_rust: 3, crop_type: 'Soja' });
  });

  it('combines columns the metadata does not know by the shape of their values', () => {
    const combined = combinedParcel(
      [parcel('A', { yield: 10, station: 'Norte' }), parcel('B', { yield: 20, station: 'Sur' })],
      INDICATORS,
    );

    expect(combined?.properties).toEqual({ yield: 15, station: 'Norte, Sur' });
  });

  it('feeds the same cards a single parcel does — a 3 and a 1 read as Medio', () => {
    const combined = combinedParcel(
      [parcel('A', { Asian_rust: 3 }), parcel('B', { Asian_rust: 1 })],
      INDICATORS,
    );

    expect(indicatorCards(combined, INDICATORS)).toEqual([
      expect.objectContaining({ id: 'asian_rust', level: 'Medio', caption: '2' }),
    ]);
  });
});
