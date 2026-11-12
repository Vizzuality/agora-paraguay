import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { basemapVisibility, firstLayerAbove, prefixedOverlay } from '@/lib/map/basemap-overlay';

const summer: StyleSpecification = {
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

describe('prefixedOverlay', () => {
  const overlay = prefixedOverlay(summer, 'capas');

  it('prefixes the sources and points the layers at them', () => {
    expect(overlay.sources.map(([id]) => id)).toEqual(['capas-osm']);
    expect(overlay.layers.map((layer) => layer.id)).toEqual(['capas-background', 'capas-roads']);
    expect(overlay.layers[1]).toMatchObject({ source: 'capas-osm', 'source-layer': 'roads' });
  });

  it('hides every layer, keeping the rest of its layout', () => {
    expect(overlay.layers[0].layout).toEqual({ visibility: 'none' });
    expect(overlay.layers[1].layout).toEqual({ 'line-cap': 'round', visibility: 'none' });
  });

  it('carries the glyphs and sprite its labels and icons need', () => {
    expect(overlay.glyphs).toBe(summer.glyphs);
    expect(overlay.sprite).toBe(summer.sprite);
  });
});

describe('firstLayerAbove', () => {
  const basemap = new Set(['satellite', 'boundaries']);

  it('finds the first layer that is not the basemap', () => {
    expect(firstLayerAbove(['satellite', 'boundaries', 'districts-fill', 'x'], basemap)).toBe(
      'districts-fill',
    );
  });

  it('finds none when only the basemap is there yet', () => {
    expect(firstLayerAbove(['satellite', 'boundaries'], basemap)).toBeUndefined();
  });
});

describe('basemapVisibility', () => {
  it('shows the overlay and hides the base, or the other way round', () => {
    expect(basemapVisibility(['satellite'], ['capas-roads'], true)).toEqual([
      ['satellite', 'none'],
      ['capas-roads', 'visible'],
    ]);
    expect(basemapVisibility(['satellite'], ['capas-roads'], false)).toEqual([
      ['satellite', 'visible'],
      ['capas-roads', 'none'],
    ]);
  });
});
