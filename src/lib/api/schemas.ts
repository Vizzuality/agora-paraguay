import { z } from 'zod';

import { polygonName, type DrawnPolygon } from '@/lib/map/draw-features';

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

/**
 * TODO(mock-analysis-options): invented contract, not agreed with the API. Replace when
 * the analysis endpoint exposes its parameters (grep `mock-analysis-options`).
 *
 * Every list has the same shape — `{ value, label }` — so the hero renders them all the
 * same way. `value` is the stable id a selection is stored under; `label` is what the
 * user sees. Date lists keep ISO `YYYY-MM-DD` values so they sort lexically, with the
 * display form in `label`. `periodo` feeds both bounds of the productivo date range.
 */
const analysisOptionSchema = z.object({ value: z.string().min(1), label: z.string().min(1) });

const dateOptionSchema = analysisOptionSchema.extend({ value: z.iso.date() });

export type AnalysisOption = z.infer<typeof analysisOptionSchema>;

export const analysisOptionsSchema = z.object({
  fechasSiembra: z.array(dateOptionSchema).min(1),
  fechasAnalisis: z.array(dateOptionSchema).min(1),
  cultivos: z.array(analysisOptionSchema).min(1),
  ciclos: z.array(analysisOptionSchema).min(1),
  periodo: z.array(dateOptionSchema).min(2),
});

export type AnalysisOptions = z.infer<typeof analysisOptionsSchema>;

/**
 * Auth contract. The GMV auth backend does not exist yet (AGP-22), so this shape is a
 * placeholder pending the agreed contract — same status as the parcel schema above.
 * The session carries only what the UI needs to show an identified state.
 */
export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const sessionSchema = z.object({
  email: z.email(),
});

export type Session = z.infer<typeof sessionSchema>;

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
