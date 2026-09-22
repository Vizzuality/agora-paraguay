import { describe, expect, it } from 'vitest';

import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import {
  BADGE_FULL_PARCEL_PX,
  BADGE_MIN_PARCEL_PX,
  BADGE_MIN_SCALE,
  badgeScale,
  parcelLabelPoint,
} from '@/lib/map/parcel-label-point';

/** A closed rectangle ring from (x, y) with the given size. */
function rect(x: number, y: number, width: number, height: number): [number, number][] {
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y],
  ];
}

function parcel(features: FilteredParcel['geometry']['features']): FilteredParcel {
  return { parcel_id: 'P', selected: true, geometry: { type: 'FeatureCollection', features } };
}

describe('parcelLabelPoint', () => {
  it('is the centre of a rectangle, whichever way the ring winds', () => {
    const clockwise = parcel([
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: [rect(0, 0, 4, 2)] } },
    ]);
    const counter = parcel([
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...rect(0, 0, 4, 2)].reverse()] },
      },
    ]);

    expect(parcelLabelPoint(clockwise)).toEqual({ lng: 2, lat: 1 });
    expect(parcelLabelPoint(counter)).toEqual({ lng: 2, lat: 1 });
  });

  it('ignores holes: the badge sits on the outer ring centroid', () => {
    const holed = parcel([
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [rect(0, 0, 4, 4), rect(1, 1, 1, 1)] },
      },
    ]);

    expect(parcelLabelPoint(holed)).toEqual({ lng: 2, lat: 2 });
  });

  it('picks the largest part of a multi-part parcel', () => {
    const multi = parcel([
      {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[rect(10, 10, 1, 1)], [rect(0, 0, 4, 4)]],
        },
      },
    ]);

    expect(parcelLabelPoint(multi)).toEqual({ lng: 2, lat: 2 });
  });

  it('is null when no ring encloses any area', () => {
    const flat = parcel([
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [2, 0],
              [0, 0],
            ],
          ],
        },
      },
    ]);

    expect(parcelLabelPoint(flat)).toBeNull();
  });
});

describe('badgeScale', () => {
  it('is full size once the parcel has room on screen', () => {
    expect(badgeScale(BADGE_FULL_PARCEL_PX)).toBe(1);
    expect(badgeScale(BADGE_FULL_PARCEL_PX * 4)).toBe(1);
  });

  it('bottoms out at the minimum scale once the parcel is a sliver', () => {
    expect(badgeScale(BADGE_MIN_PARCEL_PX)).toBe(BADGE_MIN_SCALE);
    expect(badgeScale(0)).toBe(BADGE_MIN_SCALE);
  });

  it('shrinks linearly in between', () => {
    const halfway = (BADGE_FULL_PARCEL_PX + BADGE_MIN_PARCEL_PX) / 2;

    expect(badgeScale(halfway)).toBeCloseTo((1 + BADGE_MIN_SCALE) / 2);
  });
});
