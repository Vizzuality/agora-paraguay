import { describe, expect, it } from 'vitest';

import { analysisWidgets } from '@/lib/analysis/analysis-widgets';
import { combinedParcel } from '@/lib/analysis/indicator-cards';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const resilience: Indicator = {
  id: 'Resiliencia',
  name: 'Proxy de resiliencia operativa',
  indicator_type: { type: 'category', categories: ['Alta', 'Media', 'Baja'] },
};
const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base histórica de soja',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};
const rust: Indicator = {
  id: 'asian_rust',
  name: 'Phakopsora pachyrhizi',
  indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
};
const crop: Indicator = { id: 'crop_type', name: 'Cultivo', indicator_type: { type: 'text' } };

const parcels: AnalysisParcel[] = [
  { parcel_id: 'A', properties: { Resiliencia: 'Media', Pro_soja: 3.5, asian_rust: 3 } },
  { parcel_id: 'B', properties: { Resiliencia: 'Alta', Pro_soja: 3.8, asian_rust: 1 } },
];

describe('analysisWidgets', () => {
  it('productivo, several parcels: the number lists them, the category counts them, in metadata order', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [resilience, production, crop],
      riesgo: 'productivo',
      scope: 'multiple',
      parcel: undefined,
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['bar-chart', 'Resiliencia'],
      ['parcel-list', 'Pro_soja'],
    ]);
  });

  it('productivo, one parcel: the category reads its class on the ruler', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['B'],
      indicators: [resilience, production],
      riesgo: 'productivo',
      scope: 'individual',
      parcel: parcels[1],
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['ruler', 'Resiliencia'],
      ['parcel-list', 'Pro_soja'],
    ]);
    expect(widgets[0]).toMatchObject({ level: 'Alta' });
  });

  it('sanitario, Todas: the range reads the parcels combined, the category counts them', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [rust, resilience, crop],
      riesgo: 'sanitario',
      scope: 'multiple',
      parcel: combinedParcel(parcels, [rust, resilience]),
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['ruler', 'asian_rust'],
      ['bar-chart', 'Resiliencia'],
    ]);
    expect(widgets[0]).toMatchObject({ level: 'Moderado' });
    expect(widgets[1]).toMatchObject({
      columns: [
        { label: 'Alta', count: 1 },
        { label: 'Media', count: 1 },
        { label: 'Baja', count: 0 },
      ],
    });
  });

  it('sanitario, one parcel tab: both classed readings sit on the ruler', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [rust, resilience],
      riesgo: 'sanitario',
      scope: 'individual',
      parcel: parcels[0],
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['ruler', 'asian_rust'],
      ['ruler', 'Resiliencia'],
    ]);
  });

  it('is empty without metadata', () => {
    expect(
      analysisWidgets({
        parcels,
        parcelIds: ['A'],
        indicators: undefined,
        riesgo: 'sanitario',
        scope: 'individual',
        parcel: parcels[0],
      }),
    ).toEqual([]);
  });
});
