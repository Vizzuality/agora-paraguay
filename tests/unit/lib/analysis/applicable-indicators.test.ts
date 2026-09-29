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
  it('reads the crop an id is bound to, none for an id without a crop suffix', () => {
    expect(cropOfIndicator({ id: 'Pro_soja', name: '', indicator_type: { type: 'numeric' } })).toBe(
      'soja',
    );
    expect(
      cropOfIndicator({ id: 'IEP_H5_arroz', name: '', indicator_type: { type: 'numeric' } }),
    ).toBe('arroz');
    expect(
      cropOfIndicator({ id: 'Resiliencia', name: '', indicator_type: { type: 'numeric' } }),
    ).toBeNull();
  });
});

describe('applicableIndicators', () => {
  it("keeps the hero's crop and the crop-free indicators, drops the other crop's", () => {
    const soyAnswered = [parcel('A', { pro_soja: 3.5, Pro_arroz: 4.1, Vol_arroz: 'Alta' })];

    expect(
      applicableIndicators(indicators, soyAnswered, ['A'], 'productivo', 'soy')?.map((i) => i.id),
    ).toEqual(['Pro_soja', 'IEP']);
    expect(
      applicableIndicators(indicators, soyAnswered, ['A'], 'productivo', 'rice')?.map((i) => i.id),
    ).toEqual(['Pro_arroz', 'Vol_arroz', 'IEP']);
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

  it('leaves sanitario alone and passes an unloaded list through', () => {
    expect(applicableIndicators(indicators, parcels, ['A', 'B'], 'sanitario', undefined)).toBe(
      indicators,
    );
    expect(
      applicableIndicators(undefined, parcels, ['A'], 'productivo', undefined),
    ).toBeUndefined();
  });
});
