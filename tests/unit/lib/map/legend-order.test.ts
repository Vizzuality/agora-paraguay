import { describe, expect, it } from 'vitest';

import { moveItem, ordered, scaledOpacity, stackBeforeIds, toggled } from '@/lib/map/legend-order';

describe('moveItem', () => {
  it('moves a row down and up', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the rows as they are for a move nowhere or off the list', () => {
    const ids = ['a', 'b'];

    expect(moveItem(ids, 1, 1)).toEqual(ids);
    expect(moveItem(ids, 0, 2)).toEqual(ids);
    expect(moveItem(ids, -1, 0)).toEqual(ids);
    expect(moveItem(ids, 0, 1)).not.toBe(ids);
  });
});

describe('stackBeforeIds', () => {
  it('slots the top row under the given layer and every other under the row above it', () => {
    expect(stackBeforeIds(['soja', 'flood', 'drought'], 'exposure')).toEqual({
      soja: 'exposure',
      flood: 'soja',
      drought: 'flood',
    });
  });
});

describe('ordered', () => {
  const key = (item: { id: string }) => item.id;

  it('follows the saved order, unknown rows after in their own order', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

    expect(ordered(items, ['c', 'a'], key).map(key)).toEqual(['c', 'a', 'b', 'd']);
    expect(ordered(items, [], key).map(key)).toEqual(['a', 'b', 'c', 'd']);
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

describe('scaledOpacity', () => {
  it("fades a layer's opacity by the legend's share, and leaves it be without one", () => {
    expect(scaledOpacity(0.8, 0.5)).toBe(0.4);
    expect(scaledOpacity(0.8, undefined)).toBe(0.8);
    expect(scaledOpacity(['get', 'o'], 0.5)).toEqual(['*', ['get', 'o'], 0.5]);
  });
});
