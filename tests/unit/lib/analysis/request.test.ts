import { describe, expect, it } from 'vitest';

import type { AnalysisFilterSelection } from '@/lib/analysis/filters';
import {
  isSameSummaryRequests,
  requestedIndicatorIds,
  toAnalysisRequest,
  toAnalysisRequests,
  toSummaryRequests,
  visibilityOf,
} from '@/lib/analysis/request';
import type { SummaryRequest } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

/** A hero selection as the API keys it: filter id → picked value. */
const SELECTION: AnalysisFilterSelection = {
  crop: 'soja',
  cycle: 'zafra',
  start_date: '2026-06-18',
  end_date: '2026-08-18',
};

/** A measured indicator with no default flag. */
function indicator(id: string): Indicator {
  return { id, name: id, indicator_type: { type: 'range', min: 0, max: 1 } };
}

describe('visibilityOf', () => {
  it('maps sanitario to public and productivo to private', () => {
    expect(visibilityOf('sanitario')).toBe('public');
    expect(visibilityOf('productivo')).toBe('private');
  });
});

describe('requestedIndicatorIds', () => {
  const station: Indicator = {
    id: 'weather_station',
    name: 'Estación',
    indicator_type: { type: 'text' },
  };
  const rust: Indicator = {
    id: 'asian_rust',
    name: 'Roya',
    default: true,
    indicator_type: { type: 'range', min: 1, max: 3 },
  };
  const spot: Indicator = {
    id: 'brown_spot',
    name: 'Mancha',
    default: false,
    indicator_type: { type: 'range', min: 1, max: 3 },
  };

  it('asks for the general-info facts plus the default measured indicators until the user picks', () => {
    expect(requestedIndicatorIds([station, rust, spot], null)).toEqual([
      'weather_station',
      'asian_rust',
    ]);
  });

  it("asks for the user's picks instead of the defaults, general info still included", () => {
    expect(requestedIndicatorIds([station, rust, spot], ['brown_spot'])).toEqual([
      'weather_station',
      'brown_spot',
    ]);
  });

  it('asks for every measured indicator when the API flags no default', () => {
    expect(requestedIndicatorIds([indicator('a'), indicator('b')], null)).toEqual(['a', 'b']);
  });

  it('always asks for the area and the open numbers: facts, not picks', () => {
    const area: Indicator = {
      id: 'area',
      name: 'Área',
      unit: 'ha',
      indicator_type: { type: 'numeric' },
    };
    const yieldT: Indicator = {
      id: 'Pro_soja',
      name: 'Producción',
      indicator_type: { type: 'numeric' },
    };

    expect(requestedIndicatorIds([area, yieldT, rust, spot], ['brown_spot'])).toEqual([
      'area',
      'Pro_soja',
      'brown_spot',
    ]);
  });

  it('on productivo an open number is a pick like any other, the area still always asked', () => {
    const area: Indicator = {
      id: 'area',
      name: 'Área',
      unit: 'ha',
      indicator_type: { type: 'numeric' },
    };
    const yieldT: Indicator = {
      id: 'Pro_soja',
      name: 'Producción',
      indicator_type: { type: 'numeric' },
    };

    expect(requestedIndicatorIds([area, yieldT, rust], ['asian_rust'], 'productivo')).toEqual([
      'area',
      'asian_rust',
    ]);
    expect(requestedIndicatorIds([area, yieldT, rust], ['Pro_soja'], 'productivo')).toEqual([
      'area',
      'Pro_soja',
    ]);
  });
});

describe('toAnalysisRequest', () => {
  it('lays the selection, the parcels and the indicators out flat, by filter id', () => {
    expect(toAnalysisRequest(['P1', 'P2'], SELECTION, ['iep'])).toEqual({
      parcels: ['P1', 'P2'],
      indicators: ['iep'],
      crop: 'soja',
      cycle: 'zafra',
      start_date: '2026-06-18',
      end_date: '2026-08-18',
    });
  });

  it('sends no crop under Todos', () => {
    expect(toAnalysisRequest(['P1'], { crop_type: 'todos', date: '2026-09-17' }, ['iep'])).toEqual({
      parcels: ['P1'],
      indicators: ['iep'],
      date: '2026-09-17',
    });
  });

  it('sends the two lists alone when nothing was picked yet', () => {
    expect(toAnalysisRequest(['P1'], {}, ['rendimiento'])).toEqual({
      parcels: ['P1'],
      indicators: ['rendimiento'],
    });
  });

  it('asks the diseases analysis for 2025 whatever the hero holds, productivo for nothing extra', () => {
    const selection = { crop_type: 'soja', date: '2026-09-17', year: '2031' };

    expect(toAnalysisRequest(['P1'], selection, ['iep'], 'sanitario')).toEqual({
      parcels: ['P1'],
      indicators: ['iep'],
      crop_type: 'soja',
      date: '2026-09-17',
      year: '2025',
    });
    expect(toAnalysisRequest(['P1'], selection, ['iep'], 'productivo')).toEqual({
      parcels: ['P1'],
      indicators: ['iep'],
      ...selection,
    });
  });

  it("sends rice under the backend's name, arroz", () => {
    expect(toAnalysisRequest(['P1'], { crop_type: 'rice' }, ['iep'])).toMatchObject({
      crop_type: 'arroz',
    });
  });

  it('never lets a selection key shadow the parcel or indicator lists', () => {
    const shadowing: AnalysisFilterSelection = { indicators: 'x', parcels: 'y' };

    expect(toAnalysisRequest(['P1'], shadowing, ['iep'])).toMatchObject({
      parcels: ['P1'],
      indicators: ['iep'],
    });
  });
});

describe('toAnalysisRequests', () => {
  const soyYield: Indicator = indicator('Pro_soja');
  const riceYield: Indicator = indicator('Pro_arroz');
  const area = indicator('area');
  const metadata = [soyYield, riceYield, area];
  const ids = ['Pro_soja', 'Pro_arroz', 'area'];
  const todos = { crop_type: 'todos', year: '2027' };

  it('asks productivo under Todos once per crop, every parcel, its crop’s indicators and the shared ones', () => {
    expect(toAnalysisRequests(['P1', 'P2'], todos, ids, metadata, 'productivo')).toEqual([
      {
        parcels: ['P1', 'P2'],
        indicators: ['Pro_arroz', 'area'],
        crop_type: 'arroz',
        year: '2027',
      },
      { parcels: ['P1', 'P2'], indicators: ['Pro_soja', 'area'], crop_type: 'soja', year: '2027' },
    ]);
  });

  it('asks once for a single crop', () => {
    expect(
      toAnalysisRequests(['P1'], { ...todos, crop_type: 'rice' }, ids, metadata, 'productivo'),
    ).toEqual([{ parcels: ['P1'], indicators: ids, crop_type: 'arroz', year: '2027' }]);
  });

  it('asks sanitario once, whatever the selection: its dropdown offers no Todos', () => {
    expect(
      toAnalysisRequests(['P1'], { crop_type: 'soja' }, ids, metadata, 'sanitario'),
    ).toHaveLength(1);
  });
});

describe('toSummaryRequests', () => {
  it("sends every analysed parcel under Todas, with the hero year and crop under the backend's name", () => {
    expect(toSummaryRequests(['P1', 'P2'], null, { crop_type: 'rice', year: '2026' })).toEqual([
      { parcels: ['P1', 'P2'], crop_type: 'arroz', year: '2026' },
    ]);
  });

  it("sends only the open tab's parcel", () => {
    expect(toSummaryRequests(['P1', 'P2'], 'P2', { crop_type: 'soja', year: '2025' })).toEqual([
      { parcels: ['P2'], year: '2025', crop_type: 'soja' },
    ]);
  });

  it('under Todos asks once per crop, soy first', () => {
    expect(toSummaryRequests(['P1'], null, { crop_type: 'todos', year: '2026' })).toEqual([
      { parcels: ['P1'], year: '2026', crop_type: 'soja' },
      { parcels: ['P1'], year: '2026', crop_type: 'arroz' },
    ]);
  });

  it('is null with no parcels, filters not resolved yet, no year, or a crop the analysis does not cover', () => {
    expect(toSummaryRequests(['P1'], null, { crop_type: 'soja' })).toBeNull();
    expect(toSummaryRequests([], null, { crop_type: 'soja', year: '2025' })).toBeNull();
    expect(toSummaryRequests(['P1'], null, null)).toBeNull();
    expect(toSummaryRequests(['P1'], null, {})).toBeNull();
    expect(toSummaryRequests(['P1'], null, { crop_type: 'maiz', year: '2025' })).toBeNull();
  });
});

describe('isSameSummaryRequests', () => {
  const asked: SummaryRequest = { parcels: ['P1', 'P2'], year: '2025', crop_type: 'soja' };

  it('holds for the same parcels, year and crops, even as new objects', () => {
    expect(isSameSummaryRequests([asked], [{ ...asked, parcels: ['P1', 'P2'] }])).toBe(true);
  });

  it('breaks on another crop, year, parcel set or number of crops', () => {
    expect(isSameSummaryRequests([asked], [{ ...asked, crop_type: 'arroz' }])).toBe(false);
    expect(isSameSummaryRequests([asked], [{ ...asked, year: '2026' }])).toBe(false);
    expect(isSameSummaryRequests([asked], [{ ...asked, parcels: ['P2'] }])).toBe(false);
    expect(isSameSummaryRequests([asked], [asked, { ...asked, crop_type: 'arroz' }])).toBe(false);
  });

  it('breaks when nothing was asked or nothing can be asked now', () => {
    expect(isSameSummaryRequests(undefined, [asked])).toBe(false);
    expect(isSameSummaryRequests([asked], null)).toBe(false);
  });
});
