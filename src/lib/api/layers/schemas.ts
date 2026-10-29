import { z } from 'zod';

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
