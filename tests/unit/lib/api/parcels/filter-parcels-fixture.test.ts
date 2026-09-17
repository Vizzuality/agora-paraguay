import { describe, expect, it } from 'vitest';

import { mockFilterParcels } from '@/lib/api/parcels/fixtures/filter-parcels';
import {
  filterParcelsResponseSchema,
  type FilteredParcel,
  type FilterParcelsRequest,
} from '@/lib/api/parcels/schemas';

/** A ~2 km field near Encarnación; the grid answers it in 250 m parcels. */
const SQUARE: [number, number][] = [
  [-57.5, -25.5],
  [-57.48, -25.5],
  [-57.48, -25.48],
  [-57.5, -25.48],
  [-57.5, -25.5],
];

/** The square's lower-left half. */
const TRIANGLE: [number, number][] = [
  [-57.5, -25.5],
  [-57.48, -25.5],
  [-57.5, -25.48],
  [-57.5, -25.5],
];

/** A second field well clear of the first. */
const FAR_SQUARE: [number, number][] = SQUARE.map(([lng, lat]) => [lng + 0.1, lat + 0.1]);

function request(
  rings: [number, number][][],
  overrides: Partial<Omit<FilterParcelsRequest, 'filtering_polygons'>> = {},
): FilterParcelsRequest {
  return {
    filtering_polygons: {
      type: 'FeatureCollection',
      features: rings.map((coordinates, index) => ({
        type: 'Feature',
        properties: {
          id: `6f3a2f6e-7f7a-4a3e-9a3e-2f6e7f7a4a3${index}`,
          name: `Polígono ${index + 1}`,
        },
        geometry: { type: 'Polygon', coordinates: [coordinates] },
      })),
    },
    overlap_percentage_threshold: 50,
    buffer: 0,
    ...overrides,
  };
}

/** Bounding box of a parcel's polygon, [west, south, east, north]. */
function bboxOf(parcel: FilteredParcel): [number, number, number, number] {
  const feature = parcel.geometry.features[0];
  const ring =
    feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0];
  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);

  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

/** Whether a parcel's box overlaps the ring's box by a positive area. */
function touches(parcel: FilteredParcel, ring: [number, number][]): boolean {
  const [west, south, east, north] = bboxOf(parcel);
  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);

  return (
    west < Math.max(...lngs) &&
    east > Math.min(...lngs) &&
    south < Math.max(...lats) &&
    north > Math.min(...lats)
  );
}

const selectedCount = (response: ReturnType<typeof mockFilterParcels>) =>
  response.results.filter((parcel) => parcel.selected).length;

describe('mockFilterParcels', () => {
  it("answers in the spec's shape and parses against the response contract", () => {
    const response = mockFilterParcels(request([SQUARE]));

    expect(() => filterParcelsResponseSchema.parse(response)).not.toThrow();
    expect(response).toMatchObject({
      status: 'success',
      message: '',
      input: { features: [{ id: 0 }] },
    });
    expect(response.results.length).toBeGreaterThan(0);
    expect(new Set(response.results.map((parcel) => parcel.parcel_id)).size).toBe(
      response.results.length,
    );
  });

  it('with no buffer answers only parcels that intersect the polygon', () => {
    const response = mockFilterParcels(request([SQUARE]));

    expect(response.results.every((parcel) => touches(parcel, SQUARE))).toBe(true);
    // Interior parcels pass the 50 % threshold; the ones cut by the edge mostly do not.
    expect(selectedCount(response)).toBeGreaterThan(0);
    expect(response.results.some((parcel) => !parcel.selected)).toBe(true);
  });

  it('with a buffer also answers the parcels around, never flagged', () => {
    const tight = mockFilterParcels(request([SQUARE]));
    const wide = mockFilterParcels(request([SQUARE], { buffer: 500 }));

    expect(wide.results.length).toBeGreaterThan(tight.results.length);

    const around = wide.results.filter((parcel) => !touches(parcel, SQUARE));
    expect(around.length).toBeGreaterThan(0);
    expect(around.every((parcel) => !parcel.selected)).toBe(true);
    // The buffer adds parcels around, it does not change which ones pass.
    expect(selectedCount(wide)).toBe(selectedCount(tight));
  });

  it('applies the overlap threshold: a stricter one flags fewer parcels', () => {
    const lenient = mockFilterParcels(request([TRIANGLE], { overlap_percentage_threshold: 10 }));
    const strict = mockFilterParcels(request([TRIANGLE], { overlap_percentage_threshold: 90 }));

    expect(selectedCount(lenient)).toBeGreaterThan(selectedCount(strict));
    expect(selectedCount(strict)).toBeGreaterThan(0);
  });

  it('answers every polygon once, with parcel ids that never collide', () => {
    const one = mockFilterParcels(request([SQUARE]));
    const two = mockFilterParcels(request([SQUARE, FAR_SQUARE]));

    expect(two.input).toEqual({ features: [{ id: 0 }, { id: 1 }] });
    expect(two.results.length).toBeGreaterThan(one.results.length);
    expect(new Set(two.results.map((parcel) => parcel.parcel_id)).size).toBe(two.results.length);
    expect(two.results.some((parcel) => touches(parcel, FAR_SQUARE))).toBe(true);
  });

  it('shapes parcels as irregular quadrilaterals, none of them the drawing itself', () => {
    const { results } = mockFilterParcels(request([SQUARE]));

    for (const parcel of results) {
      const feature = parcel.geometry.features[0];
      const ring = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : [];
      const [west, south, east, north] = bboxOf(parcel);
      const onBoxCorner = ring.filter(
        ([lng, lat]) => (lng === west || lng === east) && (lat === south || lat === north),
      );

      // Four corners plus the closing point; an axis-aligned square would put all on the box.
      expect(ring).toHaveLength(5);
      expect(onBoxCorner.length).toBeLessThan(5);
      expect(ring).not.toEqual(SQUARE);
    }

    // Sizes vary: the largest parcel's box is clearly bigger than the smallest's.
    const widths = results.map((parcel) => {
      const [west, , east] = bboxOf(parcel);

      return east - west;
    });
    expect(Math.max(...widths) / Math.min(...widths)).toBeGreaterThan(1.2);
  });

  it('is anchored to the world: the same parcel keeps its id across drawings', () => {
    const fromSquare = mockFilterParcels(request([SQUARE]));
    const fromTriangle = mockFilterParcels(request([TRIANGLE]));
    const ids = new Set(fromSquare.results.map((parcel) => parcel.parcel_id));

    // The triangle is half the square: every parcel it touches, the square touched too.
    expect(fromTriangle.results.every((parcel) => ids.has(parcel.parcel_id))).toBe(true);
    expect(mockFilterParcels(request([TRIANGLE]))).toEqual(fromTriangle);
  });
});
