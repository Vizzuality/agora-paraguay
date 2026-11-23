import { describe, expect, it } from 'vitest';

import layers from '@/content/global-layers.json';
import { layerMetadata } from '@/lib/map/layer-metadata';
import { colorTone, riskColorSchema } from '@/lib/platform-metadata';

describe('layerMetadata', () => {
  it("reads each layer's wire fields in app vocabulary", () => {
    for (const layer of layers) {
      expect(layerMetadata(layer.id)).toMatchObject({
        id: layer.id,
        label: layer.name,
        description: layer.description,
        legendConfig: layer.legend_config,
        legendNote: layer.legend_note,
        clipsToDistrict: layer.clips_to_district,
      });
    }
  });

  it("maps a classed layer's colours to tones and keeps its words", () => {
    const classed = layers.filter((layer) => layer.legend_items !== null);

    expect(classed.length).toBeGreaterThan(0);

    for (const layer of classed) {
      expect(layerMetadata(layer.id).legendItems).toEqual(
        (layer.legend_items ?? []).map(({ color, ...item }) => ({
          ...item,
          tone: colorTone(riskColorSchema.parse(color)),
        })),
      );
    }
  });

  it('gives an unclassed layer no legend items', () => {
    for (const layer of layers.filter((entry) => entry.legend_items === null)) {
      expect(layerMetadata(layer.id).legendItems).toEqual([]);
    }
  });

  it('throws for a layer the file does not list', () => {
    expect(() => layerMetadata(99)).toThrow('No metadata for global layer 99');
  });
});
