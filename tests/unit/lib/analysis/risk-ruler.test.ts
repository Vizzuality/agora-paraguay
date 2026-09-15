import { describe, expect, it } from 'vitest';

import { rulerSegments } from '@/lib/analysis/risk-ruler';

describe('rulerSegments', () => {
  it('splits the track so the marker lands at the given percent', () => {
    expect(rulerSegments(12)).toEqual({ before: 12, after: 88 });
  });

  it('keeps the two weights summing to 100 so the offset stays proportional', () => {
    for (const position of [0, 25, 50, 75, 100]) {
      const { before, after } = rulerSegments(position);

      expect(before + after).toBe(100);
    }
  });

  it('clamps out-of-range positions to the track edges', () => {
    expect(rulerSegments(-5)).toEqual({ before: 0, after: 100 });
    expect(rulerSegments(130)).toEqual({ before: 100, after: 0 });
  });

  it('treats NaN as the left edge rather than leaking it into flex-grow', () => {
    expect(rulerSegments(Number.NaN)).toEqual({ before: 0, after: 100 });
  });
});
