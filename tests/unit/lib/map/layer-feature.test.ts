import { describe, expect, it } from 'vitest';

import { layerFeatureFacts } from '@/lib/map/layer-feature';

describe('layerFeatureFacts', () => {
  it('lists the scalar properties in the layer order, keyed by their name', () => {
    expect(layerFeatureFacts({ nivel: 'Alto', area_ha: 1234.567, regado: true })).toEqual([
      { id: 'nivel', label: 'nivel', description: undefined, value: 'Alto' },
      { id: 'area_ha', label: 'area_ha', description: undefined, value: '1.234,57' },
      { id: 'regado', label: 'regado', description: undefined, value: 'Sí' },
    ]);
  });

  it('names a property after the indicator metadata, whatever its case', () => {
    const [fact] = layerFeatureFacts({ SOJA_HA: 10 }, [
      { id: 'soja_ha', name: 'Superficie de soja', description: 'Hectáreas sembradas' },
    ]);

    expect(fact).toMatchObject({ label: 'Superficie de soja', description: 'Hectáreas sembradas' });
  });

  it('leaves out the district key, the heading fields, empty and nested values', () => {
    expect(
      layerFeatureFacts({
        CLAVE: '0721',
        dist_desc_: 'SAN RAFAEL',
        DPTO_DESC: 'ITAPÚA',
        vacio: '',
        nulo: null,
        anidado: { a: 1 },
        infinito: Number.POSITIVE_INFINITY,
      }),
    ).toEqual([]);
  });
});
