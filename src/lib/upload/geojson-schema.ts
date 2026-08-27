import { z } from 'zod';

/**
 * Just enough GeoJSON to validate an upload before `normalize.ts` touches it. All three
 * parsers funnel their output through this schema — the GeoJSON one directly, KML and
 * shapefile via the GeoJSON their libraries emit — so downstream code never sees an
 * unvalidated shape.
 *
 * Upload-domain validation on purpose: it does not live in `src/lib/api/schemas.ts`
 * because it describes files users bring, not the API contract.
 *
 * Positions accept extra dimensions (z/m — KML and PolygonZ shapefiles produce them)
 * and rings accept being unclosed; `normalize.ts` is what repairs both.
 */
const positionSchema = z.array(z.number()).min(2);

const ringSchema = z.array(positionSchema).min(3);

const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(ringSchema).min(1),
});

const multiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(ringSchema).min(1)).min(1),
});

/** Recognised but not importable; carried through so `normalize.ts` can count them. */
const otherGeometrySchema = z.object({
  type: z.enum(['Point', 'MultiPoint', 'LineString', 'MultiLineString']),
});

export type UploadGeometry =
  | z.infer<typeof polygonSchema>
  | z.infer<typeof multiPolygonSchema>
  | z.infer<typeof otherGeometrySchema>
  | { type: 'GeometryCollection'; geometries: UploadGeometry[] };

const geometrySchema: z.ZodType<UploadGeometry> = z.lazy(() =>
  z.union([
    polygonSchema,
    multiPolygonSchema,
    otherGeometrySchema,
    z.object({
      type: z.literal('GeometryCollection'),
      geometries: z.array(geometrySchema),
    }),
  ]),
);

export const featureSchema = z.object({
  type: z.literal('Feature'),
  // togeojson emits null geometry for placemarks without one.
  geometry: geometrySchema.nullable(),
  properties: z.record(z.string(), z.unknown()).nullish(),
});

/**
 * Just the collection envelope, features left unvalidated — `normalize.ts` checks them
 * one by one so a single malformed entity cannot take down an otherwise readable file.
 */
export const featureCollectionEnvelopeSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.unknown()),
});

const featureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(featureSchema),
});

/** A GeoJSON file may legally be a FeatureCollection, a single Feature, or a geometry. */
export const uploadGeoJsonSchema = z.union([
  featureCollectionSchema,
  featureSchema,
  geometrySchema,
]);

export type UploadFeatureInput = z.infer<typeof featureSchema>;
export type UploadGeoJson = z.infer<typeof uploadGeoJsonSchema>;
