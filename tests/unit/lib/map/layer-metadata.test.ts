import { describe, expect, it } from 'vitest';

import { layerMetadata } from '@/lib/map/layer-metadata';

describe('layerMetadata', () => {
  it("reads a layer's front-end metadata in app vocabulary", () => {
    expect(layerMetadata(4)).toEqual({
      id: 4,
      label: 'Nivel de exposición',
      description: 'Mapa de exposición de la soja a las amenazas.',
      legendConfig: { opacity: false, visibility: false, order: false },
      legendNote:
        'Porcentaje de soja expuesta a una o ambas amenazas; las áreas coincidentes se cuentan una sola vez.',
      clipsToDistrict: false,
    });
  });

  it('names every layer the API lists in Spanish', () => {
    expect([1, 2, 3, 4].map((id) => layerMetadata(id).label)).toEqual([
      'Expuesto a sequía',
      'Expuesto a inundación',
      'Soja',
      'Nivel de exposición',
    ]);
  });

  it('throws for a layer the file does not list', () => {
    expect(() => layerMetadata(99)).toThrow('No metadata for global layer 99');
  });
});
