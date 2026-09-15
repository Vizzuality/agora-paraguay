import { describe, expect, it } from 'vitest';

import {
  matchesIndicator,
  selectableIndicators,
  toggleIndicatorId,
  visibleIndicatorIds,
  visibleIndicators,
} from '@/lib/analysis/indicator-picker';
import type { Indicators } from '@/lib/api/metadata/schemas';

const indicators: Indicators = [
  { id: 'asian_rust', name: 'Roya asiática', default: true },
  { id: 'brown_spot', name: 'Mancha marrón', default: true },
  { id: 'data_quality', name: 'Calidad del dato', default: false },
  { id: 'weather_station', name: 'Estación' },
];

describe('selectableIndicators', () => {
  it('leaves out the general-info facts: text and untyped indicators', () => {
    const withTypes: Indicators = [
      { id: 'asian_rust', name: 'Roya', indicator_type: { type: 'range', min: 1, max: 3 } },
      { id: 'crop_type', name: 'Cultivo', indicator_type: { type: 'text' } },
      { id: 'weather_station', name: 'Estación' },
      { id: 'ITR', name: 'ITR', indicator_type: { type: 'category', categories: ['a', 'b'] } },
    ];

    expect(selectableIndicators(withTypes).map((i) => i.id)).toEqual(['asian_rust', 'ITR']);
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
  const rust = { id: 'asian_rust', name: 'Roya asiática' };

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
