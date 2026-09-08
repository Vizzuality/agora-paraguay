import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import { importReplacingFeatures, restoreFeatures } from '@/lib/map/import-features';
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

/** Three positions, unclosed: Terra Draw wants at least four, which makes it invalid. */
const OPEN_RING: LngLat[] = [
  [-57.58, -25.28],
  [-57.58, -25.26],
  [-57.56, -25.26],
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

    const outcome = importReplacingFeatures(draw, [feature('Norte'), feature('Sur')]);

    expect(outcome.accepted).toHaveLength(2);
    expect(outcome.rejectionWarnings).toEqual([]);
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Norte', 'Sur']);
  });

  it('replaces everything already in the store once something is accepted', () => {
    const draw = startedDraw();
    importReplacingFeatures(draw, [feature('Anterior')]);

    const outcome = importReplacingFeatures(draw, [feature('Nueva')]);

    expect(outcome.accepted).toHaveLength(1);
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Nueva']);
  });

  it('clears the store even when every feature is rejected', () => {
    const draw = startedDraw();
    importReplacingFeatures(draw, [feature('Anterior')]);

    const outcome = importReplacingFeatures(draw, [feature('Abierta', [OPEN_RING])]);

    expect(outcome.accepted).toEqual([]);
    expect(outcome.rejectionWarnings).toHaveLength(1);
    expect(outcome.rejectionWarnings[0].featureName).toBe('Abierta');
    expect(outcome.rejectionWarnings[0].message).toContain('"Abierta" fue rechazado');
    expect(outcome.polygons).toEqual([]);
  });

  it('lands the valid features of a mixed import and warns per rejected one', () => {
    const draw = startedDraw();

    const outcome = importReplacingFeatures(draw, [
      feature('Válida', [OTHER_RING]),
      feature('Abierta', [OPEN_RING]),
    ]);

    expect(outcome.accepted.map((accepted) => accepted.properties.name)).toEqual(['Válida']);
    expect(outcome.rejectionWarnings.map((warning) => warning.featureName)).toEqual(['Abierta']);
    expect(outcome.polygons.map((polygon) => polygon.properties.name)).toEqual(['Válida']);
  });
});

/**
 * Pins the Terra Draw behaviour the mode persistence leans on: polygons snapshotted
 * from one instance restore into a fresh one (navigating to /analisis and back)
 * keeping their ids and analysis highlight.
 */
describe('restoreFeatures', () => {
  /** Polygons drawn into one instance, as they survive in the store after unmount. */
  function survivors(): DrawnPolygon[] {
    const previous = startedDraw();

    return importReplacingFeatures(previous, [feature('Norte'), feature('Sur', [OTHER_RING])])
      .polygons;
  }

  it('re-adds surviving polygons into a fresh instance, keeping their ids', () => {
    const polygons = survivors();
    const draw = startedDraw();

    const restored = restoreFeatures(draw, polygons);

    expect(restored.map((polygon) => polygon.id)).toEqual(polygons.map((polygon) => polygon.id));
  });

  it('keeps the analysis highlight property', () => {
    const [selected, other] = survivors();
    const withAnalysis = { ...selected, properties: { ...selected.properties, analysis: true } };
    const draw = startedDraw();

    const restored = restoreFeatures(draw, [withAnalysis, other]);

    expect(restored.map((polygon) => polygon.properties.analysis)).toEqual([true, undefined]);
  });

  it('returns only what Terra Draw accepted', () => {
    const [polygon] = survivors();
    const open = {
      ...polygon,
      id: crypto.randomUUID(),
      geometry: { ...polygon.geometry, coordinates: [OPEN_RING] },
    } as DrawnPolygon;
    const draw = startedDraw();

    const restored = restoreFeatures(draw, [polygon, open]);

    expect(restored.map((item) => item.id)).toEqual([polygon.id]);
  });
});
