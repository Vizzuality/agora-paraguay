import { describe, expect, it } from 'vitest';

import { asDeviationIndicators, baseIdOf, isDeviationId } from '@/lib/analysis/deviation-override';
import type { Indicator } from '@/lib/api/metadata/schemas';

const deviation: Indicator = {
  id: 'Des_soja',
  name: 'Desviación estándar de la producción de soja respecto a la base histórica',
  unit: 't/ha',
  default: true,
  indicator_type: { type: 'numeric' },
};
const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base histórica de soja',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};
const typed: Indicator = {
  id: 'Des_arroz',
  name: 'Desviación',
  indicator_type: { type: 'deviation', max: 2 },
};
const classed: Indicator = {
  id: 'Des_clase',
  name: 'Una categoría con el prefijo',
  indicator_type: { type: 'category', categories: ['Alta', 'Baja'] },
};

describe('isDeviationId', () => {
  it('reads the live prefix, whatever the case', () => {
    expect(isDeviationId('Des_soja')).toBe(true);
    expect(isDeviationId('des_arroz')).toBe(true);
    expect(isDeviationId('Pro_soja')).toBe(false);
    expect(isDeviationId('MID_H5_soja')).toBe(false);
  });
});

describe('baseIdOf', () => {
  it("names the crop's base production: the same id under the Pro_ prefix", () => {
    expect(baseIdOf('Des_soja')).toBe('Pro_soja');
    expect(baseIdOf('des_arroz')).toBe('Pro_arroz');
  });
});

describe('asDeviationIndicators', () => {
  it('retypes the open numbers under the prefix, base set, and leaves everything else alone', () => {
    expect(asDeviationIndicators([deviation, production, typed, classed])).toEqual([
      { ...deviation, indicator_type: { type: 'deviation', base: 'Pro_soja' } },
      production,
      typed,
      classed,
    ]);
  });

  it('keeps the rest of the entry: name, unit, default', () => {
    const [retyped] = asDeviationIndicators([deviation]);

    expect(retyped).toMatchObject({ id: 'Des_soja', unit: 't/ha', default: true });
  });
});
