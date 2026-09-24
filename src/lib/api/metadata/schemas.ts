import { z } from 'zod';

/*
 * Metadata contract: `GET /api/parcels/filters/?visibility={public|private}` and
 * `GET /api/parcels/indicators/` with `{ riesgo }`, reached through `/relay/indicators` (see
 * `client.ts`). The indicator attributes
 * are still "to be defined" in the spec, so that schema lets extra fields through
 * (`looseObject`); the filters follow the live response.
 */

/** Every list has the same shape — `{ value, label }` — so dropdowns render them all the same way. */
const optionSchema = z.object({ value: z.string().min(1), label: z.string().min(1) });

export type AnalysisOption = z.infer<typeof optionSchema>;

/** A filter the user picks from a list (`crop_type`). */
const categoryFieldSchema = z.looseObject({
  type: z.literal('category'),
  options: z.array(optionSchema),
});

/** A date the user types (`sowing_date`, `date`); `default` is what the hero starts with. */
const dateFieldSchema = z.looseObject({
  type: z.literal('date'),
  format: z.string().optional(),
  default: z.iso.date().nullable().optional(),
});

/**
 * A filter of the analysis hero. Unknown `field_type.type`s fail the parse on purpose: a
 * new kind needs a control before it can be shown.
 */
export const filterSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  field_type: z.discriminatedUnion('type', [categoryFieldSchema, dateFieldSchema]),
});

export type Filter = z.infer<typeof filterSchema>;
export type FilterField = Filter['field_type'];

export const filtersSchema = z.array(filterSchema);

export type Filters = z.infer<typeof filtersSchema>;

/** Which side of the analysis a request is for: riesgo sanitario is public, productivo private. */
export type FiltersParams = { visibility: 'public' | 'private' };

/** The two analysis tabs; each is one side of `/api/parcels/analysis/{diseases|production}/`. */
export type Riesgo = 'sanitario' | 'productivo';

/** What the indicator list is asked for: the riesgo. A query parameter to the relay, a JSON body to the API. */
export type IndicatorsParams = { riesgo: Riesgo };

const rangeIndicatorTypeSchema = z.looseObject({
  type: z.literal('range'),
  min: z.number(),
  max: z.number(),
  // The spec example carries the step as a string ("1"); both are accepted.
  step: z.union([z.number(), z.string()]).optional(),
});

const categoryIndicatorTypeSchema = z.looseObject({
  type: z.literal('category'),
  value: z.string().nullable().optional(),
  categories: z.array(z.string()),
});

/** Free text (`weather_station`, `phenology_stage`) and open numbers (`Pro_soja` t/ha). */
const plainIndicatorTypeSchema = z.looseObject({ type: z.enum(['text', 'numeric']) });

/**
 * How a parcel's reading of the indicator is typed — see `indicatorReadingSchema` in
 * `analysis/schemas.ts`. Unknown types fail the parse: a new kind needs a card first.
 */
export const indicatorTypeSchema = z.discriminatedUnion('type', [
  rangeIndicatorTypeSchema,
  categoryIndicatorTypeSchema,
  plainIndicatorTypeSchema,
]);

export type IndicatorType = z.infer<typeof indicatorTypeSchema>;

/**
 * The live list as the spec writes it. Two things it does differently: the open-number
 * type is `number` where the spec (and the cards) say `numeric`; and the hero filter
 * `crop_type` is echoed into the list as a filter (`field_type` with options) rather than
 * an indicator. The analysis answers it as text ("Soja"), so it reads as a text indicator —
 * general info, never in the picker.
 */
function asSpecIndicator(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;

  const entry = raw as Record<string, unknown>;

  if (!('indicator_type' in entry) && 'field_type' in entry) {
    return { ...entry, indicator_type: { type: 'text' } };
  }

  const type = entry.indicator_type;

  if (typeof type === 'object' && type !== null && 'type' in type && type.type === 'number') {
    return { ...entry, indicator_type: { ...type, type: 'numeric' } };
  }

  return entry;
}

export const indicatorSchema = z.preprocess(
  asSpecIndicator,
  z.looseObject({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    // `null` when the indicator has none (`weather_station`).
    unit: z.string().nullable().optional(),
    /** Whether the indicator is selected before the user touches anything. */
    default: z.boolean().optional(),
    indicator_type: indicatorTypeSchema,
  }),
);

export type Indicator = z.infer<typeof indicatorSchema>;

export const indicatorsSchema = z.array(indicatorSchema);

export type Indicators = z.infer<typeof indicatorsSchema>;

/**
 * What the list request answers: the array itself, or the analysis envelope with the
 * list under `indicators`. Both are accepted until the backend fixes one.
 */
export const indicatorsListResponseSchema = z.union([
  indicatorsSchema,
  z.looseObject({ indicators: indicatorsSchema }).transform((envelope) => envelope.indicators),
]);
