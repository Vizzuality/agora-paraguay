import { describe, expect, it } from 'vitest';

import { stackBeforeIds, toggled } from '@/lib/map/legend-order';

describe('stackBeforeIds', () => {
  it('slots the top row under the given layer and every other under the row above it', () => {
    expect(stackBeforeIds(['soja', 'flood', 'drought'], 'exposure')).toEqual({
      soja: 'exposure',
      flood: 'soja',
      drought: 'flood',
    });
  });
});

describe('toggled', () => {
  it('adds an id that is out and takes out one that is in, leaving the given set alone', () => {
    const ids = new Set(['a']);

    expect([...toggled(ids, 'b')]).toEqual(['a', 'b']);
    expect([...toggled(ids, 'a')]).toEqual([]);
    expect([...ids]).toEqual(['a']);
  });
});
