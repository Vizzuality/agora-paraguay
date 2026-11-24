import { describe, expect, it } from 'vitest';

import { analysisWidgets, widgetGroups } from '@/lib/analysis/analysis-widgets';
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
const coverage: Indicator = {
  id: 'coverage_index',
  name: 'Cobertura',
  unit: '%',
  indicator_type: { type: 'range', min: 0, max: 100 },
};
const crop: Indicator = { id: 'crop_type', name: 'Cultivo', indicator_type: { type: 'text' } };
/** A plain category indicator, for the ordering tests: Resiliencia is productivo's context. */
const trend: Indicator = {
  id: 'ITR_soja',
  name: 'Tendencia',
  indicator_type: { type: 'category', categories: ['Positiva', 'Negativa'] },
};

const parcels: AnalysisParcel[] = [
  {
    parcel_id: 'A',
    properties: {
      Resiliencia: 'Media',
      ITR_soja: 'Positiva',
      Pro_soja: 3.5,
      asian_rust: 3,
      coverage_index: 12,
    },
  },
  {
    parcel_id: 'B',
    properties: {
      Resiliencia: 'Alta',
      ITR_soja: 'Negativa',
      Pro_soja: 3.8,
      asian_rust: 1,
      coverage_index: 87,
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

  it('productivo: the projection chart sits where its scenarios sit in the metadata', () => {
    const scenarios: Indicator[] = ['LOW', 'MID', 'HIGH'].map((level) => ({
      id: `${level}_H5_soja`,
      name: `Producción proyectada ${level}`,
      unit: 't/ha',
      indicator_type: { type: 'numeric' },
    }));
    const projected = parcels.map((entry) => ({
      ...entry,
      properties: { ...entry.properties, LOW_H5_soja: 3, MID_H5_soja: 3.5, HIGH_H5_soja: 4 },
    }));

    for (const scope of ['multiple', 'individual'] as const) {
      const widgets = analysisWidgets({
        parcels: projected,
        parcelIds: ['A', 'B'],
        indicators: [resilience, ...scenarios, production],
        riesgo: 'productivo',
        scope,
        parcel: projected[0],
      });

      // On a parcel tab Resiliencia reads in the context panel instead.
      const expected = ['projection_soja', 'Pro_soja'];
      expect(widgets.map(({ id }) => id)).toEqual(
        scope === 'multiple' ? ['Resiliencia', ...expected] : expected,
      );
    }
  });

  it('orders agnostic widgets first, then historic, then future, each group in metadata order', () => {
    const future = (indicator: Indicator): Indicator => ({ ...indicator, category: 'future' });
    const historic = (indicator: Indicator): Indicator => ({ ...indicator, category: 'historic' });
    const scenarios: Indicator[] = ['LOW', 'MID', 'HIGH'].map((level) => ({
      id: `${level}_H5_soja`,
      name: `Producción proyectada ${level}`,
      unit: 't/ha',
      category: 'future',
      indicator_type: { type: 'numeric' },
    }));
    const projected = parcels.map((entry) => ({
      ...entry,
      properties: { ...entry.properties, LOW_H5_soja: 3, MID_H5_soja: 3.5, HIGH_H5_soja: 4 },
    }));

    const indicators = [...scenarios, future(trend), historic(production), coverage];
    const widgets = analysisWidgets({
      parcels: projected,
      parcelIds: ['A', 'B'],
      indicators,
      riesgo: 'productivo',
      scope: 'multiple',
      parcel: combinedParcel(projected, indicators),
    });

    expect(widgets.map(({ id }) => id)).toEqual([
      'coverage_index',
      'Pro_soja',
      'projection_soja',
      'ITR_soja',
    ]);
  });

  it("productivo, a parcel tab: Resiliencia goes to the context panel, the number is that parcel's figure", () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [resilience, production],
      riesgo: 'productivo',
      scope: 'individual',
      parcel: parcels[1],
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([['number', 'Pro_soja']]);
    // The number card sits on the scale of the whole set (0–4), not of this parcel alone.
    expect(widgets[0]).toMatchObject({ text: '3,8', unit: 't/ha', max: 4, position: 95 });
  });

  it('sanitario, Todas: the short range and the category count the parcels, the long range bins them', () => {
    const widgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: [rust, resilience, coverage, crop],
      riesgo: 'sanitario',
      scope: 'multiple',
      parcel: combinedParcel(parcels, [rust, resilience, coverage]),
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['bar-chart', 'asian_rust'],
      ['bar-chart', 'Resiliencia'],
      ['histogram', 'coverage_index'],
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
      indicators: [rust, resilience, coverage],
      riesgo: 'sanitario',
      scope: 'individual',
      parcel: parcels[0],
    });

    expect(widgets.map((widget) => [widget.kind, widget.id])).toEqual([
      ['ruler', 'asian_rust'],
      ['ruler', 'Resiliencia'],
      ['ruler', 'coverage_index'],
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

describe('widgetGroups', () => {
  const historicProduction: Indicator = { ...production, category: 'historic' };
  const futureTrend: Indicator = { ...trend, category: 'future' };
  const indicators = [coverage, historicProduction, futureTrend];
  const widgets = analysisWidgets({
    parcels,
    parcelIds: ['A', 'B'],
    indicators,
    riesgo: 'productivo',
    scope: 'multiple',
    parcel: combinedParcel(parcels, indicators),
  });

  it('cuts the sorted widgets into one run per category, titled, agnostic untitled', () => {
    expect(
      widgetGroups(widgets, indicators, 'productivo').map(({ title, widgets: run }) => [
        title,
        run.map(({ id }) => id),
      ]),
    ).toEqual([
      [null, ['coverage_index']],
      ['Análisis histórico de productividad', ['Pro_soja']],
      ['Análisis de productividad proyectada', ['ITR_soja']],
    ]);
  });

  it("puts productivo's context widgets first, under Información de contexto, whatever their category", () => {
    const withContext = [
      coverage,
      historicProduction,
      { ...resilience, category: 'future' as const },
    ];
    const contextWidgets = analysisWidgets({
      parcels,
      parcelIds: ['A', 'B'],
      indicators: withContext,
      riesgo: 'productivo',
      scope: 'multiple',
      parcel: combinedParcel(parcels, withContext),
    });

    expect(
      widgetGroups(contextWidgets, withContext, 'productivo').map(
        ({ key, title, widgets: run }) => [key, title, run.map(({ id }) => id)],
      ),
    ).toEqual([
      ['context', 'Información de contexto', ['Resiliencia']],
      ['agnostic', null, ['coverage_index']],
      ['historic', 'Análisis histórico de productividad', ['Pro_soja']],
    ]);
  });

  it('puts the zafriñas under Información de contexto, right under the seasons counter', () => {
    const count = (id: string): Indicator => ({
      id,
      name: id,
      category: 'historic',
      indicator_type: { type: 'range', min: 0, max: 8, step: 1 },
    });
    const seasons: Indicator = {
      id: 'Zafras_soja',
      name: 'Zafras',
      category: 'historic',
      indicator_type: { type: 'list' },
    };
    const list = [count('N_soja'), seasons, count('N_zafrinas')];
    const counted: AnalysisParcel[] = [
      {
        parcel_id: 'A',
        properties: { N_soja: 3, Zafras_soja: '2019-2020', N_zafrinas: 1 },
        lists: { Zafras_soja: ['2019-2020'] },
      },
      {
        parcel_id: 'B',
        properties: { N_soja: 2, Zafras_soja: '2020-2021', N_zafrinas: 0 },
        lists: { Zafras_soja: ['2020-2021'] },
      },
    ];
    const built = analysisWidgets({
      parcels: counted,
      parcelIds: ['A', 'B'],
      indicators: list,
      riesgo: 'productivo',
      scope: 'multiple',
      parcel: combinedParcel(counted, list),
    });

    expect(
      widgetGroups(built, list, 'productivo').map(({ key, widgets: run }) => [
        key,
        run.map(({ id }) => id),
      ]),
    ).toEqual([['context', ['N_soja', 'N_zafrinas', 'Zafras_soja']]]);
  });

  it('is one untitled run when no indicator has a category, as on sanitario', () => {
    const plain = [coverage, production];

    expect(widgetGroups(widgets.slice(0, 2), plain, 'sanitario')).toEqual([
      { key: 'agnostic', title: null, widgets: widgets.slice(0, 2) },
    ]);
  });

  it('is empty without widgets', () => {
    expect(widgetGroups([], indicators, 'productivo')).toEqual([]);
  });
});
