import { z } from 'zod';

import { analysisResponseSchema } from '@/lib/api/analysis/schemas';
import { polygonName, type DrawnPolygon } from '@/lib/map/draw-features';

/*
 * Parcels contract: `POST /api/parcels/filter_parcels` and
 * `POST /api/parcels/get-parcel-diseases/`. GeoJSON geometries are declared here rather
 * than via `@types/geojson`, matching the stance in `draw-features.ts`: `geojson` is only
 * a transitive dependency.
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
  console.log(polygons, options);
  console.log(
    filterParcelsRequestSchema.parse({
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
    }),
  );
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

/**
 * `POST /api/parcels/get-parcel-diseases/` body: which parcels to score and for which
 * crop and dates. Wire shape, snake_case. Not in the written spec yet, so unknown fields
 * pass through (`looseObject`); tighten as the backend settles.
 */
export const parcelDiseasesRequestSchema = z.looseObject({
  parcel_ids: z.array(z.number().int()).min(1),
  /** Cultivo; the backend defaults it when absent. */
  crop: z.string().min(1).optional(),
  start_date: z.iso.date().optional(),
  end_date: z.iso.date().optional(),
});

export type ParcelDiseasesRequest = z.infer<typeof parcelDiseasesRequestSchema>;

/**
 * The response is the public disease scoring: one Feature per parcel with the disease
 * indices as property columns — the same GeoJSON the analysis page renders.
 */
export const parcelDiseasesResponseSchema = analysisResponseSchema;

export type ParcelDiseasesResponse = z.infer<typeof parcelDiseasesResponseSchema>;
