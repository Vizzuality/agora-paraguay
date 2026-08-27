import { describe, expect, it } from 'vitest';

import { importReplacingFeatures } from '@/lib/map/import-features';
import type { LngLat, UploadFeature } from '@/lib/upload/types';

import { startedDraw } from './headless-draw';

const RING: LngLat[] = [
  [-57.6, -25.3],
  [-57.6, -25.2],
  [-57.5, -25.2],
  [-57.6, -25.3],
];

const OTHER_RING: LngLat[] = [
  [-58.1, -24.9],
  [-58.1, -24.8],
  [-58.0, -24.8],
  [-58.1, -24.9],
];

/** Inside RING: Terra Draw rejects holed polygons, which is what makes it invalid. */
const HOLE: LngLat[] = [
  [-57.58, -25.28],
  [-57.58, -25.26],
  [-57.56, -25.26],
  [-57.58, -25.28],
];

function feature(name: string, rings: LngLat[][] = [RING]): UploadFeature {
  return {
    id: crypto.randomUUID(),
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: rings },
    properties: { mode: 'polygon', origin: 'upload', name },
  };
}

describe('importReplacingFeatures', () => {
  it('imports accepted features and reports the resulting polygons', () => {
    const draw = startedDraw();

    const outcome = importReplacingFeatures(draw, [feature('Norte'), feature('Sur')], null);

    expect(outcome.accepted).toHaveLength(2);
    expect(outcome.rejectionWarnings).toEqual([]);
    expect(outcome.deselectedId).toBeNull();
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Norte', 'Sur']);
  });

  it('replaces everything already in the store once something is accepted', () => {
    const draw = startedDraw();
    importReplacingFeatures(draw, [feature('Anterior')], null);

    const outcome = importReplacingFeatures(draw, [feature('Nueva')], null);

    expect(outcome.accepted).toHaveLength(1);
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Nueva']);
  });

  it('leaves the store untouched when every feature is rejected', () => {
    const draw = startedDraw();
    importReplacingFeatures(draw, [feature('Anterior')], null);

    const outcome = importReplacingFeatures(draw, [feature('Con hueco', [RING, HOLE])], null);

    expect(outcome.accepted).toEqual([]);
    expect(outcome.rejectionWarnings).toHaveLength(1);
    expect(outcome.rejectionWarnings[0].featureName).toBe('Con hueco');
    expect(outcome.rejectionWarnings[0].message).toContain('"Con hueco" fue rechazado');
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Anterior']);
  });

  it('lands the valid features of a mixed import and warns per rejected one', () => {
    const draw = startedDraw();

    const outcome = importReplacingFeatures(
      draw,
      [feature('Válida', [OTHER_RING]), feature('Con hueco', [RING, HOLE])],
      null,
    );

    expect(outcome.accepted.map((accepted) => accepted.properties.name)).toEqual(['Válida']);
    expect(outcome.rejectionWarnings.map((warning) => warning.featureName)).toEqual(['Con hueco']);
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Válida']);
  });

  it('reports the selected id when the import removes the feature it points at', () => {
    const draw = startedDraw();
    const previous = importReplacingFeatures(draw, [feature('Anterior')], null);
    const selectedId = previous.polygons[0].id;

    const outcome = importReplacingFeatures(draw, [feature('Nueva')], selectedId);

    expect(outcome.deselectedId).toBe(selectedId);
  });

  it('keeps the selection when nothing is accepted', () => {
    const draw = startedDraw();
    const previous = importReplacingFeatures(draw, [feature('Anterior')], null);
    const selectedId = previous.polygons[0].id;

    const outcome = importReplacingFeatures(draw, [feature('Con hueco', [RING, HOLE])], selectedId);

    expect(outcome.deselectedId).toBeNull();
  });
});
