import { z } from 'zod';

/*
 * Analysis contract: `POST` runs the enumerated indicators over the selected parcels.
 * Django routes (Sept 2026): `api/parcels/analysis/diseases/` (public, riesgo sanitario)
 * and `api/parcels/analysis/production/` (private, riesgo productivo). POST only — GET
 * answers 405; the indicator list is still fixture-served (`metadata/client.ts`).
 */

/** Which side of the analysis the request goes to: riesgo sanitario is public, productivo private. */
export type AnalysisVisibility = 'public' | 'private';

/** Trailing slash as Django routes it — without one the API answers 301. */
export function analysisPath(visibility: AnalysisVisibility): string {
  return visibility === 'public'
    ? '/api/parcels/analysis/diseases/'
    : '/api/parcels/analysis/production/';
}

/**
 * The POST body, flat (checked against the backend 2026-09-18): `parcels`, the ids
 * `filter-parcels` returned; `indicators`, the ids to compute; and the hero selection
 * keyed by the ids `GET /api/parcels/filters/` lists (`crop_type`, `sowing_date`, `date`,
 * … — whatever the backend defines). Which filter keys exist is the API's call, so the
 * type is an intersection and the schema a record with three checks rather than an
 * object (a `z.object(...).catchall(z.string())` would infer an index signature the two
 * lists cannot satisfy).
 */
export type AnalysisRequest = { parcels: string[]; indicators: string[] } & Record<
  string,
  string | string[]
>;

const idListSchema = z.array(z.string().min(1)).min(1);

export const analysisRequestSchema = z
  .record(z.string(), z.union([z.string().min(1), idListSchema]))
  .refine((body) => idListSchema.safeParse(body.parcels).success, {
    message: 'parcels must be a non-empty list of cadastral codes',
    path: ['parcels'],
  })
  .refine((body) => idListSchema.safeParse(body.indicators).success, {
    message: 'indicators must be a non-empty list of indicator ids',
    path: ['indicators'],
  })
  .refine(
    (body) =>
      Object.entries(body).every(
        ([key, value]) => key === 'parcels' || key === 'indicators' || typeof value === 'string',
      ),
    { message: 'every filter is a single string value' },
  );

/**
 * One indicator reading of an analysed parcel. Numbers may arrive as strings (an earlier
 * sample exported `"asian_rust": "2"`), so both are accepted; the reading side coerces.
 */
const parcelValueSchema = z.union([z.string(), z.number(), z.null()]);

/**
 * One analysed parcel: the id `filter-parcels` gave it and the indicators it was scored
 * on, as property columns. The backend writes the column names in its own casing
 * (`Asian_rust` for the id `asian_rust` that was requested), so readers match ids to
 * columns case-insensitively (`indicator-cards.ts`).
 */
const analysisParcelSchema = z.looseObject({
  /** Echo of a requested parcel: the cadastral code, or a number in older samples. */
  parcel_id: z.union([z.string().min(1), z.number().int()]),
  properties: z.record(z.string(), parcelValueSchema),
});

export type AnalysisParcel = z.infer<typeof analysisParcelSchema>;

/**
 * The envelope `POST /api/parcels/analysis/{diseases|production}/` answers (2026-09-18):
 * `status`/`message`, the echoed `input`, and one entry per parcel under `indicators`.
 * Nothing arrives pre-aggregated; the cards read one parcel at a time.
 */
export const analysisResponseSchema = z.looseObject({
  status: z.string(),
  message: z.string(),
  input: z.unknown().optional(),
  indicators: z.array(analysisParcelSchema),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
