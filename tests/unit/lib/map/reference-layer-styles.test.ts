import { describe, expect, it } from 'vitest';

import { DISTRICTS_FILL, REFERENCE_LAYERS } from '@/lib/map/reference-layer-styles';

describe('REFERENCE_LAYERS', () => {
  it('paints drought, flood, then soy', () => {
    expect(REFERENCE_LAYERS.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it.each([
    ['drought', 0, 'Drought_ha'],
    ['flood', 1, 'Flood_ha'],
  ])(
    'ramps %s on its hectares over ascending stops, which interpolate requires',
    (_, index, property) => {
      const color = REFERENCE_LAYERS[index].fill.color;

      expect(Array.isArray(color) && color[0]).toBe('interpolate');
      expect(JSON.stringify(color)).toContain(`["get","${property}"]`);
      const stops = (color as unknown[]).slice(3).filter((_, i) => i % 2 === 0);
      expect(stops).toEqual([...stops].sort((a, b) => Number(a) - Number(b)));
      expect(new Set(stops).size).toBe(stops.length);
    },
  );

  it('leaves flood whole on a district pick, and clips drought and soy to it', () => {
    expect(REFERENCE_LAYERS.map(({ label, clipsToDistrict }) => [label, clipsToDistrict])).toEqual([
      ['Expuesto a sequía', true],
      ['Expuesto a inundación', false],
      ['Soja', true],
    ]);
  });

  it('fills soy with one colour', () => {
    expect(typeof REFERENCE_LAYERS[2].fill.color).toBe('string');
  });

  it('keeps every opacity between 0 and 1', () => {
    const opacities = [DISTRICTS_FILL, ...REFERENCE_LAYERS.map(({ fill }) => fill)].map(
      ({ opacity }) => opacity,
    );

    expect(opacities.every((opacity) => opacity >= 0 && opacity <= 1)).toBe(true);
  });
});
