import { describe, expect, it } from 'vitest';

import {
  categoryAxis,
  categoryClasses,
  classIndexAt,
  classTones,
  RANGE_CLASSES,
  widgetKindOf,
} from '@/lib/analysis/widget-config';

describe('widgetKindOf', () => {
  it('sanitario: a range gets the risk tile, text and open numbers are general info', () => {
    expect(widgetKindOf('sanitario', 'range', 'individual')).toBe('risk-class');
    expect(widgetKindOf('sanitario', 'range', 'multiple')).toBe('risk-class');
    expect(widgetKindOf('sanitario', 'text', 'individual')).toBe('general-info');
    expect(widgetKindOf('sanitario', 'numeric', 'multiple')).toBe('general-info');
  });

  it('productivo: numbers and ranges list the parcels, text is general info', () => {
    expect(widgetKindOf('productivo', 'numeric', 'individual')).toBe('parcel-values');
    expect(widgetKindOf('productivo', 'range', 'multiple')).toBe('parcel-values');
    expect(widgetKindOf('productivo', 'text', 'multiple')).toBe('general-info');
  });

  it('a category follows the scope on both riesgos: one parcel on the ruler, several counted', () => {
    expect(widgetKindOf('sanitario', 'category', 'individual')).toBe('risk-class');
    expect(widgetKindOf('productivo', 'category', 'individual')).toBe('risk-class');
    expect(widgetKindOf('sanitario', 'category', 'multiple')).toBe('category-count');
    expect(widgetKindOf('productivo', 'category', 'multiple')).toBe('category-count');
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

describe('classTones', () => {
  it('follows the design scales: four run blue, grey, orange, red; three drop the orange', () => {
    expect(classTones(4)).toEqual(['low', 'medium', 'elevated', 'high']);
    expect(classTones(3)).toEqual(['low', 'medium', 'high']);
  });

  it('faces two classes off blue against red, and paints a lone class orange', () => {
    expect(classTones(2)).toEqual(['low', 'high']);
    expect(classTones(1)).toEqual(['elevated']);
    expect(classTones(0)).toEqual([]);
  });

  it('keeps the ends for five or more and greys the middle', () => {
    expect(classTones(5)).toEqual(['low', 'medium', 'medium', 'elevated', 'high']);
  });
});

describe('categoryClasses', () => {
  it('leaves NA out and colours the rest by their count', () => {
    expect(categoryClasses(['Positiva', 'Estable', 'Alerta', 'NA'])).toEqual([
      { label: 'Positiva', tone: 'low' },
      { label: 'Estable', tone: 'medium' },
      { label: 'Alerta', tone: 'high' },
    ]);
  });

  it('keeps the labels as the metadata writes them', () => {
    expect(categoryClasses(['bajo', 'alto']).map((c) => c.label)).toEqual(['bajo', 'alto']);
  });
});

describe('categoryAxis', () => {
  it('keeps the categories in the order the indicator defines them, NA left out', () => {
    expect(categoryAxis(['Alta', 'Media', 'Baja'])).toEqual(['Alta', 'Media', 'Baja']);
    expect(categoryAxis(['Positiva', 'Estable', 'Alerta', 'NA'])).toEqual([
      'Positiva',
      'Estable',
      'Alerta',
    ]);
  });
});
