import { describe, expect, it } from 'vitest';

import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import {
  applyToggles,
  highlightParcels,
  parcelAtPoint,
  selectedParcelIds,
  toggleParcelId,
} from '@/lib/map/parcel-selection';

/** A unit-square parcel at (x, y), as `filter-parcels/` shapes it. */
function parcel(id: string, x: number, y: number, selected: boolean): FilteredParcel {
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

const ANSWER = [parcel('P1', 0, 0, true), parcel('P2', 1, 0, true), parcel('P3', 2, 0, false)];

describe('highlightParcels', () => {
  it('marks only the given ids as selected, whatever the API flagged', () => {
    expect(highlightParcels(ANSWER, ['P3']).map((entry) => entry.selected)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('highlights every submitted parcel under Todas and none with an empty list', () => {
    expect(highlightParcels(ANSWER, ['P1', 'P2']).map((entry) => entry.selected)).toEqual([
      true,
      true,
      false,
    ]);
    expect(highlightParcels(ANSWER, []).every((entry) => !entry.selected)).toBe(true);
  });

  it('leaves the answer untouched', () => {
    highlightParcels(ANSWER, ['P3']);

    expect(ANSWER.map((entry) => entry.selected)).toEqual([true, true, false]);
  });
});

describe('toggleParcelId', () => {
  it('adds an id, and removes it on the second toggle', () => {
    expect(toggleParcelId([], 'P2')).toEqual(['P2']);
    expect(toggleParcelId(['P2'], 'P3')).toEqual(['P2', 'P3']);
    expect(toggleParcelId(['P2', 'P3'], 'P2')).toEqual(['P3']);
  });
});

describe('applyToggles', () => {
  it('returns the answer untouched when nothing was flipped', () => {
    expect(applyToggles(ANSWER, [])).toBe(ANSWER);
  });

  it('inverts the flag of the flipped parcels, both ways', () => {
    const refined = applyToggles(ANSWER, ['P2', 'P3']);

    expect(refined.map((entry) => [entry.parcel_id, entry.selected])).toEqual([
      ['P1', true],
      ['P2', false],
      ['P3', true],
    ]);
    // The answer itself is never mutated: it belongs to the query cache.
    expect(ANSWER[1].selected).toBe(true);
  });

  it('ignores flips for parcels no longer in the answer', () => {
    expect(applyToggles(ANSWER, ['P99'])).toEqual(ANSWER);
  });
});

describe('selectedParcelIds', () => {
  it('lists the selected parcels, after the flips', () => {
    expect(selectedParcelIds(ANSWER)).toEqual(['P1', 'P2']);
    expect(selectedParcelIds(applyToggles(ANSWER, ['P1', 'P3']))).toEqual(['P2', 'P3']);
  });
});

describe('parcelAtPoint', () => {
  it('finds the parcel under the point, or null off every parcel', () => {
    expect(parcelAtPoint(ANSWER, { lng: 1.5, lat: 0.5 })?.parcel_id).toBe('P2');
    expect(parcelAtPoint(ANSWER, { lng: 2.5, lat: 0.5 })?.parcel_id).toBe('P3');
    expect(parcelAtPoint(ANSWER, { lng: 5, lat: 5 })).toBeNull();
  });

  it('reads every outer ring of a MultiPolygon parcel', () => {
    const split: FilteredParcel = {
      parcel_id: 'P7',
      selected: false,
      geometry: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                parcel('P0', 10, 10, false).geometry.features[0].geometry.coordinates as [
                  number,
                  number,
                ][][],
                parcel('P0', 20, 20, false).geometry.features[0].geometry.coordinates as [
                  number,
                  number,
                ][][],
              ],
            },
          },
        ],
      },
    };

    expect(parcelAtPoint([split], { lng: 20.5, lat: 20.5 })?.parcel_id).toBe('P7');
    expect(parcelAtPoint([split], { lng: 15, lat: 15 })).toBeNull();
  });
});
