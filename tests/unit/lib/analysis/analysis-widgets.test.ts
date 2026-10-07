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
const quality: Indicator = {
  id: 'data_quality',
  name: 'Calidad del dato',
  unit: '%',
  indicator_type: { type: 'range', min: 0, max: 100 },
};
const crop: Indicator = { id: 'crop_type', name: 'Cultivo', indicator_type: { type: 'text' } };

const parcels: AnalysisParcel[] = [
  {
    parcel_id: 'A',
    properties: {
      Resiliencia: 'Media',
      Pro_soja: 3.5,
      asian_rust: 3,
      data_quality: 12,
    },
  },
  {
    parcel_id: 'B',
    properties: {
      Resiliencia: 'Alta',
      Pro_soja: 3.8,
      asian_rust: 1,
      data_quality: 87,
    },
  },
];

describe('analysisWidgets', () => {
  it('productivo, Todas: the category counts the parcels, the number bins them, in metadata order', () => {
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
      ['histogram', 'Pro_soja'],
    ]);
    // 3.5 and 3.8 t/ha read on 0–4: no classes, the unit as the subtitle.
    expect(widgets[1]).toMatchObject({ unit: 't/ha', min: 0, max: 4 });
    expect(widgets[1]).not.toHaveProperty('classes');
  });

  it("productivo, a parcel tab: the category reads its class on the ruler, the number is that parcel's figure", () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [resilience, production],
      riesgo: 'productivo',
      scope: 'individual',
      parcel: parcels[1],
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['ruler', 'Resiliencia'],
      ['number', 'Pro_soja'],
    ]);
    expect(widgets[0]).toMatchObject({ level: 'Alta' });
    // The number card sits on the scale of the whole set (0–4), not of this parcel alone.
    expect(widgets[1]).toMatchObject({ text: '3,8', unit: 't/ha', max: 4, position: 95 });
  });

  it('sanitario, Todas: the short range and the category count the parcels, the long range bins them', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [rust, resilience, quality, crop],
      riesgo: 'sanitario',
      scope: 'multiple',
      parcel: combinedParcel(parcels, [rust, resilience, quality]),
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['bar-chart', 'asian_rust'],
      ['bar-chart', 'Resiliencia'],
      ['histogram', 'data_quality'],
    ]);
    expect(widgets[0]).toMatchObject({
      columns: [
        { label: 'Sin riesgo', count: 1 },
        { label: 'Moderado', count: 0 },
        { label: 'Severo', count: 1 },
      ],
    });
    expect(widgets[1]).toMatchObject({
      columns: [
        { label: 'Alta', count: 1 },
        { label: 'Media', count: 1 },
        { label: 'Baja', count: 0 },
      ],
    });
    expect(widgets[2]).toMatchObject({ min: 0, max: 100 });
    expect(
      (widgets[2] as Extract<(typeof widgets)[number], { kind: 'histogram' }>).bins.flatMap(
        (bin, index) => (bin.count > 0 ? [[index, bin.count]] : []),
      ),
    ).toEqual([
      [2, 1],
      [17, 1],
    ]);
  });

  it('sanitario, one parcel tab: every classed reading sits on the ruler', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [rust, resilience, quality],
      riesgo: 'sanitario',
      scope: 'individual',
      parcel: parcels[0],
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['ruler', 'asian_rust'],
      ['ruler', 'Resiliencia'],
      ['ruler', 'data_quality'],
    ]);
    expect(widgets[0]).toMatchObject({ level: 'Severo' });
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
