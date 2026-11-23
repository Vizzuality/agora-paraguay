import { z } from 'zod';

import layers from '@/content/global-layers.json';
import { globalLayerExtrasSchema } from '@/lib/api/layers/schemas';
import type { LegendConfig } from '@/lib/map/legend-config';

/**
 * A global layer as the map shows it: the front end's metadata for it
 * (`src/content/global-layers.json`), in app vocabulary. When the API serves these
 * attributes, read them from `GET /api/parcels/global_layers/` instead and delete the file.
 */
export type LayerMetadata = {
  id: number;
  label: string;
  description: string | null;
  legendConfig: LegendConfig;
  /** A footnote under the layer's legend. */
  legendNote: string | null;
  /** Whether a district pick keeps only that district's features, or leaves the layer whole. */
  clipsToDistrict: boolean;
};

const LAYERS: ReadonlyMap<number, LayerMetadata> = new Map(
  z
    .array(globalLayerExtrasSchema)
    .parse(layers)
    .map((layer) => [
      layer.id,
      {
        id: layer.id,
        label: layer.name,
        description: layer.description,
        legendConfig: layer.legend_config,
        legendNote: layer.legend_note,
        clipsToDistrict: layer.clips_to_district,
      },
    ]),
);

/** A layer's metadata; throws for an id the file does not list, so a typo fails loudly. */
export function layerMetadata(id: number): LayerMetadata {
  const layer = LAYERS.get(id);

  if (!layer) throw new Error(`No metadata for global layer ${id}`);

  return layer;
}
