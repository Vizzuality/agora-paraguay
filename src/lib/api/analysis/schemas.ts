import { z } from 'zod';

/*
 * Analysis contract: `POST /api/analysis/{public|private}`. Runs the enumerated
 * indicators over the selected parcels.
 */

/** Which side of the analysis the request goes to: riesgo sanitario is public, productivo private. */
export type AnalysisVisibility = 'public' | 'private';

export const analysisRequestSchema = z.object({
  parcel_ids: z.array(z.number().int()).min(1),
  filters: z.object({
    /** Cultivo — sanitario only, per the indicators endpoint. */
    crop: z.string().min(1).optional(),
    /** Ciclo. */
    cycle: z.string().min(1).optional(),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    indicators: z.array(z.string().min(1)).min(1),
  }),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

/**
 * One property value of an analysed parcel. The backend's sample exports numbers as
 * strings (`"asian_rust": "2"`), so both are accepted; the reading side coerces.
 */
const parcelValueSchema = z.union([z.string(), z.number(), z.null()]);

/**
 * The columns every analysed parcel carries (backend sample, Sept 2026). Anything else is
 * an indicator column keyed by the indicator id from `GET /api/indicators/`, hence the
 * catchall. Wire shape kept as delivered: numbers may arrive as strings.
 */
const analysisParcelPropertiesSchema = z
  .object({
    fid: z.number().optional(),
    parcela_id: z.string().min(1),
    area: parcelValueSchema.optional(),
    weather_station: z.string().optional(),
    data_quality: parcelValueSchema.optional(),
    crop_type: z.string().optional(),
    phenology_stage: z.string().optional(),
  })
  .catchall(parcelValueSchema);

export type AnalysisParcelProperties = z.infer<typeof analysisParcelPropertiesSchema>;

/**
 * Geometry as the sample delivers it: MultiPolygon in EPSG:32721 (UTM 21S), declared by
 * the collection's `crs`. Not painted yet, so the rings are not validated — reproject
 * before putting it on the map.
 */
const analysisGeometrySchema = z.looseObject({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: z.array(z.unknown()),
});

/** One analysed parcel: the indicators as property columns over its geometry. */
const analysisParcelSchema = z.object({
  type: z.literal('Feature'),
  properties: analysisParcelPropertiesSchema,
  geometry: analysisGeometrySchema,
});

export type AnalysisParcel = z.infer<typeof analysisParcelSchema>;

/**
 * `POST /api/analysis/public` answers a FeatureCollection of the analysed parcels
 * (backend sample `AGORA_Public-part_Backend2Frontend-sample_20260909`). The indicator
 * cards aggregate over it; nothing arrives pre-aggregated.
 */
export const analysisResponseSchema = z.looseObject({
  type: z.literal('FeatureCollection'),
  name: z.string().optional(),
  crs: z.looseObject({ type: z.string() }).optional(),
  features: z.array(analysisParcelSchema),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
