import { describe, expect, it } from 'vitest';

import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import {
  applyToggles,
  parcelAtPoint,
  selectedParcelIds,
  toggleParcelId,
} from '@/lib/map/parcel-selection';

/** A unit-square parcel at (x, y), as `filter_parcels` shapes it. */
function parcel(id: number, x: number, y: number, selected: boolean): FilteredParcel {
  return {
    parcel_id: id,
    selected,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [x, y],
                [x + 1, y],
                [x + 1, y + 1],
                [x, y + 1],
                [x, y],
              ],
            ],
          },
        },
      ],
    },
  };
}

const ANSWER = [parcel(1, 0, 0, true), parcel(2, 1, 0, true), parcel(3, 2, 0, false)];

describe('toggleParcelId', () => {
  it('adds an id, and removes it on the second toggle', () => {
    expect(toggleParcelId([], 2)).toEqual([2]);
    expect(toggleParcelId([2], 3)).toEqual([2, 3]);
    expect(toggleParcelId([2, 3], 2)).toEqual([3]);
  });
});

describe('applyToggles', () => {
  it('returns the answer untouched when nothing was flipped', () => {
    expect(applyToggles(ANSWER, [])).toBe(ANSWER);
  });

  it('inverts the flag of the flipped parcels, both ways', () => {
    const refined = applyToggles(ANSWER, [2, 3]);

    expect(refined.map((entry) => [entry.parcel_id, entry.selected])).toEqual([
      [1, true],
      [2, false],
      [3, true],
    ]);
    // The answer itself is never mutated: it belongs to the query cache.
    expect(ANSWER[1].selected).toBe(true);
  });

  it('ignores flips for parcels no longer in the answer', () => {
    expect(applyToggles(ANSWER, [99])).toEqual(ANSWER);
  });
});

describe('selectedParcelIds', () => {
  it('lists the selected parcels, after the flips', () => {
    expect(selectedParcelIds(ANSWER)).toEqual([1, 2]);
    expect(selectedParcelIds(applyToggles(ANSWER, [1, 3]))).toEqual([2, 3]);
  });
});

describe('parcelAtPoint', () => {
  it('finds the parcel under the point, or null off every parcel', () => {
    expect(parcelAtPoint(ANSWER, { lng: 1.5, lat: 0.5 })?.parcel_id).toBe(2);
    expect(parcelAtPoint(ANSWER, { lng: 2.5, lat: 0.5 })?.parcel_id).toBe(3);
    expect(parcelAtPoint(ANSWER, { lng: 5, lat: 5 })).toBeNull();
  });

  it('reads every outer ring of a MultiPolygon parcel', () => {
    const split: FilteredParcel = {
      parcel_id: 7,
      selected: false,
      geometry: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                parcel(0, 10, 10, false).geometry.features[0].geometry.coordinates as [
                  number,
                  number,
                ][][],
                parcel(0, 20, 20, false).geometry.features[0].geometry.coordinates as [
                  number,
                  number,
                ][][],
              ],
            },
          },
        ],
      },
    };

    expect(parcelAtPoint([split], { lng: 20.5, lat: 20.5 })?.parcel_id).toBe(7);
    expect(parcelAtPoint([split], { lng: 15, lat: 15 })).toBeNull();
  });
});
