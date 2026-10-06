import { describe, expect, it } from 'vitest';

import {
  categoryAxis,
  categoryClasses,
  classIndexAt,
  classTones,
  isShortRange,
  RANGE_CLASSES,
  widgetFor,
} from '@/lib/analysis/widget-config';
import type { IndicatorType } from '@/lib/api/metadata/schemas';

const index: IndicatorType = { type: 'range', min: 1, max: 3 };
const quality: IndicatorType = { type: 'range', min: 0, max: 100 };
const category: IndicatorType = { type: 'category', categories: ['Alta', 'Media', 'Baja'] };
const text: IndicatorType = { type: 'text' };
const numeric: IndicatorType = { type: 'numeric' };
const deviation: IndicatorType = { type: 'deviation' };

describe('widgetFor', () => {
  it('sanitario, one parcel: a range gets the ruler, text and open numbers are general info', () => {
    expect(widgetFor(index, { riesgo: 'sanitario', scope: 'individual' })).toBe('ruler');
    expect(widgetFor(quality, { riesgo: 'sanitario', scope: 'individual' })).toBe('ruler');
    expect(widgetFor(text, { riesgo: 'sanitario', scope: 'individual' })).toBe('fact');
    expect(widgetFor(numeric, { riesgo: 'sanitario', scope: 'multiple' })).toBe('fact');
  });

  it('sanitario, Todas: a short range counts the parcels per class, a long one bins their values', () => {
    expect(widgetFor(index, { riesgo: 'sanitario', scope: 'multiple' })).toBe('bar-chart');
    expect(
      widgetFor({ type: 'range', min: 0, max: 10 }, { riesgo: 'sanitario', scope: 'multiple' }),
    ).toBe('bar-chart');
    expect(widgetFor(quality, { riesgo: 'sanitario', scope: 'multiple' })).toBe('histogram');
    expect(
      widgetFor({ type: 'range', min: 0, max: 11 }, { riesgo: 'sanitario', scope: 'multiple' }),
    ).toBe('histogram');
  });

  it("productivo: a range is one parcel's number or the set's histogram, short or long; text is general info", () => {
    expect(widgetFor(index, { riesgo: 'productivo', scope: 'individual' })).toBe('number');
    expect(widgetFor(index, { riesgo: 'productivo', scope: 'multiple' })).toBe('histogram');
    expect(widgetFor(quality, { riesgo: 'productivo', scope: 'individual' })).toBe('number');
    expect(widgetFor(quality, { riesgo: 'productivo', scope: 'multiple' })).toBe('histogram');
    expect(widgetFor(text, { riesgo: 'productivo', scope: 'multiple' })).toBe('fact');
  });

  it("productivo: an open number is one parcel's figure or, under Todas, the set's histogram", () => {
    expect(widgetFor(numeric, { riesgo: 'productivo', scope: 'individual' })).toBe('number');
    expect(widgetFor(numeric, { riesgo: 'productivo', scope: 'multiple' })).toBe('histogram');
    expect(widgetFor({ type: 'number' }, { riesgo: 'productivo', scope: 'multiple' })).toBe(
      'histogram',
    );
  });

  it("productivo: a deviation is one parcel's diverging card or, under Todas, the set's diverging histogram; a fact on sanitario", () => {
    expect(widgetFor(deviation, { riesgo: 'productivo', scope: 'individual' })).toBe('deviation');
    expect(widgetFor(deviation, { riesgo: 'productivo', scope: 'multiple' })).toBe(
      'diverging-histogram',
    );
    expect(widgetFor(deviation, { riesgo: 'sanitario', scope: 'individual' })).toBe('fact');
    expect(widgetFor(deviation, { riesgo: 'sanitario', scope: 'multiple' })).toBe('fact');
  });

  it('a category follows the scope on both riesgos: one parcel on the ruler, several counted', () => {
    expect(widgetFor(category, { riesgo: 'sanitario', scope: 'individual' })).toBe('ruler');
    expect(widgetFor(category, { riesgo: 'productivo', scope: 'individual' })).toBe('ruler');
    expect(widgetFor(category, { riesgo: 'sanitario', scope: 'multiple' })).toBe('bar-chart');
    expect(widgetFor(category, { riesgo: 'productivo', scope: 'multiple' })).toBe('bar-chart');
  });
});

describe('isShortRange', () => {
  it('reads up to the design cut of 10 as a handful of values', () => {
    expect(isShortRange({ min: 1, max: 3 })).toBe(true);
    expect(isShortRange({ min: 0, max: 10 })).toBe(true);
    expect(isShortRange({ min: 0, max: 100 })).toBe(false);
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
