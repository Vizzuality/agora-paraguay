import { describe, expect, it } from 'vitest';

import { formatNumber, linearTicks, numberScale, tickStep } from '@/lib/analysis/number-scale';

describe('tickStep', () => {
  it('picks a power of ten times 1, 2 or 5, as d3 does', () => {
    expect(tickStep(10)).toBe(1);
    expect(tickStep(3.81)).toBe(0.5);
    expect(tickStep(100)).toBe(10);
    expect(tickStep(27)).toBe(2);
    expect(tickStep(0.9)).toBe(0.1);
  });

  it('falls back to one on an empty span', () => {
    expect(tickStep(0)).toBe(1);
  });
});

describe('linearTicks', () => {
  it('lists the multiples of the step over the span, ends included', () => {
    expect(linearTicks(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(linearTicks(0, 100)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(linearTicks(1, 3)).toEqual([1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3]);
  });
});

describe('numberScale', () => {
  it('runs from zero to the first tick at or above the largest value', () => {
    expect(numberScale([3.55, 3.81])).toEqual({
      min: 0,
      max: 4,
      ticks: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4],
    });
    expect(numberScale([5.15, 9.6])).toMatchObject({ max: 10 });
    expect(numberScale([10])).toMatchObject({ max: 10 });
  });

  it('reads 0–1 when nothing is above zero', () => {
    expect(numberScale([])).toMatchObject({ min: 0, max: 1 });
    expect(numberScale([0, -2])).toMatchObject({ min: 0, max: 1 });
  });
});

describe('formatNumber', () => {
  it('prints in the platform locale, two decimals at most', () => {
    expect(formatNumber(3.81)).toBe('3,81');
    expect(formatNumber(2.345)).toBe('2,35');
    expect(formatNumber(1234)).toBe('1.234');
  });
});
