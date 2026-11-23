import { z } from 'zod';

import { riskColorSchema } from '@/lib/platform-metadata';

/*
 * Global layers contract: `GET /api/parcels/global_layers/`, a bare list. `type` is a
 * numeric code whose meaning the API has not documented yet; `source` comes back empty
 * for now.
 */

export const globalLayerSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  type: z.number(),
  description: z.string().nullish(),
  source: z.string().nullish(),
});

export type GlobalLayer = z.infer<typeof globalLayerSchema>;

export const globalLayersResponseSchema = z.array(globalLayerSchema);

/**
 * What the front end adds to each layer until the API serves it, kept in
 * `src/content/global-layers.json` in the wire's own shape: Spanish `name` and
 * `description`, the legend's controls and footnote, and whether a district pick clips
 * the layer.
 */
export const globalLayerExtrasSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable(),
  legend_config: z.object({ opacity: z.boolean(), visibility: z.boolean(), order: z.boolean() }),
  legend_note: z.string().nullable(),
  /** The legend's rows for a classed layer: each class `value` as the tiles spell it. */
  legend_items: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        tooltip: z.string().min(1),
        color: riskColorSchema,
      }),
    )
    .nullable(),
  clips_to_district: z.boolean(),
});

export type GlobalLayerExtras = z.infer<typeof globalLayerExtrasSchema>;
