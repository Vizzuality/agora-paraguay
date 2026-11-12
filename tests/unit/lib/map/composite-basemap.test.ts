import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { basemapVisibility, composeBasemaps } from '@/lib/map/composite-basemap';

const base: StyleSpecification = {
  version: 8,
  sources: { satellite: { type: 'raster', tiles: ['https://tiles/{z}/{x}/{y}'] } },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
};

const overlay: StyleSpecification = {
  version: 8,
  glyphs: 'https://glyphs/{fontstack}/{range}.pbf',
  sprite: 'https://sprite/summer',
  sources: { osm: { type: 'vector', url: 'https://tiles/osm.json' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
    {
      id: 'roads',
      type: 'line',
      source: 'osm',
      'source-layer': 'roads',
      layout: { 'line-cap': 'round' },
    },
  ],
};

describe('composeBasemaps', () => {
  const { style, baseLayerIds, overlayLayerIds } = composeBasemaps(base, overlay, 'capas');
  const composed = style as StyleSpecification;

  it("keeps the base's layers first and adds the overlay's after, prefixed", () => {
    expect(composed.layers.map((layer) => layer.id)).toEqual([
      'satellite',
      'capas-background',
      'capas-roads',
    ]);
    expect(baseLayerIds).toEqual(['satellite']);
    expect(overlayLayerIds).toEqual(['capas-background', 'capas-roads']);
  });

  it("prefixes the overlay's sources and points its layers at them", () => {
    expect(Object.keys(composed.sources)).toEqual(['satellite', 'capas-osm']);
    expect(composed.layers[2]).toMatchObject({ source: 'capas-osm', 'source-layer': 'roads' });
  });

  it("hides the overlay's layers, keeping the rest of their layout", () => {
    expect(composed.layers[1].layout).toEqual({ visibility: 'none' });
    expect(composed.layers[2].layout).toEqual({ 'line-cap': 'round', visibility: 'none' });
  });

  it("takes the overlay's glyphs and sprite when the base has none", () => {
    expect(composed.glyphs).toBe(overlay.glyphs);
    expect(composed.sprite).toBe(overlay.sprite);
  });
});

describe('basemapVisibility', () => {
  const composite = { style: base, baseLayerIds: ['satellite'], overlayLayerIds: ['capas-roads'] };

  it('shows the overlay and hides the base, or the other way round', () => {
    expect(basemapVisibility(composite, true)).toEqual([
      ['satellite', 'none'],
      ['capas-roads', 'visible'],
    ]);
    expect(basemapVisibility(composite, false)).toEqual([
      ['satellite', 'visible'],
      ['capas-roads', 'none'],
    ]);
  });
});
