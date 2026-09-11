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
 * An indicator value takes several shapes in the spec: a number (`iep: 70`), a label
 * (`resiliencia: "Baja"`), or a set of named numbers (`rendimiento: {p10, p50, p90}`).
 */
const indicatorValueSchema = z.union([z.number(), z.string(), z.record(z.string(), z.number())]);

/**
 * One indicator's result. Attributes are marked "to be defined" in the spec, so only
 * the fields the examples show are declared, all optional but `id`, and extras pass.
 */
const analysisIndicatorSchema = z.looseObject({
  id: z.string().min(1),
  category: z.enum(['sanitario', 'productivo']).optional(),
  date: z.iso.date().optional(),
  value: indicatorValueSchema.optional(),
  values: z
    .array(
      z.looseObject({
        label: z.string(),
        value: indicatorValueSchema,
        date: z.iso.date().optional(),
      }),
    )
    .optional(),
  display_value: z.string().optional(),
  confidence: z.string().optional(),
});

export type AnalysisIndicator = z.infer<typeof analysisIndicatorSchema>;

export const analysisResponseSchema = z.object({
  indicators: z.array(analysisIndicatorSchema),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
