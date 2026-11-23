import { describe, expect, it } from 'vitest';

import { applicableIndicators, cropOfIndicator } from '@/lib/analysis/applicable-indicators';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators } from '@/lib/api/metadata/schemas';

const indicators: Indicators = [
  { id: 'Pro_soja', name: 'Soja', unit: 't/ha', indicator_type: { type: 'numeric' } },
  { id: 'Pro_arroz', name: 'Arroz', unit: 't/ha', indicator_type: { type: 'numeric' } },
  {
    id: 'Vol_arroz',
    name: 'Vol',
    indicator_type: { type: 'category', categories: ['Alta', 'NA'] },
  },
  { id: 'IEP', name: 'IEP', indicator_type: { type: 'range', min: 0, max: 100 } },
];

function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

const parcels = [
  parcel('A', { pro_soja: 3.5, Pro_arroz: 'NA', Vol_arroz: 'NA' }),
  parcel('B', { pro_soja: 3.8, Pro_arroz: 'NA', Vol_arroz: 'Alta' }),
];

describe('cropOfIndicator', () => {
  const crop = (id: string) =>
    cropOfIndicator({ id, name: '', indicator_type: { type: 'numeric' } });

  it('reads soy from a `_soja` or `_soy` part, wherever it sits in the id', () => {
    expect(crop('Pro_soja')).toBe('soja');
    expect(crop('Pro_soy')).toBe('soja');
    expect(crop('ITR_soja_H5')).toBe('soja');
  });

  it('reads rice from an `_arroz` or `_rice` part', () => {
    expect(crop('IEP_H5_arroz')).toBe('rice');
    expect(crop('Yield_rice')).toBe('rice');
    expect(crop('RICE_trend')).toBeNull();
  });

  it('has no crop for an id without one, nor for a crop word that only starts a longer part', () => {
    expect(crop('Resiliencia')).toBeNull();
    expect(crop('Pro_soybean')).toBeNull();
  });

  it("reads the API's `crop_type` first, whatever the id says", () => {
    const disease = (crop_type: string | null) =>
      cropOfIndicator({
        id: 'roya_asiatica',
        name: '',
        crop_type,
        indicator_type: { type: 'text' },
      });

    expect(disease('soja')).toBe('soja');
    expect(disease('arroz')).toBe('rice');
    expect(disease(null)).toBeNull();
  });
});

describe('applicableIndicators', () => {
  it('lists for rice every indicator without `_soy`, for soy every one without `_rice`', () => {
    const english: Indicators = [
      { id: 'Yield_soy', name: 'Soy', indicator_type: { type: 'numeric' } },
      { id: 'Yield_rice', name: 'Rice', indicator_type: { type: 'numeric' } },
      { id: 'IEP', name: 'IEP', indicator_type: { type: 'range', min: 0, max: 100 } },
    ];
    const ids = (crop: string) =>
      applicableIndicators(english, [], [], 'productivo', crop)?.map((i) => i.id);

    expect(ids('rice')).toEqual(['Yield_rice', 'IEP']);
    expect(ids('soja')).toEqual(['Yield_soy', 'IEP']);
  });

  it("keeps the hero's crop and the crop-free indicators, drops the other crop's", () => {
    const soyAnswered = [parcel('A', { pro_soja: 3.5, Pro_arroz: 4.1, Vol_arroz: 'Alta' })];

    expect(
      applicableIndicators(indicators, soyAnswered, ['A'], 'productivo', 'soja')?.map((i) => i.id),
    ).toEqual(['Pro_soja', 'IEP']);
    expect(
      applicableIndicators(indicators, soyAnswered, ['A'], 'productivo', 'rice')?.map((i) => i.id),
    ).toEqual(['Pro_arroz', 'Vol_arroz', 'IEP']);
  });

  it("keeps every crop's indicators under Todos, still dropping the all-NA ones", () => {
    expect(
      applicableIndicators(indicators, parcels, ['A', 'B'], 'productivo', 'todos')?.map(
        (i) => i.id,
      ),
    ).toEqual(['Pro_soja', 'Vol_arroz', 'IEP']);
  });

  it('under Todos keeps only the crops the parcels in view grew', () => {
    const ids = (cropsInView: ('soja' | 'rice')[]) =>
      applicableIndicators(indicators, [], [], 'productivo', 'todos', cropsInView)?.map(
        (i) => i.id,
      );

    expect(ids(['soja'])).toEqual(['Pro_soja', 'IEP']);
    expect(ids(['rice', 'soja'])).toEqual(['Pro_soja', 'Pro_arroz', 'Vol_arroz', 'IEP']);
  });

  it('waits for the crop: without one, only the NA rule applies', () => {
    expect(applicableIndicators(indicators, [], ['A'], 'productivo', undefined)).toEqual(
      indicators,
    );
  });

  it('drops an indicator every submitted parcel answers NA for, keeps one some parcel reads', () => {
    expect(
      applicableIndicators(indicators, parcels, ['A', 'B'], 'productivo', undefined)?.map(
        (i) => i.id,
      ),
    ).toEqual(['Pro_soja', 'Vol_arroz', 'IEP']);
  });

  it('judges only the submitted parcels', () => {
    expect(
      applicableIndicators(indicators, parcels, ['A'], 'productivo', undefined)?.map((i) => i.id),
    ).toEqual(['Pro_soja', 'IEP']);
  });

  it('keeps an indicator the answer does not carry at all: nothing known yet', () => {
    expect(applicableIndicators(indicators, [], ['A'], 'productivo', undefined)).toEqual(
      indicators,
    );
    expect(
      applicableIndicators(indicators, parcels, ['A'], 'productivo', undefined)?.map((i) => i.id),
    ).toContain('IEP');
  });

  it('reads every spelling of "no reading" the backend uses', () => {
    const spelled = [
      parcel('A', { Pro_arroz: 'N/A', Vol_arroz: 'nan' }),
      parcel('B', { Pro_arroz: null, Vol_arroz: ' NA ' }),
    ];

    expect(
      applicableIndicators(indicators, spelled, ['A', 'B'], 'productivo', undefined)?.map(
        (i) => i.id,
      ),
    ).toEqual(['Pro_soja', 'IEP']);
  });

  it('judges over the answer as it came when its parcel ids do not match the submitted ones', () => {
    const numbered = [parcel('1', { Pro_arroz: 'NA', Pro_soja: 3.5 })];

    expect(
      applicableIndicators(indicators, numbered, ['D07D21P00000002'], 'productivo', undefined)?.map(
        (i) => i.id,
      ),
    ).toEqual(['Pro_soja', 'Vol_arroz', 'IEP']);
  });

  it('applies only the crop rule on sanitario, and passes an unloaded list through', () => {
    expect(applicableIndicators(indicators, parcels, ['A', 'B'], 'sanitario', undefined)).toBe(
      indicators,
    );
    expect(
      applicableIndicators(indicators, parcels, ['A', 'B'], 'sanitario', 'rice')?.map((i) => i.id),
    ).toEqual(['Pro_arroz', 'Vol_arroz', 'IEP']);
    expect(
      applicableIndicators(undefined, parcels, ['A'], 'productivo', undefined),
    ).toBeUndefined();
  });
});
