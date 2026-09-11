import { z } from 'zod';

/*
 * Metadata contract: `GET /api/filters/` and `GET /api/indicators/`. Both are marked
 * "attributes to be defined" in the spec, so the schemas declare what the examples
 * show and let extra fields through (`looseObject`) rather than rejecting them.
 */

/** Every list has the same shape — `{ value, label }` — so dropdowns render them all the same way. */
const optionSchema = z.object({ value: z.string().min(1), label: z.string().min(1) });

export type AnalysisOption = z.infer<typeof optionSchema>;

/** A filter the user picks from a list. */
const optionsFilterSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  options: z.array(optionSchema),
});

/** A filter with a single value (the spec's `start-date`). */
const valueFilterSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.string(),
});

export const filterSchema = z.union([optionsFilterSchema, valueFilterSchema]);

export type Filter = z.infer<typeof filterSchema>;

export const filtersSchema = z.array(filterSchema);

export type Filters = z.infer<typeof filtersSchema>;

/** Query parameters `GET /api/indicators/` accepts; `cultivo` only applies to sanitario. */
export type IndicatorsParams = {
  riesgo?: 'sanitario' | 'productivo';
  cultivo?: string;
};

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

export const indicatorSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().optional(),
  /** Whether the indicator is selected before the user touches anything. */
  default: z.boolean().optional(),
  indicator_type: z
    .discriminatedUnion('type', [rangeIndicatorTypeSchema, categoryIndicatorTypeSchema])
    .optional(),
});

export type Indicator = z.infer<typeof indicatorSchema>;

export const indicatorsSchema = z.array(indicatorSchema);

export type Indicators = z.infer<typeof indicatorsSchema>;

/**
 * TODO(mock-analysis-options): invented contract behind the analysis hero dropdowns
 * (AGP-29). `GET /api/filters/` is its replacement once the filter attributes are
 * defined; migrate `src/lib/analysis/filters.ts` to `Filters` then and delete this
 * with `fixtures/analysis-options.ts` (grep `mock-analysis-options`).
 *
 * Date lists keep ISO `YYYY-MM-DD` values so they sort lexically, with the display form
 * in `label`. `periodo` feeds both bounds of the productivo date range.
 */
const dateOptionSchema = optionSchema.extend({ value: z.iso.date() });

export const analysisOptionsSchema = z.object({
  fechasSiembra: z.array(dateOptionSchema).min(1),
  fechasAnalisis: z.array(dateOptionSchema).min(1),
  cultivos: z.array(optionSchema).min(1),
  ciclos: z.array(optionSchema).min(1),
  periodo: z.array(dateOptionSchema).min(2),
});

export type AnalysisOptions = z.infer<typeof analysisOptionsSchema>;
