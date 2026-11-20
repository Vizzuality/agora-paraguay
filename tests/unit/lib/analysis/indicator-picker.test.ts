import { describe, expect, it } from 'vitest';

import {
  matchesIndicator,
  selectableIndicators,
  pickerEntries,
  toggleIndicatorId,
  toggleIndicatorIds,
  visibleIndicatorIds,
  visibleIndicators,
} from '@/lib/analysis/indicator-picker';
import type { Indicator, Indicators } from '@/lib/api/metadata/schemas';

const range = { type: 'range', min: 1, max: 3 } as const;
const text = { type: 'text' } as const;

const indicators: Indicators = [
  { id: 'asian_rust', name: 'Roya asiática', default: true, indicator_type: range },
  { id: 'brown_spot', name: 'Mancha marrón', default: true, indicator_type: range },
  { id: 'data_quality', name: 'Calidad del dato', default: false, indicator_type: range },
  { id: 'weather_station', name: 'Estación', indicator_type: text },
];

describe('selectableIndicators', () => {
  it('leaves out the general-info facts (text, open numbers) and the area', () => {
    const withTypes: Indicators = [
      { id: 'asian_rust', name: 'Roya', indicator_type: range },
      { id: 'crop_type', name: 'Cultivo', indicator_type: text },
      { id: 'weather_station', name: 'Estación', indicator_type: text },
      { id: 'Pro_soja', name: 'Producción', indicator_type: { type: 'numeric' } },
      { id: 'area', name: 'Área', unit: 'ha', indicator_type: { type: 'numeric' } },
      { id: 'ITR', name: 'ITR', indicator_type: { type: 'category', categories: ['a', 'b'] } },
    ];

    expect(selectableIndicators(withTypes).map((i) => i.id)).toEqual(['asian_rust', 'ITR']);
  });

  it("offers exposición climática's percentages and class, its hectares and codes being facts", () => {
    const exposure: Indicators = [
      { id: 'DPTO_DESC', name: 'Departamento', indicator_type: text },
      { id: 'Drought_pc', name: 'Sequía', unit: '%', indicator_type: { type: 'numeric' } },
      { id: 'Drought_ha', name: 'Sequía', unit: 'ha', indicator_type: { type: 'numeric' } },
      {
        id: 'Ex_class',
        name: 'Nivel de exposición',
        indicator_type: { type: 'category', categories: ['Bajo', 'Medio', 'Alto'] },
      },
    ];

    expect(selectableIndicators(exposure, 'exposicion_climatica').map((i) => i.id)).toEqual([
      'Drought_pc',
      'Ex_class',
    ]);
  });

  it('offers the open numbers on productivo, where they are widgets, the area still left out', () => {
    const productivo: Indicators = [
      { id: 'Pro_soja', name: 'Producción', indicator_type: { type: 'numeric' } },
      { id: 'area', name: 'Área', unit: 'ha', indicator_type: { type: 'numeric' } },
      { id: 'ITR', name: 'ITR', indicator_type: { type: 'category', categories: ['a', 'b'] } },
    ];

    expect(selectableIndicators(productivo, 'productivo').map((i) => i.id)).toEqual([
      'Pro_soja',
      'ITR',
    ]);
  });

  it('leaves data quality out on sanitario, where it is a summary fact, and offers it on productivo', () => {
    const quality: Indicators = [
      { id: 'asian_rust', name: 'Roya', indicator_type: range },
      { id: 'data_quality', name: 'Calidad del dato', indicator_type: range },
    ];

    expect(selectableIndicators(quality, 'sanitario').map((i) => i.id)).toEqual(['asian_rust']);
    expect(selectableIndicators(quality, 'productivo').map((i) => i.id)).toEqual([
      'asian_rust',
      'data_quality',
    ]);
  });
});

describe('visibleIndicatorIds', () => {
  it("follows the API's default flags until the user selects", () => {
    expect(visibleIndicatorIds(indicators, null)).toEqual(['asian_rust', 'brown_spot']);
  });

  it('shows everything when the API flags no default', () => {
    const unflagged = indicators.map(({ default: _default, ...rest }) => rest);

    expect(visibleIndicatorIds(unflagged, null)).toEqual([
      'asian_rust',
      'brown_spot',
      'data_quality',
      'weather_station',
    ]);
  });

  it("is the user's selection once there is one, even an empty list", () => {
    expect(visibleIndicatorIds(indicators, ['data_quality'])).toEqual(['data_quality']);
    expect(visibleIndicatorIds(indicators, [])).toEqual([]);
  });
});

describe('visibleIndicators', () => {
  it('keeps metadata order regardless of selection order, and drops unknown ids', () => {
    expect(
      visibleIndicators(indicators, ['weather_station', 'gone', 'asian_rust']).map((i) => i.id),
    ).toEqual(['asian_rust', 'weather_station']);
  });
});

describe('toggleIndicatorId', () => {
  it('materialises the defaults on the first toggle, then removes or adds the id', () => {
    expect(toggleIndicatorId(indicators, null, 'brown_spot')).toEqual(['asian_rust']);
    expect(toggleIndicatorId(indicators, null, 'data_quality')).toEqual([
      'asian_rust',
      'brown_spot',
      'data_quality',
    ]);
  });

  it('round-trips: toggling twice restores the list', () => {
    const once = toggleIndicatorId(indicators, ['asian_rust'], 'brown_spot');

    expect(toggleIndicatorId(indicators, once, 'brown_spot')).toEqual(['asian_rust']);
  });
});

describe('matchesIndicator', () => {
  const rust = { id: 'asian_rust', name: 'Roya asiática', indicator_type: range };

  it('matches a blank query', () => {
    expect(matchesIndicator(rust, '')).toBe(true);
    expect(matchesIndicator(rust, '   ')).toBe(true);
  });

  it('ignores case and accents on the name', () => {
    expect(matchesIndicator(rust, 'ASIATICA')).toBe(true);
    expect(matchesIndicator(rust, 'asiática')).toBe(true);
    expect(matchesIndicator(rust, 'roya as')).toBe(true);
  });

  it('also searches the id, and rejects the rest', () => {
    expect(matchesIndicator(rust, 'rust')).toBe(true);
    expect(matchesIndicator(rust, 'mancha')).toBe(false);
  });
});

describe('projection scenarios', () => {
  const scenario = (id: string, isDefault = true): Indicator => ({
    id,
    name: id,
    unit: 't/ha',
    default: isDefault,
    indicator_type: { type: 'numeric' },
  });
  const soy = ['LOW_H5_soja', 'MID_H5_soja', 'HIGH_H5_soja'].map((id) => scenario(id));
  const rice = ['LOW_H5_arroz', 'MID_H5_arroz', 'HIGH_H5_arroz'].map((id) => scenario(id));
  const production = scenario('Pro_soja');

  it('lists one row per crop for its projection, where its first scenario sits', () => {
    expect(pickerEntries([production, ...soy])).toEqual([
      { id: 'Pro_soja', name: 'Pro_soja', ids: ['Pro_soja'] },
      {
        id: 'projection_soja',
        name: 'Producción proyectada a 5 y 10 años',
        ids: ['LOW_H5_soja', 'MID_H5_soja', 'HIGH_H5_soja'],
      },
    ]);
  });

  it("names each crop when two crops' projections are listed", () => {
    expect(pickerEntries([...soy, ...rice]).map(({ name }) => name)).toEqual([
      'Producción proyectada a 5 y 10 años (Soja)',
      'Producción proyectada a 5 y 10 años (Arroz)',
    ]);
  });

  it('shows the whole group when the API flags only one scenario as a default', () => {
    const partial = [
      scenario('LOW_H5_soja', false),
      scenario('MID_H5_soja'),
      scenario('HIGH_H5_soja', false),
    ];

    expect(visibleIndicatorIds(partial, null)).toEqual([
      'MID_H5_soja',
      'LOW_H5_soja',
      'HIGH_H5_soja',
    ]);
  });

  it("toggles a row's scenarios together", () => {
    const ids = soy.map(({ id }) => id);
    const list = [production, ...soy];

    expect(toggleIndicatorIds(list, null, ids)).toEqual(['Pro_soja']);
    expect(toggleIndicatorIds(list, ['Pro_soja'], ids)).toEqual(['Pro_soja', ...ids]);
  });
});
