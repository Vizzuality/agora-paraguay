import { atom } from 'jotai';
import type { GeoJSONStoreFeatures, TerraDraw } from 'terra-draw';

import { drawnPolygons } from '@/lib/map/draw-features';
import { terraDrawMode, type DrawTool } from '@/lib/map/draw-state';
import { restoreFeatures } from '@/lib/map/import-features';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';
import { resetSelectionSessionAtom } from '@/store/upload';

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
 * Starts the selection over: every polygon on the map — hand-drawn and uploaded — goes,
 * the tool is parked, and the session state (clicked parcels, upload notice, app mode)
 * resets. The Reiniciar button and every entry point that replaces route through here.
 */
export const restartSelectionAtom = atom(null, (get, set) => {
  const draw = get(drawInstanceAtom);

  if (draw?.enabled) {
    // Disarm before clearing: stopping polygon mode sweeps an in-progress ring.
    set(drawStateAtom, { type: 'tool', tool: null });

    if (get(drawStateAtom).polygons.length > 0) {
      draw.clear();
      // `clear()` does not surface as a `change` event, so report it by hand.
      set(drawStateAtom, { type: 'geometry', polygons: [] });
    }
  }

  set(resetSelectionSessionAtom);
});

/** Activates the draw tool. A drawing session always starts from scratch. */
export const startDrawAtom = atom(null, (get, set) => {
  if (!get(drawInstanceAtom)?.enabled) return;

  set(restartSelectionAtom);
  set(drawStateAtom, { type: 'tool', tool: 'draw' });
});

/**
 * A finished polygon ends the draw session (one área de interés per session, AGP-36):
 * the geometry is reported and the tool parked, which moves the panel to step 2.
 */
export const finishDrawAtom = atom(null, (_get, set, snapshot: GeoJSONStoreFeatures[]) => {
  set(drawStateAtom, { type: 'geometry', polygons: drawnPolygons(snapshot) });
  set(drawStateAtom, { type: 'tool', tool: null });
});

/** Called with the started instance, and with `null` when it is torn down. */
export const bindDrawAtom = atom(null, (get, set, draw: TerraDraw | null) => {
  set(drawInstanceAtom, draw);

  if (draw === null) {
    set(drawStateAtom, { type: 'unbound' });
    return;
  }

  set(drawStateAtom, { type: 'bound' });

  // Polygons that survived the previous unbind (navigating to /analisis and back) go
  // into the fresh instance. Like an upload, `addFeatures` is not trusted to surface
  // as a `change` event — report the geometry by hand (idempotent if the event fires).
  const { polygons } = get(drawStateAtom);

  if (polygons.length > 0) {
    set(drawStateAtom, { type: 'geometry', polygons: restoreFeatures(draw, polygons) });
  }
});

export const reportGeometryAtom = atom(null, (_get, set, snapshot: GeoJSONStoreFeatures[]) => {
  set(drawStateAtom, { type: 'geometry', polygons: drawnPolygons(snapshot) });
});
