import { z } from 'zod';

import type { IndicatorType } from '@/lib/api/metadata/schemas';

/*
 * Analysis contract: `POST` runs the enumerated indicators over the selected parcels.
 * Django routes: `api/parcels/analysis/diseases/` (public, riesgo sanitario)
 * and `api/parcels/analysis/production/` (private, riesgo productivo). POST only — GET
 * answers 405. The indicator list has its own endpoint (`metadata/client.ts`).
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
 * The POST body, flat: `parcels`, the ids
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
 * One indicator reading as the wire carries it: what type it must be is only known once
 * the indicator's metadata is at hand, so the envelope accepts any scalar and the reading
 * side checks each column with `indicatorReadingSchema`.
 */
const parcelValueSchema = z.union([z.string(), z.number(), z.null()]);

export type ParcelValue = z.infer<typeof parcelValueSchema>;

/** The backend writes this where a parcel has no reading for an indicator. */
export const NOT_AVAILABLE = 'NA';

/** A category reading: one of the ordered labels, or its index (the sample encodes classes as codes). */
const categoryReadingSchema = z.union([z.string().min(1), z.int().nonnegative()]);

/**
 * What a parcel's reading of an indicator must be, by its `indicator_type.type`: a number
 * for `numeric` and `range`, text for `text`, a label or class code for `category`. "NA"
 * and blanks are the absence of a reading and are filtered out before this runs.
 */
export function indicatorReadingSchema(type: IndicatorType): z.ZodType<string | number> {
  switch (type.type) {
    case 'numeric':
    case 'range':
      return z.number();
    case 'text':
      return z.string();
    case 'category':
      return categoryReadingSchema;
  }
}

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
 * The envelope `POST /api/parcels/analysis/{diseases|production}/` answers:
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
