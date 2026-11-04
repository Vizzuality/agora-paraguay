import { describe, expect, it } from 'vitest';

import type { AnalysisFilterSelection } from '@/lib/analysis/filters';
import {
  requestedIndicatorIds,
  toAnalysisRequest,
  toSummaryRequest,
  visibilityOf,
} from '@/lib/analysis/request';
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

  it('sends the two lists alone when nothing was picked yet', () => {
    expect(toAnalysisRequest(['P1'], {}, ['rendimiento'])).toEqual({
      parcels: ['P1'],
      indicators: ['rendimiento'],
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

describe('toSummaryRequest', () => {
  it('sends every analysed parcel under Todas, with the hero year and crop', () => {
    expect(toSummaryRequest(['P1', 'P2'], null, { crop_type: 'rice', year: '2026' })).toEqual({
      parcels: ['P1', 'P2'],
      crop_type: 'rice',
      year: '2026',
    });
  });

  it("sends only the open tab's parcel", () => {
    expect(toSummaryRequest(['P1', 'P2'], 'P2', { crop_type: 'soy', year: '2025' })).toEqual({
      parcels: ['P2'],
      year: '2025',
      crop_type: 'soy',
    });
  });

  it('is null with no parcels, filters not resolved yet, no year, or a crop the analysis does not cover', () => {
    expect(toSummaryRequest(['P1'], null, { crop_type: 'soy' })).toBeNull();
    expect(toSummaryRequest([], null, { crop_type: 'soy', year: '2025' })).toBeNull();
    expect(toSummaryRequest(['P1'], null, null)).toBeNull();
    expect(toSummaryRequest(['P1'], null, {})).toBeNull();
    expect(toSummaryRequest(['P1'], null, { crop_type: 'maiz', year: '2025' })).toBeNull();
  });
});
