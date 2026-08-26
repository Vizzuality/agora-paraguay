import { describe, expect, it } from "vitest";

import { generateParcelFixtures } from "@/lib/api/fixtures/parcels";
import { parcelCollectionSchema, type ParcelFeature } from "@/lib/api/schemas";

// TODO(mock-parcels): tests for the mock generator — delete this file with it when
// the real parcel layer replaces the mock (grep `mock-parcels`).

/** Paraguay's bounding box, from `src/lib/map/basemap.ts`. */
const PARAGUAY = { west: -62.6, east: -54.3, south: -27.6, north: -19.3 };

function ring(feature: ParcelFeature) {
  return feature.geometry.coordinates[0];
}

/** Ray-cast point-in-polygon; boundary points are not "inside". */
function contains(feature: ParcelFeature, [x, y]: [number, number]) {
  const points = ring(feature);
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

function centroid(feature: ParcelFeature): [number, number] {
  const points = ring(feature).slice(0, -1);
  const sum = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);

  return [sum[0] / points.length, sum[1] / points.length];
}

describe("generateParcelFixtures", () => {
  const collection = generateParcelFixtures();

  it("parses against the parcel contract", () => {
    expect(() => parcelCollectionSchema.parse(collection)).not.toThrow();
  });

  it("covers an extensive area with plenty of parcels", () => {
    expect(collection.features.length).toBeGreaterThanOrEqual(300);

    const lngs = collection.features.flatMap((f) => ring(f).map(([lng]) => lng));
    const lats = collection.features.flatMap((f) => ring(f).map(([, lat]) => lat));

    // The parcels span at least ~1° in both axes (~100 km).
    expect(Math.max(...lngs) - Math.min(...lngs)).toBeGreaterThan(1);
    expect(Math.max(...lats) - Math.min(...lats)).toBeGreaterThan(1);
  });

  it("keeps every parcel inside Paraguay", () => {
    for (const feature of collection.features) {
      for (const [lng, lat] of ring(feature)) {
        expect(lng).toBeGreaterThan(PARAGUAY.west);
        expect(lng).toBeLessThan(PARAGUAY.east);
        expect(lat).toBeGreaterThan(PARAGUAY.south);
        expect(lat).toBeLessThan(PARAGUAY.north);
      }
    }
  });

  it("makes every parcel an irregular polygon, not an axis-aligned rectangle", () => {
    const axisAligned = collection.features.filter((feature) => {
      const points = ring(feature);

      return points.slice(1).every(([x, y], i) => {
        const [px, py] = points[i];
        return x === px || y === py;
      });
    });

    expect(axisAligned).toHaveLength(0);
  });

  it("never overlaps two parcels (no centroid falls inside another parcel)", () => {
    for (const feature of collection.features) {
      const inside = collection.features.filter(
        (other) => other !== feature && contains(other, centroid(feature)),
      );

      expect(inside).toHaveLength(0);
    }
  });

  it("places parcels flush against neighbours (shared corner vertices)", () => {
    const seen = new Map<string, number>();

    for (const feature of collection.features) {
      // Skip the closing point so a vertex counts once per parcel.
      for (const [lng, lat] of ring(feature).slice(0, -1)) {
        const key = `${lng}:${lat}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
    }

    const shared = [...seen.values()].filter((count) => count >= 2).length;

    // Estates are subdivided lattices, so shared corners dominate.
    expect(shared).toBeGreaterThan(collection.features.length / 2);
  });

  it("is deterministic for a given seed", () => {
    expect(generateParcelFixtures(7)).toEqual(generateParcelFixtures(7));
    expect(generateParcelFixtures(7)).not.toEqual(generateParcelFixtures(8));
  });
});
