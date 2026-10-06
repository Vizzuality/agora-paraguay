import { describe, expect, it } from 'vitest';

import { SELECTION_STEPS, selectionStep, selectionView } from '@/lib/selection-steps';

describe('selectionStep', () => {
  it('starts on step 1 with nothing on the map', () => {
    expect(selectionStep({ areaCount: 0, drawing: false })).toBe(1);
  });

  it('stays on step 1 while a polygon is being drawn', () => {
    expect(selectionStep({ areaCount: 0, drawing: true })).toBe(1);
    // A drawing session starts from scratch, so areas during a draw are theoretical —
    // but if they exist the tool still owns the map.
    expect(selectionStep({ areaCount: 2, drawing: true })).toBe(1);
  });

  it('moves to step 2 once an area exists and the tool is parked', () => {
    expect(selectionStep({ areaCount: 1, drawing: false })).toBe(2);
    expect(selectionStep({ areaCount: 3, drawing: false })).toBe(2);
  });
});

describe('selectionView', () => {
  it('shows the panel while nothing is on the map and no tool is armed', () => {
    expect(selectionView({ areaCount: 0, drawing: false })).toBe('selection');
  });

  it('hands the screen to the map as soon as a polygon is being traced', () => {
    expect(selectionView({ areaCount: 0, drawing: true })).toBe('map');
  });

  it('keeps the map once areas have landed, whatever the tool', () => {
    expect(selectionView({ areaCount: 1, drawing: false })).toBe('map');
    expect(selectionView({ areaCount: 2, drawing: true })).toBe('map');
  });
});

describe('SELECTION_STEPS', () => {
  it('numbers the three steps in order', () => {
    expect(SELECTION_STEPS.map((step) => step.number)).toEqual([1, 2, 3]);
  });
});
