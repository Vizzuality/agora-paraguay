import { describe, expect, it } from 'vitest';

import type { AnalysisFilterSelection } from '@/lib/analysis/filters';
import { requestedIndicatorIds, toAnalysisRequest, visibilityOf } from '@/lib/analysis/request';
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
  return { id, name: id, indicator_type: { type: 'numeric' } };
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
