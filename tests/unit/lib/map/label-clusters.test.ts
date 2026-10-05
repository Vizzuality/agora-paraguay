import { describe, expect, it } from 'vitest';

import { clusterLabels, formatNumbers } from '@/lib/map/label-clusters';

describe('clusterLabels', () => {
  it('keeps chips apart when they do not overlap', () => {
    const clusters = clusterLabels(
      [
        { number: 1, x: 0, y: 0 },
        { number: 2, x: 100, y: 0 },
      ],
      24,
    );

    expect(clusters).toEqual([
      { numbers: [1], x: 0, y: 0 },
      { numbers: [2], x: 100, y: 0 },
    ]);
  });

  it('merges chips within the radius and centres the group on its members', () => {
    const clusters = clusterLabels(
      [
        { number: 3, x: 10, y: 0 },
        { number: 1, x: 0, y: 0 },
        { number: 2, x: 20, y: 0 },
      ],
      24,
    );

    expect(clusters).toEqual([{ numbers: [1, 2, 3], x: 10, y: 0 }]);
  });

  it('measures against the moving cluster centre, not the first member', () => {
    // 1 and 2 merge at x=12; 3 at x=30 is 18 from that centre, so it joins too.
    const clusters = clusterLabels(
      [
        { number: 1, x: 0, y: 0 },
        { number: 2, x: 24, y: 0 },
        { number: 3, x: 30, y: 0 },
      ],
      24,
    );

    expect(clusters.map((cluster) => cluster.numbers)).toEqual([[1, 2, 3]]);
  });

  it('has no clusters without points', () => {
    expect(clusterLabels([], 24)).toEqual([]);
  });
});

describe('formatNumbers', () => {
  it('reads one number as is', () => {
    expect(formatNumbers([4])).toBe('4');
  });

  it('lists two numbers, consecutive or not', () => {
    expect(formatNumbers([1, 2])).toBe('1, 2');
    expect(formatNumbers([1, 5])).toBe('1, 5');
  });

  it('collapses runs of three or more', () => {
    expect(formatNumbers([1, 2, 3])).toBe('1–3');
    expect(formatNumbers([1, 2, 3, 5, 7, 8, 9])).toBe('1–3, 5, 7–9');
  });
});
