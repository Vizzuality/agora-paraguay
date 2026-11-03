import { describe, expect, it } from 'vitest';

import {
  districtFromProperties,
  exposureClasses,
  exposureFill,
  exposureLabel,
} from '@/lib/map/exposure-districts';

describe('districtFromProperties', () => {
  it('reads the exposure layer, which spells its keys in capitals', () => {
    expect(
      districtFromProperties({
        DPTO_DESC: 'ITAPÚA',
        DIST_DESC_: 'SAN RAFAEL DEL PARANÁ',
        CLAVE: '0721',
        Ex_class: 'Alto',
      }),
    ).toMatchObject({
      id: '0721',
      name: 'San Rafael Del Paraná',
      department: 'Itapúa',
      exposure: 'Alto',
    });
  });

  it('reads the soy layer, which spells them in lower case', () => {
    expect(
      districtFromProperties({
        clave: '1508',
        dist_desc_: 'TENIENTE ESTEBAN MARTINEZ',
        dpto_desc: 'PRESIDENTE HAYES',
      }),
    ).toMatchObject({
      id: '1508',
      name: 'Teniente Esteban Martinez',
      department: 'Presidente Hayes',
      exposure: null,
    });
  });

  it('falls back to the key when the feature has no name', () => {
    expect(districtFromProperties({ CLAVE: 1508 })?.name).toBe('Distrito 1508');
  });

  it('is null for a feature without a district key', () => {
    expect(districtFromProperties({ DIST_DESC_: 'ASUNCION' })).toBeNull();
    expect(districtFromProperties(null)).toBeNull();
  });

  it('is null for a key that is neither text nor a number', () => {
    expect(districtFromProperties({ CLAVE: '' })).toBeNull();
    expect(districtFromProperties({ CLAVE: { code: 1508 } })).toBeNull();
  });
});

describe('exposureLabel', () => {
  it('words the legend classes as the legend does and passes the others through', () => {
    expect(exposureLabel('Medio')).toBe('Media exposición');
    expect(exposureLabel('Sin soja')).toBe('Sin soja');
  });
});

describe('exposureClasses', () => {
  const exClass = (categories: string[]) => [
    { id: 'Ex_class', indicator_type: { type: 'category' as const, categories } },
  ];

  it("colours Ex_class's categories as the ruler does, Sin soja green first", () => {
    expect(
      exposureClasses(
        exClass(['Sin soja', 'Sin exposición identificada', 'Bajo', 'Medio', 'Alto']),
      ),
    ).toEqual([
      { label: 'Sin soja', tone: 'none' },
      { label: 'Sin exposición identificada', tone: 'low' },
      { label: 'Bajo', tone: 'medium' },
      { label: 'Medio', tone: 'elevated' },
      { label: 'Alto', tone: 'high' },
    ]);
  });

  it('falls back to Bajo, Medio and Alto until the metadata lists Ex_class', () => {
    expect(exposureClasses(undefined).map(({ label }) => label)).toEqual(['Bajo', 'Medio', 'Alto']);
    expect(exposureClasses(exClass([])).map(({ label }) => label)).toEqual([
      'Bajo',
      'Medio',
      'Alto',
    ]);
  });
});

describe('exposureFill', () => {
  it("matches each class's label to its tone's colour, grey for any other", () => {
    expect(
      exposureFill([
        { label: 'Sin soja', tone: 'none' },
        { label: 'Alto', tone: 'high' },
      ]),
    ).toEqual(['match', ['get', 'Ex_class'], 'Sin soja', '#1AF807', 'Alto', '#FF3838', '#96A3B5']);
  });

  it('paints everything grey with no classes, since match needs a label', () => {
    expect(exposureFill([])).toBe('#96A3B5');
  });
});
