import { z } from 'zod';

/*
 * Metadata contract: `GET /api/parcels/filters/?riesgo={sanitario|productivo}` and
 * `GET /api/parcels/indicators?riesgo={sanitario|productivo}`. The indicator attributes
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

/** The two analysis tabs; each is one side of `/api/parcels/analysis/{diseases|production}/`. */
export type Riesgo = 'sanitario' | 'productivo';

/**
 * Which riesgo the filters are asked for: sanitario is the public side, productivo the
 * private one. Left out, the client asks for sanitario.
 */
export type FiltersParams = {
  riesgo?: Riesgo;
  /** The crop the other filters are asked for (`crop_type`'s option value); the API's default when absent. */
  crop_type?: string;
};

/** What the indicator list is asked for: the riesgo, as a query parameter. */
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
 * `analysis/schemas.ts`. An unknown type fails this parse; the list then skips that
 * indicator (`indicatorsSchema`) until the kind has a card.
 */
export const indicatorTypeSchema = z.discriminatedUnion('type', [
  rangeIndicatorTypeSchema,
  categoryIndicatorTypeSchema,
  plainIndicatorTypeSchema,
]);

export type IndicatorType = z.infer<typeof indicatorTypeSchema>;

/**
 * The live list as the spec writes it, with one thing it does differently: the hero filter
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

/** The only failure is an `indicator_type.type` no card exists for. */
function isUnknownIndicatorType(error: z.ZodError): boolean {
  return error.issues.every(
    (issue) =>
      issue.code === 'invalid_union' &&
      issue.path.length === 2 &&
      issue.path[0] === 'indicator_type' &&
      issue.path[1] === 'type',
  );
}

/**
 * The list, minus indicators of a type the app has no card for: the backend adding a
 * kind must not take every other indicator down with it. Any other malformed entry
 * still fails the whole list.
 */
export const indicatorsSchema = z.array(z.unknown()).transform((entries, ctx) => {
  const indicators: Indicator[] = [];

  for (const [index, entry] of entries.entries()) {
    const result = indicatorSchema.safeParse(entry);

    if (result.success) {
      indicators.push(result.data);
    } else if (isUnknownIndicatorType(result.error)) {
      const { id, indicator_type: type } = (entry ?? {}) as Record<string, unknown>;
      console.warn(
        `Skipping indicator ${JSON.stringify(id)}: unknown type ${JSON.stringify(type)}`,
      );
    } else {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: 'custom', message: issue.message, path: [index, ...issue.path] });
      }

      return z.NEVER;
    }
  }

  return indicators;
});

export type Indicators = Indicator[];

/**
 * What the list request answers: the array itself, or the analysis envelope with the
 * list under `indicators`. Both are accepted until the backend fixes one.
 */
export const indicatorsListResponseSchema = z.union([
  indicatorsSchema,
  z.looseObject({ indicators: indicatorsSchema }).transform((envelope) => envelope.indicators),
]);
