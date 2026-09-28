import { describe, expect, it } from 'vitest';

import {
  categoryClasses,
  classIndexAt,
  RANGE_CLASSES,
  WIDGET_BY_TYPE,
} from '@/lib/analysis/widget-config';

describe('WIDGET_BY_TYPE', () => {
  it('sends classed values to the risk tile, text and open numbers to general info', () => {
    expect(WIDGET_BY_TYPE).toEqual({
      range: 'risk-class',
      category: 'risk-class',
      numeric: 'general-info',
      text: 'general-info',
    });
  });
});

describe('RANGE_CLASSES', () => {
  it('reads a range in three classes, low to high', () => {
    expect(RANGE_CLASSES.map((riskClass) => riskClass.label)).toEqual([
      'Sin riesgo',
      'Moderado',
      'Severo',
    ]);
    expect(RANGE_CLASSES.map((riskClass) => riskClass.tone)).toEqual(['low', 'medium', 'high']);
  });
});

describe('classIndexAt', () => {
  it('splits the scale in equal classes, a cut point belonging to the class above it', () => {
    expect([0, 33.3, 33.4, 66.6, 66.7, 100].map((position) => classIndexAt(position, 3))).toEqual([
      0, 0, 1, 1, 2, 2,
    ]);
  });

  it('reads a 1–3 disease index spread at 0, 50, 100 as the three classes', () => {
    expect([0, 50, 100].map((position) => classIndexAt(position, 3))).toEqual([0, 1, 2]);
  });

  it('clamps out-of-range positions to the outer classes, and an unknown one to the first', () => {
    expect(classIndexAt(-10, 3)).toBe(0);
    expect(classIndexAt(140, 3)).toBe(2);
    expect(classIndexAt(Number.NaN, 3)).toBe(0);
  });

  it('is the only class when there is one', () => {
    expect(classIndexAt(90, 1)).toBe(0);
  });
});

describe('categoryClasses', () => {
  it('paints the first category blue, the last red, the rest grey', () => {
    expect(categoryClasses(['Positiva', 'Estable', 'Alerta', 'NA']).map((c) => c.tone)).toEqual([
      'low',
      'medium',
      'medium',
      'high',
    ]);
  });

  it('keeps the labels as the metadata writes them', () => {
    expect(categoryClasses(['bajo', 'alto']).map((c) => c.label)).toEqual(['bajo', 'alto']);
  });
});
