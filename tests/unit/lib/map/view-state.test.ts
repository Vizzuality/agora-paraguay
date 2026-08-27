import { describe, expect, it } from 'vitest';

import {
  LATITUDE_RANGE,
  normalizeLatitude,
  normalizeLongitude,
  normalizeViewState,
  normalizeZoom,
  ZOOM_RANGE,
} from '@/lib/map/view-state';

describe('normalizeLatitude', () => {
  it('clamps beyond the Web Mercator limit', () => {
    expect(normalizeLatitude(90)).toBe(LATITUDE_RANGE.max);
    expect(normalizeLatitude(-90)).toBe(LATITUDE_RANGE.min);
  });

  it('leaves a Paraguayan latitude alone apart from rounding', () => {
    expect(normalizeLatitude(-23.442503)).toBe(-23.4425);
  });
});

describe('normalizeLongitude', () => {
  it('wraps rather than clamps, so crossing the antimeridian is not a dead end', () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-190)).toBe(170);
  });

  it('keeps an in-range longitude', () => {
    expect(normalizeLongitude(-58.44)).toBe(-58.44);
  });
});

describe('normalizeZoom', () => {
  it('clamps to the supported range', () => {
    expect(normalizeZoom(-5)).toBe(ZOOM_RANGE.min);
    expect(normalizeZoom(40)).toBe(ZOOM_RANGE.max);
  });

  it('rounds to two decimals', () => {
    expect(normalizeZoom(6.123456)).toBe(6.12);
  });
});

describe('normalizeViewState', () => {
  it('repairs a hand-edited URL instead of passing invalid values to MapLibre', () => {
    expect(normalizeViewState({ longitude: 200, latitude: 95, zoom: 99 })).toEqual({
      longitude: -160,
      latitude: LATITUDE_RANGE.max,
      zoom: ZOOM_RANGE.max,
    });
  });
});
