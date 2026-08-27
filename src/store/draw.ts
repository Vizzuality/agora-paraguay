import { atom } from 'jotai';
import type { GeoJSONStoreFeatures, TerraDraw } from 'terra-draw';

import { drawnPolygons, type FeatureId } from '@/lib/map/draw-features';
import { terraDrawMode, type DrawTool } from '@/lib/map/draw-state';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';
import { selectedParcelsAtom } from '@/store/parcels';
import { uploadResultAtom } from '@/store/upload';

/**
 * Drawing and editing the areas of interest, as global state.
 *
 * The Terra Draw instance can only be created inside `<Map>` — it needs the MapLibre map
 * from react-map-gl's context — but the geometry has to be readable from the controls,
 * the panel, and eventually whatever queries the API with the drawn areas. Atoms in a
 * module put it where all of them can reach it without threading a provider through the
 * tree. (SSR caveats live on `draw-core.ts`.)
 */

/** The whole control state, for the cluster that renders every button at once. */
export const drawAtom = atom((get) => get(drawStateAtom));

/** The drawn polygons, for anything that consumes the geometry. */
export const drawPolygonsAtom = atom((get) => get(drawStateAtom).polygons);

/** The Terra Draw mode the current state means. Drives the mode effect in `useTerraDraw`. */
export const drawModeAtom = atom((get) => terraDrawMode(get(drawStateAtom)));

/*
 * Write-only atoms below. Their identities are module constants, so `useSetAtom` hands
 * back a stable function and the effect that constructs Terra Draw never re-runs because
 * a command changed.
 */

export const setDrawToolAtom = atom(null, (_get, set, tool: DrawTool | null) => {
  set(drawStateAtom, { type: 'tool', tool });
});

/**
 * Activates the draw tool. A drawing session starts from scratch: every polygon on the
 * map — hand-drawn and uploaded — is cleared first. (The reducer's `geometry` action
 * prunes `selectedId` and `analysisId` with the polygons, so the highlight goes too.)
 */
export const startDrawAtom = atom(null, (get, set) => {
  const draw = get(drawInstanceAtom);

  if (!draw?.enabled) return;

  if (get(drawStateAtom).polygons.length > 0) {
    draw.clear();
    // `clear()` does not surface as a `change` event, so report it by hand.
    set(drawStateAtom, { type: 'geometry', polygons: [] });
  }

  // A stale "Imported N areas" notice must not outlive the areas it counted, and a
  // from-scratch session drops the clicked cadastral parcels with everything else.
  set(uploadResultAtom, null);
  set(selectedParcelsAtom, []);
  set(drawStateAtom, { type: 'tool', tool: 'draw' });
});

/** Called with the started instance, and with `null` when it is torn down. */
export const bindDrawAtom = atom(null, (_get, set, draw: TerraDraw | null) => {
  set(drawInstanceAtom, draw);
  set(drawStateAtom, { type: draw ? 'bound' : 'unbound' });
});

export const reportGeometryAtom = atom(null, (_get, set, snapshot: GeoJSONStoreFeatures[]) => {
  set(drawStateAtom, { type: 'geometry', polygons: drawnPolygons(snapshot) });
});

export const reportSelectedAtom = atom(null, (_get, set, id: FeatureId) => {
  set(drawStateAtom, { type: 'selected', id });
});

export const reportDeselectedAtom = atom(null, (_get, set, id: FeatureId) => {
  set(drawStateAtom, { type: 'deselected', id });
});

export const deleteSelectedAtom = atom(null, (get, set) => {
  const draw = get(drawInstanceAtom);
  const { selectedId } = get(drawStateAtom);

  if (!draw?.enabled || selectedId === null) return;

  // Deselect first, or the selection points outlive the geometry they annotate.
  draw.deselectFeature(selectedId);
  draw.removeFeatures([selectedId]);

  set(drawStateAtom, { type: 'deselected', id: selectedId });
});

export const clearDrawAtom = atom(null, (get, set) => {
  const draw = get(drawInstanceAtom);

  if (!draw?.enabled) return;

  draw.clear();
  // `clear()` does not surface as a `change` event, so report it by hand.
  set(drawStateAtom, { type: 'geometry', polygons: [] });
});
