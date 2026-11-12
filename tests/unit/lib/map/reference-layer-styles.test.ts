import { describe, expect, it } from 'vitest';

import { DISTRICTS_FILL, REFERENCE_LAYERS } from '@/lib/map/reference-layer-styles';

describe('REFERENCE_LAYERS', () => {
  it('paints drought, flood, then soy', () => {
    expect(REFERENCE_LAYERS.map(({ id }) => id)).toEqual([6, 7, 8]);
  });

  it('ramps drought over ascending stops, which interpolate requires', () => {
    const [drought] = REFERENCE_LAYERS;
    const color = drought.fill.color;

    expect(Array.isArray(color) && color[0]).toBe('interpolate');
    const stops = (color as unknown[]).slice(3).filter((_, index) => index % 2 === 0);
    expect(stops).toEqual([...stops].sort((a, b) => Number(a) - Number(b)));
    expect(new Set(stops).size).toBe(stops.length);
  });

  it('fills flood and soy with one colour', () => {
    const [, flood, soja] = REFERENCE_LAYERS;

    expect(typeof flood.fill.color).toBe('string');
    expect(typeof soja.fill.color).toBe('string');
  });

  it('keeps every opacity between 0 and 1', () => {
    const opacities = [DISTRICTS_FILL, ...REFERENCE_LAYERS.map(({ fill }) => fill)].map(
      ({ opacity }) => opacity,
    );

    expect(opacities.every((opacity) => opacity >= 0 && opacity <= 1)).toBe(true);
  });
});
