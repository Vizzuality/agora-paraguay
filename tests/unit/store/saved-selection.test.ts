import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import type { SavedSelection } from '@/lib/saved-selection';
import { bindDrawAtom, drawAtom, drawPolygonsAtom, restartSelectionAtom } from '@/store/draw';
import { drawStateAtom } from '@/store/draw-core';
import { toggledParcelIdsAtom } from '@/store/parcels';
import {
  hydrateSavedSelectionAtom,
  savedSelectionAtom,
  savedSelectionHydratedAtom,
} from '@/store/saved-selection';

import { startedDraw } from '../lib/map/headless-draw';

/** A closed square near Asunción, at the precision Terra Draw's store accepts. */
const RING = [
  [-58.5, -24.5],
  [-58.5, -24.4],
  [-58.4, -24.4],
  [-58.4, -24.5],
  [-58.5, -24.5],
];

function polygon(id: string, properties: Record<string, unknown> = {}): DrawnPolygon {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [RING] },
    properties: { mode: 'polygon', ...properties },
  } as DrawnPolygon;
}

// Terra Draw's default id strategy only admits UUIDs.
const A = crypto.randomUUID();
const B = crypto.randomUUID();

function saved(overrides: Partial<SavedSelection> = {}): SavedSelection {
  return {
    polygons: [polygon(A), polygon(B, { analysis: true })],
    analysisId: B,
    toggledParcelIds: ['D07D23P00000008'],
    ...overrides,
  };
}

describe('hydrateSavedSelectionAtom', () => {
  it('lands the record before the map binds, and the bind imports the polygons', () => {
    const store = createStore();

    store.set(hydrateSavedSelectionAtom, saved());

    expect(store.get(savedSelectionHydratedAtom)).toBe(true);
    expect(store.get(drawPolygonsAtom).map((p) => p.id)).toEqual([A, B]);
    expect(store.get(drawAtom).analysisId).toBe(B);
    expect(store.get(toggledParcelIdsAtom)).toEqual(['D07D23P00000008']);

    const draw = startedDraw();
    store.set(bindDrawAtom, draw);

    expect(draw.getSnapshot().map((feature) => feature.id)).toEqual([A, B]);
    expect(draw.getSnapshotFeature(B)?.properties.analysis).toBe(true);
  });

  it('puts the polygons straight into an already bound instance', () => {
    const store = createStore();
    const draw = startedDraw();
    store.set(bindDrawAtom, draw);

    store.set(hydrateSavedSelectionAtom, saved());

    expect(draw.getSnapshot().map((feature) => feature.id)).toEqual([A, B]);
    expect(store.get(drawPolygonsAtom).map((p) => p.id)).toEqual([A, B]);
    expect(draw.getSnapshotFeature(B)?.properties.analysis).toBe(true);
  });

  it('leaves a selection the user already made alone', () => {
    const store = createStore();
    store.set(drawStateAtom, { type: 'geometry', polygons: [polygon(crypto.randomUUID())] });

    store.set(hydrateSavedSelectionAtom, saved());

    expect(store.get(drawPolygonsAtom).map((p) => p.id)).toHaveLength(1);
    expect(store.get(toggledParcelIdsAtom)).toEqual([]);
    expect(store.get(savedSelectionHydratedAtom)).toBe(true);
  });

  it('runs once per session: a second record never resurrects a reset selection', () => {
    const store = createStore();
    store.set(hydrateSavedSelectionAtom, saved());
    store.set(restartSelectionAtom);

    store.set(hydrateSavedSelectionAtom, saved());

    expect(store.get(drawPolygonsAtom)).toEqual([]);
  });

  it('marks the session hydrated when nothing was saved', () => {
    const store = createStore();

    store.set(hydrateSavedSelectionAtom, null);

    expect(store.get(savedSelectionHydratedAtom)).toBe(true);
    expect(store.get(drawPolygonsAtom)).toEqual([]);
  });
});

describe('savedSelectionAtom', () => {
  it('is the areas, the analysis pick and the flips, as the store holds them', () => {
    const store = createStore();
    store.set(hydrateSavedSelectionAtom, saved());

    expect(store.get(savedSelectionAtom)).toEqual({
      polygons: store.get(drawPolygonsAtom),
      analysisId: B,
      toggledParcelIds: ['D07D23P00000008'],
    });
  });

  it('empties with Reiniciar, which is what removes the record', () => {
    const store = createStore();
    store.set(hydrateSavedSelectionAtom, saved());

    store.set(restartSelectionAtom);

    expect(store.get(savedSelectionAtom)).toEqual({
      polygons: [],
      analysisId: null,
      toggledParcelIds: [],
    });
  });
});
