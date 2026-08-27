import { z } from 'zod';

import { polygonName, type DrawnPolygon } from '@/lib/map/draw-features';

/**
 * Placeholder model. It corresponds to nothing in the external API and exists only to
 * prove the data path end to end:
 *
 *   fixtures -> client.ts -> queries.ts -> route component
 *
 * Replace it with schemas derived from the agreed API contract rather than extending
 * it — invented schemas get mistaken for decisions.
 */
export const placeholderSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  value: z.number(),
  description: z.string().min(1),
});

export type Placeholder = z.infer<typeof placeholderSchema>;

export const placeholderListSchema = z.array(placeholderSchema);

/**
 * Analysis contract. The endpoint is fake (see `client.ts`), but the request shape is
 * the platform contract: a GeoJSON FeatureCollection whose geometries may be Polygon or
 * MultiPolygon. The draw store only ever holds Polygons today — uploads explode
 * MultiPolygons (pinned in `terra-draw-api.test.ts`) — but the contract must not narrow.
 */
const positionSchema = z.tuple([z.number(), z.number()]);
const ringSchema = z.array(positionSchema).min(4);

const polygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(ringSchema).min(1),
});

const multiPolygonGeometrySchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(ringSchema).min(1)).min(1),
});

const analysisFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({ name: z.string().min(1) }),
  geometry: z.discriminatedUnion('type', [polygonGeometrySchema, multiPolygonGeometrySchema]),
});

export const analysisRequestSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(analysisFeatureSchema).min(1),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

/**
 * TODO(mock-parcels): invented contract, not agreed with the API. Replace with the
 * real parcel schema when the real layer is available (grep `mock-parcels`).
 *
 * The shape mirrors what a cadastral endpoint would plausibly return: a
 * FeatureCollection of named Polygons.
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

export const analysisResponseSchema = z.object({
  id: z.uuid(),
  status: z.literal('accepted'),
  receivedFeatures: z.number().int().positive(),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

/**
 * An area the analysis can be asked about: a drawn or uploaded Terra Draw polygon, or
 * a cadastral parcel selected by clicking it on the map.
 */
export type AnalysisArea = DrawnPolygon | ParcelFeature;

/**
 * Request payload: every polygon on the map becomes a named Feature. The parse both
 * validates and strips Terra Draw's internal properties (`mode`, `currentlyDrawing`,
 * `origin`) — the feature schema only declares `name`, and Zod rebuilds objects and
 * arrays, so the payload never aliases the draw store. Throws on an empty list: the
 * contract requires at least one feature, callers guard before mapping.
 */
export function toAnalysisRequest(polygons: AnalysisArea[]): AnalysisRequest {
  return analysisRequestSchema.parse({
    type: 'FeatureCollection',
    features: polygons.map((polygon, index) => ({
      type: 'Feature',
      properties: { name: polygonName(polygon, index) },
      geometry: polygon.geometry,
    })),
  });
}
