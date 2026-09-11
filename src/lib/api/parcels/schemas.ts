import { z } from 'zod';

import { polygonName, type DrawnPolygon } from '@/lib/map/draw-features';

/*
 * Parcels contract: `POST /api/parcels/filter_parcels` and the (still mock) cadastral
 * layer. GeoJSON geometries are declared here rather than via `@types/geojson`,
 * matching the stance in `draw-features.ts`: `geojson` is only a transitive dependency.
 */

const positionSchema = z.tuple([z.number(), z.number()]);
const ringSchema = z.array(positionSchema).min(4);

export const polygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(ringSchema).min(1),
});

const multiPolygonGeometrySchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(ringSchema).min(1)).min(1),
});

const arealGeometrySchema = z.discriminatedUnion('type', [
  polygonGeometrySchema,
  multiPolygonGeometrySchema,
]);

/**
 * TODO(mock-parcels): invented contract, not in the API spec. The spec has no "all
 * parcels" endpoint — the cadastral layer is expected to come from `filter_parcels`
 * results once the selection flow drives it. Replace or delete then (grep
 * `mock-parcels`).
 */
export const parcelFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  geometry: polygonGeometrySchema,
});

export type ParcelFeature = z.infer<typeof parcelFeatureSchema>;

export const parcelCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(parcelFeatureSchema),
});

export type ParcelCollection = z.infer<typeof parcelCollectionSchema>;

/**
 * `POST /api/parcels/filter_parcels` body. The drawn or uploaded polygons filter the
 * cadastre: the API buffers them by `buffer` metres and returns the parcels around,
 * flagging those whose area overlaps a polygon by at least
 * `overlap_percentage_threshold` percent. Snake_case on purpose — this is the wire
 * shape, not app vocabulary.
 */
const filteringPolygonSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({ id: z.uuid(), name: z.string().min(1) }),
  geometry: polygonGeometrySchema,
});

export const filterParcelsRequestSchema = z.object({
  filtering_polygons: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(filteringPolygonSchema).min(1),
  }),
  overlap_percentage_threshold: z.number().min(0).max(100),
  /** Metres. */
  buffer: z.number().min(0),
});

export type FilterParcelsRequest = z.infer<typeof filterParcelsRequestSchema>;

/** The tunable half of the request, in app vocabulary. */
export type FilterParcelsOptions = {
  overlapPercentageThreshold: number;
  /** Metres. */
  buffer: number;
};

export const DEFAULT_FILTER_PARCELS_OPTIONS: FilterParcelsOptions = {
  overlapPercentageThreshold: 50,
  buffer: 50,
};

/**
 * Request payload from the polygons on the map — a finished drawing or an upload.
 * Terra Draw's default id strategy and the upload normaliser both mint UUIDs, so the
 * store id doubles as the wire `properties.id`; the parse strips the rest of Terra
 * Draw's internals (`mode`, `origin`, `currentlyDrawing`) and copies the geometry, so
 * the payload never aliases the draw store. Throws on an empty list.
 */
export function toFilterParcelsRequest(
  polygons: DrawnPolygon[],
  options: FilterParcelsOptions = DEFAULT_FILTER_PARCELS_OPTIONS,
): FilterParcelsRequest {
  return filterParcelsRequestSchema.parse({
    filtering_polygons: {
      type: 'FeatureCollection',
      features: polygons.map((polygon, index) => ({
        type: 'Feature',
        properties: { id: String(polygon.id), name: polygonName(polygon, index) },
        geometry: polygon.geometry,
      })),
    },
    overlap_percentage_threshold: options.overlapPercentageThreshold,
    buffer: options.buffer,
  });
}

/**
 * `filter_parcels` response. Every parcel around the polygons comes back; `selected`
 * marks the ones over the overlap threshold. The spec (WIP) wraps each parcel's
 * geometry in a FeatureCollection — modelled as given, loose on the feature so the
 * backend can add properties without breaking the parse.
 */
const filteredParcelSchema = z.object({
  parcel_id: z.number().int(),
  geometry: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(z.looseObject({ type: z.literal('Feature'), geometry: arealGeometrySchema })),
  }),
  selected: z.boolean(),
});

export type FilteredParcel = z.infer<typeof filteredParcelSchema>;

export const filterParcelsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  /** Echo of the filtering polygons; shape not fixed, nothing in the app reads it. */
  input: z.unknown().optional(),
  results: z.array(filteredParcelSchema),
});

export type FilterParcelsResponse = z.infer<typeof filterParcelsResponseSchema>;
