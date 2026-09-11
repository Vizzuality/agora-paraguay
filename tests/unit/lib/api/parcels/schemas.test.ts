import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  DEFAULT_FILTER_PARCELS_OPTIONS,
  filterParcelsRequestSchema,
  filterParcelsResponseSchema,
  toFilterParcelsRequest,
} from '@/lib/api/parcels/schemas';
import type { DrawnPolygon } from '@/lib/map/draw-features';

/** A closed unit square, the smallest valid ring. */
const SQUARE = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

const UUID = '6f3a2f6e-7f7a-4a3e-9a3e-2f6e7f7a4a3e';

function polygonGeometry() {
  return { type: 'Polygon', coordinates: [SQUARE] };
}

/** A DrawnPolygon as Terra Draw stores it, internals included. */
function drawnPolygon(id: string, properties: Record<string, unknown> = {}): DrawnPolygon {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [SQUARE] },
    properties: { mode: 'polygon', currentlyDrawing: false, ...properties },
  } as DrawnPolygon;
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    filtering_polygons: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: UUID, name: 'Polígono 1' },
          geometry: polygonGeometry(),
        },
      ],
    },
    overlap_percentage_threshold: 50,
    buffer: 50,
    ...overrides,
  };
}

describe('filterParcelsRequestSchema', () => {
  it('accepts the documented body', () => {
    expect(filterParcelsRequestSchema.safeParse(request()).success).toBe(true);
  });

  it('rejects a threshold outside 0–100 and a negative buffer', () => {
    expect(
      filterParcelsRequestSchema.safeParse(request({ overlap_percentage_threshold: 101 })).success,
    ).toBe(false);
    expect(filterParcelsRequestSchema.safeParse(request({ buffer: -1 })).success).toBe(false);
  });

  it('rejects a feature whose id is not a UUID', () => {
    const body = request();
    body.filtering_polygons.features[0].properties.id = 'parcel-1';

    expect(filterParcelsRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects an empty filtering collection and a non-Polygon geometry', () => {
    const empty = request({ filtering_polygons: { type: 'FeatureCollection', features: [] } });
    expect(filterParcelsRequestSchema.safeParse(empty).success).toBe(false);

    const multi = request();
    multi.filtering_polygons.features[0].geometry = {
      type: 'MultiPolygon',
      coordinates: [[SQUARE]],
    } as never;
    expect(filterParcelsRequestSchema.safeParse(multi).success).toBe(false);
  });

  it('rejects a ring with fewer than 4 positions', () => {
    const body = request();
    body.filtering_polygons.features[0].geometry = {
      type: 'Polygon',
      coordinates: [SQUARE.slice(0, 3)],
    };

    expect(filterParcelsRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe('toFilterParcelsRequest', () => {
  it('maps the store id and name onto properties, with the default tunables', () => {
    const body = toFilterParcelsRequest([drawnPolygon(UUID, { name: 'Estancia' })]);

    expect(body.filtering_polygons.features[0].properties).toEqual({ id: UUID, name: 'Estancia' });
    expect(body.overlap_percentage_threshold).toBe(
      DEFAULT_FILTER_PARCELS_OPTIONS.overlapPercentageThreshold,
    );
    expect(body.buffer).toBe(DEFAULT_FILTER_PARCELS_OPTIONS.buffer);
  });

  it('names unnamed drawings by position and strips Terra Draw internals', () => {
    const body = toFilterParcelsRequest([drawnPolygon(UUID, { origin: 'upload' })]);
    const [feature] = body.filtering_polygons.features;

    expect(feature.properties.name).toBe('Área dibujada 1');
    expect(Object.keys(feature.properties).sort()).toEqual(['id', 'name']);
  });

  it('takes the tunables from the options and copies the geometry', () => {
    const polygon = drawnPolygon(UUID);
    const body = toFilterParcelsRequest([polygon], { overlapPercentageThreshold: 80, buffer: 0 });

    expect(body.overlap_percentage_threshold).toBe(80);
    expect(body.buffer).toBe(0);
    expect(body.filtering_polygons.features[0].geometry).toEqual(polygon.geometry);
    expect(body.filtering_polygons.features[0].geometry).not.toBe(polygon.geometry);
  });

  it('throws on an empty polygon list', () => {
    expect(() => toFilterParcelsRequest([])).toThrow(ZodError);
  });
});

describe('filterParcelsResponseSchema', () => {
  const response = {
    status: 'success',
    message: '',
    input: { features: [{ id: 0 }] },
    results: [
      {
        parcel_id: 8668,
        geometry: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: polygonGeometry() }],
        },
        selected: true,
      },
      { parcel_id: 7866, geometry: { type: 'FeatureCollection', features: [] }, selected: false },
    ],
  };

  it('accepts the documented response, including empty geometry collections', () => {
    expect(filterParcelsResponseSchema.safeParse(response).success).toBe(true);
  });

  it('accepts a MultiPolygon parcel geometry and extra feature fields', () => {
    const body = structuredClone(response);
    body.results[0].geometry.features[0] = {
      type: 'Feature',
      id: 1,
      properties: { area: 12 },
      geometry: { type: 'MultiPolygon', coordinates: [[SQUARE]] },
    } as never;

    expect(filterParcelsResponseSchema.safeParse(body).success).toBe(true);
  });

  it('rejects a parcel without the selected flag or with a string id', () => {
    const noFlag = structuredClone(response) as { results: Record<string, unknown>[] };
    delete noFlag.results[0].selected;
    expect(filterParcelsResponseSchema.safeParse(noFlag).success).toBe(false);

    const stringId = structuredClone(response) as { results: Record<string, unknown>[] };
    stringId.results[0].parcel_id = '8668';
    expect(filterParcelsResponseSchema.safeParse(stringId).success).toBe(false);
  });
});
