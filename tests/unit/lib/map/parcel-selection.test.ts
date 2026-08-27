import { describe, expect, it } from "vitest";

import type { ParcelFeature } from "@/lib/api/schemas";
import { parcelAtPoint, toggleParcel } from "@/lib/map/parcel-selection";

function parcel(id: string, west: number, south: number, east: number, north: number) {
  return {
    type: "Feature",
    properties: { id, name: `Parcela ${id}` },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  } as ParcelFeature;
}

const first = parcel("p-1", 0, 0, 1, 1);
const second = parcel("p-2", 2, 0, 3, 1);

describe("toggleParcel", () => {
  it("adds a parcel that is not selected", () => {
    expect(toggleParcel([], first)).toEqual([first]);
    expect(toggleParcel([first], second)).toEqual([first, second]);
  });

  it("removes a parcel that already is, keeping the rest", () => {
    expect(toggleParcel([first, second], first)).toEqual([second]);
  });

  it("toggles by id, so a re-fetched feature object still matches", () => {
    const refetched = parcel("p-1", 0, 0, 1, 1);

    expect(toggleParcel([first], refetched)).toEqual([]);
  });

  it("never mutates the selection it was given", () => {
    const selection = [first];

    toggleParcel(selection, second);
    toggleParcel(selection, first);

    expect(selection).toEqual([first]);
  });
});

describe("parcelAtPoint", () => {
  it("finds the parcel under the point", () => {
    expect(parcelAtPoint([first, second], { lng: 2.5, lat: 0.5 })).toBe(second);
  });

  it("misses with null, and is empty-safe", () => {
    expect(parcelAtPoint([first, second], { lng: 1.5, lat: 0.5 })).toBeNull();
    expect(parcelAtPoint([], { lng: 0.5, lat: 0.5 })).toBeNull();
  });
});
