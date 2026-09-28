import { describe, expect, it } from 'vitest';

import { rulerBands } from '@/lib/analysis/risk-ruler';
import { RANGE_CLASSES } from '@/lib/analysis/widget-config';

describe('rulerBands', () => {
  it('gives one band per class and puts the marker in the class the position falls in', () => {
    const bands = rulerBands(50, RANGE_CLASSES);

    expect(bands.map((band) => band.label)).toEqual(['Sin riesgo', 'Moderado', 'Severo']);
    expect(bands.map((band) => band.marker !== undefined)).toEqual([false, true, false]);
  });

  it('lands the marker where the position falls within its band', () => {
    // 50 is halfway into the middle third (33.3–66.7).
    const [, middle] = rulerBands(50, RANGE_CLASSES);

    expect(middle.marker?.before).toBeCloseTo(50);
    expect(middle.marker?.after).toBeCloseTo(50);

    // 12 is 36% into the first third.
    const [first] = rulerBands(12, RANGE_CLASSES);

    expect(first.marker?.before).toBeCloseTo(36);
  });

  it('marks the classes up to the reading as reached, for the strong labels', () => {
    expect(rulerBands(0, RANGE_CLASSES).map((band) => band.reached)).toEqual([true, false, false]);
    expect(rulerBands(50, RANGE_CLASSES).map((band) => band.reached)).toEqual([true, true, false]);
    expect(rulerBands(100, RANGE_CLASSES).map((band) => band.reached)).toEqual([true, true, true]);
  });

  it('keeps the two weights of the marked band summing to 100 so the offset stays proportional', () => {
    for (const position of [0, 25, 50, 75, 100]) {
      const band = rulerBands(position, RANGE_CLASSES).find((entry) => entry.marker);

      expect(band?.marker && band.marker.before + band.marker.after).toBeCloseTo(100);
    }
  });

  it('clamps out-of-range positions to the track edges', () => {
    expect(rulerBands(-5, RANGE_CLASSES)[0].marker).toEqual({ before: 0, after: 100 });
    expect(rulerBands(130, RANGE_CLASSES)[2].marker).toEqual({ before: 100, after: 0 });
  });

  it('treats NaN as the left edge rather than leaking it into flex-grow', () => {
    expect(rulerBands(Number.NaN, RANGE_CLASSES)[0].marker).toEqual({ before: 0, after: 100 });
  });
});
